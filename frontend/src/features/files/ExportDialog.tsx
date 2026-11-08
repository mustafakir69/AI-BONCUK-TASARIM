import { useMemo, useState } from "react";
import {
  createExportPlan,
  EXPORT_DPI_OPTIONS,
  type ExportAreaMode,
  type ExportFormat,
} from "../../domain/export";
import type { Material } from "../../domain/material";
import type { MotifDimensions } from "../../domain/motif";
import type { Placement } from "../../domain/placement";

export interface ExportRequest {
  format: ExportFormat;
  areaMode: ExportAreaMode;
  marginMm: number;
  dpi: number;
  quality: number;
  transparent: boolean;
  backgroundColor: string;
}

interface ExportDialogProps {
  motif: MotifDimensions;
  placements: readonly Placement[];
  materials: readonly Material[];
  onClose(): void;
  onExport(request: ExportRequest): Promise<void>;
  onCsvExport(): void;
}

export function ExportDialog({ motif, placements, materials, onClose, onExport, onCsvExport }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [areaMode, setAreaMode] = useState<ExportAreaMode>("motif");
  const [marginMm, setMarginMm] = useState(5);
  const [dpi, setDpi] = useState(300);
  const [quality, setQuality] = useState(0.9);
  const [transparent, setTransparent] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [cropConfirmed, setCropConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const plan = useMemo(() => createExportPlan({
    areaMode, motif, placements, materials, marginMm, dpi,
  }), [areaMode, motif, placements, materials, marginMm, dpi]);
  const requiresCropConfirmation = areaMode === "motif" && Boolean(plan?.hasOutsidePlacements);
  const canExport = Boolean(plan) && !plan?.exceedsLimit &&
    (!requiresCropConfirmation || cropConfirmed) && !busy;

  async function submit(): Promise<void> {
    if (!canExport) return;
    setBusy(true);
    setError(undefined);
    try {
      await onExport({ format, areaMode, marginMm, dpi, quality, transparent, backgroundColor });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Görsel dışa aktarılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="export-title" aria-modal="true" className="dialog export-dialog" role="dialog">
        <div className="dialog__header">
          <div><span className="eyebrow">Dosya çıktısı</span><h2 id="export-title">Dışa aktar</h2></div>
          <button aria-label="Dışa aktarma penceresini kapat" className="icon-button" onClick={onClose} type="button">×</button>
        </div>

        <div className="export-grid">
          <fieldset><legend>Görsel biçimi</legend>
            <label><input checked={format === "png"} name="format" onChange={() => setFormat("png")} type="radio" /> PNG</label>
            <label><input checked={format === "jpeg"} name="format" onChange={() => setFormat("jpeg")} type="radio" /> JPEG</label>
          </fieldset>
          <fieldset><legend>Çıktı alanı</legend>
            <label><input checked={areaMode === "motif"} name="area" onChange={() => { setAreaMode("motif"); setCropConfirmed(false); }} type="radio" /> Motif kılavuzu</label>
            <label><input checked={areaMode === "placements"} disabled={placements.length === 0} name="area" onChange={() => setAreaMode("placements")} type="radio" /> Yerleşim sınırları</label>
          </fieldset>
        </div>

        {areaMode === "placements" ? (
          <label className="field-label" htmlFor="export-margin">Kenar payı (mm)
            <input id="export-margin" max="1000" min="0" onChange={(event) => setMarginMm(Number(event.target.value))} step="0.5" type="number" value={marginMm} />
          </label>
        ) : null}
        <label className="field-label" htmlFor="export-dpi">Çözünürlük
          <select id="export-dpi" onChange={(event) => setDpi(Number(event.target.value))} value={dpi}>
            {EXPORT_DPI_OPTIONS.map((value) => <option key={value} value={value}>{value} DPI</option>)}
          </select>
        </label>
        {format === "jpeg" ? (
          <label className="field-label" htmlFor="jpeg-quality">JPEG kalitesi: %{Math.round(quality * 100)}
            <input id="jpeg-quality" max="1" min="0.5" onChange={(event) => setQuality(Number(event.target.value))} step="0.05" type="range" value={quality} />
          </label>
        ) : (
          <label className="toggle-row"><input checked={transparent} onChange={(event) => setTransparent(event.target.checked)} type="checkbox" /> Şeffaf arka plan</label>
        )}
        {(format === "jpeg" || !transparent) ? (
          <label className="field-label" htmlFor="export-background">Arka plan rengi
            <input id="export-background" onChange={(event) => setBackgroundColor(event.target.value)} type="color" value={backgroundColor} />
          </label>
        ) : null}

        <div className="export-summary" aria-live="polite">
          {plan ? <><strong>{plan.bounds.widthMm.toFixed(2)} × {plan.bounds.heightMm.toFixed(2)} mm</strong><span>{plan.widthPx.toLocaleString("tr-TR")} × {plan.heightPx.toLocaleString("tr-TR")} piksel</span><small>Tahmini bellek: {(plan.estimatedBytes / 1024 / 1024).toFixed(1)} MB</small></> : <span>Yerleşim sınırı için en az bir boncuk gereklidir.</span>}
        </div>
        {plan?.exceedsLimit ? <p className="form-message form-message--error" role="alert">Çıktı tarayıcı güvenlik sınırını aşıyor. DPI veya alan boyutunu küçültün.</p> : null}
        {requiresCropConfirmation ? (
          <label className="crop-warning"><input checked={cropConfirmed} onChange={(event) => setCropConfirmed(event.target.checked)} type="checkbox" /> Motif dışında kalan boncukların kırpılacağını anladım.</label>
        ) : null}
        <p className="export-note">Piksel boyutu seçilen DPI değerine göre hesaplanır. Dosyaya fiziksel DPI metadatası yazılması tarayıcıya göre değişebilir.</p>
        {error ? <p className="form-message form-message--error" role="alert">{error}</p> : null}
        <div className="dialog__actions dialog__actions--split">
          <button className="button button--secondary" disabled={placements.length === 0} onClick={onCsvExport} type="button">Malzeme raporu (CSV)</button>
          <span className="dialog__action-group">
            <button className="button button--secondary" onClick={onClose} type="button">Vazgeç</button>
            <button className="button button--primary" disabled={!canExport} onClick={() => void submit()} type="button">{busy ? "Hazırlanıyor…" : `${format.toUpperCase()} indir`}</button>
          </span>
        </div>
      </section>
    </div>
  );
}
