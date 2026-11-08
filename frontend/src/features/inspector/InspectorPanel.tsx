import { useState, type FormEvent } from "react";
import type { AlignmentOperation } from "../../domain/editing";
import type { Material } from "../../domain/material";
import type { Placement } from "../../domain/placement";
import {
  formatMeasurement,
  fromMillimeters,
  toMillimeters,
  validateMotifDimensions,
  type MeasurementUnit,
  type MotifDimensions,
} from "../../domain/motif";
import { Icon } from "../../shared/Icon";

interface InspectorPanelProps {
  motif: MotifDimensions;
  gridVisible: boolean;
  motifGuideVisible: boolean;
  materials: Material[];
  counts: Record<string, number>;
  totalCount: number;
  selectedPlacement?: Placement;
  selectedCount: number;
  clipboardCount: number;
  minimumGapMm: number;
  keyboardStepMm: number;
  keyboardShiftStepMm: number;
  onGridVisibleChange(visible: boolean): void;
  onMotifChange(motif: MotifDimensions): void;
  onMotifGuideVisibleChange(visible: boolean): void;
  onMinimumGapChange(valueMm: number): boolean;
  onPlacementChange(
    placementId: string,
    updates: Partial<Pick<Placement, "xMm" | "yMm" | "rotationDeg">>,
  ): boolean;
  onRotateSelected(deltaDeg?: number): boolean;
  onDeleteSelected(): boolean;
  onCopySelected(): boolean;
  onPasteClipboard(): boolean;
  onDuplicateSelected(): boolean;
  onDuplicatePrecise(offsetXmm: number, offsetYmm: number, repeatCount: number): boolean;
  onGroupSelected(): boolean;
  onUngroupSelected(): boolean;
  onAlignSelected(operation: AlignmentOperation): boolean;
  onKeyboardStepsChange(normalMm: number, shiftedMm: number): boolean;
  onOpenMotifGenerator(): void;
}

function parseDecimal(value: string): number {
  const normalized = value.trim().replace(",", ".");
  return normalized === "" ? Number.NaN : Number(normalized);
}

function MotifSettings({
  motif,
  gridVisible,
  motifGuideVisible,
  onGridVisibleChange,
  onMotifChange,
  onMotifGuideVisibleChange,
}: Pick<
  InspectorPanelProps,
  | "motif"
  | "gridVisible"
  | "motifGuideVisible"
  | "onGridVisibleChange"
  | "onMotifChange"
  | "onMotifGuideVisibleChange"
>) {
  const [unit, setUnit] = useState<MeasurementUnit>("mm");
  const [width, setWidth] = useState(formatMeasurement(motif.widthMm));
  const [height, setHeight] = useState(formatMeasurement(motif.heightMm));
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("Varsayılan motif ölçüsü");

  function handleUnitChange(nextUnit: MeasurementUnit): void {
    const currentWidth = Number(width);
    const currentHeight = Number(height);
    const widthMm = Number.isFinite(currentWidth) ? toMillimeters(currentWidth, unit) : motif.widthMm;
    const heightMm = Number.isFinite(currentHeight) ? toMillimeters(currentHeight, unit) : motif.heightMm;
    setUnit(nextUnit);
    setWidth(formatMeasurement(fromMillimeters(widthMm, nextUnit)));
    setHeight(formatMeasurement(fromMillimeters(heightMm, nextUnit)));
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const widthMm = toMillimeters(Number(width), unit);
    const heightMm = toMillimeters(Number(height), unit);
    const errors = validateMotifDimensions(widthMm, heightMm);
    if (errors.length > 0) {
      setError(errors[0] ?? "Ölçüler doğrulanamadı.");
      setSavedMessage("Ölçüler uygulanmadı");
      return;
    }
    onMotifChange({ widthMm, heightMm });
    setError(null);
    setSavedMessage(`${formatMeasurement(widthMm)} × ${formatMeasurement(heightMm)} mm uygulandı`);
  }

  return (
    <>
      <form aria-label="Motif hedef ölçüleri" className="dimension-form" noValidate onSubmit={handleSubmit}>
        <div className="motif-size-heading">
          <strong>Hedef motif ölçüsü</strong>
          <span>Sonsuz düzlemden bağımsızdır</span>
        </div>
        <div className="field-row field-row--unit">
          <label htmlFor="measurement-unit">Ölçü birimi</label>
          <div className="select-wrap">
            <select id="measurement-unit" onChange={(event) => handleUnitChange(event.target.value as MeasurementUnit)} value={unit}>
              <option value="mm">Milimetre (mm)</option>
              <option value="cm">Santimetre (cm)</option>
            </select>
            <Icon name="arrow-down" size={15} />
          </div>
        </div>
        <div className="dimension-grid">
          <label className="field" htmlFor="motif-width">
            <span>Motif genişliği</span>
            <div className="input-with-unit">
              <input aria-label="Motif genişliği" id="motif-width" inputMode="decimal" min={unit === "mm" ? 1 : 0.1} onChange={(event) => setWidth(event.target.value)} step="any" type="number" value={width} />
              <span>{unit}</span>
            </div>
          </label>
          <label className="field" htmlFor="motif-height">
            <span>Motif yüksekliği</span>
            <div className="input-with-unit">
              <input aria-label="Motif yüksekliği" id="motif-height" inputMode="decimal" min={unit === "mm" ? 1 : 0.1} onChange={(event) => setHeight(event.target.value)} step="any" type="number" value={height} />
              <span>{unit}</span>
            </div>
          </label>
        </div>
        {error ? <p className="form-message form-message--error" role="alert">{error}</p> : <p className="form-message" role="status">{savedMessage}</p>}
        <button className="primary-button" type="submit">Motif ölçülerini uygula</button>
      </form>

      <div className="settings-stack">
        <label className="setting-toggle">
          <span className="setting-toggle__icon"><Icon name="grid" size={17} /></span>
          <span className="setting-toggle__copy"><strong>Milimetrik ızgara</strong><small>Cetvel ölçeğiyle birlikte güncellenir</small></span>
          <input checked={gridVisible} onChange={(event) => onGridVisibleChange(event.target.checked)} role="switch" type="checkbox" />
          <span aria-hidden="true" className="switch-control" />
        </label>
        <label className="setting-toggle">
          <span className="setting-toggle__icon setting-toggle__icon--guide" aria-hidden="true" />
          <span className="setting-toggle__copy"><strong>Motif sınır kılavuzu</strong><small>Alanı sınırlamadan hedef ölçüyü gösterir</small></span>
          <input checked={motifGuideVisible} onChange={(event) => onMotifGuideVisibleChange(event.target.checked)} role="switch" type="checkbox" />
          <span aria-hidden="true" className="switch-control" />
        </label>
      </div>
    </>
  );
}

function MinimumGapForm({ minimumGapMm, onChange }: { minimumGapMm: number; onChange(value: number): boolean }) {
  const [value, setValue] = useState(String(minimumGapMm).replace(".", ","));
  const [message, setMessage] = useState("Bütün malzeme çiftlerine uygulanır.");

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsed = parseDecimal(value);
    const accepted = onChange(parsed);
    setMessage(accepted ? `${parsed.toLocaleString("tr-TR")} mm uygulandı.` : "Mevcut tasarım bu aralığı sağlamıyor veya değer geçersiz.");
  }

  return (
    <form className="gap-form" onSubmit={submit}>
      <label className="field" htmlFor="minimum-gap">
        <span>Minimum boncuk aralığı</span>
        <div className="input-with-unit">
          <input id="minimum-gap" inputMode="decimal" onChange={(event) => setValue(event.target.value)} value={value} />
          <span>mm</span>
        </div>
      </label>
      <p className="form-message" role="status">{message}</p>
      <button className="secondary-button secondary-button--full" type="submit">Aralığı uygula</button>
    </form>
  );
}

function PlacementProperties({
  placement,
  material,
  onChange,
  onDelete,
  onRotate,
}: {
  placement: Placement;
  material?: Material;
  onChange: InspectorPanelProps["onPlacementChange"];
  onDelete: InspectorPanelProps["onDeleteSelected"];
  onRotate: InspectorPanelProps["onRotateSelected"];
}) {
  const [x, setX] = useState(String(placement.xMm).replace(".", ","));
  const [y, setY] = useState(String(placement.yMm).replace(".", ","));
  const [rotation, setRotation] = useState(String(placement.rotationDeg).replace(".", ","));
  const [message, setMessage] = useState("Koordinatlar nesnenin merkezidir.");

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const updates = { xMm: parseDecimal(x), yMm: parseDecimal(y), rotationDeg: parseDecimal(rotation) };
    setMessage(onChange(placement.id, updates) ? "Nesne özellikleri uygulandı." : "Konum çakışıyor veya değerler geçersiz.");
  }

  return (
    <form className="object-form" onSubmit={submit}>
      <div className="selected-material-label">
        <span style={{ backgroundColor: material?.color }} />
        <strong>{material?.name ?? "Bilinmeyen malzeme"}</strong>
      </div>
      <div className="object-coordinate-grid">
        <label className="field"><span>X koordinatı</span><div className="input-with-unit"><input aria-label="X koordinatı" inputMode="decimal" onChange={(event) => setX(event.target.value)} value={x} /><span>mm</span></div></label>
        <label className="field"><span>Y koordinatı</span><div className="input-with-unit"><input aria-label="Y koordinatı" inputMode="decimal" onChange={(event) => setY(event.target.value)} value={y} /><span>mm</span></div></label>
      </div>
      <label className="field"><span>Dönüş açısı</span><div className="input-with-unit"><input aria-label="Dönüş açısı" inputMode="decimal" onChange={(event) => setRotation(event.target.value)} value={rotation} /><span>°</span></div></label>
      <p className="form-message" role="status">{message}</p>
      <button className="primary-button" type="submit">Nesne özelliklerini uygula</button>
      <div className="object-action-row">
        <button className="secondary-button" onClick={() => onRotate(15)} type="button">15° döndür</button>
        <button className="danger-button" onClick={onDelete} type="button">Nesneyi sil</button>
      </div>
    </form>
  );
}

const ALIGNMENT_TOOLS: Array<{ operation: AlignmentOperation; label: string }> = [
  { operation: "left", label: "Sola" },
  { operation: "right", label: "Sağa" },
  { operation: "top", label: "Üste" },
  { operation: "bottom", label: "Alta" },
  { operation: "center-horizontal", label: "Yatay ortala" },
  { operation: "center-vertical", label: "Dikey ortala" },
  { operation: "distribute-horizontal", label: "Yatay dağıt" },
  { operation: "distribute-vertical", label: "Dikey dağıt" },
];

function AdvancedEditingTools(props: Pick<
  InspectorPanelProps,
  | "selectedCount" | "clipboardCount" | "keyboardStepMm" | "keyboardShiftStepMm"
  | "onCopySelected" | "onPasteClipboard" | "onDuplicateSelected" | "onDuplicatePrecise"
  | "onGroupSelected" | "onUngroupSelected" | "onAlignSelected" | "onRotateSelected"
  | "onKeyboardStepsChange"
>) {
  const [offsetX, setOffsetX] = useState("10");
  const [offsetY, setOffsetY] = useState("0");
  const [repeatCount, setRepeatCount] = useState("1");
  const [customAngle, setCustomAngle] = useState("15");
  const [normalStep, setNormalStep] = useState(String(props.keyboardStepMm).replace(".", ","));
  const [shiftStep, setShiftStep] = useState(String(props.keyboardShiftStepMm).replace(".", ","));
  const hasSelection = props.selectedCount > 0;

  return (
    <section aria-labelledby="advanced-tools-title" className="inspector-section inspector-section--advanced">
      <div className="section-title-row">
        <div><p className="eyebrow">Toplu düzenleme</p><h3 id="advanced-tools-title">Gelişmiş araçlar</h3></div>
        <strong className="selection-count">{props.selectedCount} seçili</strong>
      </div>

      <div className="advanced-action-grid">
        <button disabled={!hasSelection} onClick={props.onCopySelected} type="button">Kopyala</button>
        <button disabled={props.clipboardCount === 0} onClick={props.onPasteClipboard} type="button">Yapıştır ({props.clipboardCount})</button>
        <button disabled={!hasSelection} onClick={props.onDuplicateSelected} type="button">Çoğalt</button>
        <button disabled={props.selectedCount < 2} onClick={props.onGroupSelected} type="button">Grupla</button>
        <button disabled={!hasSelection} onClick={props.onUngroupSelected} type="button">Grubu çöz</button>
      </div>

      <div className="advanced-tool-block">
        <strong>Hassas çoğaltma</strong>
        <div className="compact-input-grid compact-input-grid--three">
          <label><span>Yatay mm</span><input aria-label="Çoğaltma yatay ofseti" inputMode="decimal" onChange={(event) => setOffsetX(event.target.value)} value={offsetX} /></label>
          <label><span>Dikey mm</span><input aria-label="Çoğaltma dikey ofseti" inputMode="decimal" onChange={(event) => setOffsetY(event.target.value)} value={offsetY} /></label>
          <label><span>Tekrar</span><input aria-label="Çoğaltma tekrar sayısı" inputMode="numeric" min="1" onChange={(event) => setRepeatCount(event.target.value)} type="number" value={repeatCount} /></label>
        </div>
        <button className="secondary-button secondary-button--wide" disabled={!hasSelection} onClick={() => props.onDuplicatePrecise(parseDecimal(offsetX), parseDecimal(offsetY), Number(repeatCount))} type="button">Kopyaları oluştur</button>
      </div>

      <div className="advanced-tool-block">
        <strong>Toplu döndürme</strong>
        <div className="rotation-presets">
          {[15, 30, 45, 90].map((angle) => <button disabled={!hasSelection} key={angle} onClick={() => props.onRotateSelected(angle)} type="button">{angle}°</button>)}
        </div>
        <div className="inline-tool-input"><input aria-label="Özel dönüş açısı" inputMode="decimal" onChange={(event) => setCustomAngle(event.target.value)} value={customAngle} /><button disabled={!hasSelection} onClick={() => props.onRotateSelected(parseDecimal(customAngle))} type="button">Uygula</button></div>
      </div>

      <div className="advanced-tool-block">
        <strong>Hizala ve dağıt</strong>
        <div className="alignment-grid">
          {ALIGNMENT_TOOLS.map((tool) => (
            <button disabled={props.selectedCount < (tool.operation.startsWith("distribute") ? 3 : 2)} key={tool.operation} onClick={() => props.onAlignSelected(tool.operation)} type="button">{tool.label}</button>
          ))}
        </div>
      </div>

      <div className="advanced-tool-block">
        <strong>Klavye taşıma adımı</strong>
        <div className="compact-input-grid">
          <label><span>Normal mm</span><input aria-label="Normal ok tuşu adımı" inputMode="decimal" onChange={(event) => setNormalStep(event.target.value)} value={normalStep} /></label>
          <label><span>Shift mm</span><input aria-label="Shift ok tuşu adımı" inputMode="decimal" onChange={(event) => setShiftStep(event.target.value)} value={shiftStep} /></label>
        </div>
        <button className="secondary-button secondary-button--wide" onClick={() => props.onKeyboardStepsChange(parseDecimal(normalStep), parseDecimal(shiftStep))} type="button">Adımları kaydet</button>
      </div>
    </section>
  );
}

export function InspectorPanel(props: InspectorPanelProps) {
  const selectedMaterial = props.selectedPlacement
    ? props.materials.find((material) => material.id === props.selectedPlacement?.materialId)
    : undefined;
  const usedMaterials = props.materials.filter((material) => (props.counts[material.id] ?? 0) > 0);

  return (
    <aside aria-label="Tasarım özellikleri" className="panel panel--inspector">
      <section className="inspector-section">
        <div className="panel__heading panel__heading--compact">
          <div><p className="eyebrow">Belge</p><h2>Tasarım özellikleri</h2></div>
          <span className="status-pill">Düzenleniyor</span>
        </div>
        <MotifSettings {...props} />
        <MinimumGapForm key={props.minimumGapMm} minimumGapMm={props.minimumGapMm} onChange={props.onMinimumGapChange} />
        <div className="motif-generator-launch">
          <div><strong>Akıllı motif motoru</strong><span>Seçili gerçek malzemelerle deterministik motif üretin.</span></div>
          <button className="primary-button" onClick={props.onOpenMotifGenerator} type="button">Motif oluştur</button>
        </div>
      </section>

      <AdvancedEditingTools key={`${props.keyboardStepMm}:${props.keyboardShiftStepMm}`} {...props} />

      <section aria-labelledby="counter-title" className="inspector-section inspector-section--counter">
        <div className="section-title-row">
          <div><p className="eyebrow">Canlı özet</p><h3 id="counter-title">Malzeme sayacı</h3></div>
          <strong className="total-count">{props.totalCount}</strong>
        </div>
        {usedMaterials.length === 0 ? (
          <div className="empty-summary"><div className="empty-summary__beads" aria-hidden="true"><span /><span /><span /></div><p>Henüz yerleştirilmiş malzeme yok.</p><span>Sayım gerçek yerleşimlerden otomatik hesaplanır.</span></div>
        ) : (
          <ul className="material-count-list">
            {usedMaterials.map((material) => (
              <li key={material.id}><span className="material-count-list__swatch" style={{ backgroundColor: material.color }} /><span>{material.name}</span><strong>{props.counts[material.id]} adet</strong></li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="object-title" className="inspector-section">
        <div className="section-title-row"><h3 id="object-title">Nesne özellikleri</h3>{props.selectedCount > 0 ? <span className="phase-tag">{props.selectedCount} seçili</span> : null}</div>
        {props.selectedPlacement ? (
          <PlacementProperties
            key={`${props.selectedPlacement.id}:${props.selectedPlacement.xMm}:${props.selectedPlacement.yMm}:${props.selectedPlacement.rotationDeg}`}
            material={selectedMaterial}
            onChange={props.onPlacementChange}
            onDelete={props.onDeleteSelected}
            onRotate={props.onRotateSelected}
            placement={props.selectedPlacement}
          />
        ) : <p className="object-empty-copy">Tekil koordinat düzenlemek için bir boncuk seçin; toplu seçimde gelişmiş araçları kullanın.</p>}
      </section>
    </aside>
  );
}

