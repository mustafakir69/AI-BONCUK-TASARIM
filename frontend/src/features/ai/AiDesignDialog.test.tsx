import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AiDesignProvider, AiProviderResult } from "../../domain/aiProvider";
import { cloneInitialMaterials } from "../../domain/material";
import type { Placement } from "../../domain/placement";
import type { ReferenceImageInspection } from "../../infrastructure/referenceImage";
import { AiDesignDialog } from "./AiDesignDialog";

const CONSENT = "Yazdığınız tasarım tarifi ve seçtiğiniz referans görsel, tasarımın oluşturulması amacıyla seçtiğiniz yapay zekâ sağlayıcısına gönderilecektir.";

function plan() {
  return {
    schemaVersion: "1.0", description: "Düzenlenebilir dal",
    target: { widthMm: 400, heightMm: 600 }, materialIds: ["mat-seed-bead"],
    components: [{
      id: "dal", kind: "path", label: "Ana dal", centerXmm: 0, centerYmm: 0,
      widthMm: 100, heightMm: 10, rotationDeg: 0, layer: 0, priority: 10,
      geometry: {
        type: "line", points: [{ xMm: -50, yMm: 0 }, { xMm: 50, yMm: 0 }],
        closed: false, interpretationNote: "Düz dal",
      },
      placement: {
        strategy: "follow-path", materialIds: ["mat-seed-bead"], targetGapMm: 1,
        densityPercent: 70, maxPlacements: 10,
      },
    }],
    densityRegions: [], symmetry: { type: "none" }, placementInstructions: [], warnings: [], uncertainties: [],
  };
}

function readyProvider(requestPlan?: AiDesignProvider["requestPlan"]): AiDesignProvider {
  return {
    id: "test-provider",
    getStatus: vi.fn(async () => ({
      id: "openai" as const,
      state: "ready" as const,
      providerName: "Test Responses API",
      message: "Test sağlayıcısı hazır.",
      visionSupported: true,
    })),
    requestPlan: requestPlan ?? vi.fn(async () => ({ requestId: "request-1", plan: plan() })),
  };
}

function renderDialog(options: {
  inspectImage?: (file: File) => Promise<ReferenceImageInspection>;
  provider?: AiDesignProvider;
  onApply?: (placements: readonly Placement[], mode: "append" | "replace") => boolean;
  onPreview?: (placements: readonly Placement[]) => void;
  strictMode?: boolean;
} = {}) {
  const onClose = vi.fn();
  const onRequestValidated = vi.fn();
  const onApply: (placements: readonly Placement[], mode: "append" | "replace") => boolean =
    options.onApply ?? vi.fn(() => true);
  const onPreview: (placements: readonly Placement[]) => void = options.onPreview ?? vi.fn();
  const provider = options.provider ?? readyProvider();
  const dialog = (previewHandler: (placements: readonly Placement[]) => void) => (
    <AiDesignDialog
      inspectImage={options.inspectImage}
      materials={cloneInitialMaterials()}
      motif={{ widthMm: 400, heightMm: 600 }}
      onApply={onApply}
      onClose={onClose}
      onPreview={previewHandler}
      onRequestValidated={onRequestValidated}
      projectMinimumGapMm={0.5}
      provider={provider}
    />
  );
  const element = (previewHandler: (placements: readonly Placement[]) => void) => options.strictMode
    ? <StrictMode>{dialog(previewHandler)}</StrictMode>
    : dialog(previewHandler);
  const view = render(element(onPreview));
  return {
    onApply, onClose, onPreview, onRequestValidated, provider,
    rerenderDialog: (previewHandler = onPreview) => view.rerender(element(previewHandler)),
    unmount: view.unmount,
  };
}

async function enterPromptAndConsent(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText("Serbest tasarım tarifi"), "Abiye elbise için akışkan bir dal tasarla.");
  await user.click(screen.getByRole("checkbox", { name: CONSENT }));
}

describe("Yapay Zekâ ile Tasarla penceresi", () => {
  it("açılışta tek sağlık kontrolü yapar; state ve parent yeniden render'ı yeni istek başlatmaz", async () => {
    const getStatuses = vi.fn(async () => [
      {
        id: "openai" as const, state: "ready" as const, providerName: "OpenAI API",
        message: "OpenAI hazır.", backendReachable: true, compatibilityVerified: true,
      },
      {
        id: "9router" as const, state: "unverified" as const, providerName: "9Router yerel ağ geçidi",
        message: "9Router erişilebilir ancak model uyumluluğu henüz doğrulanmadı.",
        backendReachable: true, reachable: true, modelAvailable: true, compatibilityVerified: false,
      },
    ]);
    const provider = readyProvider();
    provider.getStatuses = getStatuses;
    const { rerenderDialog } = renderDialog({ provider });

    expect(await screen.findByRole("radio", { name: /OpenAI API/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /9Router yerel ağ geçidi/ })).toBeInTheDocument();
    expect(screen.queryByText(/Backend sağlık durumu kontrol ediliyor/)).not.toBeInTheDocument();
    expect(getStatuses).toHaveBeenCalledOnce();

    rerenderDialog(vi.fn());
    await Promise.resolve();
    expect(getStatuses).toHaveBeenCalledOnce();
  });

  it("pencere kapanınca bekleyen sağlık isteğini iptal eder ve geç yanıtı uygulamaz", async () => {
    let healthSignal: AbortSignal | undefined;
    let resolveHealth!: (statuses: readonly []) => void;
    const provider = readyProvider();
    provider.getStatuses = vi.fn((signal?: AbortSignal) => {
      healthSignal = signal;
      return new Promise<readonly []>((resolve) => { resolveHealth = resolve; });
    });
    const { unmount } = renderDialog({ provider });

    expect(screen.getByText(/Backend sağlık durumu kontrol ediliyor/)).toBeInTheDocument();
    await waitFor(() => expect(provider.getStatuses).toHaveBeenCalledOnce());
    unmount();
    expect(healthSignal?.aborted).toBe(true);
    resolveHealth([]);
    await Promise.resolve();
    expect(provider.getStatuses).toHaveBeenCalledOnce();
  });

  it("React StrictMode effect tekrarında yalnız tek sağlık kontrolüyle yüklemeyi bitirir", async () => {
    const provider = readyProvider();
    provider.getStatuses = vi.fn(async () => [{
      id: "9router" as const, state: "unverified" as const, providerName: "9Router yerel ağ geçidi",
      message: "9Router erişilebilir ancak model uyumluluğu henüz doğrulanmadı.",
      backendReachable: true, reachable: true, modelAvailable: true, compatibilityVerified: false,
    }]);
    const { rerenderDialog } = renderDialog({ provider, strictMode: true });

    expect(await screen.findByRole("radio", { name: /9Router yerel ağ geçidi/ })).toBeInTheDocument();
    expect(screen.queryByText(/Backend sağlık durumu kontrol ediliyor/)).not.toBeInTheDocument();
    expect(provider.getStatuses).toHaveBeenCalledOnce();
    rerenderDialog(vi.fn());
    await Promise.resolve();
    expect(provider.getStatuses).toHaveBeenCalledOnce();
  });

  it("backend durum isteği reddedildiğinde loading'i kapatır ve erişim hatasını gösterir", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const provider = readyProvider();
    provider.getStatuses = vi.fn(async () => { throw new TypeError("Failed to fetch"); });
    try {
      renderDialog({ provider });

      expect((await screen.findAllByText("Yerel AI sunucusuna ulaşılamadı.")).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Backend sağlık durumu kontrol ediliyor/)).not.toBeInTheDocument();
      expect(screen.getAllByText(/Backend erişilemiyor/).length).toBeGreaterThan(0);
      expect(consoleError).toHaveBeenCalledWith(
        "[AI sağlık] Sağlayıcı durum isteği tamamlanamadı.",
        { errorType: "TypeError" },
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("açık onay olmadan sağlayıcıyı çağırmaz", async () => {
    const user = userEvent.setup();
    const requestPlan = vi.fn();
    renderDialog({ provider: readyProvider(requestPlan) });
    await user.type(screen.getByLabelText("Serbest tasarım tarifi"), "Bir dal tasarla.");
    await waitFor(() => expect(screen.getByRole("button", { name: "Gerçek AI planı oluştur" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Gerçek AI planı oluştur" }));
    expect(requestPlan).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("açıkça onaylayın");
  });

  it("planı doğrular, geçici önizler ve uygulama onayı bekler", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn(() => true);
    const onPreview = vi.fn();
    const { provider } = renderDialog({ onApply, onPreview });
    await enterPromptAndConsent(user);
    await user.click(await screen.findByRole("button", { name: "Gerçek AI planı oluştur" }));
    expect(await screen.findByText("Düzenlenebilir dal")).toBeInTheDocument();
    expect(provider.requestPlan).toHaveBeenCalledOnce();
    expect(onPreview).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ materialId: "mat-seed-bead" }),
    ]));
    expect(onApply).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Önizlemeyi onayla ve uygula" }));
    expect(onApply).toHaveBeenCalledOnce();
  });

  it("referans görseli yalnız açık onaydan sonra sağlayıcıya gönderir", async () => {
    const user = userEvent.setup();
    const requestPlan = vi.fn(async () => ({ requestId: "request-1", plan: plan() }));
    const inspectImage = vi.fn(async (file: File): Promise<ReferenceImageInspection> => ({
      ok: true,
      descriptor: { name: file.name, mimeType: "image/png", sizeBytes: file.size, widthPx: 640, heightPx: 480 },
    }));
    renderDialog({ inspectImage, provider: readyProvider(requestPlan) });
    const file = new File([new Uint8Array([137, 80, 78, 71])], "cicek.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Referans görsel seç"), file);
    await user.type(screen.getByLabelText("Serbest tasarım tarifi"), "Görseli yorumla.");
    await user.click(await screen.findByRole("button", { name: "Gerçek AI planı oluştur" }));
    expect(requestPlan).not.toHaveBeenCalled();
    await user.click(screen.getByRole("checkbox", { name: CONSENT }));
    await user.click(screen.getByRole("button", { name: "Gerçek AI planı oluştur" }));
    await waitFor(() => expect(requestPlan).toHaveBeenCalledWith(
      expect.anything(), expect.anything(), file, expect.any(AbortSignal), "openai",
    ));
  });

  it("yinelenen gönderimi engeller ve iptal sinyalini iletir", async () => {
    const user = userEvent.setup();
    let capturedSignal: AbortSignal | undefined;
    const requestPlan = vi.fn((_request, _catalog, _image, signal?: AbortSignal) => {
      capturedSignal = signal;
      return new Promise<never>(() => undefined);
    });
    renderDialog({ provider: readyProvider(requestPlan) });
    await enterPromptAndConsent(user);
    await user.click(await screen.findByRole("button", { name: "Gerçek AI planı oluştur" }));
    expect(requestPlan).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Gerçek AI planı oluştur" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "İsteği iptal et" }));
    expect(capturedSignal?.aborted).toBe(true);
    expect(screen.getByText(/İstek iptal edildi/)).toBeInTheDocument();
  });

  it("iptalden sonra gelen eski yanıtı önizlemeye almaz", async () => {
    const user = userEvent.setup();
    let resolveRequest!: (value: AiProviderResult) => void;
    const requestPlan: AiDesignProvider["requestPlan"] = vi.fn(() => new Promise<AiProviderResult>((resolve) => {
      resolveRequest = resolve;
    }));
    const onPreview = vi.fn();
    renderDialog({ provider: readyProvider(requestPlan), onPreview });
    await enterPromptAndConsent(user);
    await user.click(await screen.findByRole("button", { name: "Gerçek AI planı oluştur" }));
    await user.click(screen.getByRole("button", { name: "İsteği iptal et" }));
    resolveRequest({ requestId: "late-request", plan: plan() });
    await Promise.resolve();
    expect(screen.queryByText("Düzenlenebilir dal")).not.toBeInTheDocument();
    expect(onPreview).not.toHaveBeenCalledWith(expect.arrayContaining([expect.anything()]));
  });

  it("bozuk sağlayıcı planını reddeder ve projeye uygulama sunmaz", async () => {
    const user = userEvent.setup();
    const requestPlan = vi.fn(async () => ({ requestId: "bad", plan: { schemaVersion: "1.0" } }));
    const onApply = vi.fn(() => true);
    renderDialog({ provider: readyProvider(requestPlan), onApply });
    await enterPromptAndConsent(user);
    await user.click(await screen.findByRole("button", { name: "Gerçek AI planı oluştur" }));
    expect(await screen.findByText(/sözleşmesini geçemedi/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Önizlemeyi onayla ve uygula" })).not.toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("üç malzeme seçim modunu korur", async () => {
    const user = userEvent.setup();
    renderDialog();
    expect(screen.getByRole("radio", { name: /Malzemeleri ben seçeyim/ })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /Yapay zekâ seçsin/ }));
    expect(screen.getByText(/4 etkin katalog malzemesi aday havuzunda/)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Birlikte seçelim/ }));
    expect(screen.getByRole("checkbox", { name: /Kum boncuk/ })).toBeChecked();
  });

  it("geçersiz ölçüyü sağlayıcı çağrısından önce reddeder", async () => {
    const user = userEvent.setup();
    const requestPlan = vi.fn();
    renderDialog({ provider: readyProvider(requestPlan) });
    await enterPromptAndConsent(user);
    await user.clear(screen.getByLabelText("AI hedef genişliği"));
    await user.type(screen.getByLabelText("AI hedef genişliği"), "0");
    await user.click(await screen.findByRole("button", { name: "Gerçek AI planı oluştur" }));
    expect(requestPlan).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Hedef genişlik ve yükseklik");
  });

  it("9Router uyumluluğu doğrulanmadığında hazır veya görsel destekli göstermez", async () => {
    const user = userEvent.setup();
    const provider = readyProvider();
    provider.getStatuses = vi.fn(async () => [
      {
        id: "9router" as const,
        state: "unverified" as const,
        providerName: "9Router yerel ağ geçidi",
        message: "9Router erişilebilir ancak model uyumluluğu henüz doğrulanmadı.",
        backendReachable: true,
        reachable: true,
        modelAvailable: true,
        compatibilityVerified: false,
        visionSupported: false,
      },
      {
        id: "openai" as const,
        state: "ready" as const,
        providerName: "OpenAI Responses API",
        message: "OpenAI yapılandırıldı.",
        backendReachable: true,
        compatibilityVerified: true,
        visionSupported: true,
      },
    ]);
    renderDialog({ provider });
    expect((await screen.findAllByText("9Router erişilebilir ancak model uyumluluğu henüz doğrulanmadı.")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Gerçek AI planı oluştur" })).toBeDisabled();
    expect(screen.getByLabelText("Referans görsel seç")).toBeDisabled();
    expect(screen.getByText(/Model katalogda mevcut/)).toBeInTheDocument();
    expect(screen.getByText(/ayrı ve açık onaylı 9Router canlı metin\/JSON uyumluluk testi/)).toBeInTheDocument();
    expect(screen.getByText(/NINEROUTER_MODEL_COMPATIBILITY_VERIFIED=true/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /9Router yerel ağ geçidi/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /OpenAI Responses API/ })).not.toBeChecked();
    await user.click(screen.getByRole("radio", { name: /OpenAI Responses API/ }));
    expect(screen.getByRole("radio", { name: /9Router yerel ağ geçidi/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /OpenAI Responses API/ })).toBeChecked();
    expect(screen.getByText("OpenAI yapılandırıldı.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerçek AI planı oluştur" })).toBeEnabled();
    expect(screen.getByLabelText("Referans görsel seç")).toBeEnabled();
    expect(provider.getStatuses).toHaveBeenCalledOnce();
  });

  it("backend yeniden bağlandığında durum yenilemeyle erişim ve kapalı çağrı mesajını günceller", async () => {
    const user = userEvent.setup();
    const getStatuses = vi.fn()
      .mockResolvedValueOnce([
        {
          id: "9router" as const, state: "unavailable" as const,
          providerName: "9Router yerel ağ geçidi", message: "Yerel AI sunucusuna ulaşılamadı.",
          backendReachable: false,
        },
        {
          id: "openai" as const, state: "unavailable" as const,
          providerName: "OpenAI API", message: "Yerel AI sunucusuna ulaşılamadı.",
          backendReachable: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "9router" as const, state: "disabled" as const,
          providerName: "9Router yerel ağ geçidi",
          message: "9Router AI çağrıları sunucu ayarlarında kapalı.",
          backendReachable: true, reachable: true, modelAvailable: true,
          compatibilityVerified: false, textSupported: false,
        },
        {
          id: "openai" as const, state: "disabled" as const,
          providerName: "OpenAI Responses API",
          message: "OpenAI çağrıları sunucu ayarlarında kapalı.",
          backendReachable: true, compatibilityVerified: false,
        },
      ]);
    const provider = readyProvider();
    provider.getStatuses = getStatuses;
    renderDialog({ provider });
    expect((await screen.findAllByText("Yerel AI sunucusuna ulaşılamadı.")).length).toBeGreaterThan(0);
    expect(screen.getByText(/yerel FastAPI backend çalışır/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Durumu yenile" }));
    expect(await screen.findByText("9Router AI çağrıları sunucu ayarlarında kapalı.")).toBeInTheDocument();
    expect(screen.getByText(/Backend hazır.*9Router erişilebilir.*Model katalogda mevcut/s)).toBeInTheDocument();
    expect(screen.getByText(/AI_CALLS_ENABLED otomatik olarak değiştirilmez/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerçek AI planı oluştur" })).toBeDisabled();
    expect(getStatuses).toHaveBeenCalledTimes(2);
  });
});
