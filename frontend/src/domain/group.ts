export interface PlacementGroup {
  id: string;
  placementIds: string[];
}

export function createGroupId(existingIds: ReadonlySet<string>): string {
  const randomPart = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const base = `group-${randomPart}`;
  if (!existingIds.has(base)) return base;
  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function expandSelectionForGroups(
  selectedIds: ReadonlySet<string>,
  groups: readonly PlacementGroup[],
): Set<string> {
  const expanded = new Set(selectedIds);
  for (const group of groups) {
    if (group.placementIds.some((id) => expanded.has(id))) {
      for (const id of group.placementIds) expanded.add(id);
    }
  }
  return expanded;
}

export function normalizeGroups(
  groups: readonly PlacementGroup[],
  validPlacementIds: ReadonlySet<string>,
): PlacementGroup[] {
  return groups.flatMap((group) => {
    const placementIds = [...new Set(group.placementIds.filter((id) => validPlacementIds.has(id)))];
    return placementIds.length >= 2 ? [{ ...group, placementIds }] : [];
  });
}
