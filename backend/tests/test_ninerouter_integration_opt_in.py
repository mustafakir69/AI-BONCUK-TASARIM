import os
from io import BytesIO

import pytest
from PIL import Image

from app.config import Settings
from app.image_validation import SafeImage
from app.models import AiDesignRequest
from app.provider import NineRouterDesignProvider

LIVE_APPROVED = (
    os.getenv("RUN_NINEROUTER_INTEGRATION_TESTS") == "1"
    and os.getenv("NINEROUTER_LIVE_TEST_APPROVED") == "YES"
    and bool(os.getenv("NINEROUTER_MODEL"))
)


def live_settings(*, vision: bool = False) -> Settings:
    return Settings(
        ai_calls_enabled=True,
        ai_provider="9router",
        ninerouter_model_compatibility_verified=True,
        ninerouter_vision_verified=vision,
    )


@pytest.mark.asyncio
@pytest.mark.skipif(
    not LIVE_APPROVED,
    reason="Gerçek 9Router metin/JSON testi ayrı açık onay ve model kimliği gerektirir.",
)
async def test_real_ninerouter_text_and_structured_plan_opt_in(
    request_model: AiDesignRequest,
) -> None:
    result = await NineRouterDesignProvider(live_settings()).create_plan(request_model, None)
    assert result.plan.schema_version == "1.0"


@pytest.mark.asyncio
@pytest.mark.skipif(
    not LIVE_APPROVED or os.getenv("RUN_NINEROUTER_VISION_TESTS") != "1",
    reason="Gerçek 9Router görsel testi ayrı açık onay ve vision doğrulaması gerektirir.",
)
async def test_real_ninerouter_vision_plan_opt_in(request_model: AiDesignRequest) -> None:
    output = BytesIO()
    Image.new("RGB", (16, 16), "white").save(output, "JPEG")
    data = output.getvalue()
    image = SafeImage(data, "image/jpeg", "image/jpeg", len(data), 16, 16)
    result = await NineRouterDesignProvider(live_settings(vision=True)).create_plan(request_model, image)
    assert result.plan.schema_version == "1.0"
