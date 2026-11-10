import json
from dataclasses import dataclass
from types import SimpleNamespace
from typing import Any

import pytest

from app.config import Settings
from app.image_validation import SafeImage
from app.models import AiDesignPlan, AiDesignRequest
from app.provider import NineRouterDesignProvider, OpenAiDesignProvider, ProviderOutputError


@dataclass
class FakeUsage:
    input_tokens: int = 11
    output_tokens: int = 22
    total_tokens: int = 33


class FakeResponse:
    def __init__(self, plan: AiDesignPlan) -> None:
        self.output_parsed = plan
        self.usage = FakeUsage()


class FakeResponses:
    def __init__(self, plan: AiDesignPlan) -> None:
        self.plan = plan
        self.kwargs: dict[str, Any] = {}

    async def parse(self, **kwargs: Any) -> FakeResponse:
        self.kwargs = kwargs
        return FakeResponse(self.plan)


class FakeClient:
    def __init__(self, plan: AiDesignPlan) -> None:
        self.responses = FakeResponses(plan)


@pytest.mark.asyncio
async def test_openai_adapter_uses_responses_structured_output_and_store_false(
    monkeypatch: pytest.MonkeyPatch,
    request_model: AiDesignRequest,
    plan: AiDesignPlan,
) -> None:
    fake = FakeClient(plan)

    def client_factory(**_kwargs: Any) -> FakeClient:
        return fake

    monkeypatch.setattr("app.provider.AsyncOpenAI", client_factory)
    provider = OpenAiDesignProvider(
        Settings(
            openai_api_key="test-only-key",
            ai_model="configured-model",
            ai_calls_enabled=True,
        )
    )
    result = await provider.create_plan(request_model, None)
    assert result.plan == plan
    assert result.usage is not None and result.usage.total_tokens == 33
    assert fake.responses.kwargs["model"] == "configured-model"
    assert fake.responses.kwargs["text_format"] is AiDesignPlan
    assert fake.responses.kwargs["store"] is False


@pytest.mark.asyncio
async def test_openai_adapter_adds_only_validated_image_as_data_url(
    monkeypatch: pytest.MonkeyPatch,
    request_model: AiDesignRequest,
    plan: AiDesignPlan,
) -> None:
    fake = FakeClient(plan)

    def client_factory(**_kwargs: Any) -> FakeClient:
        return fake

    monkeypatch.setattr("app.provider.AsyncOpenAI", client_factory)
    provider = OpenAiDesignProvider(
        Settings(
            openai_api_key="test-only-key",
            ai_model="configured-model",
            ai_calls_enabled=True,
        )
    )
    image = SafeImage(b"safe-jpeg", "image/jpeg", "image/png", 123, 10, 10)
    await provider.create_plan(request_model, image)
    content = fake.responses.kwargs["input"][0]["content"]
    assert content[1]["type"] == "input_image"
    assert content[1]["image_url"].startswith("data:image/jpeg;base64,")
    assert content[1]["detail"] == "low"


class FakeChatCompletions:
    def __init__(self, content: str) -> None:
        self.content = content
        self.kwargs: dict[str, Any] = {}

    async def create(self, **kwargs: Any) -> Any:
        self.kwargs = kwargs
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=self.content))],
            usage=SimpleNamespace(prompt_tokens=7, completion_tokens=9, total_tokens=16),
        )


class FakeNineRouterClient:
    def __init__(self, content: str) -> None:
        self.completions = FakeChatCompletions(content)
        self.chat = SimpleNamespace(completions=self.completions)


@pytest.mark.asyncio
async def test_ninerouter_adapter_uses_exact_model_and_validates_json(
    monkeypatch: pytest.MonkeyPatch,
    request_model: AiDesignRequest,
    plan: AiDesignPlan,
) -> None:
    fake = FakeNineRouterClient(json.dumps(plan.model_dump(by_alias=True)))
    client_options: dict[str, Any] = {}

    def client_factory(**kwargs: Any) -> FakeNineRouterClient:
        client_options.update(kwargs)
        return fake

    monkeypatch.setattr("app.provider.AsyncOpenAI", client_factory)
    provider = NineRouterDesignProvider(
        Settings(
            _env_file=None,
            ai_calls_enabled=True,
            ai_provider="9router",
            ninerouter_model="cx/exact-model-id",
            ninerouter_model_compatibility_verified=True,
        )
    )
    result = await provider.create_plan(request_model, None)
    assert result.plan == plan
    assert result.usage is not None and result.usage.total_tokens == 16
    assert fake.completions.kwargs["model"] == "cx/exact-model-id"
    assert fake.completions.kwargs["stream"] is False
    assert "response_format" not in fake.completions.kwargs
    assert client_options["base_url"] == "http://127.0.0.1:20128/v1"
    assert client_options["http_client"].follow_redirects is False
    await client_options["http_client"].aclose()


@pytest.mark.asyncio
async def test_ninerouter_adapter_rejects_invalid_json(
    monkeypatch: pytest.MonkeyPatch,
    request_model: AiDesignRequest,
) -> None:
    fake = FakeNineRouterClient("bu bir JSON planı değildir")
    monkeypatch.setattr("app.provider.AsyncOpenAI", lambda **_kwargs: fake)
    provider = NineRouterDesignProvider(
        Settings(
            _env_file=None,
            ai_calls_enabled=True,
            ninerouter_model="cx/exact-model-id",
            ninerouter_model_compatibility_verified=True,
        )
    )
    with pytest.raises(ProviderOutputError):
        await provider.create_plan(request_model, None)


def test_ninerouter_base_url_cannot_leave_loopback() -> None:
    with pytest.raises(ValueError):
        Settings(_env_file=None, ninerouter_base_url="https://example.com/v1")
