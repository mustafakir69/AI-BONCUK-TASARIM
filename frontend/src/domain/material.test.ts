import { describe, expect, it } from "vitest";
import {
  INITIAL_MATERIALS,
  createMaterial,
  createMaterialId,
  removeMaterial,
  updateMaterial,
  validateMaterialDraft,
  type MaterialDraft,
} from "./material";

const validRectangle: MaterialDraft = {
  name: "Yeni boru",
  shape: "rectangle",
  widthMm: 2.5,
  heightMm: 4,
  color: "#123ABC",
};

describe("malzeme alan modeli", () => {
  it("yeni malzemeyi benzersiz kimliği ve mm ölçüleriyle oluşturur", () => {
    const material = createMaterial(validRectangle, "mat-new", "2026-11-08T10:00:00.000Z");

    expect(material).toMatchObject({
      id: "mat-new",
      name: "Yeni boru",
      widthMm: 2.5,
      heightMm: 4,
      active: true,
    });
  });

  it("malzemeyi düzenlerken kimlik ve oluşturulma zamanını korur", () => {
    const original = createMaterial(validRectangle, "mat-fixed", "2026-11-08T10:00:00.000Z");
    const updated = updateMaterial(
      original,
      { ...validRectangle, name: "Güncel boru", color: "#AA1122" },
      "2026-11-08T11:00:00.000Z",
    );

    expect(updated.id).toBe(original.id);
    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.updatedAt).toBe("2026-11-08T11:00:00.000Z");
    expect(updated.name).toBe("Güncel boru");
  });

  it("kullanılmayan malzemeyi siler, kullanılan malzemeyi korur", () => {
    const removed = removeMaterial(INITIAL_MATERIALS, "mat-pearl", 0);
    const blocked = removeMaterial(INITIAL_MATERIALS, "mat-pearl", 3);

    expect(removed.removed).toBe(true);
    expect(removed.materials.some((item) => item.id === "mat-pearl")).toBe(false);
    expect(blocked).toMatchObject({ removed: false, reason: "MATERIAL_IN_USE" });
  });

  it("sıfır, negatif ve sonlu olmayan ölçüleri reddeder", () => {
    expect(validateMaterialDraft({ ...validRectangle, widthMm: 0 }).widthMm).toBeDefined();
    expect(validateMaterialDraft({ ...validRectangle, heightMm: -2 }).heightMm).toBeDefined();
    expect(validateMaterialDraft({ ...validRectangle, widthMm: Number.NaN }).widthMm).toBeDefined();
  });

  it("dairede genişlik ve yüksekliği aynı çap olarak doğrular", () => {
    const invalid = validateMaterialDraft({
      ...validRectangle,
      shape: "circle",
      widthMm: 4,
      heightMm: 3.9,
    });
    const valid = validateMaterialDraft({ ...validRectangle, shape: "circle", widthMm: 4, heightMm: 4 });

    expect(invalid.heightMm).toContain("Daire çapı");
    expect(valid).toEqual({});
  });

  it("pul deliğinin pozitif ve dış çaptan küçük olmasını zorunlu kılar", () => {
    const baseRing: MaterialDraft = {
      ...validRectangle,
      shape: "ring",
      widthMm: 5,
      heightMm: 5,
    };

    expect(validateMaterialDraft({ ...baseRing, holeDiameterMm: 0 }).holeDiameterMm).toBeDefined();
    expect(validateMaterialDraft({ ...baseRing, holeDiameterMm: 5 }).holeDiameterMm).toContain("küçük");
    expect(validateMaterialDraft({ ...baseRing, holeDiameterMm: 1.5 })).toEqual({});
  });

  it("aynı adla oluşturulan malzemeleri farklı kimliklerle saklayabilir", () => {
    const ids = new Set<string>();
    const firstId = createMaterialId(ids);
    ids.add(firstId);
    const secondId = createMaterialId(ids);
    const first = createMaterial(validRectangle, firstId);
    const second = createMaterial(validRectangle, secondId);

    expect(first.name).toBe(second.name);
    expect(first.id).not.toBe(second.id);
  });
});

