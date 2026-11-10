import { describe, expect, it } from "vitest";
import type { UserConfig } from "vite";
import viteConfig from "../../vite.config";

describe("Vite backend proxy yapılandırması", () => {
  it("aynı-origin /api isteklerini yerel FastAPI sunucusuna yönlendirir", () => {
    const config = viteConfig as UserConfig;
    const proxy = config.server?.proxy as Record<string, { target?: string; changeOrigin?: boolean }>;
    expect(proxy["/api"]).toEqual(expect.objectContaining({
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
    }));
  });
});
