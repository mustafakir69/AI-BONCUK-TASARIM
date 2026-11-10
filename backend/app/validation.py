from .models import AiDesignPlan, AiDesignRequest


def validate_plan_against_request(plan: AiDesignPlan, request: AiDesignRequest) -> list[str]:
    issues: list[str] = []
    if plan.target != request.target:
        issues.append("Plan hedef ölçüleri kullanıcı isteğiyle eşleşmiyor.")
    allowed = request.allowed_material_ids()
    plan_ids = plan.material_ids
    if len(plan_ids) != len(set(plan_ids)) or any(item not in allowed for item in plan_ids):
        issues.append("Plan izin verilmeyen veya yinelenen malzeme içeriyor.")
    if request.material_selection.mode == "collaborative":
        missing = set(request.material_selection.selected_material_ids) - set(plan_ids)
        if missing:
            issues.append("Birlikte seçim modundaki zorunlu malzemeler planda eksik.")
    component_ids = [component.id for component in plan.components]
    if len(component_ids) != len(set(component_ids)):
        issues.append("Plan bileşen kimlikleri benzersiz değil.")
    requested_count = 0
    half_width = request.target.width_mm / 2
    half_height = request.target.height_mm / 2
    for component in plan.components:
        requested_count += component.placement.max_placements
        if any(item not in plan_ids for item in component.placement.material_ids):
            issues.append(f"{component.id} plan malzeme kümesi dışında malzeme kullanıyor.")
        if abs(component.center_xmm) > half_width or abs(component.center_ymm) > half_height:
            issues.append(f"{component.id} merkezi motif sınırının dışında.")
        if component.width_mm > request.target.width_mm or component.height_mm > request.target.height_mm:
            issues.append(f"{component.id} boyutu hedef motifi aşıyor.")
        if any(
            abs(point.x_mm) > half_width or abs(point.y_mm) > half_height
            for point in component.geometry.points
        ):
            issues.append(f"{component.id} geometri noktası motif sınırının dışında.")
    if requested_count > request.constraints.max_placements:
        issues.append("Bileşen boncuk üst sınırlarının toplamı kullanıcı sınırını aşıyor.")
    return issues
