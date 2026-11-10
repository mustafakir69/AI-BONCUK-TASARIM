import type { AiDesignRequest } from "../domain/aiDesign";
import type { AiDesignProvider, AiProviderId, AiProviderResult, AiProviderStatus } from "../domain/aiProvider";
import type { Material } from "../domain/material";

interface HealthPayload {
  status?: string;
  providerState?: AiProviderStatus["state"];
  providerName?: string;
  defaultProvider?: AiProviderId;
  providers?: Array<{
    id: AiProviderId;
    name: string;
    state: AiProviderStatus["state"];
    message: string;
    modelId?: string;
    reachable?: boolean | null;
    modelAvailable?: boolean | null;
    compatibilityVerified?: boolean;
    textSupported?: boolean;
    visionSupported?: boolean;
    structuredOutput?: AiProviderStatus["structuredOutput"];
    apiMode?: AiProviderStatus["apiMode"];
  }>;
}

const PROVIDER_STATES = new Set<AiProviderStatus["state"]>([
  "ready", "disabled", "unconfigured", "unavailable", "unverified",
]);

function isProviderId(value: unknown): value is AiProviderId {
  return value === "openai" || value === "9router";
}

function isProviderState(value: unknown): value is AiProviderStatus["state"] {
  return typeof value === "string" && PROVIDER_STATES.has(value as AiProviderStatus["state"]);
}

function parseHealthPayload(value: unknown): HealthPayload {
  if (typeof value !== "object" || value === null) throw new Error("Sağlık yanıtı JSON nesnesi değil.");
  const payload = value as HealthPayload;
  if (payload.status !== "ok") throw new Error("Sağlık yanıtında status=ok bulunamadı.");
  if (payload.defaultProvider !== undefined && !isProviderId(payload.defaultProvider)) {
    throw new Error("Varsayılan sağlayıcı kimliği geçersiz.");
  }
  if (payload.providers !== undefined) {
    if (!Array.isArray(payload.providers) || payload.providers.length === 0) {
      throw new Error("Sağlayıcı durum listesi boş veya geçersiz.");
    }
    for (const item of payload.providers) {
      if (
        !isProviderId(item.id)
        || !isProviderState(item.state)
        || typeof item.name !== "string"
        || typeof item.message !== "string"
      ) {
        throw new Error("Sağlayıcı sağlık kaydı geçersiz.");
      }
    }
  } else if (!isProviderState(payload.providerState)) {
    throw new Error("Sağlayıcı durumu sağlık yanıtında bulunamadı.");
  }
  return payload;
}

interface ErrorPayload {
  detail?: { code?: string; message?: string };
}

export class AiHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

function apiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function readError(response: Response): Promise<AiHttpError> {
  let payload: ErrorPayload = {};
  try {
    payload = await response.json() as ErrorPayload;
  } catch {
    // Sunucu JSON hata gövdesi döndürmediyse güvenli genel mesaj kullanılır.
  }
  return new AiHttpError(
    payload.detail?.message ?? `AI hizmeti ${response.status} hatası döndürdü.`,
    response.status,
    payload.detail?.code ?? "HTTP_ERROR",
  );
}

function catalogPayload(materials: readonly Material[]): Array<Record<string, unknown>> {
  return materials.map((material) => ({
    id: material.id,
    name: material.name,
    shape: material.shape,
    widthMm: material.widthMm,
    heightMm: material.heightMm,
    color: material.color,
    ...(material.holeDiameterMm === undefined ? {} : { holeDiameterMm: material.holeDiameterMm }),
    active: material.active,
  }));
}

export class HttpAiDesignProvider implements AiDesignProvider {
  readonly id = "local-ai-backend";
  private readonly fetcher: typeof fetch;

  constructor(
    private readonly baseUrl: string,
    fetcher: typeof fetch = globalThis.fetch,
    private readonly timeoutMs = 60_000,
    private readonly healthTimeoutMs = 10_000,
  ) {
    // Window.fetch bir Web IDL metodudur ve bazı tarayıcılarda bağlı olduğu
    // global nesneden koparılarak çağrıldığında "Illegal invocation" üretir.
    // Enjekte edilen fetch'i de aynı güvenli bağlama alarak test çiftlerini koruruz.
    this.fetcher = fetcher.bind(globalThis);
  }

  async getStatus(signal?: AbortSignal): Promise<AiProviderStatus> {
    const statuses = await this.getStatuses(signal);
    return statuses[0] ?? {
      state: "unavailable", providerName: "Yerel AI backend",
      message: "AI sunucusunun durumu okunamadı.", backendReachable: false,
    };
  }

  async getStatuses(signal?: AbortSignal): Promise<readonly AiProviderStatus[]> {
    const controller = new AbortController();
    const timeoutReason = new DOMException("Sağlık kontrolü zaman aşımı", "TimeoutError");
    const timeout = setTimeout(() => controller.abort(timeoutReason), this.healthTimeoutMs);
    const cancel = () => controller.abort(signal?.reason);
    if (signal?.aborted) cancel();
    else signal?.addEventListener("abort", cancel, { once: true });
    try {
      const response = await this.fetcher(apiUrl(this.baseUrl, "/api/health"), {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) {
        console.error("[AI sağlık] Backend sağlık kontrolü HTTP hatası.", {
          endpoint: "/api/health",
          status: response.status,
        });
        return unavailableStatuses("AI backend sağlık kontrolü başarısız oldu.");
      }
      const payload = parseHealthPayload(await response.json());
      if (payload.providers?.length) {
        const statuses = payload.providers.map((item): AiProviderStatus => ({
          id: item.id,
          state: item.state,
          providerName: item.name,
          message: item.state === "disabled"
            ? "AI çağrıları sunucu ayarlarında kapalı."
            : (item.id === "9router" && item.state === "unverified"
              ? "9Router erişilebilir ancak model uyumluluğu henüz doğrulanmadı."
              : item.message),
          backendReachable: true,
          ...(item.modelId ? { modelId: item.modelId } : {}),
          ...(typeof item.reachable === "boolean" ? { reachable: item.reachable } : {}),
          ...(typeof item.modelAvailable === "boolean" ? { modelAvailable: item.modelAvailable } : {}),
          ...(item.compatibilityVerified === undefined ? {} : { compatibilityVerified: item.compatibilityVerified }),
          ...(item.textSupported === undefined ? {} : { textSupported: item.textSupported }),
          ...(item.visionSupported === undefined ? {} : { visionSupported: item.visionSupported }),
          ...(item.structuredOutput === undefined ? {} : { structuredOutput: item.structuredOutput }),
          ...(item.apiMode === undefined ? {} : { apiMode: item.apiMode }),
        }));
        return statuses.sort((left, right) => Number(right.id === payload.defaultProvider) - Number(left.id === payload.defaultProvider));
      }
      if (payload.providerState === "ready") {
        return [{
          id: "openai", state: "ready", providerName: payload.providerName ?? "OpenAI Responses API",
          message: "Sağlayıcı yapılandırıldı.", backendReachable: true,
        }];
      }
      if (payload.providerState === "disabled") {
        return [{
          id: "openai", state: "disabled", providerName: payload.providerName ?? "AI sağlayıcısı",
          message: "AI çağrıları sunucu ayarlarında kapalı.", backendReachable: true,
        }];
      }
      return [{
        id: "openai", state: payload.providerState ?? "unconfigured",
        providerName: payload.providerName ?? "AI sağlayıcısı",
        message: "AI anahtarı veya model sunucuda yapılandırılmamış.", backendReachable: true,
      }];
    } catch (error) {
      if (signal?.aborted) throw error;
      if (controller.signal.reason === timeoutReason) {
        console.error("[AI sağlık] Backend sağlık kontrolü zaman aşımına uğradı.", {
          endpoint: "/api/health",
          timeoutMs: this.healthTimeoutMs,
        });
        return unavailableStatuses("AI backend sağlık kontrolü zaman aşımına uğradı.");
      }
      console.error("[AI sağlık] Backend bağlantısı veya sağlık sözleşmesi okunamadı.", {
        endpoint: "/api/health",
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
      return unavailableStatuses("Yerel AI sunucusuna ulaşılamadı.");
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", cancel);
    }
  }

  async requestPlan(
    request: AiDesignRequest,
    catalog: readonly Material[],
    referenceImage?: Blob,
    signal?: AbortSignal,
    providerId?: AiProviderId,
  ): Promise<AiProviderResult> {
    const requestId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const form = new FormData();
    form.set("request_id", requestId);
    form.set("consent", "true");
    if (providerId) form.set("provider_id", providerId);
    form.set("request_json", JSON.stringify({ ...request, catalog: catalogPayload(catalog) }));
    if (referenceImage) form.set("reference_image", referenceImage, request.referenceImage?.name ?? "referans.jpg");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new DOMException("İstek zaman aşımı", "TimeoutError")), this.timeoutMs);
    const cancel = () => controller.abort(signal?.reason);
    if (signal?.aborted) cancel();
    else signal?.addEventListener("abort", cancel, { once: true });
    try {
      const response = await this.fetcher(apiUrl(this.baseUrl, "/api/ai/design"), {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      if (!response.ok) throw await readError(response);
      return await response.json() as AiProviderResult;
    } catch (error) {
      if (controller.signal.reason instanceof DOMException && controller.signal.reason.name === "TimeoutError") {
        throw new AiHttpError("AI isteği zaman aşımına uğradı.", 504, "CLIENT_TIMEOUT");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", cancel);
    }
  }
}

function unavailableStatuses(message: string): AiProviderStatus[] {
  return [
    { id: "openai", state: "unavailable", providerName: "OpenAI API", message, backendReachable: false },
    {
      id: "9router", state: "unavailable", providerName: "9Router yerel ağ geçidi",
      message, backendReachable: false,
    },
  ];
}

export const aiDesignProvider = new HttpAiDesignProvider(
  import.meta.env.VITE_AI_API_BASE_URL?.trim() ?? "",
);

