import { describe, expect, it, vi } from "vitest";
import { AI_DESIGN_REQUEST_SCHEMA_VERSION, type AiDesignRequest } from "../domain/aiDesign";
import { cloneInitialMaterials } from "../domain/material";
import { AiHttpError, HttpAiDesignProvider } from "./httpAiDesignProvider";

const request: AiDesignRequest = {
  schemaVersion: AI_DESIGN_REQUEST_SCHEMA_VERSION,
  prompt: "Bir dal tasarla.",
  target: { widthMm: 200, heightMm: 250 },
  materialSelection: { mode: "user-only", selectedMaterialIds: ["mat-seed-bead"] },
  constraints: {
    minimumGapMm: 0.5, targetGapMm: 1, densityPercent: 70,
    symmetry: "none", maxPlacements: 100,
  },
};

describe("HTTP AI sağlayıcısı", () => {
  it("tarayıcı fetch fonksiyonunu doğru global bağlamla çağırır", async () => {
    const browserFetch = vi.fn(function (this: typeof globalThis) {
      if (this !== globalThis) throw new TypeError("Illegal invocation");
      return Promise.resolve(new Response(JSON.stringify({
        status: "ok", providerState: "ready", providerName: "OpenAI Responses API",
      }), { status: 200 }));
    }) as unknown as typeof fetch;
    vi.stubGlobal("fetch", browserFetch);
    try {
      const status = await new HttpAiDesignProvider("").getStatus();

      expect(browserFetch).toHaveBeenCalledOnce();
      expect(status).toEqual(expect.objectContaining({ state: "ready", backendReachable: true }));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("bağımlılık olarak verilen fetch fonksiyonunun mock kullanımını korur", async () => {
    const injectedFetch = vi.fn(async () => new Response(JSON.stringify({
      status: "ok", providerState: "disabled", providerName: "9Router yerel ağ geçidi",
    }), { status: 200 })) as unknown as typeof fetch;

    await new HttpAiDesignProvider("", injectedFetch).getStatuses();

    expect(injectedFetch).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({ cache: "no-store", headers: { Accept: "application/json" } }),
    );
  });

  it("sağlık durumunu hazır olarak okur", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      status: "ok", providerState: "ready", providerName: "OpenAI Responses API",
    }), { status: 200 })) as unknown as typeof fetch;
    await expect(new HttpAiDesignProvider("http://127.0.0.1:8000", fetcher).getStatus())
      .resolves.toEqual({
        id: "openai", state: "ready", providerName: "OpenAI Responses API", message: "Sağlayıcı yapılandırıldı.",
        backendReachable: true,
      });
  });

  it("anahtar taşımadan katalog ve onaylı isteği multipart gönderir", async () => {
    let sentForm: FormData | undefined;
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      sentForm = init?.body as FormData;
      return new Response(JSON.stringify({ requestId: "request-1", plan: {} }), { status: 200 });
    }) as unknown as typeof fetch;
    const result = await new HttpAiDesignProvider("http://127.0.0.1:8000/", fetcher)
      .requestPlan(request, cloneInitialMaterials(), undefined, undefined, "9router");
    expect(result.requestId).toBe("request-1");
    expect(sentForm?.get("consent")).toBe("true");
    expect(sentForm?.get("provider_id")).toBe("9router");
    const payload = String(sentForm?.get("request_json"));
    expect(payload).toContain("mat-seed-bead");
    expect(payload).not.toMatch(/OPENAI_API_KEY|sk-/);
  });

  it("iki backend sağlayıcısını ve varsayılan seçimi listeler", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      defaultProvider: "9router",
      status: "ok",
      providers: [
        { id: "openai", name: "OpenAI Responses API", state: "ready", message: "Yapılandırıldı." },
        {
          id: "9router", name: "9Router yerel ağ geçidi", state: "unverified",
          message: "Model uyumluluğu doğrulanmadı.", reachable: true, visionSupported: false,
        },
      ],
    }), { status: 200 })) as unknown as typeof fetch;
    const statuses = await new HttpAiDesignProvider("http://127.0.0.1:8000", fetcher).getStatuses();
    expect(statuses.map((status) => status.id)).toEqual(["9router", "openai"]);
    expect(statuses[0]).toEqual(expect.objectContaining({ reachable: true, state: "unverified" }));
    expect(statuses[0]?.message).toBe("9Router erişilebilir ancak model uyumluluğu henüz doğrulanmadı.");
  });

  it("HTTP 200 ve providerState disabled yanıtını bağlantı hatası saymaz", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      status: "ok",
      providerState: "disabled",
      defaultProvider: "9router",
      providers: [
        {
          id: "openai", name: "OpenAI Responses API", state: "disabled",
          message: "OpenAI çağrıları sunucu yapılandırmasında kapalı.", compatibilityVerified: false,
        },
        {
          id: "9router", name: "9Router yerel ağ geçidi", state: "disabled",
          message: "9Router AI çağrıları sunucu yapılandırmasında kapalı.",
          reachable: true, modelAvailable: true, compatibilityVerified: false, textSupported: false,
        },
      ],
    }), { status: 200 })) as unknown as typeof fetch;
    const statuses = await new HttpAiDesignProvider("", fetcher).getStatuses();
    expect(fetcher).toHaveBeenCalledWith("/api/health", expect.objectContaining({ cache: "no-store" }));
    expect(statuses[0]).toEqual(expect.objectContaining({
      id: "9router",
      state: "disabled",
      backendReachable: true,
      reachable: true,
      modelAvailable: true,
      compatibilityVerified: false,
      textSupported: false,
    }));
    expect(statuses[0]?.message).toBe("AI çağrıları sunucu ayarlarında kapalı.");
  });

  it("backend kesintisini güvenli konsol kaydıyla ayırır ve yeniden bağlanınca güncel durumu okur", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: "ok",
        providerState: "disabled",
        providerName: "9Router yerel ağ geçidi",
        defaultProvider: "9router",
        providers: [{
          id: "9router", name: "9Router yerel ağ geçidi", state: "disabled",
          message: "AI çağrıları sunucu ayarlarında kapalı.", reachable: true,
          modelAvailable: true, compatibilityVerified: false,
        }],
      }), { status: 200 })) as unknown as typeof fetch;
    const provider = new HttpAiDesignProvider("", fetcher);
    const disconnected = await provider.getStatuses();
    const reconnected = await provider.getStatuses();
    expect(disconnected.every((status) => status.backendReachable === false)).toBe(true);
    expect(reconnected[0]).toEqual(expect.objectContaining({
      id: "9router", backendReachable: true, reachable: true, state: "disabled",
    }));
    expect(consoleError).toHaveBeenCalledWith(
      "[AI sağlık] Backend bağlantısı veya sağlık sözleşmesi okunamadı.",
      expect.objectContaining({ endpoint: "/api/health", errorType: "TypeError" }),
    );
    consoleError.mockRestore();
  });

  it("sağlık kontrolünü zaman aşımında sonlandırır", async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetcher = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    })) as unknown as typeof fetch;
    try {
      const pending = new HttpAiDesignProvider("", fetcher, 60_000, 50).getStatuses();
      await vi.advanceTimersByTimeAsync(51);
      const statuses = await pending;

      expect(statuses.every((status) => status.state === "unavailable")).toBe(true);
      expect(statuses[0]?.message).toBe("AI backend sağlık kontrolü zaman aşımına uğradı.");
      expect(consoleError).toHaveBeenCalledWith(
        "[AI sağlık] Backend sağlık kontrolü zaman aşımına uğradı.",
        expect.objectContaining({ endpoint: "/api/health", timeoutMs: 50 }),
      );
    } finally {
      consoleError.mockRestore();
      vi.useRealTimers();
    }
  });

  it("sunucu hata kodunu Türkçe hata nesnesiyle korur", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      detail: { code: "AI_DISABLED", message: "AI çağrıları kapalı." },
    }), { status: 503 })) as unknown as typeof fetch;
    await expect(new HttpAiDesignProvider("http://127.0.0.1:8000", fetcher)
      .requestPlan(request, cloneInitialMaterials()))
      .rejects.toEqual(expect.objectContaining<Partial<AiHttpError>>({ code: "AI_DISABLED", status: 503 }));
  });

  it("istemci zaman aşımını sınırlı ve ayırt edilebilir hata yapar", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    })) as unknown as typeof fetch;
    const pending = new HttpAiDesignProvider("http://127.0.0.1:8000", fetcher, 50)
      .requestPlan(request, cloneInitialMaterials());
    const expectation = expect(pending).rejects.toEqual(expect.objectContaining({
      code: "CLIENT_TIMEOUT", status: 504,
    }));
    await vi.advanceTimersByTimeAsync(51);
    await expectation;
    vi.useRealTimers();
  });
});
