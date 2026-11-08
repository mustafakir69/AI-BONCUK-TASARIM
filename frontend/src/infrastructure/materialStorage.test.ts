import { describe, expect, it } from "vitest";
import { createMaterial, type MaterialDraft } from "../domain/material";
import {
  MATERIAL_STORAGE_KEY,
  loadMaterials,
  saveMaterials,
  type StorageAdapter,
} from "./materialStorage";

class MemoryStorage implements StorageAdapter {
  private readonly records = new Map<string, string>();

  getItem(key: string): string | null {
    return this.records.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.records.set(key, value);
  }
}

const draft: MaterialDraft = {
  name: "Yerel inci",
  shape: "circle",
  widthMm: 6.5,
  heightMm: 6.5,
  color: "#EFEADF",
};

describe("malzeme yerel saklama servisi", () => {
  it("kaydedilen kataloğu sayfa yenilemesini temsil eden yeni okumada geri yükler", () => {
    const storage = new MemoryStorage();
    const material = createMaterial(draft, "mat-local", "2026-11-08T10:00:00.000Z");

    expect(saveMaterials(storage, [material])).toEqual({ saved: true });
    expect(loadMaterials(storage)).toEqual({ materials: [material] });
  });

  it("bozuk JSON kaydında çökmeden başlangıç kataloğuna döner", () => {
    const storage = new MemoryStorage();
    storage.setItem(MATERIAL_STORAGE_KEY, "{bozuk-json");

    const result = loadMaterials(storage);

    expect(result.materials).toHaveLength(4);
    expect(result.warning).toContain("Bozuk");
  });

  it("geçersiz ve yinelenen kayıtları güvenli biçimde atlar", () => {
    const storage = new MemoryStorage();
    const material = createMaterial(draft, "mat-valid", "2026-11-08T10:00:00.000Z");
    storage.setItem(
      MATERIAL_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: "1.0",
        materials: [
          material,
          material,
          {
            ...material,
            id: "mat-wrong-type",
            name: 42,
          },
        ],
      }),
    );

    const result = loadMaterials(storage);

    expect(result.materials).toEqual([material]);
    expect(result.warning).toContain("atlandı");
  });
});

