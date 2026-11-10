from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

NonEmpty = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
MaterialId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
        allow_inf_nan=False,
    )


class Material(ApiModel):
    id: MaterialId
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    shape: Literal["square", "rectangle", "circle", "ring"]
    width_mm: float = Field(gt=0, le=1000)
    height_mm: float = Field(gt=0, le=1000)
    color: Annotated[str, StringConstraints(pattern=r"^#[0-9A-Fa-f]{6}$")]
    hole_diameter_mm: float | None = Field(default=None, gt=0, le=1000)
    active: bool

    @model_validator(mode="after")
    def validate_geometry(self) -> Material:
        if self.shape in {"square", "circle", "ring"} and abs(self.width_mm - self.height_mm) > 1e-7:
            raise ValueError("Kare ve dairesel malzemelerde genişlik ile yükseklik eşit olmalıdır.")
        if self.shape == "ring":
            if self.hole_diameter_mm is None or self.hole_diameter_mm >= self.width_mm:
                raise ValueError("Pul delik çapı dış çaptan küçük olmalıdır.")
        elif self.hole_diameter_mm is not None:
            raise ValueError("Delik çapı yalnız pul malzemesinde kullanılabilir.")
        return self


class ReferenceImageDescriptor(ApiModel):
    name: Annotated[str, StringConstraints(min_length=1, max_length=255)]
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]
    size_bytes: int = Field(ge=1, le=8 * 1024 * 1024)
    width_px: int = Field(ge=1, le=8192)
    height_px: int = Field(ge=1, le=8192)

    @model_validator(mode="after")
    def validate_pixels(self) -> ReferenceImageDescriptor:
        if self.width_px * self.height_px > 32_000_000:
            raise ValueError("Görsel 32 megapiksel sınırını aşıyor.")
        return self


class Target(ApiModel):
    width_mm: float = Field(ge=1, le=5000)
    height_mm: float = Field(ge=1, le=5000)


class MaterialSelection(ApiModel):
    mode: Literal["user-only", "ai-selects", "collaborative"]
    selected_material_ids: list[MaterialId] = Field(max_length=100)


class Constraints(ApiModel):
    minimum_gap_mm: float = Field(ge=0, le=100)
    target_gap_mm: float = Field(ge=0, le=100)
    density_percent: float = Field(ge=1, le=100)
    symmetry: Literal["none", "optional", "horizontal", "vertical", "four-way", "radial"]
    max_placements: int = Field(ge=1, le=5000)


class AiDesignRequest(ApiModel):
    schema_version: Literal["1.0"]
    prompt: Annotated[str, StringConstraints(max_length=10000)]
    reference_image: ReferenceImageDescriptor | None = None
    target: Target
    material_selection: MaterialSelection
    constraints: Constraints
    catalog: list[Material] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def validate_material_authority(self) -> AiDesignRequest:
        if not self.prompt.strip() and self.reference_image is None:
            raise ValueError("Bir tarif veya referans görsel gereklidir.")
        ids = [item.id for item in self.catalog]
        if len(ids) != len(set(ids)):
            raise ValueError("Katalog kimlikleri benzersiz olmalıdır.")
        active_ids = {item.id for item in self.catalog if item.active}
        selected = self.material_selection.selected_material_ids
        if len(selected) != len(set(selected)) or any(item not in active_ids for item in selected):
            raise ValueError("Seçili malzemeler benzersiz ve etkin katalogda olmalıdır.")
        if self.material_selection.mode in {"user-only", "collaborative"} and not selected:
            raise ValueError("Bu malzeme modunda en az bir seçim gerekir.")
        if self.material_selection.mode == "ai-selects" and not active_ids:
            raise ValueError("AI seçimi için etkin malzeme gerekir.")
        return self

    def allowed_material_ids(self) -> set[str]:
        if self.material_selection.mode == "user-only":
            return set(self.material_selection.selected_material_ids)
        return {item.id for item in self.catalog if item.active}


class PointMm(ApiModel):
    x_mm: float = Field(ge=-5000, le=5000)
    y_mm: float = Field(ge=-5000, le=5000)


class ComponentGeometry(ApiModel):
    type: Literal["line", "polyline", "bezier", "ellipse", "rectangle", "point-cluster", "unsupported"]
    points: list[PointMm] = Field(max_length=100)
    closed: bool
    interpretation_note: NonEmpty


class ComponentPlacement(ApiModel):
    strategy: Literal["follow-path", "fill-region", "edge", "scatter", "cluster"]
    material_ids: list[MaterialId] = Field(min_length=1, max_length=100)
    target_gap_mm: float = Field(ge=0, le=100)
    density_percent: float = Field(ge=1, le=100)
    max_placements: int = Field(ge=1, le=5000)


class AiDesignPlanComponent(ApiModel):
    id: NonEmpty
    kind: Literal["path", "region", "cluster", "accent", "border"]
    label: NonEmpty
    center_xmm: float = Field(ge=-2500, le=2500)
    center_ymm: float = Field(ge=-2500, le=2500)
    width_mm: float = Field(gt=0, le=5000)
    height_mm: float = Field(gt=0, le=5000)
    rotation_deg: float = Field(ge=0, lt=360)
    layer: int = Field(ge=0, le=1000)
    priority: int = Field(ge=0, le=1000)
    geometry: ComponentGeometry
    placement: ComponentPlacement


class DensityRegion(ApiModel):
    id: NonEmpty
    center_xmm: float = Field(ge=-2500, le=2500)
    center_ymm: float = Field(ge=-2500, le=2500)
    width_mm: float = Field(gt=0, le=5000)
    height_mm: float = Field(gt=0, le=5000)
    density_percent: float = Field(ge=1, le=100)
    layer: int = Field(ge=0, le=1000)


class Symmetry(ApiModel):
    type: Literal["none", "optional", "horizontal", "vertical", "four-way", "radial"]
    repeat_count: int | None = Field(default=None, ge=3, le=12)


class AiDesignPlan(ApiModel):
    schema_version: Literal["1.0"]
    description: NonEmpty
    target: Target
    material_ids: list[MaterialId] = Field(min_length=1, max_length=100)
    components: list[AiDesignPlanComponent] = Field(min_length=1, max_length=200)
    density_regions: list[DensityRegion] = Field(max_length=100)
    symmetry: Symmetry
    placement_instructions: list[NonEmpty] = Field(max_length=50)
    warnings: list[NonEmpty] = Field(max_length=50)
    uncertainties: list[NonEmpty] = Field(max_length=50)


class Usage(ApiModel):
    input_tokens: int | None = Field(default=None, ge=0)
    output_tokens: int | None = Field(default=None, ge=0)
    total_tokens: int | None = Field(default=None, ge=0)


class DesignResponse(ApiModel):
    request_id: str
    plan: AiDesignPlan
    usage: Usage | None = None


class ProviderHealth(ApiModel):
    id: Literal["openai", "9router"]
    name: str
    state: Literal["ready", "disabled", "unconfigured", "unavailable", "unverified"]
    message: str
    model_id: str | None = None
    reachable: bool | None = None
    model_available: bool | None = None
    compatibility_verified: bool
    text_supported: bool
    vision_supported: bool
    structured_output: Literal["native-schema", "validated-json"]
    api_mode: Literal["responses", "chat-completions"]


class HealthResponse(ApiModel):
    status: Literal["ok"] = "ok"
    provider_state: Literal["ready", "disabled", "unconfigured", "unavailable", "unverified"]
    provider_name: str = "OpenAI Responses API"
    model_configured: bool
    default_provider: Literal["openai", "9router"]
    providers: list[ProviderHealth]
