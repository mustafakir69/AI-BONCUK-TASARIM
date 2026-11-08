import { useState, type FormEvent } from "react";
import {
  formatMeasurement,
  fromMillimeters,
  toMillimeters,
  validateWorkspaceDimensions,
  type MeasurementUnit,
  type WorkspaceDimensions,
} from "../../domain/workspace";
import { Icon } from "../../shared/Icon";

interface InspectorPanelProps {
  workspace: WorkspaceDimensions;
  gridVisible: boolean;
  onGridVisibleChange: (visible: boolean) => void;
  onWorkspaceChange: (workspace: WorkspaceDimensions) => void;
}

export function InspectorPanel({
  workspace,
  gridVisible,
  onGridVisibleChange,
  onWorkspaceChange,
}: InspectorPanelProps) {
  const [unit, setUnit] = useState<MeasurementUnit>("mm");
  const [width, setWidth] = useState(formatMeasurement(workspace.widthMm));
  const [height, setHeight] = useState(formatMeasurement(workspace.heightMm));
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("Varsayılan çalışma alanı");

  const handleUnitChange = (nextUnit: MeasurementUnit) => {
    const currentWidth = Number(width);
    const currentHeight = Number(height);
    const widthMm = Number.isFinite(currentWidth) ? toMillimeters(currentWidth, unit) : workspace.widthMm;
    const heightMm = Number.isFinite(currentHeight) ? toMillimeters(currentHeight, unit) : workspace.heightMm;

    setUnit(nextUnit);
    setWidth(formatMeasurement(fromMillimeters(widthMm, nextUnit)));
    setHeight(formatMeasurement(fromMillimeters(heightMm, nextUnit)));
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const widthMm = toMillimeters(Number(width), unit);
    const heightMm = toMillimeters(Number(height), unit);
    const errors = validateWorkspaceDimensions(widthMm, heightMm);

    if (errors.length > 0) {
      setError(errors[0] ?? "Ölçüler doğrulanamadı.");
      setSavedMessage("Ölçüler uygulanmadı");
      return;
    }

    onWorkspaceChange({ widthMm, heightMm });
    setError(null);
    setSavedMessage(`${formatMeasurement(widthMm)} × ${formatMeasurement(heightMm)} mm uygulandı`);
  };

  return (
    <aside aria-label="Tasarım özellikleri" className="panel panel--inspector">
      <section className="inspector-section">
        <div className="panel__heading panel__heading--compact">
          <div>
            <p className="eyebrow">Belge</p>
            <h2>Tasarım özellikleri</h2>
          </div>
          <span className="status-pill">Taslak</span>
        </div>

        <form aria-label="Çalışma alanı ölçüleri" className="dimension-form" noValidate onSubmit={handleSubmit}>
          <div className="field-row field-row--unit">
            <label htmlFor="measurement-unit">Ölçü birimi</label>
            <div className="select-wrap">
              <select
                id="measurement-unit"
                onChange={(event) => handleUnitChange(event.target.value as MeasurementUnit)}
                value={unit}
              >
                <option value="mm">Milimetre (mm)</option>
                <option value="cm">Santimetre (cm)</option>
              </select>
              <Icon name="arrow-down" size={15} />
            </div>
          </div>

          <div className="dimension-grid">
            <label className="field" htmlFor="workspace-width">
              <span>Genişlik</span>
              <div className="input-with-unit">
                <input
                  aria-label="Genişlik"
                  aria-describedby={error ? "dimension-error" : "dimension-help"}
                  id="workspace-width"
                  inputMode="decimal"
                  min={unit === "mm" ? 1 : 0.1}
                  onChange={(event) => setWidth(event.target.value)}
                  step="any"
                  type="number"
                  value={width}
                />
                <span>{unit}</span>
              </div>
            </label>

            <label className="field" htmlFor="workspace-height">
              <span>Yükseklik</span>
              <div className="input-with-unit">
                <input
                  aria-label="Yükseklik"
                  aria-describedby={error ? "dimension-error" : "dimension-help"}
                  id="workspace-height"
                  inputMode="decimal"
                  min={unit === "mm" ? 1 : 0.1}
                  onChange={(event) => setHeight(event.target.value)}
                  step="any"
                  type="number"
                  value={height}
                />
                <span>{unit}</span>
              </div>
            </label>
          </div>

          {error ? (
            <p className="form-message form-message--error" id="dimension-error" role="alert">
              {error}
            </p>
          ) : (
            <p className="form-message" id="dimension-help" role="status">
              {savedMessage}
            </p>
          )}

          <button className="primary-button" type="submit">
            Ölçüleri uygula
          </button>
        </form>

        <label className="setting-toggle">
          <span className="setting-toggle__icon"><Icon name="grid" size={17} /></span>
          <span className="setting-toggle__copy">
            <strong>Milimetrik ızgara</strong>
            <small>Yakınlaştırmaya göre ölçeklenir</small>
          </span>
          <input
            checked={gridVisible}
            onChange={(event) => onGridVisibleChange(event.target.checked)}
            role="switch"
            type="checkbox"
          />
          <span aria-hidden="true" className="switch-control" />
        </label>
      </section>

      <section aria-labelledby="counter-title" className="inspector-section inspector-section--counter">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Canlı özet</p>
            <h3 id="counter-title">Malzeme sayacı</h3>
          </div>
          <strong className="total-count">0</strong>
        </div>
        <div className="empty-summary">
          <div className="empty-summary__beads" aria-hidden="true">
            <span /><span /><span />
          </div>
          <p>Henüz yerleştirilmiş malzeme yok.</p>
          <span>Sayım, Aşama 3'te gerçek nesnelerden otomatik hesaplanacak.</span>
        </div>
      </section>

      <section aria-labelledby="object-title" className="inspector-section inspector-section--muted">
        <div className="section-title-row">
          <h3 id="object-title">Nesne özellikleri</h3>
          <span className="phase-tag">Aşama 3</span>
        </div>
        <p>Bir malzeme seçildiğinde konum, açı ve renk ayarları burada görünecek.</p>
      </section>
    </aside>
  );
}

