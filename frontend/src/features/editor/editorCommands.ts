import type { PlacementGroup } from "../../domain/group";
import type { Placement } from "../../domain/placement";

export interface EditorDocumentState {
  placements: Placement[];
  groups: PlacementGroup[];
}

export type EditorCommand =
  | { type: "placement.add"; placement: Placement }
  | { type: "placement.remove"; placement: Placement; groupsBefore?: PlacementGroup[]; groupsAfter?: PlacementGroup[] }
  | { type: "placement.update"; before: Placement; after: Placement }
  | { type: "placements.add"; placements: Placement[]; groups: PlacementGroup[] }
  | { type: "placements.remove"; placements: Placement[]; groupsBefore: PlacementGroup[]; groupsAfter: PlacementGroup[] }
  | { type: "placements.update"; before: Placement[]; after: Placement[] }
  | { type: "document.replace"; before: EditorDocumentState; after: EditorDocumentState }
  | { type: "groups.update"; before: PlacementGroup[]; after: PlacementGroup[] };

function replacePlacements(
  placements: readonly Placement[],
  replacements: readonly Placement[],
): Placement[] {
  const byId = new Map(replacements.map((placement) => [placement.id, placement]));
  return placements.map((placement) => byId.get(placement.id) ?? placement);
}

function cloneGroups(groups: readonly PlacementGroup[]): PlacementGroup[] {
  return groups.map((group) => ({ ...group, placementIds: [...group.placementIds] }));
}

export function applyEditorCommand(
  state: EditorDocumentState,
  command: EditorCommand,
): EditorDocumentState {
  if (command.type === "placement.add") {
    return { ...state, placements: [...state.placements, command.placement] };
  }
  if (command.type === "placement.remove") {
    return {
      placements: state.placements.filter((placement) => placement.id !== command.placement.id),
      groups: cloneGroups(command.groupsAfter ?? state.groups),
    };
  }
  if (command.type === "placement.update") {
    return { ...state, placements: replacePlacements(state.placements, [command.after]) };
  }
  if (command.type === "placements.add") {
    return {
      placements: [...state.placements, ...command.placements],
      groups: [...state.groups, ...cloneGroups(command.groups)],
    };
  }
  if (command.type === "placements.remove") {
    const ids = new Set(command.placements.map((placement) => placement.id));
    return {
      placements: state.placements.filter((placement) => !ids.has(placement.id)),
      groups: cloneGroups(command.groupsAfter),
    };
  }
  if (command.type === "placements.update") {
    return { ...state, placements: replacePlacements(state.placements, command.after) };
  }
  if (command.type === "document.replace") {
    return {
      placements: command.after.placements.map((placement) => ({ ...placement })),
      groups: cloneGroups(command.after.groups),
    };
  }
  return { ...state, groups: cloneGroups(command.after) };
}

export function revertEditorCommand(
  state: EditorDocumentState,
  command: EditorCommand,
): EditorDocumentState {
  if (command.type === "placement.add") {
    return { ...state, placements: state.placements.filter((item) => item.id !== command.placement.id) };
  }
  if (command.type === "placement.remove") {
    return {
      placements: [...state.placements, command.placement],
      groups: cloneGroups(command.groupsBefore ?? state.groups),
    };
  }
  if (command.type === "placement.update") {
    return { ...state, placements: replacePlacements(state.placements, [command.before]) };
  }
  if (command.type === "placements.add") {
    const ids = new Set(command.placements.map((placement) => placement.id));
    const groupIds = new Set(command.groups.map((group) => group.id));
    return {
      placements: state.placements.filter((placement) => !ids.has(placement.id)),
      groups: state.groups.filter((group) => !groupIds.has(group.id)),
    };
  }
  if (command.type === "placements.remove") {
    return {
      placements: [...state.placements, ...command.placements],
      groups: cloneGroups(command.groupsBefore),
    };
  }
  if (command.type === "placements.update") {
    return { ...state, placements: replacePlacements(state.placements, command.before) };
  }
  if (command.type === "document.replace") {
    return {
      placements: command.before.placements.map((placement) => ({ ...placement })),
      groups: cloneGroups(command.before.groups),
    };
  }
  return { ...state, groups: cloneGroups(command.before) };
}
