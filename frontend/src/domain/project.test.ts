import { describe, expect, it } from "vitest";
import { INITIAL_MATERIALS } from "./material";
import {
  createProjectDocument,
  parseProjectJson,
  projectContentFingerprint,
  resolveProjectImport,
  serializeProject,
  type DesignProject,
} from "./project";

const metadata = {
  id: "project-test", name: "Test tasarımı",
  createdAt: "2026-11-08T10:00:00.000Z", updatedAt: "2026-11-08T11:00:00.000Z",
};

function project(placements = [
  { id: "p1", materialId: "mat-bugle-bead", xMm: -12.5, yMm: 8, rotationDeg: 45 },
]): DesignProject {
  return createProjectDocument(metadata, {
    motif: { widthMm: 200, heightMm: 250 }, minimumGapMm: 0,
    keyboardStepMm: 0.5, keyboardShiftStepMm: 5,
    materials: INITIAL_MATERIALS, placements, groups: [],
  });
}

describe("sürümlü proje dosyası", () => {
  it("kaydet-aç turunda proje içeriğini kayıpsız korur", () => {
    const original = project();
    const parsed = parseProjectJson(serializeProject(original));
    expect(parsed).toEqual({ ok: true, project: original });
  });

  it("negatif koordinat ve dönüş açısını korur", () => {
    const parsed = parseProjectJson(serializeProject(project()));
    expect(parsed.ok && parsed.project.placements[0]).toMatchObject({ xMm: -12.5, yMm: 8, rotationDeg: 45 });
  });

  it("yalnız kullanılan katalog kayıtlarını dosyaya alır", () => {
    const value = project();
    expect(value.materials.map((item) => item.id)).toEqual(["mat-bugle-bead"]);
  });

  it("bozuk JSON'u Türkçe hatayla reddeder", () => {
    expect(parseProjectJson("{bozuk")).toEqual({ ok: false, error: "Dosya geçerli JSON biçiminde değil." });
  });

  it("desteklenmeyen sürümü reddeder", () => {
    const value = { ...project(), schemaVersion: "9.0" };
    expect(parseProjectJson(JSON.stringify(value))).toMatchObject({ ok: false });
  });

  it("eksik malzeme başvurusunu reddeder", () => {
    const value = project();
    value.placements[0]!.materialId = "mat-yok";
    expect(parseProjectJson(JSON.stringify(value))).toMatchObject({ ok: false, error: expect.stringContaining("bulunamadı") });
  });

  it("çakışan yerleşimleri reddeder", () => {
    const value = createProjectDocument(metadata, {
      motif: { widthMm: 200, heightMm: 250 }, minimumGapMm: 0,
      keyboardStepMm: 0.5, keyboardShiftStepMm: 5, groups: [],
      materials: INITIAL_MATERIALS,
      placements: [
        { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
        { id: "p2", materialId: "mat-pearl", xMm: 1, yMm: 0, rotationDeg: 0 },
      ],
    });
    expect(parseProjectJson(JSON.stringify(value))).toEqual({ ok: false, error: "Proje çakışan yerleşimler içeriyor." });
  });

  it("minimum aralık ihlalini reddeder", () => {
    const value = createProjectDocument(metadata, {
      motif: { widthMm: 200, heightMm: 250 }, minimumGapMm: 2,
      keyboardStepMm: 0.5, keyboardShiftStepMm: 5, groups: [],
      materials: INITIAL_MATERIALS,
      placements: [
        { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
        { id: "p2", materialId: "mat-pearl", xMm: 5, yMm: 0, rotationDeg: 0 },
      ],
    });
    expect(parseProjectJson(JSON.stringify(value))).toEqual({ ok: false, error: "Proje minimum malzeme aralığını ihlal ediyor." });
  });

  it("yerel aynı ID farklı tanımında yerel kaydı ezmeden güvenli eşler", () => {
    const incoming = project();
    const local = [{ ...incoming.materials[0]!, name: "Yerel farklı boru", widthMm: 3 }];
    const resolved = resolveProjectImport(incoming, local);
    expect(resolved.conflictCount).toBe(1);
    expect(resolved.catalog[0]?.name).toBe("Yerel farklı boru");
    expect(resolved.project.materials[0]?.id).toBe("mat-bugle-bead-proje");
    expect(resolved.project.placements[0]?.materialId).toBe("mat-bugle-bead-proje");
  });

  it("aynı tanımlı yerel kaydı çoğaltmadan kullanır", () => {
    const incoming = project();
    const resolved = resolveProjectImport(incoming, incoming.materials);
    expect(resolved.conflictCount).toBe(0);
    expect(resolved.catalog).toHaveLength(1);
  });

  it("sonlu olmayan ve yinelenen yerleşim kimliklerini reddeder", () => {
    const value = project();
    value.placements.push({ ...value.placements[0]!, xMm: 30 });
    expect(parseProjectJson(JSON.stringify(value))).toMatchObject({ ok: false, error: expect.stringContaining("benzersiz") });
    value.placements[1]!.id = "p2";
    value.placements[1]!.xMm = Number.NaN;
    expect(parseProjectJson(JSON.stringify(value))).toMatchObject({ ok: false });
  });

  it("içerik parmak izi kayıt anına dönünce temiz durumu tanır", () => {
    const base = { name: "A", motif: { widthMm: 200, heightMm: 250 }, minimumGapMm: 0, keyboardStepMm: 0.5, keyboardShiftStepMm: 5, materials: INITIAL_MATERIALS, placements: project().placements, groups: [] };
    const saved = projectContentFingerprint(base);
    expect(projectContentFingerprint({ ...base, motif: { widthMm: 300, heightMm: 250 } })).not.toBe(saved);
    expect(projectContentFingerprint(base)).toBe(saved);
  });

  it("grup kayıtlarını ve klavye adımlarını kaydet-aç turunda korur", () => {
    const original = createProjectDocument(metadata, {
      motif: { widthMm: 200, heightMm: 250 }, minimumGapMm: 0,
      keyboardStepMm: 0.25, keyboardShiftStepMm: 4,
      materials: INITIAL_MATERIALS,
      placements: [
        { id: "p1", materialId: "mat-pearl", xMm: -10, yMm: 0, rotationDeg: 0 },
        { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
      ],
      groups: [{ id: "g1", placementIds: ["p1", "p2"] }],
    });
    const parsed = parseProjectJson(serializeProject(original));
    expect(parsed.ok && parsed.project.groups).toEqual([{ id: "g1", placementIds: ["p1", "p2"] }]);
    expect(parsed.ok && parsed.project.settings.keyboardStepMm).toBe(0.25);
  });

  it("1.0 proje dosyasını boş grup ve varsayılan klavye adımlarıyla açar", () => {
    const legacy = project();
    const legacyValue = {
      ...legacy,
      schemaVersion: "1.0",
      settings: { minimumGapMm: legacy.settings.minimumGapMm },
    } as Record<string, unknown>;
    delete legacyValue.groups;
    const parsed = parseProjectJson(JSON.stringify(legacyValue));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.project.schemaVersion).toBe("1.1");
      expect(parsed.project.groups).toEqual([]);
      expect(parsed.project.settings).toMatchObject({ keyboardStepMm: 0.5, keyboardShiftStepMm: 5 });
    }
  });

  it("yinelenen grup üyeliğini reddeder", () => {
    const value = createProjectDocument(metadata, {
      motif: { widthMm: 200, heightMm: 250 }, minimumGapMm: 0,
      keyboardStepMm: 0.5, keyboardShiftStepMm: 5,
      materials: INITIAL_MATERIALS,
      placements: [
        { id: "p1", materialId: "mat-pearl", xMm: -10, yMm: 0, rotationDeg: 0 },
        { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
        { id: "p3", materialId: "mat-pearl", xMm: 20, yMm: 0, rotationDeg: 0 },
      ],
      groups: [{ id: "g1", placementIds: ["p1", "p2"] }],
    });
    value.groups.push({ id: "g2", placementIds: ["p2", "p3"] });
    expect(parseProjectJson(JSON.stringify(value))).toMatchObject({ ok: false, error: expect.stringContaining("grup") });
  });
});
