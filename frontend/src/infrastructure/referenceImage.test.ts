import { describe, expect, it, vi } from "vitest";
import { inspectReferenceImage, REFERENCE_IMAGE_MAX_BYTES } from "./referenceImage";

const signatures = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0],
  "image/jpeg": [0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "image/webp": [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
} as const;

function imageFile(type: keyof typeof signatures, name = "referans"): File {
  return new File([new Uint8Array(signatures[type])], name, { type });
}

describe("referans görsel güvenliği", () => {
  it.each(Object.keys(signatures) as Array<keyof typeof signatures>)("%s dosyasını imza ve çözünürlükle doğrular", async (type) => {
    const result = await inspectReferenceImage(imageFile(type), async () => ({ width: 1200, height: 800 }));
    expect(result).toMatchObject({ ok: true, descriptor: { mimeType: type, widthPx: 1200, heightPx: 800 } });
  });

  it("desteklenmeyen türü ve sahte dosya imzasını reddeder", async () => {
    expect(await inspectReferenceImage(new File(["gif"], "a.gif", { type: "image/gif" }))).toMatchObject({ ok: false });
    expect(await inspectReferenceImage(new File(["sahte"], "a.png", { type: "image/png" }))).toMatchObject({ ok: false, error: expect.stringMatching(/eşleşmiyor/) });
  });

  it("boyut ve çözünürlük güvenlik sınırlarını uygular", async () => {
    const huge = new File([new Uint8Array(REFERENCE_IMAGE_MAX_BYTES + 1)], "huge.png", { type: "image/png" });
    expect(await inspectReferenceImage(huge)).toMatchObject({ ok: false, error: expect.stringMatching(/8 MB/) });
    const result = await inspectReferenceImage(imageFile("image/png"), async () => ({ width: 9000, height: 4000 }));
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/güvenlik sınırını/) });
  });

  it("çözümlenemeyen bozuk görseli güvenle reddeder", async () => {
    const decoder = vi.fn().mockRejectedValue(new Error("decode"));
    expect(await inspectReferenceImage(imageFile("image/jpeg"), decoder)).toMatchObject({ ok: false, error: expect.stringMatching(/bozuk/) });
  });
});
