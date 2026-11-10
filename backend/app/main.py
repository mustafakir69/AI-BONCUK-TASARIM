import asyncio
import json
from typing import Annotated, Literal

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from .config import Settings, get_settings
from .image_validation import ImageValidationError, validate_and_normalize_image
from .models import AiDesignPlan, AiDesignRequest, DesignResponse, HealthResponse, ProviderHealth
from .provider import (
    DesignProvider,
    NineRouterDesignProvider,
    OpenAiDesignProvider,
    ProviderError,
    ProviderOutputError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    probe_ninerouter,
)
from .security import InFlightRegistry, RateLimiter
from .validation import validate_plan_against_request


def create_app(
    settings: Settings | None = None,
    provider: DesignProvider | None = None,
    providers: dict[str, DesignProvider] | None = None,
) -> FastAPI:
    config = settings or get_settings()
    app = FastAPI(title="AI Boncuk Tasarım API", version="0.8.0", docs_url="/api/docs")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-Request-ID"],
    )
    app.state.settings = config
    provider_registry: dict[str, DesignProvider] = dict(providers or {})
    if provider is not None:
        provider_registry[config.ai_provider] = provider
    if provider is None and providers is None:
        if config.provider_configured("openai"):
            provider_registry["openai"] = OpenAiDesignProvider(config)
        if config.provider_configured("9router"):
            provider_registry["9router"] = NineRouterDesignProvider(config)
    app.state.providers = provider_registry
    app.state.rate_limiter = RateLimiter(config.ai_rate_limit_requests, config.ai_rate_limit_window_seconds)
    app.state.in_flight = InFlightRegistry()
    app.state.semaphore = asyncio.Semaphore(config.ai_max_concurrent_requests)

    @app.get("/api/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        openai_configured = bool(config.openai_api_key and config.ai_model)
        openai_state: Literal["ready", "disabled", "unconfigured", "unavailable", "unverified"] = (
            "disabled"
            if not config.ai_calls_enabled
            else ("ready" if openai_configured and "openai" in app.state.providers else "unconfigured")
        )
        openai_health = ProviderHealth(
            id="openai",
            name="OpenAI Responses API",
            state=openai_state,
            message=(
                "OpenAI çağrıları sunucu ayarlarında kapalı."
                if openai_state == "disabled"
                else (
                    "OpenAI anahtarı ve model sunucuda yapılandırıldı."
                    if openai_state == "ready"
                    else "OpenAI anahtarı veya model sunucuda yapılandırılmadı."
                )
            ),
            model_id=config.ai_model,
            reachable=None,
            model_available=None,
            compatibility_verified=openai_configured,
            text_supported=openai_state == "ready",
            vision_supported=openai_state == "ready",
            structured_output="native-schema",
            api_mode="responses",
        )
        router_probe = await probe_ninerouter(config)
        router_model_available = bool(
            config.ninerouter_model and config.ninerouter_model in router_probe.model_ids
        )
        router_state: Literal["ready", "disabled", "unconfigured", "unavailable", "unverified"]
        if not config.ai_calls_enabled:
            router_state = "disabled"
            router_message = "9Router AI çağrıları sunucu ayarlarında kapalı."
        elif not config.ninerouter_model:
            router_state = "unconfigured"
            router_message = "9Router model kimliği yapılandırılmadı."
        elif not router_probe.reachable:
            router_state = "unavailable"
            router_message = "Yerel 9Router model kataloğuna ulaşılamadı."
        elif not router_model_available:
            router_state = "unavailable"
            router_message = "Yapılandırılan model 9Router model listesinde bulunamadı."
        elif not config.ninerouter_model_compatibility_verified:
            router_state = "unverified"
            router_message = "9Router erişilebilir; model metin uyumluluğu henüz doğrulanmadı."
        else:
            router_state = "ready"
            router_message = "9Router erişilebilir ve yapılandırılan model doğrulandı."
        router_health = ProviderHealth(
            id="9router",
            name="9Router yerel ağ geçidi",
            state=router_state,
            message=router_message,
            model_id=config.ninerouter_model,
            reachable=router_probe.reachable,
            model_available=router_model_available if config.ninerouter_model else None,
            compatibility_verified=config.ninerouter_model_compatibility_verified,
            text_supported=router_state == "ready",
            vision_supported=bool(
                router_state == "ready"
                and config.ninerouter_vision_verified
                and config.ninerouter_model in router_probe.vision_model_ids
            ),
            structured_output="validated-json",
            api_mode="chat-completions",
        )
        provider_health = {"openai": openai_health, "9router": router_health}
        selected_health = provider_health[config.ai_provider]
        return HealthResponse(
            provider_state=selected_health.state,
            provider_name=selected_health.name,
            model_configured=selected_health.model_id is not None,
            default_provider=config.ai_provider,
            providers=[openai_health, router_health],
        )

    @app.get("/api/ai/schema")
    async def ai_schema() -> dict[str, object]:
        return AiDesignPlan.model_json_schema(by_alias=True)

    @app.post("/api/ai/design", response_model=DesignResponse)
    async def design(
        http_request: Request,
        request_json: Annotated[str, Form(max_length=200_000)],
        consent: Annotated[bool, Form()],
        request_id: Annotated[str, Form(min_length=8, max_length=100)],
        provider_id: Annotated[str, Form()] = "",
        reference_image: Annotated[UploadFile | None, File()] = None,
    ) -> DesignResponse:
        if not consent:
            raise HTTPException(
                400,
                detail={
                    "code": "CONSENT_REQUIRED",
                    "message": "AI sağlayıcısına aktarım için açık onay gereklidir.",
                },
            )
        if not config.ai_calls_enabled:
            raise HTTPException(
                503,
                detail={
                    "code": "AI_DISABLED",
                    "message": "AI çağrıları sunucu ayarlarında kapalı.",
                },
            )
        selected_provider = provider_id or config.ai_provider
        if selected_provider not in ("openai", "9router"):
            raise HTTPException(
                422,
                detail={"code": "INVALID_PROVIDER", "message": "Bilinmeyen AI sağlayıcısı seçildi."},
            )
        selected_adapter: DesignProvider | None = app.state.providers.get(selected_provider)
        if selected_adapter is None:
            raise HTTPException(
                503,
                detail={
                    "code": "AI_UNCONFIGURED",
                    "message": "Seçilen AI sağlayıcısı için model veya sunucu yapılandırması eksik.",
                },
            )
        router_probe = None
        if selected_provider == "9router":
            router_probe = await probe_ninerouter(config)
            if not router_probe.reachable:
                raise HTTPException(
                    503,
                    detail={"code": "NINEROUTER_UNAVAILABLE", "message": "Yerel 9Router'a ulaşılamadı."},
                )
            if config.ninerouter_model not in router_probe.model_ids:
                raise HTTPException(
                    503,
                    detail={
                        "code": "NINEROUTER_MODEL_UNAVAILABLE",
                        "message": "Yapılandırılan model 9Router model listesinde bulunamadı.",
                    },
                )
        client_key = http_request.client.host if http_request.client else "unknown"
        if not await app.state.rate_limiter.allow(client_key):
            raise HTTPException(
                429,
                detail={
                    "code": "LOCAL_RATE_LIMIT",
                    "message": "Çok fazla AI isteği gönderildi; daha sonra tekrar deneyin.",
                },
            )
        if not await app.state.in_flight.add(request_id):
            raise HTTPException(
                409,
                detail={"code": "DUPLICATE_REQUEST", "message": "Aynı istek zaten işleniyor."},
            )
        try:
            try:
                payload = AiDesignRequest.model_validate(json.loads(request_json))
            except (json.JSONDecodeError, ValidationError) as exc:
                raise HTTPException(
                    422,
                    detail={"code": "INVALID_REQUEST", "message": "AI istek sözleşmesi geçersiz."},
                ) from exc
            image = None
            if payload.reference_image is not None and reference_image is None:
                raise HTTPException(
                    422,
                    detail={
                        "code": "IMAGE_MISSING",
                        "message": "İstek üst verisindeki referans görsel dosyası eksik.",
                    },
                )
            if reference_image is not None:
                if payload.reference_image is None:
                    raise HTTPException(
                        422,
                        detail={
                            "code": "UNDECLARED_IMAGE",
                            "message": "Görsel üst verisi istek sözleşmesinde bulunmuyor.",
                        },
                    )
                try:
                    image = await validate_and_normalize_image(reference_image)
                except ImageValidationError as exc:
                    raise HTTPException(415, detail={"code": "INVALID_IMAGE", "message": str(exc)}) from exc
                descriptor = payload.reference_image
                if (
                    image.source_mime_type != descriptor.mime_type
                    or image.source_size_bytes != descriptor.size_bytes
                    or image.width_px != descriptor.width_px
                    or image.height_px != descriptor.height_px
                ):
                    raise HTTPException(
                        422,
                        detail={
                            "code": "IMAGE_METADATA_MISMATCH",
                            "message": "Görsel üst verisi dosyayla eşleşmiyor.",
                        },
                    )
                if selected_provider == "9router" and (
                    not config.ninerouter_vision_verified
                    or router_probe is None
                    or config.ninerouter_model not in router_probe.vision_model_ids
                ):
                    raise HTTPException(
                        422,
                        detail={
                            "code": "NINEROUTER_VISION_UNVERIFIED",
                            "message": "Seçilen 9Router modelinin görsel uyumluluğu doğrulanmadı.",
                        },
                    )
            async with app.state.semaphore:
                try:
                    result = await selected_adapter.create_plan(payload, image)
                except ProviderRateLimitError as exc:
                    raise HTTPException(429, detail={"code": exc.code, "message": str(exc)}) from exc
                except ProviderTimeoutError as exc:
                    raise HTTPException(504, detail={"code": exc.code, "message": str(exc)}) from exc
                except ProviderOutputError as exc:
                    raise HTTPException(502, detail={"code": exc.code, "message": str(exc)}) from exc
                except ProviderError as exc:
                    raise HTTPException(502, detail={"code": exc.code, "message": str(exc)}) from exc
            plan_issues = validate_plan_against_request(result.plan, payload)
            if plan_issues:
                raise HTTPException(
                    502,
                    detail={"code": "INVALID_PROVIDER_OUTPUT", "message": plan_issues[0]},
                )
            return DesignResponse(request_id=request_id, plan=result.plan, usage=result.usage)
        finally:
            await app.state.in_flight.remove(request_id)

    return app


app = create_app()
