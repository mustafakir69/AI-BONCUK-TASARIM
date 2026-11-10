import asyncio
import base64
import json
from dataclasses import dataclass
from typing import Any, Protocol, cast

from httpx2 import AsyncClient
from openai import APIConnectionError, APIError, APITimeoutError, AsyncOpenAI, RateLimitError
from openai.types.responses import ResponseInputParam
from pydantic import ValidationError

from .config import Settings
from .image_validation import SafeImage
from .models import AiDesignPlan, AiDesignRequest, Usage
from .prompt import SYSTEM_INSTRUCTIONS, build_user_content


class ProviderError(RuntimeError):
    code = "PROVIDER_ERROR"


class ProviderRateLimitError(ProviderError):
    code = "PROVIDER_RATE_LIMIT"


class ProviderTimeoutError(ProviderError):
    code = "PROVIDER_TIMEOUT"


class ProviderOutputError(ProviderError):
    code = "INVALID_PROVIDER_OUTPUT"


@dataclass(frozen=True)
class ProviderResult:
    plan: AiDesignPlan
    usage: Usage | None


@dataclass(frozen=True)
class NineRouterProbeResult:
    reachable: bool
    model_ids: frozenset[str]
    vision_model_ids: frozenset[str]
    error: str | None = None


class DesignProvider(Protocol):
    async def create_plan(self, request: AiDesignRequest, image: SafeImage | None) -> ProviderResult: ...


class OpenAiDesignProvider:
    def __init__(self, settings: Settings) -> None:
        if not settings.openai_api_key or not settings.ai_model:
            raise ValueError("OpenAI anahtarı ve model yapılandırması gereklidir.")
        self._model = settings.ai_model
        self._timeout = settings.ai_request_timeout_seconds
        self._max_output_tokens = settings.ai_max_output_tokens
        self._client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            timeout=settings.ai_request_timeout_seconds,
            max_retries=settings.ai_max_retries,
        )

    async def create_plan(self, request: AiDesignRequest, image: SafeImage | None) -> ProviderResult:
        content: list[dict[str, Any]] = [{"type": "input_text", "text": build_user_content(request)}]
        if image is not None:
            encoded = base64.b64encode(image.data).decode("ascii")
            content.append(
                {
                    "type": "input_image",
                    "image_url": f"data:{image.mime_type};base64,{encoded}",
                    "detail": "low",
                }
            )
        try:
            response_input = cast(ResponseInputParam, [{"role": "user", "content": content}])
            response = await asyncio.wait_for(
                self._client.responses.parse(
                    model=self._model,
                    instructions=SYSTEM_INSTRUCTIONS,
                    input=response_input,
                    text_format=AiDesignPlan,
                    max_output_tokens=self._max_output_tokens,
                    store=False,
                ),
                timeout=self._timeout,
            )
        except RateLimitError as exc:
            raise ProviderRateLimitError("Bulut hizmeti istek sınırına ulaştı.") from exc
        except (APITimeoutError, asyncio.TimeoutError) as exc:
            raise ProviderTimeoutError("Bulut yapay zekâ isteği zaman aşımına uğradı.") from exc
        except APIConnectionError as exc:
            raise ProviderError("Bulut yapay zekâ hizmetine bağlanılamadı.") from exc
        except APIError as exc:
            raise ProviderError("Bulut yapay zekâ hizmeti isteği tamamlayamadı.") from exc
        plan = response.output_parsed
        if not isinstance(plan, AiDesignPlan):
            raise ProviderOutputError("Sağlayıcı geçerli bir tasarım planı döndürmedi.")
        raw_usage = getattr(response, "usage", None)
        usage = (
            None
            if raw_usage is None
            else Usage(
                input_tokens=getattr(raw_usage, "input_tokens", None),
                output_tokens=getattr(raw_usage, "output_tokens", None),
                total_tokens=getattr(raw_usage, "total_tokens", None),
            )
        )
        return ProviderResult(plan=plan, usage=usage)


class NineRouterDesignProvider:
    """9Router'ın belgelenmiş OpenAI uyumlu Chat Completions yolunu kullanır."""

    def __init__(self, settings: Settings) -> None:
        if not settings.ninerouter_model:
            raise ValueError("9Router model kimliği yapılandırması gereklidir.")
        self._model = settings.ninerouter_model
        self._timeout = settings.ai_request_timeout_seconds
        self._max_output_tokens = settings.ai_max_output_tokens
        self._vision_verified = settings.ninerouter_vision_verified
        self._json_mode = settings.ninerouter_json_mode
        self._client = AsyncOpenAI(
            base_url=settings.ninerouter_base_url,
            api_key=settings.ninerouter_api_key or "local-no-auth",
            timeout=settings.ai_request_timeout_seconds,
            max_retries=settings.ai_max_retries,
            http_client=AsyncClient(follow_redirects=False),
        )

    async def create_plan(self, request: AiDesignRequest, image: SafeImage | None) -> ProviderResult:
        if image is not None and not self._vision_verified:
            raise ProviderError("Seçili 9Router modelinin görsel uyumluluğu doğrulanmadı.")
        schema = json.dumps(AiDesignPlan.model_json_schema(by_alias=True), ensure_ascii=False)
        system_content = (
            f"{SYSTEM_INSTRUCTIONS}\nYalnız tek bir JSON nesnesi döndür. Markdown kod bloğu kullanma. "
            f"JSON bu şemaya uymalıdır: {schema}"
        )
        user_content: str | list[dict[str, Any]] = build_user_content(request)
        if image is not None:
            encoded = base64.b64encode(image.data).decode("ascii")
            user_content = [
                {"type": "text", "text": build_user_content(request)},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{image.mime_type};base64,{encoded}", "detail": "low"},
                },
            ]
        response_format: dict[str, str] | None = (
            {"type": "json_object"} if self._json_mode == "json_object" else None
        )
        try:
            kwargs: dict[str, Any] = {
                "model": self._model,
                "messages": [
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": user_content},
                ],
                "max_tokens": self._max_output_tokens,
                "stream": False,
            }
            if response_format is not None:
                kwargs["response_format"] = response_format
            response = await asyncio.wait_for(
                self._client.chat.completions.create(**cast(Any, kwargs)),
                timeout=self._timeout,
            )
        except RateLimitError as exc:
            raise ProviderRateLimitError("9Router istek sınırına ulaştı.") from exc
        except (APITimeoutError, asyncio.TimeoutError) as exc:
            raise ProviderTimeoutError("9Router isteği zaman aşımına uğradı.") from exc
        except APIConnectionError as exc:
            raise ProviderError("Yerel 9Router hizmetine bağlanılamadı.") from exc
        except APIError as exc:
            raise ProviderError("9Router isteği tamamlayamadı.") from exc
        content = response.choices[0].message.content if response.choices else None
        if not isinstance(content, str) or not content.strip():
            raise ProviderOutputError("9Router boş veya metin olmayan bir yanıt döndürdü.")
        try:
            plan = AiDesignPlan.model_validate(json.loads(content))
        except (json.JSONDecodeError, ValidationError) as exc:
            raise ProviderOutputError(
                "9Router yanıtı geçerli AiDesignPlan JSON sözleşmesine uymuyor."
            ) from exc
        raw_usage = response.usage
        usage = (
            None
            if raw_usage is None
            else Usage(
                input_tokens=raw_usage.prompt_tokens,
                output_tokens=raw_usage.completion_tokens,
                total_tokens=raw_usage.total_tokens,
            )
        )
        return ProviderResult(plan=plan, usage=usage)


async def probe_ninerouter(settings: Settings) -> NineRouterProbeResult:
    """Yalnız model kataloğunu okur; üretim/prompt çağrısı yapmaz."""

    client = AsyncOpenAI(
        base_url=settings.ninerouter_base_url,
        api_key=settings.ninerouter_api_key or "local-no-auth",
        timeout=min(settings.ai_request_timeout_seconds, 5),
        max_retries=0,
        http_client=AsyncClient(follow_redirects=False),
    )
    try:
        page = await asyncio.wait_for(client.models.list(), timeout=5)
        model_ids: set[str] = set()
        vision_ids: set[str] = set()
        for model in page.data:
            model_ids.add(model.id)
            capabilities = getattr(model, "capabilities", None)
            if isinstance(capabilities, dict) and capabilities.get("vision") is True:
                vision_ids.add(model.id)
        return NineRouterProbeResult(True, frozenset(model_ids), frozenset(vision_ids))
    except (APIError, asyncio.TimeoutError) as exc:
        return NineRouterProbeResult(False, frozenset(), frozenset(), type(exc).__name__)
    finally:
        await client.close()
