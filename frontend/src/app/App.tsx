import { lazy, Suspense, useState } from "react";
import { DEFAULT_WORKSPACE, type WorkspaceDimensions } from "../domain/workspace";
import { InspectorPanel } from "../features/inspector/InspectorPanel";
import { MaterialLibrary } from "../features/materials/MaterialLibrary";
import { Toolbar } from "../features/toolbar/Toolbar";

const DesignWorkspace = lazy(async () => {
  const module = await import("../features/workspace/DesignWorkspace");
  return { default: module.DesignWorkspace };
});

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceDimensions>(DEFAULT_WORKSPACE);
  const [gridVisible, setGridVisible] = useState(true);

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

        <Toolbar />

        <div className="stage-badge" title="Temel uygulama ve arayüz">
          <span />
          Aşama 1
        </div>
      </header>

      <main className="editor-layout">
        <MaterialLibrary />
        <Suspense
          fallback={
            <section aria-label="Çalışma alanı yükleniyor" className="workspace-loading">
              <span />
              <strong>Çalışma alanı hazırlanıyor</strong>
            </section>
          }
        >
          <DesignWorkspace gridVisible={gridVisible} workspace={workspace} />
        </Suspense>
        <InspectorPanel
          gridVisible={gridVisible}
          onGridVisibleChange={setGridVisible}
          onWorkspaceChange={setWorkspace}
          workspace={workspace}
        />
      </main>
    </div>
  );
}

