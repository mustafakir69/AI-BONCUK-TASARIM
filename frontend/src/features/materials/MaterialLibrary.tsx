import { useState } from "react";
import { formatMillimeters, type Material, type MaterialDraft, type MaterialShape } from "../../domain/material";
import { Icon } from "../../shared/Icon";
import { MaterialEditorDialog } from "./MaterialEditorDialog";
import { MaterialPreview } from "./MaterialPreview";

interface MaterialLibraryProps {
  materials: Material[];
  selectedMaterialId?: string;
  storageWarning?: string;
  onAdd(draft: MaterialDraft): void;
  onDelete(materialId: string): "REMOVED" | "MATERIAL_IN_USE" | "MATERIAL_NOT_FOUND";
  onEdit(materialId: string, draft: MaterialDraft): "UPDATED" | "GEOMETRY_CONFLICT";
  onSelect(materialId: string): void;
}

const SHAPE_LABELS: Record<MaterialShape, string> = {
  square: "Kare",
  rectangle: "Dikdörtgen",
  circle: "Daire",
  ring: "Delikli daire",
};

export function MaterialLibrary({
  materials,
  selectedMaterialId,
  storageWarning,
  onAdd,
  onDelete,
  onEdit,
  onSelect,
}: MaterialLibraryProps) {
  const [editorMaterial, setEditorMaterial] = useState<Material | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  function handleSave(draft: MaterialDraft): void {
    if (editorMaterial === "new") {
      onAdd(draft);
      setActionMessage(`${draft.name.trim()} kataloğa eklendi.`);
    } else if (editorMaterial) {
      const result = onEdit(editorMaterial.id, draft);
      setActionMessage(
        result === "UPDATED"
          ? `${draft.name.trim()} güncellendi.`
          : "Ölçü değişikliği mevcut tasarımda çakışma oluşturduğu için uygulanmadı.",
      );
    }
    setEditorMaterial(null);
  }

  function confirmDelete(): void {
    if (!deleteTarget) {
      return;
    }
    const result = onDelete(deleteTarget.id);
    if (result === "REMOVED") {
      setActionMessage(`${deleteTarget.name} silindi.`);
      setDeleteTarget(null);
    } else if (result === "MATERIAL_IN_USE") {
      setActionMessage("Bu malzeme tasarımda kullanıldığı için silinemez.");
      setDeleteTarget(null);
    } else {
      setActionMessage("Malzeme artık katalogda bulunamadığı için işlem uygulanmadı.");
      setDeleteTarget(null);
    }
  }

  return (
    <aside aria-labelledby="materials-title" className="panel panel--materials">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Katalog</p>
          <h2 id="materials-title">Malzeme kütüphanesi</h2>
        </div>
        <span className="count-badge">{materials.length} malzeme</span>
      </div>

      <div className="panel-note" role="note">
        <span className="panel-note__dot" />
        <span>Ölçüler katalogda gerçek milimetre değerleriyle saklanır.</span>
      </div>

      {storageWarning ? <p className="catalog-message catalog-message--warning" role="alert">{storageWarning}</p> : null}
      {actionMessage ? <p className="catalog-message" role="status">{actionMessage}</p> : null}

      {materials.length > 0 ? (
        <div aria-label="Malzemeler" className="material-list">
          {materials.map((material) => (
            <article className={selectedMaterialId === material.id ? "material-card material-card--selected" : "material-card"} key={material.id}>
              <button
                aria-label={`${material.name} ile yerleştirme moduna geç`}
                aria-pressed={selectedMaterialId === material.id}
                className="material-card__select"
                onClick={() => onSelect(material.id)}
                type="button"
              >
                <span className="material-card__preview">
                  <MaterialPreview material={material} />
                </span>
                <span className="material-card__content">
                  <strong>{material.name}</strong>
                  <span>
                    {formatMillimeters(material.widthMm)} × {formatMillimeters(material.heightMm)} mm · {SHAPE_LABELS[material.shape]}
                  </span>
                </span>
              </button>
              <div className="material-card__actions">
                <button
                  aria-label={`${material.name} malzemesini düzenle`}
                  onClick={() => setEditorMaterial(material)}
                  title="Düzenle"
                  type="button"
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  aria-label={`${material.name} malzemesini sil`}
                  className="material-card__delete"
                  onClick={() => setDeleteTarget(material)}
                  title="Sil"
                  type="button"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <strong>Katalog boş</strong>
          <span>İlk malzemenizi ekleyerek başlayın.</span>
        </div>
      )}

      <button className="secondary-button secondary-button--full catalog-add-button" onClick={() => setEditorMaterial("new")} type="button">
        <Icon name="add" />
        Malzeme ekle
      </button>

      {editorMaterial ? (
        <MaterialEditorDialog
          key={editorMaterial === "new" ? "new" : editorMaterial.id}
          material={editorMaterial === "new" ? undefined : editorMaterial}
          onClose={() => setEditorMaterial(null)}
          onSave={handleSave}
        />
      ) : null}

      {deleteTarget ? (
        <div className="dialog-backdrop">
          <section aria-labelledby="delete-material-title" aria-modal="true" className="confirm-dialog" role="alertdialog">
            <div className="confirm-dialog__mark" aria-hidden="true">!</div>
            <h2 id="delete-material-title">Malzemeyi sil?</h2>
            <p>
              <strong>{deleteTarget.name}</strong> katalogdan kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={() => setDeleteTarget(null)} type="button">İptal</button>
              <button className="danger-button" onClick={confirmDelete} type="button">Malzemeyi sil</button>
            </div>
          </section>
        </div>
      ) : null}
    </aside>
  );
}

