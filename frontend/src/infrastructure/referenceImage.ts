import type { AiReferenceImageDescriptor } from "../domain/aiDesign";

export const REFERENCE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const REFERENCE_IMAGE_MAX_EDGE_PX = 8_192;
export const REFERENCE_IMAGE_MAX_PIXELS = 32_000_000;
export const REFERENCE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ReferenceImageInspection =
  | { ok: true; descriptor: AiReferenceImageDescriptor }
  | { ok: false; error: string };

type SupportedImageType = (typeof REFERENCE_IMAGE_TYPES)[number];

function hasExpectedSignature(bytes: Uint8Array, type: SupportedImageType): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

async function defaultReadDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel çözümlenemedi."));
    };
    image.src = url;
  });
}

export async function inspectReferenceImage(
  file: File,
  readDimensions: (file: File) => Promise<{ width: number; height: number }> = defaultReadDimensions,
): Promise<ReferenceImageInspection> {
  if (!REFERENCE_IMAGE_TYPES.includes(file.type as SupportedImageType)) {
    return { ok: false, error: "Yalnız JPEG, PNG veya WebP görselleri desteklenir." };
  }
  if (file.size <= 0 || file.size > REFERENCE_IMAGE_MAX_BYTES) {
    return { ok: false, error: "Görsel boş olamaz ve en fazla 8 MB olabilir." };
  }
  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!hasExpectedSignature(header, file.type as SupportedImageType)) {
      return { ok: false, error: "Dosya içeriği bildirilen görsel formatıyla eşleşmiyor." };
    }
    const { width, height } = await readDimensions(file);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      return { ok: false, error: "Görsel çözünürlüğü okunamadı." };
    }
    if (width > REFERENCE_IMAGE_MAX_EDGE_PX || height > REFERENCE_IMAGE_MAX_EDGE_PX || width * height > REFERENCE_IMAGE_MAX_PIXELS) {
      return { ok: false, error: "Görsel çözünürlüğü güvenlik sınırını aşıyor (8.192 px kenar / 32 MP)." };
    }
    return {
      ok: true,
      descriptor: {
        name: file.name.slice(0, 255) || "referans-gorsel",
        mimeType: file.type as SupportedImageType,
        sizeBytes: file.size,
        widthPx: width,
        heightPx: height,
      },
    };
  } catch {
    return { ok: false, error: "Görsel bozuk veya tarayıcı tarafından çözümlenemiyor." };
  }
}
