import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  AI_DESIGN_REQUEST_SCHEMA_VERSION,
  parseAiDesignPlan,
  validateAiDesignRequest,
  type AiDesignPlan,
  type AiDesignRequest,
  type AiMaterialSelectionMode,
  type AiReferenceImageDescriptor,
  type AiSymmetryPreference,
} from "../../domain/aiDesign";
import { interpretAiDesignPlan, type AiPlanInterpretation } from "../../domain/aiPlanInterpreter";
import {
  UNCONFIGURED_AI_STATUS,
  type AiDesignProvider,
  type AiProviderId,
  type AiProviderStatus,
  type AiProviderUsage,
} from "../../domain/aiProvider";
import type { Material } from "../../domain/material";
import type { MotifDimensions } from "../../domain/motif";
import type { Placement } from "../../domain/placement";
import { aiDesignProvider } from "../../infrastructure/httpAiDesignProvider";
import { inspectReferenceImage, type ReferenceImageInspection } from "../../infrastructure/referenceImage";

const EXAMPLE_PROMPTS = [
  "Abiye elbise önü için zarif çiçek ve yaprak kompozisyonu oluştur.",
  "Omuzdan bele doğru seyrekleşen, akışkan ve asimetrik bir nakış tasarla.",
  "İnci merkezli küçük çiçekleri boru boncuklu dallarla birbirine bağla.",
];

const MATERIAL_MODE_COPY: Record<AiMaterialSelectionMode, { title: string; description: string }> = {
  "user-only": { title: "Malzemeleri ben seçeyim", description: "Yalnız işaretlediğiniz katalog malzemeleri kullanılabilir." },
  "ai-selects": { title: "Yapay zekâ seçsin", description: "Etkin katalogdaki uygun malzemeler arasından seçim yapılabilir." },
  collaborative: { title: "Birlikte seçelim", description: "İşaretledikleriniz zorunludur; diğer etkin katalog kayıtları tamamlayıcı olabilir." },
};

interface AiDesignDialogProps {
  materials: Material[];
  motif: MotifDimensions;
  projectMinimumGapMm: number;
  inspectImage?: (file: File) => Promise<ReferenceImageInspection>;
  provider?: AiDesignProvider;
  onClose(): void;
  onPreview?(placements: readonly Placement[]): void;
  onApply?(placements: readonly Placement[], mode: "append" | "replace"): boolean;
  onRequestValidated?(request: AiDesignRequest): void;
}

type RequestLifecycle = "ready" | "sending" | "analyzing" | "validating" | "preview-ready" | "awaiting-approval" | "failure" | "cancelled";

interface PreviewState {
  plan: AiDesignPlan;
  interpretation: AiPlanInterpretation;
  usage?: AiProviderUsage;
}

const CONSENT_TEXT = "Yazdığınız tasarım tarifi ve seçtiğiniz referans görsel, tasarımın oluşturulması amacıyla seçtiğiniz yapay zekâ sağlayıcısına gönderilecektir.";

function parseDecimal(value: string): number {
  const normalized = value.trim().replace(",", ".");
  return normalized ? Number(normalized) : Number.NaN;
}

function createPreviewUrl(file: File): string | null {
  return typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : null;
}

function revokePreviewUrl(url: string | null): void {
  if (url && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url);
}

function connectionBadge(status: AiProviderStatus): string {
  if (status.state === "ready") return "Kullanıma hazır";
  if (status.state === "disabled") return "AI çağrıları kapalı";
  if (status.state === "unverified") return "Model doğrulanmadı";
  if (status.state === "unavailable") {
    return status.backendReachable === false ? "Backend erişilemiyor" : "Sağlayıcı erişilemiyor";
  }
  return "Yapılandırılmadı";
}

function providerHealthDetails(status: AiProviderStatus): string {
  const details = [status.backendReachable === false
    ? "Backend erişilemiyor."
    : (status.backendReachable ? "Backend hazır." : "Backend durumu kontrol ediliyor.")];
  if (status.id === "9router") {
    details.push(status.reachable ? "9Router erişilebilir." : "9Router erişilemiyor.");
    if (status.modelAvailable === true) details.push("Model katalogda mevcut.");
    if (status.modelAvailable === false) details.push("Model katalogda bulunamadı.");
    details.push(status.compatibilityVerified
      ? "Model uyumluluğu canlı testle doğrulandı."
      : "Model uyumluluğu doğrulanmadı.");
  } else if (status.id === "openai") {
    details.push(status.compatibilityVerified
      ? "OpenAI API bağlantısı yapılandırılmış."
      : "OpenAI anahtarı veya model doğrulanmadı.");
  }
  return details.join(" ");
}

function createDisabledReason(status: AiProviderStatus): string | undefined {
  if (status.state === "ready") return undefined;
  if (status.state === "disabled") {
    return "Plan oluşturmak için AI çağrılarının sunucu ayarlarında etkinleştirilmesi gerekir. AI_CALLS_ENABLED otomatik olarak değiştirilmez.";
  }
  if (status.state === "unverified") {
    return "Plan oluşturmak için önce ayrı ve açık onaylı 9Router canlı metin/JSON uyumluluk testi başarıyla çalıştırılmalıdır. Ardından sunucuda NINEROUTER_MODEL_COMPATIBILITY_VERIFIED=true ayarlanıp backend yeniden başlatılmalıdır.";
  }
  if (status.state === "unavailable") {
    return status.backendReachable === false
      ? "Plan oluşturmak için yerel FastAPI backend çalışır ve erişilebilir olmalıdır."
      : "Plan oluşturmak için seçili AI sağlayıcısı erişilebilir olmalıdır.";
  }
  return "Plan oluşturmak için seçili sağlayıcının anahtar ve model yapılandırması tamamlanmalıdır.";
}

function unavailableProviderStatuses(): readonly AiProviderStatus[] {
  const message = "Yerel AI sunucusuna ulaşılamadı.";
  return [
    { id: "openai", state: "unavailable", providerName: "OpenAI API", message, backendReachable: false },
    { id: "9router", state: "unavailable", providerName: "9Router yerel ağ geçidi", message, backendReachable: false },
  ];
}

export function AiDesignDialog({
  materials,
  motif,
  projectMinimumGapMm,
  inspectImage = inspectReferenceImage,
  provider = aiDesignProvider,
  onClose,
  onPreview,
  onApply,
  onRequestValidated,
}: AiDesignDialogProps) {
  const activeMaterials = materials.filter((material) => material.active);
  const firstMaterialId = activeMaterials[0]?.id;
  const [prompt, setPrompt] = useState("");
  const [materialMode, setMaterialMode] = useState<AiMaterialSelectionMode>("user-only");
  const [selectedIds, setSelectedIds] = useState<string[]>(firstMaterialId ? [firstMaterialId] : []);
  const [width, setWidth] = useState(String(motif.widthMm));
  const [height, setHeight] = useState(String(motif.heightMm));
  const [minimumGap, setMinimumGap] = useState(String(projectMinimumGapMm));
  const [targetGap, setTargetGap] = useState("1");
  const [density, setDensity] = useState(70);
  const [symmetry, setSymmetry] = useState<AiSymmetryPreference>("optional");
  const [maxPlacements, setMaxPlacements] = useState("1200");
  const [referenceFile, setReferenceFile] = useState<File>();
  const [referenceDescriptor, setReferenceDescriptor] = useState<AiReferenceImageDescriptor>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState("Görsel eklenmedi. Veriler yalnız bu geçici istekte tutulur.");
  const [imageError, setImageError] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [providerStatus, setProviderStatus] = useState<AiProviderStatus>(UNCONFIGURED_AI_STATUS);
  const [providerStatuses, setProviderStatuses] = useState<readonly AiProviderStatus[]>([UNCONFIGURED_AI_STATUS]);
  const [selectedProviderId, setSelectedProviderId] = useState<AiProviderId>("openai");
  const [healthBusy, setHealthBusy] = useState(true);
  const [lifecycle, setLifecycle] = useState<RequestLifecycle>("ready");
  const [statusMessage, setStatusMessage] = useState("İstek göndermeye hazır.");
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState<PreviewState>();
  const [applyMode, setApplyMode] = useState<"append" | "replace">("append");
  const [acceptApproximations, setAcceptApproximations] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const imageInspectionIdRef = useRef(0);
  const requestSequenceRef = useRef(0);
  const abortRef = useRef<AbortController | undefined>(undefined);
  const inFlightRef = useRef(false);
  const healthAbortRef = useRef<AbortController | undefined>(undefined);
  const healthSequenceRef = useRef(0);
  const onPreviewRef = useRef(onPreview);
  const selectedProviderIdRef = useRef<AiProviderId>("openai");

  useEffect(() => {
    onPreviewRef.current = onPreview;
  }, [onPreview]);

  const applyProviderStatuses = useCallback((statuses: readonly AiProviderStatus[], preserveSelection: boolean) => {
    const nextStatuses = statuses.length > 0 ? statuses : [UNCONFIGURED_AI_STATUS];
    const nextStatus = (preserveSelection
      ? nextStatuses.find((status) => status.id === selectedProviderIdRef.current)
      : undefined)
      ?? nextStatuses[0]
      ?? UNCONFIGURED_AI_STATUS;
    setProviderStatuses(nextStatuses);
    setProviderStatus(nextStatus);
    if (nextStatus.id) {
      selectedProviderIdRef.current = nextStatus.id;
      setSelectedProviderId(nextStatus.id);
    }
  }, []);

  const checkProviderHealth = useCallback((preserveSelection: boolean) => {
    if (healthAbortRef.current && !healthAbortRef.current.signal.aborted) return;
    const controller = new AbortController();
    const sequence = healthSequenceRef.current + 1;
    healthSequenceRef.current = sequence;
    healthAbortRef.current = controller;
    setHealthBusy(true);
    const statusRequest = provider.getStatuses?.(controller.signal)
      ?? provider.getStatus(controller.signal).then((status) => [status]);
    void statusRequest.then((statuses) => {
      if (controller.signal.aborted || sequence !== healthSequenceRef.current) return;
      applyProviderStatuses(statuses, preserveSelection);
    }).catch((error: unknown) => {
      if (controller.signal.aborted || sequence !== healthSequenceRef.current) return;
      console.error("[AI sağlık] Sağlayıcı durum isteği tamamlanamadı.", {
        errorType: error instanceof Error ? error.name : typeof error,
      });
      applyProviderStatuses(unavailableProviderStatuses(), preserveSelection);
    }).finally(() => {
      if (sequence !== healthSequenceRef.current) return;
      healthAbortRef.current = undefined;
      if (!controller.signal.aborted) setHealthBusy(false);
    });
  }, [applyProviderStatuses, provider]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) checkProviderHealth(false);
    });
    return () => {
      active = false;
      healthSequenceRef.current += 1;
      healthAbortRef.current?.abort();
      healthAbortRef.current = undefined;
    };
  }, [checkProviderHealth]);

  useEffect(() => () => {
      imageInspectionIdRef.current += 1;
      requestSequenceRef.current += 1;
      abortRef.current?.abort();
      revokePreviewUrl(previewUrlRef.current);
      onPreviewRef.current?.([]);
  }, []);

  function refreshProviderHealth(): void {
    checkProviderHealth(true);
  }

  function changeProvider(providerId: AiProviderId): void {
    const nextStatus = providerStatuses.find((status) => status.id === providerId);
    if (!nextStatus) return;
    selectedProviderIdRef.current = providerId;
    setSelectedProviderId(providerId);
    setProviderStatus(nextStatus);
    setConsent(false);
    setPreview(undefined);
    onPreview?.([]);
    if (nextStatus.visionSupported === false && referenceFile) removeImage();
  }

  function setNextPreviewUrl(next: string | null): void {
    revokePreviewUrl(previewUrlRef.current);
    previewUrlRef.current = next;
    setPreviewUrl(next);
  }

  function removeImage(): void {
    imageInspectionIdRef.current += 1;
    setReferenceFile(undefined);
    setReferenceDescriptor(undefined);
    setNextPreviewUrl(null);
    setImageError(false);
    setImageMessage("Görsel kaldırıldı; hiçbir yere gönderilmedi veya kalıcı olarak saklanmadı.");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function selectImage(file?: File): Promise<void> {
    if (!file) return;
    const inspectionId = imageInspectionIdRef.current + 1;
    imageInspectionIdRef.current = inspectionId;
    setImageBusy(true);
    setImageError(false);
    setImageMessage("Görsel yerel olarak doğrulanıyor…");
    const result = await inspectImage(file);
    if (inspectionId !== imageInspectionIdRef.current) return;
    setImageBusy(false);
    if (!result.ok) {
      removeImage();
      setImageError(true);
      setImageMessage(result.error);
      return;
    }
    setReferenceFile(file);
    setReferenceDescriptor(result.descriptor);
    setImageError(false);
    setNextPreviewUrl(createPreviewUrl(file));
    setImageMessage(`${result.descriptor.widthPx.toLocaleString("tr-TR")} × ${result.descriptor.heightPx.toLocaleString("tr-TR")} px · ${(result.descriptor.sizeBytes / 1024).toFixed(1)} KB`);
  }

  function changeMaterialMode(mode: AiMaterialSelectionMode): void {
    setMaterialMode(mode);
    if (mode === "ai-selects") setSelectedIds([]);
    else if (selectedIds.length === 0 && firstMaterialId) setSelectedIds([firstMaterialId]);
  }

  function toggleMaterial(materialId: string): void {
    setSelectedIds((current) => current.includes(materialId)
      ? current.filter((id) => id !== materialId)
      : [...current, materialId]);
  }

  function buildRequest(): AiDesignRequest {
    return {
      schemaVersion: AI_DESIGN_REQUEST_SCHEMA_VERSION,
      prompt,
      ...(referenceDescriptor ? { referenceImage: referenceDescriptor } : {}),
      target: { widthMm: parseDecimal(width), heightMm: parseDecimal(height) },
      materialSelection: { mode: materialMode, selectedMaterialIds: selectedIds },
      constraints: {
        minimumGapMm: parseDecimal(minimumGap),
        targetGapMm: parseDecimal(targetGap),
        densityPercent: density,
        symmetry,
        maxPlacements: Number(maxPlacements),
      },
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (inFlightRef.current) return;
    const result = validateAiDesignRequest(buildRequest(), materials);
    if (!result.ok) {
      setIssues(result.issues.map((issue) => issue.message));
      setStatusMessage("İstek doğrulanamadı; hiçbir veri gönderilmedi.");
      return;
    }
    if (!consent) {
      setIssues(["AI sağlayıcısına aktarım metnini okuyup açıkça onaylayın."]);
      setStatusMessage("Onay verilmedi; hiçbir tasarım isteği gönderilmedi.");
      return;
    }
    setIssues([]);
    onRequestValidated?.(result.value);
    setPreview(undefined);
    onPreview?.([]);
    setAcceptApproximations(false);
    const sequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = sequence;
    const controller = new AbortController();
    abortRef.current = controller;
    inFlightRef.current = true;
    setLifecycle("sending");
    setStatusMessage("Doğrulanmış istek güvenli backend'e gönderiliyor…");
    try {
      setLifecycle("analyzing");
      setStatusMessage(`${providerStatus.providerName} tasarım planını analiz ediyor; yüzde tahmini gösterilmiyor.`);
      const response = await provider.requestPlan(
        result.value,
        materials,
        referenceFile,
        controller.signal,
        selectedProviderId,
      );
      if (sequence !== requestSequenceRef.current) return;
      setLifecycle("validating");
      setStatusMessage("Yapılandırılmış plan şema ve geometri kurallarıyla doğrulanıyor…");
      const parsed = parseAiDesignPlan(response.plan, result.value, materials);
      if (!parsed.ok) {
        setIssues(parsed.issues.map((issue) => issue.message));
        setLifecycle("failure");
        setStatusMessage("Sağlayıcı yanıtı güvenli tasarım planı sözleşmesini geçemedi.");
        return;
      }
      const interpretation = interpretAiDesignPlan(parsed.value, result.value, materials);
      const nextPreview = { plan: parsed.value, interpretation, usage: response.usage };
      setPreview(nextPreview);
      onPreview?.(interpretation.placements);
      setLifecycle("preview-ready");
      setStatusMessage(interpretation.placements.length > 0
        ? "Geçici önizleme hazır. Proje henüz değiştirilmedi; uygulamak için kullanıcı onayı bekleniyor."
        : "Plan hazır ancak güvenle düzenlenebilir boncuk koordinatına dönüştürülemedi; proje değiştirilmedi.");
    } catch (error) {
      if (sequence !== requestSequenceRef.current) return;
      if (error instanceof DOMException && error.name === "AbortError") {
        setLifecycle("cancelled");
        setStatusMessage("İstek iptal edildi; geç gelen yanıtlar yok sayılacak.");
      } else {
        setLifecycle("failure");
        setStatusMessage(error instanceof Error ? error.message : "AI isteği güvenli biçimde tamamlanamadı.");
      }
    } finally {
      if (sequence === requestSequenceRef.current) {
        inFlightRef.current = false;
        abortRef.current = undefined;
      }
    }
  }

  function cancelRequest(): void {
    requestSequenceRef.current += 1;
    inFlightRef.current = false;
    abortRef.current?.abort();
    abortRef.current = undefined;
    setLifecycle("cancelled");
    setStatusMessage("İstek iptal edildi; proje değiştirilmedi.");
  }

  function applyPreview(): void {
    if (!preview || preview.interpretation.placements.length === 0 || !onApply) return;
    if (preview.interpretation.approximations.length > 0 && !acceptApproximations) {
      setIssues(["Yaklaştırmaları inceleyip kabul etmeden tasarım uygulanamaz."]);
      return;
    }
    setLifecycle("awaiting-approval");
    if (onApply(preview.interpretation.placements, applyMode)) onClose();
  }

  const requestBusy = lifecycle === "sending" || lifecycle === "analyzing" || lifecycle === "validating";
  const providerReady = providerStatus.state === "ready";
  const disabledReason = createDisabledReason(providerStatus);
  const badgeText = healthBusy ? "Backend kontrol ediliyor" : connectionBadge(providerStatus);

  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="ai-design-title" aria-modal="true" className="dialog ai-design-dialog" role="dialog">
        <header className="dialog__header ai-design-header">
          <div>
            <p className="eyebrow">Serbest tasarım isteği</p>
            <h2 id="ai-design-title">Yapay Zekâ ile Tasarla</h2>
            <p>Metin ve isteğe bağlı referans görselden, gerçek katalog malzemeleriyle düzenlenebilir bir tasarım planı hazırlamak için güvenli istek oluşturun.</p>
          </div>
          <div className="ai-design-header__actions">
            <span className={`ai-connection-badge${providerReady ? " ai-connection-badge--ready" : ""}`}><span /> {badgeText}</span>
            <button aria-label="Yapay zekâ tasarım penceresini kapat" className="dialog-close" onClick={onClose} type="button">×</button>
          </div>
        </header>

        <div className="ai-connection-notice" role="status">
          <div>
            <strong>{healthBusy ? "Backend sağlık durumu kontrol ediliyor…" : providerStatus.message}</strong>
            <span>
              {providerStatus.modelId ? `Model: ${providerStatus.modelId}. ` : ""}
              {providerHealthDetails(providerStatus)}
            </span>
          </div>
          <button className="button button--secondary ai-health-refresh" disabled={healthBusy} onClick={() => void refreshProviderHealth()} type="button">
            {healthBusy ? "Kontrol ediliyor…" : "Durumu yenile"}
          </button>
        </div>

        <form className="ai-design-form" noValidate onSubmit={submit}>
          <fieldset className="ai-provider-selector">
            <legend>Yapay zekâ sağlayıcısı</legend>
            <div>
              {providerStatuses.filter((status) => status.id).map((status) => (
                <label className={selectedProviderId === status.id ? "ai-provider-option ai-provider-option--active" : "ai-provider-option"} key={status.id}>
                  <input
                    checked={selectedProviderId === status.id}
                    name="ai-provider"
                    onChange={() => changeProvider(status.id as AiProviderId)}
                    type="radio"
                  />
                  <span>
                    <strong>{status.providerName}</strong>
                    <small>{status.state === "ready"
                      ? "Model uyumluluğu doğrulandı ve etkin."
                      : `${status.id === "9router" && status.reachable ? "Yerel sunucu erişilebilir. " : ""}${status.message}`}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="ai-design-grid">
            <section className="ai-design-card ai-design-card--prompt">
              <div className="ai-card-heading"><span>01</span><div><h3>Tasarımınızı anlatın</h3><p>Bir kategori seçmek zorunda değilsiniz.</p></div></div>
              <label className="field" htmlFor="ai-design-prompt">
                <span>Serbest tasarım tarifi</span>
                <textarea
                  id="ai-design-prompt"
                  maxLength={10_000}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Örn. 40 × 60 cm ölçülerinde, abiye elbisenin ön kısmına uygun, çiçek ve yapraklardan oluşan zarif bir nakış oluştur…"
                  rows={7}
                  value={prompt}
                />
              </label>
              <div className="ai-prompt-meta"><span>İstediğiniz biçimi, yoğunluğu ve malzeme rolünü doğal dille yazabilirsiniz.</span><strong>{prompt.length.toLocaleString("tr-TR")} / 10.000</strong></div>
              <div className="ai-example-prompts" aria-label="Örnek tasarım tarifleri">
                {EXAMPLE_PROMPTS.map((example, index) => <button key={example} onClick={() => setPrompt(example)} type="button">Örnek {index + 1}</button>)}
              </div>
            </section>

            <section className="ai-design-card">
              <div className="ai-card-heading"><span>02</span><div><h3>Referans görsel</h3><p>{providerStatus.visionSupported === false ? "Bu sağlayıcı/model için görsel uyumluluğu doğrulanmadı." : "İsteğe bağlı JPEG, PNG veya WebP."}</p></div></div>
              <label className="ai-image-drop" htmlFor="ai-reference-image">
                <input
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Referans görsel seç"
                  disabled={providerStatus.visionSupported === false}
                  id="ai-reference-image"
                  onChange={(event) => void selectImage(event.target.files?.[0])}
                  ref={fileInputRef}
                  type="file"
                />
                <strong>{referenceDescriptor ? "Görseli değiştir" : "Referans görsel seç"}</strong>
                <span>En fazla 8 MB · 8.192 px kenar · 32 MP</span>
              </label>
              {referenceDescriptor ? (
                <div className="ai-image-preview">
                  {previewUrl ? <img alt="Seçilen referans görsel önizlemesi" src={previewUrl} /> : <div aria-hidden="true" className="ai-image-preview__placeholder" />}
                  <div><strong>{referenceFile?.name ?? referenceDescriptor.name}</strong><span>{imageMessage}</span><small>Henüz analiz edilmedi.</small></div>
                  <button onClick={removeImage} type="button">Görseli kaldır</button>
                </div>
              ) : <p className={imageError ? "form-message form-message--error" : "form-message"} role={imageError ? "alert" : "status"}>{imageBusy ? "Görsel doğrulanıyor…" : imageMessage}</p>}
            </section>

            <section className="ai-design-card ai-design-card--materials">
              <div className="ai-card-heading"><span>03</span><div><h3>Malzeme yetkisi</h3><p>Katalog dışına çıkılamaz.</p></div></div>
              <div className="ai-material-modes">
                {(Object.keys(MATERIAL_MODE_COPY) as AiMaterialSelectionMode[]).map((mode) => (
                  <label className={materialMode === mode ? "ai-mode-card ai-mode-card--active" : "ai-mode-card"} key={mode}>
                    <input checked={materialMode === mode} name="ai-material-mode" onChange={() => changeMaterialMode(mode)} type="radio" />
                    <span><strong>{MATERIAL_MODE_COPY[mode].title}</strong><small>{MATERIAL_MODE_COPY[mode].description}</small></span>
                  </label>
                ))}
              </div>
              {materialMode === "ai-selects" ? (
                <p className="generator-note">{activeMaterials.length} etkin katalog malzemesi aday havuzunda. Öneri daha sonra kullanıcı tarafından değiştirilebilir.</p>
              ) : (
                <div className="ai-material-checks">
                  {activeMaterials.map((material) => (
                    <label key={material.id}>
                      <input checked={selectedIds.includes(material.id)} onChange={() => toggleMaterial(material.id)} type="checkbox" />
                      <span style={{ backgroundColor: material.color }} />
                      <strong>{material.name}</strong>
                      <small>{material.widthMm} × {material.heightMm} mm</small>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <section className="ai-design-card">
              <div className="ai-card-heading"><span>04</span><div><h3>Fiziksel sınırlar</h3><p>Değerler milimetre olarak doğrulanır.</p></div></div>
              <div className="compact-input-grid">
                <label><span>Genişlik (mm)</span><input aria-label="AI hedef genişliği" inputMode="decimal" onChange={(event) => setWidth(event.target.value)} value={width} /></label>
                <label><span>Yükseklik (mm)</span><input aria-label="AI hedef yüksekliği" inputMode="decimal" onChange={(event) => setHeight(event.target.value)} value={height} /></label>
                <label><span>Minimum güvenlik aralığı</span><input aria-label="AI minimum güvenlik aralığı" inputMode="decimal" onChange={(event) => setMinimumGap(event.target.value)} value={minimumGap} /></label>
                <label><span>Hedef boncuk aralığı</span><input aria-label="AI hedef boncuk aralığı" inputMode="decimal" onChange={(event) => setTargetGap(event.target.value)} value={targetGap} /></label>
              </div>
              <label className="field generator-density" htmlFor="ai-density"><span>Tasarım yoğunluğu <strong>%{density}</strong></span><input id="ai-density" max="100" min="1" onChange={(event) => setDensity(Number(event.target.value))} type="range" value={density} /></label>
              <div className="compact-input-grid">
                <label><span>Simetri tercihi</span><select aria-label="AI simetri tercihi" onChange={(event) => setSymmetry(event.target.value as AiSymmetryPreference)} value={symmetry}><option value="optional">AI karar verebilir</option><option value="none">Simetri yok</option><option value="horizontal">Yatay</option><option value="vertical">Dikey</option><option value="four-way">Dört yönlü</option><option value="radial">Radyal</option></select></label>
                <label><span>Maksimum boncuk</span><input aria-label="AI maksimum boncuk sayısı" max="5000" min="1" onChange={(event) => setMaxPlacements(event.target.value)} type="number" value={maxPlacements} /></label>
              </div>
            </section>
          </div>

          <section className="ai-pipeline-card" aria-label="AI tasarım işleme hattı">
            <div><p className="eyebrow">Güvenli işlem hattı</p><h3>Öneri doğrudan editöre yazılmaz</h3></div>
            <ol><li>Girdi doğrulama</li><li>Sağlayıcı planı</li><li>Şema kontrolü</li><li>Geometri üretimi</li><li>Kesin doğrulama</li><li>Kullanıcı onayı</li></ol>
          </section>

          <label className="ai-consent">
            <input checked={consent} onChange={(event) => setConsent(event.target.checked)} type="checkbox" />
            <span>{CONSENT_TEXT}</span>
          </label>

          {preview ? (
            <section className="ai-preview-report" aria-label="AI tasarım planı önizleme raporu">
              <div><p className="eyebrow">Yapılandırılmış plan</p><h3>{preview.plan.description}</h3></div>
              <dl>
                <div><dt>Bileşen</dt><dd>{preview.plan.components.length}</dd></div>
                <div><dt>Düzenlenebilir boncuk</dt><dd>{preview.interpretation.placements.length}</dd></div>
                <div><dt>Reddedilen aday</dt><dd>{preview.interpretation.rejectedCandidates}</dd></div>
                <div><dt>Kullanılan malzeme</dt><dd>{new Set(preview.interpretation.placements.map((item) => item.materialId)).size}</dd></div>
              </dl>
              {preview.interpretation.unsupportedComponents.length > 0 ? <div><strong>Desteklenmeyen bileşenler</strong><ul>{preview.interpretation.unsupportedComponents.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
              {preview.interpretation.approximations.length > 0 ? <div><strong>Yaklaştırmalar</strong><ul>{preview.interpretation.approximations.map((item) => <li key={item}>{item}</li>)}</ul><label><input checked={acceptApproximations} onChange={(event) => setAcceptApproximations(event.target.checked)} type="checkbox" /> Bu geometrik yaklaştırmaları kabul ediyorum.</label></div> : null}
              {preview.interpretation.warnings.length > 0 ? <div><strong>Uyarılar</strong><ul>{preview.interpretation.warnings.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
              {preview.usage?.totalTokens !== undefined ? <p>Sağlayıcı kullanımı: {preview.usage.totalTokens.toLocaleString("tr-TR")} token. Ücret tahmini gösterilmez.</p> : null}
              <div className="ai-preview-actions">
                <label><span>Uygulama biçimi</span><select onChange={(event) => setApplyMode(event.target.value as "append" | "replace")} value={applyMode}><option value="append">Mevcut tasarıma ekle</option><option value="replace">Mevcut tasarımla değiştir</option></select></label>
                <button className="button button--primary" disabled={preview.interpretation.placements.length === 0} onClick={applyPreview} type="button">Önizlemeyi onayla ve uygula</button>
              </div>
            </section>
          ) : null}

          {issues.length > 0 ? <ul className="generator-message-list generator-message-list--error" role="alert">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
          <div className="ai-design-status" aria-live="polite"><strong>Durum</strong><span>{statusMessage}</span></div>

          <footer className="dialog__actions dialog__actions--split">
            <button className="button button--secondary" onClick={onClose} type="button">Kapat</button>
            {requestBusy ? <button className="button button--secondary" onClick={cancelRequest} type="button">İsteği iptal et</button> : null}
            <div className="ai-create-action">
              {disabledReason ? <small id="ai-create-disabled-reason">{disabledReason}</small> : null}
              <button
                aria-describedby={disabledReason ? "ai-create-disabled-reason" : undefined}
                className="button button--primary"
                disabled={imageBusy || requestBusy || !providerReady}
                type="submit"
              >Gerçek AI planı oluştur</button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
