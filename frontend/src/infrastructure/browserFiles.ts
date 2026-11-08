export const MAX_PROJECT_FILE_BYTES = 10 * 1024 * 1024;

export async function readTextFile(file: File): Promise<string> {
  if (file.size > MAX_PROJECT_FILE_BYTES) {
    throw new Error("Proje dosyası 10 MB sınırını aşıyor.");
  }
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsText(file, "UTF-8");
  });
}

export function safeFilename(name: string): string {
  const normalized = name.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ");
  return normalized || "isimsiz-tasarim";
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadText(text: string, filename: string, mimeType: string): void {
  downloadBlob(new Blob([text], { type: `${mimeType};charset=utf-8` }), filename);
}
