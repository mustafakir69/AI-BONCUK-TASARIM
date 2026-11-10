import io
import json
from dataclasses import dataclass, field

import pytest
from fastapi.testclient import TestClient
from httpx2 import Response
from PIL import Image

from app.config import Settings
from app.image_validation import SafeImage
from app.main import create_app
from app.models import AiDesignPlan, AiDesignRequest, Usage
from app.provider import (
    NineRouterProbeResult,
    ProviderOutputError,
    ProviderRateLimitError,
    ProviderResult,
    ProviderTimeoutError,
)


@dataclass
class FakeProvider:
    plan: AiDesignPlan
    error: Exception | None = None
    calls: list[tuple[AiDesignRequest, SafeImage | None]] = field(default_factory=list)

    async def create_plan(self, request: AiDesignRequest, image: SafeImage | None) -> ProviderResult:
        self.calls.append((request, image))
        if self.error:
            raise self.error
        return ProviderResult(self.plan, Usage(input_tokens=10, output_tokens=20, total_tokens=30))


def post_design(
    client: TestClient,
    payload: dict[str, object],
    *,
    consent: bool = True,
    request_id: str = "request-001",
    files: dict[str, tuple[str, bytes, str]] | None = None,
    provider_id: str | None = None,
) -> Response:
    upload = {"reference_image": files["reference_image"]} if files else None
    data = {"request_json": json.dumps(payload), "consent": str(consent).lower(), "request_id": request_id}
    if provider_id is not None:
        data["provider_id"] = provider_id
    return client.post(
        "/api/ai/design",
        data=data,
        files=upload,
    )


def make_png(width: int = 16, height: int = 12) -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (width, height), "red").save(output, "PNG")
    return output.getvalue()


def test_health_starts_without_key() -> None:
    response = TestClient(create_app(Settings(_env_file=None, ai_calls_enabled=False))).get("/api/health")
    assert response.status_code == 200
    assert response.json()["providerState"] == "disabled"
    assert response.json()["modelConfigured"] is False


def test_health_reports_reachable_but_unverified_ninerouter(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_probe(_settings: Settings) -> NineRouterProbeResult:
        return NineRouterProbeResult(
            True,
            frozenset({"cx/listed-model"}),
            frozenset({"cx/listed-model"}),
        )

    monkeypatch.setattr("app.main.probe_ninerouter", fake_probe)
    settings = Settings(
        _env_file=None,
        ai_calls_enabled=True,
        ai_provider="9router",
        ninerouter_model="cx/listed-model",
    )
    payload = TestClient(create_app(settings)).get("/api/health").json()
    router = next(item for item in payload["providers"] if item["id"] == "9router")
    assert router["state"] == "unverified"
    assert router["reachable"] is True
    assert router["modelAvailable"] is True
    assert router["visionSupported"] is False


def test_text_request_returns_structured_plan(
    enabled_settings: Settings,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    provider = FakeProvider(plan)
    response = post_design(TestClient(create_app(enabled_settings, provider)), request_payload)
    assert response.status_code == 200
    assert response.json()["plan"]["components"][0]["geometry"]["type"] == "bezier"
    assert response.json()["usage"] == {"inputTokens": 10, "outputTokens": 20, "totalTokens": 30}
    assert len(provider.calls) == 1


def test_consent_is_required_before_provider_call(
    enabled_settings: Settings,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    provider = FakeProvider(plan)
    response = post_design(TestClient(create_app(enabled_settings, provider)), request_payload, consent=False)
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "CONSENT_REQUIRED"
    assert provider.calls == []


def test_disabled_paid_calls_fail_honestly(request_payload: dict[str, object], plan: AiDesignPlan) -> None:
    provider = FakeProvider(plan)
    response = post_design(
        TestClient(
            create_app(Settings(openai_api_key="unused", ai_model="unused", ai_calls_enabled=False), provider)
        ),
        request_payload,
    )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "AI_DISABLED"
    assert provider.calls == []


def test_invalid_request_is_rejected_before_provider(
    enabled_settings: Settings,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    provider = FakeProvider(plan)
    request_payload["target"] = {"widthMm": 0, "heightMm": 250}
    response = post_design(TestClient(create_app(enabled_settings, provider)), request_payload)
    assert response.status_code == 422
    assert provider.calls == []


def test_valid_image_is_decoded_and_normalized(
    enabled_settings: Settings,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    png = make_png()
    request_payload["referenceImage"] = {
        "name": "ref.png",
        "mimeType": "image/png",
        "sizeBytes": len(png),
        "widthPx": 16,
        "heightPx": 12,
    }
    provider = FakeProvider(plan)
    response = post_design(
        TestClient(create_app(enabled_settings, provider)),
        request_payload,
        files={"reference_image": ("ref.png", png, "image/png")},
    )
    assert response.status_code == 200
    assert provider.calls[0][1] is not None
    assert provider.calls[0][1].mime_type == "image/jpeg"


def test_invalid_image_signature_is_rejected(
    enabled_settings: Settings,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    data = b"not-a-real-png"
    request_payload["referenceImage"] = {
        "name": "ref.png",
        "mimeType": "image/png",
        "sizeBytes": len(data),
        "widthPx": 16,
        "heightPx": 12,
    }
    provider = FakeProvider(plan)
    response = post_design(
        TestClient(create_app(enabled_settings, provider)),
        request_payload,
        files={"reference_image": ("ref.png", data, "image/png")},
    )
    assert response.status_code == 415
    assert provider.calls == []


def test_image_metadata_must_match_decoded_file(
    enabled_settings: Settings,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    png = make_png()
    request_payload["referenceImage"] = {
        "name": "ref.png",
        "mimeType": "image/png",
        "sizeBytes": len(png),
        "widthPx": 99,
        "heightPx": 12,
    }
    response = post_design(
        TestClient(create_app(enabled_settings, FakeProvider(plan))),
        request_payload,
        files={"reference_image": ("ref.png", png, "image/png")},
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "IMAGE_METADATA_MISMATCH"


def test_provider_errors_have_stable_http_mapping(
    enabled_settings: Settings,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    cases = [
        (ProviderRateLimitError("limit"), 429, "PROVIDER_RATE_LIMIT"),
        (ProviderTimeoutError("timeout"), 504, "PROVIDER_TIMEOUT"),
        (ProviderOutputError("bad output"), 502, "INVALID_PROVIDER_OUTPUT"),
    ]
    for index, (error, status, code) in enumerate(cases):
        response = post_design(
            TestClient(create_app(enabled_settings, FakeProvider(plan, error))),
            request_payload,
            request_id=f"request-{index:03d}",
        )
        assert response.status_code == status
        assert response.json()["detail"]["code"] == code


def test_local_rate_limit_is_enforced(
    enabled_settings: Settings,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    limited = enabled_settings.model_copy(update={"ai_rate_limit_requests": 1})
    client = TestClient(create_app(limited, FakeProvider(plan)))
    assert post_design(client, request_payload, request_id="request-a").status_code == 200
    second = post_design(client, request_payload, request_id="request-b")
    assert second.status_code == 429
    assert second.json()["detail"]["code"] == "LOCAL_RATE_LIMIT"


def test_schema_endpoint_exposes_strict_contract(enabled_settings: Settings, plan: AiDesignPlan) -> None:
    response = TestClient(create_app(enabled_settings, FakeProvider(plan))).get("/api/ai/schema")
    assert response.status_code == 200
    assert response.json()["additionalProperties"] is False


def test_cors_allows_only_configured_frontend_origin(enabled_settings: Settings, plan: AiDesignPlan) -> None:
    client = TestClient(create_app(enabled_settings, FakeProvider(plan)))
    allowed = client.options(
        "/api/health",
        headers={"Origin": "http://127.0.0.1:5173", "Access-Control-Request-Method": "GET"},
    )
    denied = client.options(
        "/api/health",
        headers={"Origin": "https://example.invalid", "Access-Control-Request-Method": "GET"},
    )
    assert allowed.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
    assert "access-control-allow-origin" not in denied.headers


def test_provider_selection_never_falls_back_silently(
    enabled_settings: Settings,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    openai_provider = FakeProvider(plan)
    client = TestClient(create_app(enabled_settings, providers={"openai": openai_provider}))
    response = post_design(client, request_payload, provider_id="9router")
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "AI_UNCONFIGURED"
    assert openai_provider.calls == []


def test_ninerouter_uses_selected_adapter_after_exact_model_probe(
    monkeypatch: pytest.MonkeyPatch,
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    router_provider = FakeProvider(plan)
    settings = Settings(
        _env_file=None,
        ai_calls_enabled=True,
        ai_provider="9router",
        ninerouter_model="cx/exact-model",
        ninerouter_model_compatibility_verified=True,
    )

    async def fake_probe(_settings: Settings) -> NineRouterProbeResult:
        return NineRouterProbeResult(True, frozenset({"cx/exact-model"}), frozenset())

    monkeypatch.setattr("app.main.probe_ninerouter", fake_probe)
    response = post_design(
        TestClient(create_app(settings, providers={"9router": router_provider})),
        request_payload,
        provider_id="9router",
    )
    assert response.status_code == 200
    assert len(router_provider.calls) == 1
