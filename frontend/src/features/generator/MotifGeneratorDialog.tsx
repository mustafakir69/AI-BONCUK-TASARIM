import { useMemo, useState, type FormEvent } from "react";
import type { Material } from "../../domain/material";
import {
  estimateMotifGeneration,
  generateMotif,
  MOTIF_PATTERN_TYPES,
  MOTIF_SYMMETRIES,
  RADIAL_REPEAT_OPTIONS,
  type MotifGenerationRequest,
  type MotifGenerationResult,
  type MotifPatternType,
  type MotifSymmetry,
} from "../../domain/motifGeneration";
import type { MotifDimensions } from "../../domain/motif";
import type { Placement } from "../../domain/placement";

export type MotifApplicationMode = "append" | "replace";

interface MotifGeneratorDialogProps {
  materials: Material[];
  motif: MotifDimensions;
  projectMinimumGapMm: number;
  onApply(placements: readonly Placement[], mode: MotifApplicationMode): void;
  onClose(): void;
  onPreview(placements: readonly Placement[]): void;
}

const PATTERN_LABELS: Record<MotifPatternType, string> = {
  line: "Düz çizgi",
  ring: "Daire / halka",
  spiral: "Spiral",
  wave: "Dalga",
  flower: "Çiçek",
  geometric: "Tekrarlı geometrik desen",
};

const SYMMETRY_LABELS: Record<MotifSymmetry, string> = {
  none: "Simetri yok",
  horizontal: "Yatay ayna",
  vertical: "Dikey ayna",
  "four-way": "Dört yönlü ayna",
  radial: "Radyal simetri",
};

function numberValue(value: string): number {
  const normalized = value.trim().replace(",", ".");
  return normalized ? Number(normalized) : Number.NaN;
}

export function MotifGeneratorDialog({
  materials,
  motif,
  projectMinimumGapMm,
  onApply,
  onClose,
  onPreview,
}: MotifGeneratorDialogProps) {
  const activeMaterials = useMemo(() => materials.filter((material) => material.active), [materials]);
  const [pattern, setPattern] = useState<MotifPatternType>("flower");
  const [width, setWidth] = useState(String(motif.widthMm));
  const [height, setHeight] = useState(String(motif.heightMm));
  const [centerX, setCenterX] = useState("0");
  const [centerY, setCenterY] = useState("0");
  const [minimumGap, setMinimumGap] = useState(String(projectMinimumGapMm));
  const [symmetry, setSymmetry] = useState<MotifSymmetry>("none");
  const [radialRepeats, setRadialRepeats] = useState(6);
  const [repeatCount, setRepeatCount] = useState("5");
  const [density, setDensity] = useState(75);
  const [seed, setSeed] = useState("boncuk-2026");
  const [selectedWeights, setSelectedWeights] = useState<Record<string, number>>(() => {
    const first = activeMaterials[0];
    return first ? { [first.id]: 1 } : {};
  });
  const [result, setResult] = useState<MotifGenerationResult | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [applyMode, setApplyMode] = useState<MotifApplicationMode>("append");

  const requestedGap = numberValue(minimumGap);
  const effectiveGap = Number.isFinite(requestedGap)
    ? Math.max(projectMinimumGapMm, requestedGap)
    : requestedGap;
  const request = useMemo<MotifGenerationRequest>(() => ({
    pattern,
    widthMm: numberValue(width),
    heightMm: numberValue(height),
    centerXmm: numberValue(centerX),
    centerYmm: numberValue(centerY),
    materials: Object.entries(selectedWeights)
      .filter(([, weight]) => weight > 0)
      .map(([materialId, weight]) => ({ materialId, weight })),
    minimumGapMm: effectiveGap,
    symmetry,
    radialRepeats,
    repeatCount: Number(repeatCount),
    densityPercent: density,
    seed,
  }), [centerX, centerY, density, effectiveGap, height, pattern, radialRepeats, repeatCount, seed, selectedWeights, symmetry, width]);
  const requestKey = JSON.stringify(request);
  const estimate = useMemo(() => estimateMotifGeneration(request, materials), [materials, request]);

  function invalidatePreview(): void {
    if (generatedKey) {
      setGeneratedKey(null);
      setResult(null);
      onPreview([]);
    }
  }

  function close(): void {
    onPreview([]);
    onClose();
  }

  function toggleMaterial(materialId: string, checked: boolean): void {
    setSelectedWeights((current) => {
      if (checked) return { ...current, [materialId]: current[materialId] ?? 1 };
      const next = { ...current };
      delete next[materialId];
      return next;
    });
  }

  function generate(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const next = generateMotif(request, materials);
    setResult(next);
    setGeneratedKey(requestKey);
    onPreview(next.ok ? next.placements : []);
  }

  const currentPreview = result?.ok && generatedKey === requestKey ? result : null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="motif-generator-title" aria-modal="true" className="dialog motif-generator-dialog" role="dialog">
        <header className="dialog__header">
          <div>
            <p className="eyebrow">Deterministik üretim</p>
            <h2 id="motif-generator-title">Motif oluştur</h2>
            <p>Seçili katalog malzemelerinden düzenlenebilir boncuk yerleşimleri üretir.</p>
          </div>
          <button aria-label="Motif oluşturma penceresini kapat" className="dialog-close" onClick={close} type="button">×</button>
        </header>

        <form className="motif-generator-form" noValidate onChangeCapture={invalidatePreview} onSubmit={generate}>
          <div className="motif-generator-grid">
            <section className="generator-card">
              <h3>Geometri</h3>
              <label className="field" htmlFor="generator-pattern">
                <span>Motif türü</span>
                <select id="generator-pattern" onChange={(event) => setPattern(event.target.value as MotifPatternType)} value={pattern}>
                  {MOTIF_PATTERN_TYPES.map((item) => <option key={item} value={item}>{PATTERN_LABELS[item]}</option>)}
                </select>
              </label>
              <div className="compact-input-grid">
                <label><span>Genişlik (mm)</span><input aria-label="Üretim motif genişliği" inputMode="decimal" onChange={(event) => setWidth(event.target.value)} value={width} /></label>
                <label><span>Yükseklik (mm)</span><input aria-label="Üretim motif yüksekliği" inputMode="decimal" onChange={(event) => setHeight(event.target.value)} value={height} /></label>
                <label><span>Merkez X (mm)</span><input aria-label="Motif merkezi X" inputMode="decimal" onChange={(event) => setCenterX(event.target.value)} value={centerX} /></label>
                <label><span>Merkez Y (mm)</span><input aria-label="Motif merkezi Y" inputMode="decimal" onChange={(event) => setCenterY(event.target.value)} value={centerY} /></label>
              </div>
              <div className="compact-input-grid">
                <label><span>Minimum aralık (mm)</span><input aria-label="Üretim minimum aralığı" inputMode="decimal" onChange={(event) => setMinimumGap(event.target.value)} value={minimumGap} /></label>
                <label><span>Tekrar sayısı</span><input aria-label="Motif tekrar sayısı" min="1" onChange={(event) => setRepeatCount(event.target.value)} type="number" value={repeatCount} /></label>
              </div>
              {Number.isFinite(requestedGap) && requestedGap < projectMinimumGapMm ? (
                <p className="generator-note">Proje kuralı nedeniyle etkili aralık {projectMinimumGapMm.toLocaleString("tr-TR")} mm olacaktır.</p>
              ) : null}
            </section>

            <section className="generator-card">
              <h3>Dağılım ve simetri</h3>
              <label className="field" htmlFor="generator-symmetry">
                <span>Simetri türü</span>
                <select id="generator-symmetry" onChange={(event) => setSymmetry(event.target.value as MotifSymmetry)} value={symmetry}>
                  {MOTIF_SYMMETRIES.map((item) => <option key={item} value={item}>{SYMMETRY_LABELS[item]}</option>)}
                </select>
              </label>
              {symmetry === "radial" ? (
                <label className="field" htmlFor="generator-radial-repeat">
                  <span>Radyal tekrar</span>
                  <select id="generator-radial-repeat" onChange={(event) => setRadialRepeats(Number(event.target.value))} value={radialRepeats}>
                    {RADIAL_REPEAT_OPTIONS.map((item) => <option key={item} value={item}>{item} yön</option>)}
                  </select>
                </label>
              ) : null}
              <label className="field generator-density" htmlFor="generator-density">
                <span>Yoğunluk <strong>%{density}</strong></span>
                <input id="generator-density" max="100" min="1" onChange={(event) => setDensity(Number(event.target.value))} type="range" value={density} />
              </label>
              <label className="field" htmlFor="generator-seed">
                <span>Rastgelelik tohumu (seed)</span>
                <input id="generator-seed" maxLength={100} onChange={(event) => setSeed(event.target.value)} value={seed} />
              </label>
              <p className="generator-note">Aynı ayarlar ve aynı seed her zaman aynı geometrik sonucu üretir.</p>
            </section>

            <section className="generator-card generator-card--materials">
              <h3>Kullanılacak malzemeler</h3>
              {activeMaterials.length === 0 ? <p className="form-message form-message--error">Etkin katalog malzemesi bulunamadı.</p> : (
                <div className="generator-material-list">
                  {activeMaterials.map((material) => {
                    const checked = selectedWeights[material.id] !== undefined;
                    return (
                      <div className="generator-material" key={material.id}>
                        <label>
                          <input checked={checked} onChange={(event) => toggleMaterial(material.id, event.target.checked)} type="checkbox" />
                          <span className="generator-material__swatch" style={{ backgroundColor: material.color }} />
                          <span><strong>{material.name}</strong><small>{material.widthMm} × {material.heightMm} mm</small></span>
                        </label>
                        <input
                          aria-label={`${material.name} kullanım oranı`}
                          disabled={!checked}
                          min="0.1"
                          onChange={(event) => {
                            const nextWeight = numberValue(event.target.value);
                            setSelectedWeights((current) => ({
                              ...current,
                              [material.id]: Number.isFinite(nextWeight) ? nextWeight : 0,
                            }));
                          }}
                          step="0.1"
                          title="Göreli kullanım oranı"
                          type="number"
                          value={checked ? selectedWeights[material.id] : ""}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="generator-card generator-card--estimate" aria-live="polite">
              <h3>Üretim tahmini</h3>
              {estimate.errors.length > 0 ? (
                <ul className="generator-message-list generator-message-list--error">{estimate.errors.map((item) => <li key={item}>{item}</li>)}</ul>
              ) : (
                <>
                  <div className="generator-estimate-number"><strong>≈ {estimate.estimatedCount.toLocaleString("tr-TR")}</strong><span>boncuk</span></div>
                  <p>Yaklaşık kapasite: {estimate.capacity.toLocaleString("tr-TR")}. Tahmin kesin sonuç değildir; geometri doğrulaması adayları reddedebilir.</p>
                  {estimate.warnings.length > 0 ? <ul className="generator-message-list">{estimate.warnings.map((item) => <li key={item}>{item}</li>)}</ul> : <span className="generator-suitability">Ayarlar ön kontrol için uygun görünüyor.</span>}
                </>
              )}
              <button className="primary-button" disabled={estimate.errors.length > 0} type="submit">Önizleme üret</button>
            </section>
          </div>
        </form>

        <section aria-live="polite" className="generator-result">
          {!result ? <p>Önizleme üretildiğinde rapor burada gösterilir; proje henüz değişmez.</p> : result.ok ? (
            <>
              <div className="generator-result__heading"><div><p className="eyebrow">Geometri doğrulandı</p><h3>Üretim raporu</h3></div><strong>{result.report.totalCount.toLocaleString("tr-TR")} boncuk</strong></div>
              <dl className="generator-report-grid">
                <div><dt>Gerçek ölçü</dt><dd>{result.report.actualWidthMm.toFixed(2)} × {result.report.actualHeightMm.toFixed(2)} mm</dd></div>
                <div><dt>Simetri</dt><dd>{SYMMETRY_LABELS[result.report.symmetry]}</dd></div>
                <div><dt>Minimum aralık</dt><dd>{result.report.minimumGapMm.toLocaleString("tr-TR")} mm</dd></div>
                <div><dt>Aday sonucu</dt><dd>{result.report.acceptedCandidates} başarılı / {result.report.rejectedCandidates} reddedildi</dd></div>
              </dl>
              <ul className="generator-counts">
                {Object.entries(result.report.countsByMaterial).map(([materialId, count]) => (
                  <li key={materialId}><span>{materials.find((item) => item.id === materialId)?.name ?? materialId}</span><strong>{count} adet</strong></li>
                ))}
              </ul>
              {result.report.warnings.length > 0 ? <ul className="generator-message-list">{result.report.warnings.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            </>
          ) : (
            <div className="generator-failure" role="alert"><strong>Motif üretilemedi</strong><p>{result.message}</p><ul>{result.errors.map((item) => <li key={item}>{item}</li>)}</ul></div>
          )}
        </section>

        <footer className="dialog__actions dialog__actions--split">
          <button className="button button--secondary" onClick={close} type="button">İptal</button>
          <div className="generator-apply-controls">
            <label><input checked={applyMode === "append"} onChange={() => setApplyMode("append")} type="radio" /> Mevcut tasarıma ekle</label>
            <label><input checked={applyMode === "replace"} onChange={() => setApplyMode("replace")} type="radio" /> Mevcut tasarımı değiştir</label>
            <button className="button button--primary" disabled={!currentPreview} onClick={() => currentPreview && onApply(currentPreview.placements, applyMode)} type="button">Motifi uygula</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
