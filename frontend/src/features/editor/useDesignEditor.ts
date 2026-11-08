import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import type { PointMm } from "../../domain/coordinates";
import {
  alignPlacements,
  rotatePlacementsAroundSelection,
  selectPlacementsInRect,
  translatePlacements,
  type AlignmentOperation,
  type WorldRect,
} from "../../domain/editing";
import {
  placementIssueMessage,
  validateAllPlacements,
  validatePlacement,
  type PlacementValidationResult,
} from "../../domain/geometry/validation";
import {
  createGroupId,
  expandSelectionForGroups,
  normalizeGroups,
  type PlacementGroup,
} from "../../domain/group";
import type { Material } from "../../domain/material";
import {
  countPlacementsByMaterial,
  createPlacementId,
  normalizeRotation,
  type Placement,
} from "../../domain/placement";
import {
  applyEditorCommand,
  revertEditorCommand,
  type EditorCommand,
  type EditorDocumentState,
} from "./editorCommands";

export type EditorMode = "select" | "place";

interface HistoryState extends EditorDocumentState {
  past: EditorCommand[];
  future: EditorCommand[];
}

type HistoryAction =
  | { type: "execute"; command: EditorCommand }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "replace"; placements: Placement[]; groups: PlacementGroup[] };

interface ClipboardData {
  placements: Placement[];
  groups: PlacementGroup[];
}

const HISTORY_LIMIT = 100;
const DEFAULT_PASTE_OFFSET_MM = 10;
export const MAX_DUPLICATE_REPEATS = 1000;
export const MAX_DUPLICATE_PLACEMENTS = 10_000;

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === "replace") {
    return { placements: action.placements, groups: action.groups, past: [], future: [] };
  }
  if (action.type === "execute") {
    return {
      ...applyEditorCommand(state, action.command),
      past: [...state.past, action.command].slice(-HISTORY_LIMIT),
      future: [],
    };
  }
  if (action.type === "undo") {
    const command = state.past.at(-1);
    if (!command) return state;
    return {
      ...revertEditorCommand(state, command),
      past: state.past.slice(0, -1),
      future: [command, ...state.future].slice(0, HISTORY_LIMIT),
    };
  }
  const command = state.future[0];
  if (!command) return state;
  return {
    ...applyEditorCommand(state, command),
    past: [...state.past, command].slice(-HISTORY_LIMIT),
    future: state.future.slice(1),
  };
}

function replaceInDocument(
  placements: readonly Placement[],
  replacements: readonly Placement[],
): Placement[] {
  const byId = new Map(replacements.map((placement) => [placement.id, placement]));
  return placements.map((placement) => byId.get(placement.id) ?? placement);
}

export interface DesignEditorState {
  placements: Placement[];
  groups: PlacementGroup[];
  selectedIds: ReadonlySet<string>;
  selectedPlacements: Placement[];
  selectedPlacement?: Placement;
  selectedCount: number;
  mode: EditorMode;
  activeMaterialId?: string;
  minimumGapMm: number;
  keyboardStepMm: number;
  keyboardShiftStepMm: number;
  clipboardCount: number;
  counts: Record<string, number>;
  totalCount: number;
  notice: string | null;
  canUndo: boolean;
  canRedo: boolean;
  activateMaterial(materialId: string): void;
  activateSelection(): void;
  resumePlacement(): void;
  cancelInteraction(): void;
  selectPlacement(placementId?: string, additive?: boolean): void;
  selectInRect(rect: WorldRect, additive?: boolean): void;
  selectAll(): void;
  addPlacementAt(point: PointMm): boolean;
  movePlacement(placementId: string, point: PointMm): boolean;
  moveSelectedBy(dxMm: number, dyMm: number): boolean;
  validateSelectionMove(placementId: string, point: PointMm): PlacementValidationResult;
  updatePlacement(placementId: string, updates: Partial<Pick<Placement, "xMm" | "yMm" | "rotationDeg">>): boolean;
  rotateSelected(deltaDeg?: number): boolean;
  deleteSelected(): boolean;
  copySelected(): boolean;
  pasteClipboard(): boolean;
  duplicateSelected(): boolean;
  duplicatePrecise(offsetXmm: number, offsetYmm: number, repeatCount: number): boolean;
  groupSelected(): boolean;
  ungroupSelected(): boolean;
  alignSelected(operation: AlignmentOperation): boolean;
  undo(): void;
  redo(): void;
  setMinimumGap(valueMm: number): boolean;
  setKeyboardSteps(normalMm: number, shiftedMm: number): boolean;
  replaceProject(
    placements: readonly Placement[],
    minimumGapMm: number,
    groups?: readonly PlacementGroup[],
    keyboardSteps?: { normalMm: number; shiftedMm: number },
  ): void;
  validateCandidate(candidate: Placement): PlacementValidationResult;
  validateMaterialChange(nextMaterials: readonly Material[]): PlacementValidationResult;
}

export function useDesignEditor(materials: readonly Material[]): DesignEditorState {
  const [history, dispatch] = useReducer(historyReducer, {
    placements: [], groups: [], past: [], future: [],
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [mode, setMode] = useState<EditorMode>("select");
  const [activeMaterialId, setActiveMaterialId] = useState<string | undefined>();
  const [minimumGapMm, setMinimumGapMmState] = useState(0);
  const [keyboardStepMm, setKeyboardStepMm] = useState(0.5);
  const [keyboardShiftStepMm, setKeyboardShiftStepMm] = useState(5);
  const [notice, setNotice] = useState<string | null>(null);
  const [clipboardCount, setClipboardCount] = useState(0);
  const clipboardRef = useRef<ClipboardData | null>(null);

  const selectedPlacements = useMemo(() => history.placements.filter((item) => selectedIds.has(item.id)), [history.placements, selectedIds]);
  const selectedPlacement = selectedPlacements.length === 1 ? selectedPlacements[0] : undefined;
  const counts = useMemo(() => countPlacementsByMaterial(history.placements), [history.placements]);

  const validateCandidate = useCallback(
    (candidate: Placement) => validatePlacement(candidate, history.placements, materials, minimumGapMm),
    [history.placements, materials, minimumGapMm],
  );

  const reject = useCallback((result: PlacementValidationResult, fallback?: string): false => {
    setNotice(placementIssueMessage(result) ?? fallback ?? "Toplu işlem geometri kurallarını sağlamıyor.");
    return false;
  }, []);

  const validateReplacements = useCallback((replacements: readonly Placement[]) => {
    const next = replaceInDocument(history.placements, replacements);
    return { next, result: validateAllPlacements(next, materials, minimumGapMm) };
  }, [history.placements, materials, minimumGapMm]);

  const commitUpdates = useCallback((before: Placement[], after: Placement[], message: string): boolean => {
    const { result } = validateReplacements(after);
    if (!result.valid) return reject(result, "Toplu işlem çakışma oluşturduğu için uygulanmadı.");
    const changed = after.some((item, index) => {
      const previous = before[index];
      return !previous || previous.xMm !== item.xMm || previous.yMm !== item.yMm || previous.rotationDeg !== item.rotationDeg;
    });
    if (!changed) return true;
    dispatch({ type: "execute", command: { type: "placements.update", before, after } });
    setNotice(message);
    return true;
  }, [reject, validateReplacements]);

  const activateMaterial = useCallback((materialId: string) => {
    setActiveMaterialId(materialId);
    setMode("place");
    setSelectedIds(new Set());
    setNotice("Çalışma alanına tıklayarak malzemeyi yerleştirin.");
  }, []);

  const activateSelection = useCallback(() => {
    setMode("select");
    setNotice("Seçim aracı etkin. Sürükleyerek alan seçebilirsiniz.");
  }, []);

  const resumePlacement = useCallback(() => {
    if (!activeMaterialId) {
      setNotice("Önce sol panelden bir malzeme seçin.");
      return;
    }
    setMode("place");
    setSelectedIds(new Set());
    setNotice("Yerleştirme aracı etkin.");
  }, [activeMaterialId]);

  const cancelInteraction = useCallback(() => {
    if (mode === "place") {
      setMode("select");
      setNotice("Yerleştirme modu kapatıldı.");
    } else {
      setSelectedIds(new Set());
      setNotice("Seçim temizlendi.");
    }
  }, [mode]);

  const selectPlacement = useCallback((placementId?: string, additive = false) => {
    setMode("select");
    if (!placementId) {
      if (!additive) setSelectedIds(new Set());
      setNotice(null);
      return;
    }
    const target = expandSelectionForGroups(new Set([placementId]), history.groups);
    setSelectedIds((current) => {
      if (!additive) {
        if (current.has(placementId) && current.size > 1) return current;
        return target;
      }
      const next = new Set(current);
      const remove = [...target].every((id) => next.has(id));
      for (const id of target) {
        if (remove) next.delete(id);
        else next.add(id);
      }
      return next;
    });
    setNotice("Seçim güncellendi.");
  }, [history.groups]);

  const selectInRect = useCallback((rect: WorldRect, additive = false) => {
    const found = expandSelectionForGroups(
      selectPlacementsInRect(rect, history.placements, materials), history.groups,
    );
    setSelectedIds((current) => additive ? new Set([...current, ...found]) : found);
    setMode("select");
    setNotice(`${found.size} boncuk seçim alanına girdi.`);
  }, [history.groups, history.placements, materials]);

  const selectAll = useCallback(() => {
    setMode("select");
    setSelectedIds(new Set(history.placements.map((placement) => placement.id)));
    setNotice(`${history.placements.length} boncuk seçildi.`);
  }, [history.placements]);

  const addPlacementAt = useCallback((point: PointMm): boolean => {
    if (!activeMaterialId) {
      setNotice("Önce sol panelden bir malzeme seçin.");
      return false;
    }
    const candidate: Placement = {
      id: createPlacementId(new Set(history.placements.map((placement) => placement.id))),
      materialId: activeMaterialId, xMm: point.x, yMm: point.y, rotationDeg: 0,
    };
    const result = validateCandidate(candidate);
    if (!result.valid) return reject(result);
    dispatch({ type: "execute", command: { type: "placement.add", placement: candidate } });
    setNotice("Malzeme yerleştirildi.");
    return true;
  }, [activeMaterialId, history.placements, reject, validateCandidate]);

  const updatePlacement = useCallback((
    placementId: string,
    updates: Partial<Pick<Placement, "xMm" | "yMm" | "rotationDeg">>,
  ): boolean => {
    const before = history.placements.find((placement) => placement.id === placementId);
    if (!before) return false;
    const after: Placement = { ...before, ...updates, rotationDeg: normalizeRotation(updates.rotationDeg ?? before.rotationDeg) };
    const result = validateCandidate(after);
    if (!result.valid) return reject(result);
    if (before.xMm === after.xMm && before.yMm === after.yMm && before.rotationDeg === after.rotationDeg) return true;
    dispatch({ type: "execute", command: { type: "placement.update", before, after } });
    setNotice("Nesne güncellendi.");
    return true;
  }, [history.placements, reject, validateCandidate]);

  const effectiveSelectionFor = useCallback((placementId: string): Set<string> => {
    if (selectedIds.has(placementId)) return new Set(selectedIds);
    return expandSelectionForGroups(new Set([placementId]), history.groups);
  }, [history.groups, selectedIds]);

  const validateSelectionMove = useCallback((placementId: string, point: PointMm): PlacementValidationResult => {
    const anchor = history.placements.find((placement) => placement.id === placementId);
    if (!anchor) return { valid: false, issues: [{ code: "INVALID_NUMBER" }] };
    const ids = effectiveSelectionFor(placementId);
    const before = history.placements.filter((placement) => ids.has(placement.id));
    const after = translatePlacements(before, point.x - anchor.xMm, point.y - anchor.yMm);
    return validateReplacements(after).result;
  }, [effectiveSelectionFor, history.placements, validateReplacements]);

  const movePlacement = useCallback((placementId: string, point: PointMm): boolean => {
    const anchor = history.placements.find((placement) => placement.id === placementId);
    if (!anchor) return false;
    const ids = effectiveSelectionFor(placementId);
    const before = history.placements.filter((placement) => ids.has(placement.id));
    const after = translatePlacements(before, point.x - anchor.xMm, point.y - anchor.yMm);
    const accepted = commitUpdates(before, after, `${before.length} boncuk birlikte taşındı.`);
    if (accepted) setSelectedIds(ids);
    return accepted;
  }, [commitUpdates, effectiveSelectionFor, history.placements]);

  const moveSelectedBy = useCallback((dxMm: number, dyMm: number): boolean => {
    if (selectedPlacements.length === 0 || !Number.isFinite(dxMm) || !Number.isFinite(dyMm)) return false;
    return commitUpdates(selectedPlacements, translatePlacements(selectedPlacements, dxMm, dyMm), `${selectedPlacements.length} boncuk hassas taşındı.`);
  }, [commitUpdates, selectedPlacements]);

  const rotateSelected = useCallback((deltaDeg = 15): boolean => {
    if (selectedPlacements.length === 0 || !Number.isFinite(deltaDeg)) {
      setNotice("Döndürmek için en az bir nesne seçin.");
      return false;
    }
    const after = rotatePlacementsAroundSelection(selectedPlacements, materials, deltaDeg);
    return commitUpdates(selectedPlacements, after, `${selectedPlacements.length} boncuk ${deltaDeg}° döndürüldü.`);
  }, [commitUpdates, materials, selectedPlacements]);

  const deleteSelected = useCallback((): boolean => {
    if (selectedPlacements.length === 0) {
      setNotice("Silmek için en az bir nesne seçin.");
      return false;
    }
    const remainingIds = new Set(history.placements.filter((item) => !selectedIds.has(item.id)).map((item) => item.id));
    const groupsAfter = normalizeGroups(history.groups, remainingIds);
    dispatch({
      type: "execute",
      command: { type: "placements.remove", placements: selectedPlacements, groupsBefore: history.groups, groupsAfter },
    });
    setSelectedIds(new Set());
    setNotice(`${selectedPlacements.length} boncuk silindi.`);
    return true;
  }, [history.groups, history.placements, selectedIds, selectedPlacements]);

  const clipboardFromSelection = useCallback((): ClipboardData | null => {
    if (selectedPlacements.length === 0) return null;
    const selected = new Set(selectedPlacements.map((placement) => placement.id));
    return {
      placements: selectedPlacements.map((placement) => ({ ...placement })),
      groups: history.groups.filter((group) => group.placementIds.every((id) => selected.has(id)))
        .map((group) => ({ ...group, placementIds: [...group.placementIds] })),
    };
  }, [history.groups, selectedPlacements]);

  const copySelected = useCallback((): boolean => {
    const data = clipboardFromSelection();
    if (!data) {
      setNotice("Kopyalamak için en az bir nesne seçin.");
      return false;
    }
    clipboardRef.current = data;
    setClipboardCount(data.placements.length);
    setNotice(`${data.placements.length} boncuk panoya kopyalandı.`);
    return true;
  }, [clipboardFromSelection]);

  const cloneData = useCallback((
    source: ClipboardData,
    offsetXmm: number,
    offsetYmm: number,
    repeatCount: number,
  ): { placements: Placement[]; groups: PlacementGroup[] } => {
    const placementIds = new Set(history.placements.map((placement) => placement.id));
    const groupIds = new Set(history.groups.map((group) => group.id));
    const placements: Placement[] = [];
    const groups: PlacementGroup[] = [];
    for (let repeat = 1; repeat <= repeatCount; repeat += 1) {
      const idMap = new Map<string, string>();
      for (const placement of source.placements) {
        const id = createPlacementId(placementIds);
        placementIds.add(id);
        idMap.set(placement.id, id);
        placements.push({
          ...placement, id,
          xMm: placement.xMm + offsetXmm * repeat,
          yMm: placement.yMm + offsetYmm * repeat,
        });
      }
      for (const group of source.groups) {
        const id = createGroupId(groupIds);
        groupIds.add(id);
        groups.push({ id, placementIds: group.placementIds.map((oldId) => idMap.get(oldId)!).filter(Boolean) });
      }
    }
    return { placements, groups };
  }, [history.groups, history.placements]);

  const addClones = useCallback((source: ClipboardData, dx: number, dy: number, count: number, message: string): boolean => {
    if (!Number.isInteger(count) || count < 1 || count > MAX_DUPLICATE_REPEATS || source.placements.length * count > MAX_DUPLICATE_PLACEMENTS) {
      setNotice(`Çoğaltma en fazla ${MAX_DUPLICATE_REPEATS} tekrar ve ${MAX_DUPLICATE_PLACEMENTS.toLocaleString("tr-TR")} yeni boncukla sınırlıdır.`);
      return false;
    }
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) {
      setNotice("Çoğaltma ofsetlerinden en az biri sıfırdan farklı, sonlu bir sayı olmalıdır.");
      return false;
    }
    const clones = cloneData(source, dx, dy, count);
    const result = validateAllPlacements([...history.placements, ...clones.placements], materials, minimumGapMm);
    if (!result.valid) return reject(result, "Kopyaların en az biri çakıştığı için hiçbir kopya eklenmedi.");
    dispatch({ type: "execute", command: { type: "placements.add", ...clones } });
    setSelectedIds(new Set(clones.placements.map((placement) => placement.id)));
    setMode("select");
    setNotice(message);
    return true;
  }, [cloneData, history.placements, materials, minimumGapMm, reject]);

  const pasteClipboard = useCallback((): boolean => {
    if (!clipboardRef.current) {
      setNotice("Yapıştırılacak kopyalanmış boncuk yok.");
      return false;
    }
    return addClones(clipboardRef.current, DEFAULT_PASTE_OFFSET_MM, DEFAULT_PASTE_OFFSET_MM, 1, `${clipboardRef.current.placements.length} boncuk yapıştırıldı.`);
  }, [addClones]);

  const duplicateSelected = useCallback((): boolean => {
    const source = clipboardFromSelection();
    if (!source) {
      setNotice("Çoğaltmak için en az bir nesne seçin.");
      return false;
    }
    return addClones(source, DEFAULT_PASTE_OFFSET_MM, DEFAULT_PASTE_OFFSET_MM, 1, `${source.placements.length} boncuk çoğaltıldı.`);
  }, [addClones, clipboardFromSelection]);

  const duplicatePrecise = useCallback((offsetXmm: number, offsetYmm: number, repeatCount: number): boolean => {
    const source = clipboardFromSelection();
    if (!source) {
      setNotice("Hassas çoğaltma için en az bir nesne seçin.");
      return false;
    }
    return addClones(source, offsetXmm, offsetYmm, repeatCount, `${source.placements.length} boncukluk seçim ${repeatCount} kez çoğaltıldı.`);
  }, [addClones, clipboardFromSelection]);

  const groupSelected = useCallback((): boolean => {
    if (selectedIds.size < 2) {
      setNotice("Grup oluşturmak için en az iki boncuk seçin.");
      return false;
    }
    const after = history.groups.filter((group) => !group.placementIds.some((id) => selectedIds.has(id)));
    const id = createGroupId(new Set(history.groups.map((group) => group.id)));
    after.push({ id, placementIds: [...selectedIds] });
    dispatch({ type: "execute", command: { type: "groups.update", before: history.groups, after } });
    setNotice(`${selectedIds.size} boncuk gruplandı.`);
    return true;
  }, [history.groups, selectedIds]);

  const ungroupSelected = useCallback((): boolean => {
    const after = history.groups.filter((group) => !group.placementIds.some((id) => selectedIds.has(id)));
    if (after.length === history.groups.length) {
      setNotice("Seçimde çözülecek bir grup yok.");
      return false;
    }
    dispatch({ type: "execute", command: { type: "groups.update", before: history.groups, after } });
    setNotice("Seçili gruplar çözüldü.");
    return true;
  }, [history.groups, selectedIds]);

  const alignSelected = useCallback((operation: AlignmentOperation): boolean => {
    const minimum = operation.startsWith("distribute") ? 3 : 2;
    if (selectedPlacements.length < minimum) {
      setNotice(`Bu işlem için en az ${minimum} boncuk seçin.`);
      return false;
    }
    const after = alignPlacements(selectedPlacements, materials, operation);
    return commitUpdates(selectedPlacements, after, "Hizalama işlemi uygulandı.");
  }, [commitUpdates, materials, selectedPlacements]);

  const undo = useCallback(() => {
    const command = history.past.at(-1);
    if (!command) return;
    const next = revertEditorCommand(history, command);
    if (!validateAllPlacements(next.placements, materials, minimumGapMm).valid) {
      setNotice("Bu işlem güncel malzeme veya aralık kurallarında geçersiz olacağı için geri alınamadı.");
      return;
    }
    dispatch({ type: "undo" });
    setSelectedIds(new Set());
    setNotice("Son işlem geri alındı.");
  }, [history, materials, minimumGapMm]);

  const redo = useCallback(() => {
    const command = history.future[0];
    if (!command) return;
    const next = applyEditorCommand(history, command);
    if (!validateAllPlacements(next.placements, materials, minimumGapMm).valid) {
      setNotice("Bu işlem güncel malzeme veya aralık kurallarında geçersiz olacağı için yinelenemedi.");
      return;
    }
    dispatch({ type: "redo" });
    setSelectedIds(new Set());
    setNotice("İşlem yinelendi.");
  }, [history, materials, minimumGapMm]);

  const setMinimumGap = useCallback((valueMm: number): boolean => {
    if (!Number.isFinite(valueMm) || valueMm < 0 || valueMm > 100) {
      setNotice("Minimum aralık 0 ile 100 mm arasında olmalıdır.");
      return false;
    }
    const result = validateAllPlacements(history.placements, materials, valueMm);
    if (!result.valid) {
      setNotice("Bu aralık mevcut yerleşimlerde ihlal oluşturduğu için uygulanmadı.");
      return false;
    }
    setMinimumGapMmState(valueMm);
    setNotice(`Minimum malzeme aralığı ${valueMm.toLocaleString("tr-TR")} mm olarak ayarlandı.`);
    return true;
  }, [history.placements, materials]);

  const setKeyboardSteps = useCallback((normalMm: number, shiftedMm: number): boolean => {
    if (!Number.isFinite(normalMm) || !Number.isFinite(shiftedMm) || normalMm <= 0 || shiftedMm <= 0 || normalMm > 100 || shiftedMm > 1000) {
      setNotice("Klavye adımları pozitif olmalı; normal adım en fazla 100 mm, hızlı adım en fazla 1000 mm olabilir.");
      return false;
    }
    setKeyboardStepMm(normalMm);
    setKeyboardShiftStepMm(shiftedMm);
    setNotice("Klavye taşıma adımları güncellendi.");
    return true;
  }, []);

  const validateMaterialChange = useCallback(
    (nextMaterials: readonly Material[]) => validateAllPlacements(history.placements, nextMaterials, minimumGapMm),
    [history.placements, minimumGapMm],
  );

  const replaceProject = useCallback((
    placements: readonly Placement[],
    nextMinimumGapMm: number,
    groups: readonly PlacementGroup[] = [],
    keyboardSteps = { normalMm: 0.5, shiftedMm: 5 },
  ) => {
    dispatch({
      type: "replace",
      placements: placements.map((placement) => ({ ...placement })),
      groups: groups.map((group) => ({ ...group, placementIds: [...group.placementIds] })),
    });
    setMinimumGapMmState(nextMinimumGapMm);
    setKeyboardStepMm(keyboardSteps.normalMm);
    setKeyboardShiftStepMm(keyboardSteps.shiftedMm);
    setSelectedIds(new Set());
    setMode("select");
    setActiveMaterialId(undefined);
    setNotice(placements.length > 0 ? "Proje yerleşimleri yüklendi." : "Yeni proje hazır.");
  }, []);

  return {
    placements: history.placements,
    groups: history.groups,
    selectedIds,
    selectedPlacements,
    selectedPlacement,
    selectedCount: selectedIds.size,
    mode,
    activeMaterialId,
    minimumGapMm,
    keyboardStepMm,
    keyboardShiftStepMm,
    clipboardCount,
    counts,
    totalCount: history.placements.length,
    notice,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    activateMaterial,
    activateSelection,
    resumePlacement,
    cancelInteraction,
    selectPlacement,
    selectInRect,
    selectAll,
    addPlacementAt,
    movePlacement,
    moveSelectedBy,
    validateSelectionMove,
    updatePlacement,
    rotateSelected,
    deleteSelected,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    duplicatePrecise,
    groupSelected,
    ungroupSelected,
    alignSelected,
    undo,
    redo,
    setMinimumGap,
    setKeyboardSteps,
    replaceProject,
    validateCandidate,
    validateMaterialChange,
  };
}
