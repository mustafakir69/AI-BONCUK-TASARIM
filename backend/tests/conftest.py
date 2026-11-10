import json
from pathlib import Path
from typing import Any

import pytest

from app.config import Settings
from app.models import AiDesignPlan, AiDesignRequest

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def plan() -> AiDesignPlan:
    data = json.loads((ROOT / "contracts" / "ai-design-plan-v1.0.example.json").read_text(encoding="utf-8"))
    return AiDesignPlan.model_validate(data)


@pytest.fixture
def request_payload() -> dict[str, Any]:
    return {
        "schemaVersion": "1.0",
        "prompt": "Zarif bir dal tasarla.",
        "target": {"widthMm": 200, "heightMm": 250},
        "materialSelection": {"mode": "user-only", "selectedMaterialIds": ["mat-seed-bead"]},
        "constraints": {
            "minimumGapMm": 0.5,
            "targetGapMm": 1,
            "densityPercent": 70,
            "symmetry": "none",
            "maxPlacements": 100,
        },
        "catalog": [
            {
                "id": "mat-seed-bead",
                "name": "Kum boncuk",
                "shape": "square",
                "widthMm": 2.5,
                "heightMm": 2.5,
                "color": "#C99A45",
                "active": True,
            },
            {
                "id": "mat-pearl",
                "name": "İnci",
                "shape": "circle",
                "widthMm": 4,
                "heightMm": 4,
                "color": "#F2EEE3",
                "active": True,
            },
        ],
    }


@pytest.fixture
def request_model(request_payload: dict[str, Any]) -> AiDesignRequest:
    return AiDesignRequest.model_validate(request_payload)


@pytest.fixture
def enabled_settings() -> Settings:
    return Settings(
        _env_file=None,
        openai_api_key="test-only-key",
        ai_model="test-model",
        ai_provider="openai",
        ai_calls_enabled=True,
        ai_rate_limit_requests=20,
        ai_rate_limit_window_seconds=60,
    )
