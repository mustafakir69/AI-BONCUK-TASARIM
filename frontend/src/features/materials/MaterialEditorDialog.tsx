import { useEffect, useId, useState, type FormEvent } from "react";
import {
  hasMaterialValidationErrors,
  validateMaterialDraft,
  type Material,
  type MaterialDraft,
  type MaterialShape,
  type MaterialValidationErrors,
} from "../../domain/material";
import { MaterialPreview } from "./MaterialPreview";

interface MaterialEditorDialogProps {
  material?: Material;
  onClose(): void;
  onSave(draft: MaterialDraft): void;
}

interface MaterialFormValues {
  name: string;
  shape: MaterialShape;
  width: string;
  height: string;
  color: string;
  holeDiameter: string;
}

const SHAPE_LABELS: Record<MaterialShape, string> = {
  square: "Kare",
  rectangle: "Dikdörtgen",
  circle: "Daire",
  ring: "Ortası delikli daire",
};

function numberToInput(value: number | undefined): string {
  return value === undefined ? "" : String(value).replace(".", ",");
}

function parseDecimal(value: string): number {
  const normalized = value.trim().replace(",", ".");
  return normalized === "" ? Number.NaN : Number(normalized);
}

function initialValues(material?: Material): MaterialFormValues {
  return material
    ? {
        name: material.name,
        shape: material.shape,
        width: numberToInput(material.widthMm),
        height: numberToInput(material.heightMm),
        color: material.color,
        holeDiameter: numberToInput(material.holeDiameterMm),
      }
    : {
        name: "",
        shape: "square",
        width: "2,5",
        height: "2,5",
        color: "#C99A45",
        holeDiameter: "0,8",
      };
}

function isConstrainedShape(shape: MaterialShape): boolean {
  return shape === "square" || shape === "circle" || shape === "ring";
}

export function MaterialEditorDialog({ material, onClose, onSave }: MaterialEditorDialogProps) {
  const titleId = useId();
  const [values, setValues] = useState<MaterialFormValues>(() => initialValues(material));
  const [errors, setErrors] = useState<MaterialValidationErrors>({});

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const previewDraft: MaterialDraft = {
    name: values.name,
    shape: values.shape,
    widthMm: parseDecimal(values.width),
    heightMm: parseDecimal(values.height),
    color: values.color,
    holeDiameterMm: parseDecimal(values.holeDiameter),
  };

  function updateWidth(width: string): void {
    setValues((current) => ({
      ...current,
      width,
      ...(isConstrainedShape(current.shape) ? { height: width } : {}),
    }));
  }

  function updateShape(shape: MaterialShape): void {
    setValues((current) => ({
      ...current,
      shape,
      ...(isConstrainedShape(shape) ? { height: current.width } : {}),
      ...(shape === "ring" && current.holeDiameter === "" ? { holeDiameter: "0,8" } : {}),
    }));
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const draft: MaterialDraft = {
      name: values.name,
      shape: values.shape,
      widthMm: parseDecimal(values.width),
      heightMm: parseDecimal(values.height),
      color: values.color,
      ...(values.shape === "ring" ? { holeDiameterMm: parseDecimal(values.holeDiameter) } : {}),
    };
    const nextErrors = validateMaterialDraft(draft);
    setErrors(nextErrors);
    if (hasMaterialValidationErrors(nextErrors)) {
      return;
    }
    onSave(draft);
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby={titleId} aria-modal="true" className="material-dialog" role="dialog">
        <header className="dialog-header">
          <div>
            <p className="eyebrow">Malzeme kataloğu</p>
            <h2 id={titleId}>{material ? "Malzemeyi düzenle" : "Yeni malzeme"}</h2>
          </div>
          <button aria-label="Pencereyi kapat" className="dialog-close" onClick={onClose} type="button">
            ×
          </button>
        </header>

        <form className="material-form" onSubmit={handleSubmit}>
          <div className="material-form__fields">
            <label className="form-field">
              <span>Malzeme adı</span>
              <input
                autoFocus
                maxLength={100}
                onChange={(event) => setValues({ ...values, name: event.target.value })}
                value={values.name}
              />
              {errors.name ? <small role="alert">{errors.name}</small> : null}
            </label>

            <label className="form-field">
              <span>Malzeme türü</span>
              <select
                onChange={(event) => updateShape(event.target.value as MaterialShape)}
                value={values.shape}
              >
                {Object.entries(SHAPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <div className="material-form__dimensions">
              <label className="form-field">
                <span>{values.shape === "circle" || values.shape === "ring" ? "Dış çap / genişlik (mm)" : "Genişlik (mm)"}</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => updateWidth(event.target.value)}
                  value={values.width}
                />
                {errors.widthMm ? <small role="alert">{errors.widthMm}</small> : null}
              </label>

              <label className="form-field">
                <span>Yükseklik (mm)</span>
                <input
                  aria-describedby={isConstrainedShape(values.shape) ? `${titleId}-locked-size` : undefined}
                  inputMode="decimal"
                  onChange={(event) => setValues({ ...values, height: event.target.value })}
                  readOnly={isConstrainedShape(values.shape)}
                  value={values.height}
                />
                {errors.heightMm ? <small role="alert">{errors.heightMm}</small> : null}
              </label>
            </div>

            {isConstrainedShape(values.shape) ? (
              <p className="form-help" id={`${titleId}-locked-size`}>
                {values.shape === "square" ? "Karede kenarlar" : "Dairesel malzemede genişlik ve yükseklik"} otomatik olarak eşit tutulur.
              </p>
            ) : null}

            {values.shape === "ring" ? (
              <label className="form-field">
                <span>Delik çapı (mm)</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => setValues({ ...values, holeDiameter: event.target.value })}
                  value={values.holeDiameter}
                />
                {errors.holeDiameterMm ? <small role="alert">{errors.holeDiameterMm}</small> : null}
              </label>
            ) : null}

            <label className="form-field form-field--color">
              <span>Renk</span>
              <span className="color-field">
                <input
                  aria-label="Renk seçici"
                  onChange={(event) => setValues({ ...values, color: event.target.value.toUpperCase() })}
                  type="color"
                  value={values.color}
                />
                <output>{values.color.toUpperCase()}</output>
              </span>
              {errors.color ? <small role="alert">{errors.color}</small> : null}
            </label>
          </div>

          <aside className="material-form__preview" aria-label="Malzeme önizlemesi">
            <span className="material-form__preview-label">Önizleme</span>
            <div className="material-form__preview-canvas">
              <MaterialPreview large material={previewDraft} />
            </div>
            <strong>{values.name.trim() || "Adsız malzeme"}</strong>
            <span>Oranlar fiziksel mm ölçülerinden türetilir.</span>
          </aside>

          <footer className="dialog-actions">
            <button className="secondary-button" onClick={onClose} type="button">İptal</button>
            <button className="primary-button" type="submit">
              {material ? "Değişiklikleri kaydet" : "Malzemeyi ekle"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

