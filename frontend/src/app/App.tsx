import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { createExportPlan } from "../domain/export";
import { updateMaterial, type MaterialDraft } from "../domain/material";
import { createMaterialReportCsv } from "../domain/materialReport";
import { DEFAULT_MOTIF, type MotifDimensions } from "../domain/motif";
import {
  createProjectDocument,
  createProjectId,
  parseProjectJson,
  projectContentFingerprint,
  resolveProjectImport,
  serializeProject,
  type ResolvedProjectImport,
} from "../domain/project";
import { useDesignEditor } from "../features/editor/useDesignEditor";
import { AiDesignDialog } from "../features/ai/AiDesignDialog";
import { ExportDialog, type ExportRequest } from "../features/files/ExportDialog";
import { ProjectConfirmDialog } from "../features/files/ProjectConfirmDialog";
import { MotifGeneratorDialog, type MotifApplicationMode } from "../features/generator/MotifGeneratorDialog";
import { InspectorPanel } from "../features/inspector/InspectorPanel";
import { MaterialLibrary } from "../features/materials/MaterialLibrary";
import { useMaterialLibrary } from "../features/materials/useMaterialLibrary";
import { Toolbar } from "../features/toolbar/Toolbar";
import { downloadBlob, downloadText, readTextFile, safeFilename } from "../infrastructure/browserFiles";
import { renderProjectImage } from "../infrastructure/imageExport";
import type { Placement } from "../domain/placement";

const DesignWorkspace = lazy(async () => {
  const module = await import("../features/workspace/DesignWorkspace");
  return { default: module.DesignWorkspace };
});

export function App() {
  const [projectMeta, setProjectMeta] = useState(() => {
    const now = new Date().toISOString();
    return { id: createProjectId(), name: "İsimsiz tasarım", createdAt: now, updatedAt: now };
  });
  const [motif, setMotif] = useState<MotifDimensions>(DEFAULT_MOTIF);
  const [gridVisible, setGridVisible] = useState(true);
  const [motifGuideVisible, setMotifGuideVisible] = useState(true);
  const materialLibrary = useMaterialLibrary();
  const editor = useDesignEditor(materialLibrary.materials);
  const currentContent = useMemo(() => ({
    name: projectMeta.name,
    motif,
    minimumGapMm: editor.minimumGapMm,
    keyboardStepMm: editor.keyboardStepMm,
    keyboardShiftStepMm: editor.keyboardShiftStepMm,
    materials: materialLibrary.materials,
    placements: editor.placements,
    groups: editor.groups,
  }), [editor.groups, editor.keyboardShiftStepMm, editor.keyboardStepMm, editor.minimumGapMm, editor.placements, materialLibrary.materials, motif, projectMeta.name]);
  const currentFingerprint = useMemo(() => projectContentFingerprint(currentContent), [currentContent]);
  const [savedFingerprint, setSavedFingerprint] = useState(currentFingerprint);
  const [projectNotice, setProjectNotice] = useState<string>();
  const [confirmAction, setConfirmAction] = useState<"new" | "open" | "replace-motif" | null>(null);
  const [pendingImport, setPendingImport] = useState<ResolvedProjectImport>();
  const [pendingMotifReplace, setPendingMotifReplace] = useState<Placement[]>();
  const [exportOpen, setExportOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [aiDesignerOpen, setAiDesignerOpen] = useState(false);
  const [motifPreview, setMotifPreview] = useState<Placement[]>([]);
  const isDirty = currentFingerprint !== savedFingerprint;
  const {
    cancelInteraction, copySelected, deleteSelected, duplicateSelected, groupSelected,
    moveSelectedBy, pasteClipboard, redo, selectAll, undo, ungroupSelected,
  } = editor;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target;
      if (
        (target instanceof Element && target.matches("input, textarea, select, [contenteditable='true']")) ||
        document.querySelector("[role='dialog'], [role='alertdialog']")
      ) return;

      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (modifier && key === "a") {
        event.preventDefault();
        selectAll();
      } else if (modifier && key === "c") {
        event.preventDefault();
        copySelected();
      } else if (modifier && key === "v") {
        event.preventDefault();
        pasteClipboard();
      } else if (modifier && key === "d") {
        event.preventDefault();
        duplicateSelected();
      } else if (modifier && key === "g") {
        event.preventDefault();
        if (event.shiftKey) ungroupSelected();
        else groupSelected();
      } else if (modifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (modifier && key === "y") {
        event.preventDefault();
        redo();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
      } else if (event.key === "Escape") {
        cancelInteraction();
      } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const step = event.shiftKey ? editor.keyboardShiftStepMm : editor.keyboardStepMm;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        moveSelectedBy(dx, dy);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelInteraction, copySelected, deleteSelected, duplicateSelected, editor.keyboardShiftStepMm, editor.keyboardStepMm, groupSelected, moveSelectedBy, pasteClipboard, redo, selectAll, undo, ungroupSelected]);

  function handleMaterialEdit(
    materialId: string,
    draft: MaterialDraft,
  ): "UPDATED" | "GEOMETRY_CONFLICT" {
    const current = materialLibrary.materials.find((material) => material.id === materialId);
    if (!current) return "GEOMETRY_CONFLICT";
    const nextMaterials = materialLibrary.materials.map((material) =>
      material.id === materialId ? updateMaterial(current, draft) : material,
    );
    if (!editor.validateMaterialChange(nextMaterials).valid) return "GEOMETRY_CONFLICT";
    materialLibrary.editMaterial(materialId, draft);
    return "UPDATED";
  }

  function handleMaterialDelete(
    materialId: string,
  ): "REMOVED" | "MATERIAL_IN_USE" | "MATERIAL_NOT_FOUND" {
    const result = materialLibrary.deleteMaterial(materialId, editor.counts[materialId] ?? 0);
    if (result === "REMOVED" && editor.activeMaterialId === materialId) {
      editor.activateSelection();
    }
    return result;
  }

  function createNewProject(): void {
    const now = new Date().toISOString();
    const nextMeta = { id: createProjectId(), name: "İsimsiz tasarım", createdAt: now, updatedAt: now };
    editor.replaceProject([], 0, [], { normalMm: 0.5, shiftedMm: 5 });
    setMotif(DEFAULT_MOTIF);
    setGridVisible(true);
    setMotifGuideVisible(true);
    setProjectMeta(nextMeta);
    setSavedFingerprint(projectContentFingerprint({
      name: nextMeta.name, motif: DEFAULT_MOTIF, minimumGapMm: 0,
      keyboardStepMm: 0.5, keyboardShiftStepMm: 5,
      materials: materialLibrary.materials, placements: [], groups: [],
    }));
    setProjectNotice("Yeni proje oluşturuldu; malzeme kataloğu korundu.");
    setGeneratorOpen(false);
    setAiDesignerOpen(false);
    setMotifPreview([]);
    setConfirmAction(null);
  }

  function handleNewProject(): void {
    if (isDirty) setConfirmAction("new");
    else createNewProject();
  }

  function handleSave(): void {
    const updatedAt = new Date().toISOString();
    const project = createProjectDocument({ ...projectMeta, updatedAt }, currentContent);
    downloadText(
      serializeProject(project), `${safeFilename(project.name)}.boncuk.json`, "application/json",
    );
    setProjectMeta((current) => ({ ...current, updatedAt }));
    setSavedFingerprint(projectContentFingerprint(currentContent));
    setProjectNotice("Proje JSON dosyası olarak kaydedildi.");
  }

  function applyImport(resolved: ResolvedProjectImport): void {
    const { project } = resolved;
    materialLibrary.replaceMaterials(resolved.catalog);
    editor.replaceProject(project.placements, project.settings.minimumGapMm, project.groups, {
      normalMm: project.settings.keyboardStepMm,
      shiftedMm: project.settings.keyboardShiftStepMm,
    });
    setMotif(project.motif);
    setProjectMeta({
      id: project.id, name: project.name,
      createdAt: project.createdAt, updatedAt: project.updatedAt,
    });
    setSavedFingerprint(projectContentFingerprint({
      name: project.name, motif: project.motif,
      minimumGapMm: project.settings.minimumGapMm,
      keyboardStepMm: project.settings.keyboardStepMm,
      keyboardShiftStepMm: project.settings.keyboardShiftStepMm,
      materials: resolved.catalog, placements: project.placements, groups: project.groups,
    }));
    setProjectNotice(resolved.conflictCount > 0
      ? `Proje açıldı; ${resolved.conflictCount} malzeme kimliği yerel kaydı ezmeden yeniden eşlendi.`
      : "Proje doğrulandı ve açıldı.");
    setGeneratorOpen(false);
    setAiDesignerOpen(false);
    setMotifPreview([]);
    setPendingImport(undefined);
    setConfirmAction(null);
  }

  async function handleOpenFile(file: File): Promise<void> {
    try {
      const parsed = parseProjectJson(await readTextFile(file));
      if (!parsed.ok) {
        setProjectNotice(`Proje açılamadı: ${parsed.error}`);
        return;
      }
      const resolved = resolveProjectImport(parsed.project, materialLibrary.materials);
      if (isDirty) {
        setPendingImport(resolved);
        setConfirmAction("open");
      } else applyImport(resolved);
    } catch (reason) {
      setProjectNotice(`Proje açılamadı: ${reason instanceof Error ? reason.message : "Dosya okunamadı."}`);
    }
  }

  async function handleImageExport(request: ExportRequest): Promise<void> {
    const plan = createExportPlan({
      ...request, motif, placements: editor.placements, materials: materialLibrary.materials,
    });
    if (!plan) throw new Error("Dışa aktarılacak yerleşim bulunamadı.");
    if (plan.exceedsLimit) throw new Error("Çıktı tarayıcı güvenlik sınırını aşıyor.");
    const blob = await renderProjectImage({
      ...request, plan, placements: editor.placements, materials: materialLibrary.materials,
    });
    downloadBlob(blob, `${safeFilename(projectMeta.name)}.${request.format === "jpeg" ? "jpg" : "png"}`);
    setProjectNotice(`${request.format.toUpperCase()} görseli indirildi.`);
  }

  function handleCsvExport(): void {
    downloadText(
      createMaterialReportCsv(materialLibrary.materials, editor.placements),
      `${safeFilename(projectMeta.name)}-malzeme-raporu.csv`, "text/csv",
    );
    setProjectNotice("Malzeme raporu CSV olarak indirildi.");
  }

  const handleMotifPreview = useCallback((placements: readonly Placement[]) => {
    setMotifPreview(placements.map((placement) => ({ ...placement })));
  }, []);

  function closeMotifGenerator(): void {
    setGeneratorOpen(false);
    setMotifPreview([]);
    setPendingMotifReplace(undefined);
  }

  function commitGeneratedMotif(placements: readonly Placement[], mode: MotifApplicationMode): boolean {
    const applied = editor.applyGeneratedPlacements(placements, mode);
    if (applied) {
      setGeneratorOpen(false);
      setMotifPreview([]);
      setPendingMotifReplace(undefined);
      setProjectNotice(mode === "append"
        ? `${placements.length} boncukluk motif mevcut tasarıma eklendi.`
        : `${placements.length} boncukluk motif mevcut tasarımın yerine uygulandı.`);
    }
    return applied;
  }

  function closeAiDesigner(): void {
    setAiDesignerOpen(false);
    setMotifPreview([]);
  }

  function commitAiDesign(placements: readonly Placement[], mode: "append" | "replace"): boolean {
    const applied = editor.applyGeneratedPlacements(placements, mode);
    if (applied) {
      setAiDesignerOpen(false);
      setMotifPreview([]);
      setProjectNotice(mode === "append"
        ? `${placements.length} boncukluk AI önizlemesi mevcut tasarıma tek işlemde eklendi.`
        : `${placements.length} boncukluk AI önizlemesi mevcut tasarımın yerine tek işlemde uygulandı.`);
    }
    return applied;
  }

  function handleMotifApply(placements: readonly Placement[], mode: MotifApplicationMode): void {
    if (mode === "replace" && isDirty) {
      setPendingMotifReplace(placements.map((placement) => ({ ...placement })));
      setConfirmAction("replace-motif");
      return;
    }
    commitGeneratedMotif(placements, mode);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#workspace-title" aria-label="AI Boncuk Tasarım ana çalışma alanı">
          <span aria-hidden="true" className="brand-mark">
            <span /><span /><span /><span /><span />
          </span>
          <span className="brand-copy">
            <strong>AI BONCUK</strong>
            <span>TASARIM</span>
          </span>
        </a>

        <Toolbar
          canRedo={editor.canRedo}
          canUndo={editor.canUndo}
          onExport={() => setExportOpen(true)}
          onNewProject={handleNewProject}
          onOpenFile={(file) => void handleOpenFile(file)}
          onRedo={editor.redo}
          onSave={handleSave}
          onUndo={editor.undo}
        />

        <div className="stage-badge" title="AI tasarım arayüzü ve güvenli entegrasyon mimarisi">
          <span />
          Aşama 7B
        </div>
      </header>

      {projectNotice ? (
        <div className="project-notice" role="status">
          <span>{projectNotice}</span>
          <button aria-label="Proje bildirimini kapat" onClick={() => setProjectNotice(undefined)} type="button">×</button>
        </div>
      ) : null}

      <main className="editor-layout">
        <MaterialLibrary
          materials={materialLibrary.materials}
          onAdd={materialLibrary.addMaterial}
          onDelete={handleMaterialDelete}
          onEdit={handleMaterialEdit}
          onSelect={editor.activateMaterial}
          selectedMaterialId={editor.mode === "place" ? editor.activeMaterialId : undefined}
          storageWarning={materialLibrary.storageWarning}
        />
        <Suspense
          fallback={
            <section aria-label="Çalışma alanı yükleniyor" className="workspace-loading">
              <span />
              <strong>Çalışma alanı hazırlanıyor</strong>
            </section>
          }
        >
          <DesignWorkspace
            gridVisible={gridVisible}
            activeMaterialId={editor.activeMaterialId}
            editorMode={editor.mode}
            materials={materialLibrary.materials}
            motif={motif}
            motifGuideVisible={motifGuideVisible}
            isDirty={isDirty}
            notice={editor.notice}
            onActivateSelection={editor.activateSelection}
            onAddPlacement={editor.addPlacementAt}
            onDeleteSelected={editor.deleteSelected}
            onMovePlacement={editor.movePlacement}
            onSelectRect={editor.selectInRect}
            onResumePlacement={editor.resumePlacement}
            onRotateSelected={editor.rotateSelected}
            onSelectPlacement={editor.selectPlacement}
            placements={editor.placements}
            previewPlacements={motifPreview}
            projectName={projectMeta.name}
            selectedIds={editor.selectedIds}
            validateCandidate={editor.validateCandidate}
            validateSelectionMove={editor.validateSelectionMove}
          />
        </Suspense>
        <InspectorPanel
          gridVisible={gridVisible}
          clipboardCount={editor.clipboardCount}
          counts={editor.counts}
          materials={materialLibrary.materials}
          minimumGapMm={editor.minimumGapMm}
          keyboardShiftStepMm={editor.keyboardShiftStepMm}
          keyboardStepMm={editor.keyboardStepMm}
          motif={motif}
          motifGuideVisible={motifGuideVisible}
          onDeleteSelected={editor.deleteSelected}
          onAlignSelected={editor.alignSelected}
          onCopySelected={editor.copySelected}
          onDuplicatePrecise={editor.duplicatePrecise}
          onDuplicateSelected={editor.duplicateSelected}
          onGroupSelected={editor.groupSelected}
          onGridVisibleChange={setGridVisible}
          onMinimumGapChange={editor.setMinimumGap}
          onMotifChange={setMotif}
          onMotifGuideVisibleChange={setMotifGuideVisible}
          onOpenAiDesigner={() => setAiDesignerOpen(true)}
          onOpenMotifGenerator={() => setGeneratorOpen(true)}
          onPlacementChange={editor.updatePlacement}
          onPasteClipboard={editor.pasteClipboard}
          onRotateSelected={editor.rotateSelected}
          onKeyboardStepsChange={editor.setKeyboardSteps}
          onUngroupSelected={editor.ungroupSelected}
          selectedCount={editor.selectedCount}
          selectedPlacement={editor.selectedPlacement}
          totalCount={editor.totalCount}
        />
      </main>
      {exportOpen ? (
        <ExportDialog
          materials={materialLibrary.materials}
          motif={motif}
          onClose={() => setExportOpen(false)}
          onCsvExport={handleCsvExport}
          onExport={handleImageExport}
          placements={editor.placements}
        />
      ) : null}
      {generatorOpen ? (
        <MotifGeneratorDialog
          materials={materialLibrary.materials}
          motif={motif}
          onApply={handleMotifApply}
          onClose={closeMotifGenerator}
          onPreview={handleMotifPreview}
          projectMinimumGapMm={editor.minimumGapMm}
        />
      ) : null}
      {aiDesignerOpen ? (
        <AiDesignDialog
          materials={materialLibrary.materials}
          motif={motif}
          onApply={commitAiDesign}
          onClose={closeAiDesigner}
          onPreview={handleMotifPreview}
          projectMinimumGapMm={editor.minimumGapMm}
        />
      ) : null}
      {confirmAction ? (
        <ProjectConfirmDialog
          confirmLabel={confirmAction === "new" ? "Kaydetmeden yeni proje" : confirmAction === "open" ? "Kaydetmeden aç" : "Tasarımla değiştir"}
          message={confirmAction === "replace-motif"
            ? "Geçerli tasarımda kaydedilmemiş değişiklikler var. Motifi uygularsanız mevcut boncuklar ve gruplar tek işlemde değiştirilecek."
            : "Geçerli tasarımda kaydedilmemiş değişiklikler var. Devam ederseniz bu değişiklikler kaybolur."}
          onCancel={() => { setConfirmAction(null); setPendingImport(undefined); setPendingMotifReplace(undefined); }}
          onConfirm={() => {
            if (confirmAction === "new") createNewProject();
            else if (confirmAction === "open" && pendingImport) applyImport(pendingImport);
            else if (confirmAction === "replace-motif" && pendingMotifReplace) {
              commitGeneratedMotif(pendingMotifReplace, "replace");
              setConfirmAction(null);
            }
          }}
          title={confirmAction === "new" ? "Yeni proje oluşturulsun mu?" : confirmAction === "open" ? "Seçilen proje açılsın mı?" : "Mevcut tasarım değiştirilsin mi?"}
        />
      ) : null}
    </div>
  );
}

