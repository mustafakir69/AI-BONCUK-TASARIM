from pathlib import Path

import pytest
from pydantic import ValidationError

from app.models import AiDesignPlan, AiDesignRequest
from app.validation import validate_plan_against_request


def test_all_three_material_modes_are_validated(request_payload: dict[str, object]) -> None:
    for mode, selected in [
        ("user-only", ["mat-seed-bead"]),
        ("ai-selects", []),
        ("collaborative", ["mat-seed-bead"]),
    ]:
        payload = {**request_payload, "materialSelection": {"mode": mode, "selectedMaterialIds": selected}}
        assert AiDesignRequest.model_validate(payload).material_selection.mode == mode


def test_unknown_selected_material_is_rejected(request_payload: dict[str, object]) -> None:
    request_payload["materialSelection"] = {"mode": "user-only", "selectedMaterialIds": ["unknown"]}
    with pytest.raises(ValidationError):
        AiDesignRequest.model_validate(request_payload)


def test_plan_cannot_add_catalog_material_in_user_only_mode(
    request_model: AiDesignRequest,
    plan: AiDesignPlan,
) -> None:
    changed = plan.model_copy(update={"material_ids": ["mat-pearl"]})
    assert "izin verilmeyen" in validate_plan_against_request(changed, request_model)[0]


def test_collaborative_mode_requires_selected_materials(
    request_payload: dict[str, object],
    plan: AiDesignPlan,
) -> None:
    request_payload["materialSelection"] = {
        "mode": "collaborative",
        "selectedMaterialIds": ["mat-seed-bead", "mat-pearl"],
    }
    request = AiDesignRequest.model_validate(request_payload)
    assert "zorunlu" in validate_plan_against_request(plan, request)[0]


def test_plan_target_coordinates_and_count_are_bounded(
    request_model: AiDesignRequest,
    plan: AiDesignPlan,
) -> None:
    component = plan.components[0]
    outside = component.model_copy(update={"center_xmm": 101})
    over_count = component.model_copy(update={"max_placements": 101})
    assert any(
        "sınırının dışında" in item
        for item in validate_plan_against_request(
            plan.model_copy(update={"components": [outside]}), request_model
        )
    )
    # Pydantic model_copy intentionally bypasses parsing here to exercise the cross-contract gate.
    over_count.placement = component.placement.model_copy(update={"max_placements": 101})
    assert any(
        "üst sınır" in item
        for item in validate_plan_against_request(
            plan.model_copy(update={"components": [over_count]}), request_model
        )
    )


def test_contract_fixture_has_no_secret_and_is_backend_compatible(plan: AiDesignPlan) -> None:
    assert plan.schema_version == "1.0"
    source = Path(__file__).resolve().parents[1].joinpath("app", "provider.py").read_text(encoding="utf-8")
    assert "store=False" in source
    assert "OPENAI_API_KEY" not in source


def test_frontend_production_sources_do_not_contain_openai_secret() -> None:
    frontend = Path(__file__).resolve().parents[2] / "frontend" / "src"
    production_sources = [
        path for path in frontend.rglob("*") if path.suffix in {".ts", ".tsx"} and ".test." not in path.name
    ]
    combined = "\n".join(path.read_text(encoding="utf-8") for path in production_sources)
    assert "OPENAI_API_KEY" not in combined
    assert "sk-" not in combined


def test_wildcard_cors_configuration_is_rejected() -> None:
    from app.config import Settings

    with pytest.raises(ValidationError):
        Settings(ai_allowed_origins="*")
