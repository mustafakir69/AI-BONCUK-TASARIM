import { Icon } from "../../shared/Icon";
import type { CSSProperties } from "react";

const previewMaterials = [
  { name: "Kum boncuk", dimensions: "2,5 × 2,5 mm", shape: "square", color: "#c7984d" },
  { name: "Boru boncuk", dimensions: "2,5 × 4 mm", shape: "rectangle", color: "#668aa6" },
  { name: "İnci", dimensions: "4 × 4 mm", shape: "circle", color: "#e9e4d8" },
  { name: "Pul", dimensions: "5 × 5 mm", shape: "ring", color: "#c97998" },
] as const;

export function MaterialLibrary() {
  return (
    <aside aria-labelledby="materials-title" className="panel panel--materials">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Katalog</p>
          <h2 id="materials-title">Malzeme kütüphanesi</h2>
        </div>
        <span className="count-badge">4 örnek</span>
      </div>

      <div className="panel-note" role="note">
        <span className="panel-note__dot" />
        <span>Malzeme yönetimi Aşama 2'de etkinleşecek.</span>
      </div>

      <div aria-label="Örnek malzemeler" className="material-list">
        {previewMaterials.map((material) => (
          <div aria-disabled="true" className="material-card" key={material.name}>
            <div className="material-card__preview">
              <span
                className={`material-shape material-shape--${material.shape}`}
                style={{ "--material-color": material.color } as CSSProperties}
              />
            </div>
            <div className="material-card__content">
              <strong>{material.name}</strong>
              <span>{material.dimensions}</span>
            </div>
            <span className="material-card__state">Yakında</span>
          </div>
        ))}
      </div>

      <button className="secondary-button secondary-button--full" disabled type="button">
        <Icon name="add" />
        Malzeme ekle
        <span className="button-phase">Aşama 2</span>
      </button>
    </aside>
  );
}

