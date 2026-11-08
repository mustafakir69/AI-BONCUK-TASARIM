import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { INITIAL_MATERIALS } from "../../domain/material";
import { useDesignEditor } from "./useDesignEditor";

describe("manuel tasarım editörü durumu", () => {
  it("farklı malzemeleri negatif koordinatlar dahil yerleştirir ve sayar", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));

    act(() => result.current.activateMaterial("mat-seed-bead"));
    act(() => { expect(result.current.addPlacementAt({ x: -10, y: -5 })).toBe(true); });
    act(() => result.current.activateMaterial("mat-pearl"));
    act(() => { expect(result.current.addPlacementAt({ x: 10, y: 5 })).toBe(true); });

    expect(result.current.placements).toHaveLength(2);
    expect(result.current.counts).toEqual({ "mat-seed-bead": 1, "mat-pearl": 1 });
    expect(result.current.totalCount).toBe(2);
  });

  it("çakışan yerleştirmeyi kalıcı duruma ve geçmişe almaz", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.activateMaterial("mat-pearl"));
    act(() => { result.current.addPlacementAt({ x: 0, y: 0 }); });
    act(() => { expect(result.current.addPlacementAt({ x: 1, y: 0 })).toBe(false); });

    expect(result.current.placements).toHaveLength(1);
    expect(result.current.notice).toContain("çakışıyor");
  });

  it("nesneyi taşır, geçersiz taşımada son geçerli konumu korur ve siler", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.activateMaterial("mat-pearl"));
    act(() => { result.current.addPlacementAt({ x: 0, y: 0 }); });
    act(() => { result.current.addPlacementAt({ x: 10, y: 0 }); });
    const firstId = result.current.placements[0]!.id;

    act(() => { expect(result.current.movePlacement(firstId, { x: -8, y: -2 })).toBe(true); });
    expect(result.current.placements[0]).toMatchObject({ xMm: -8, yMm: -2 });
    act(() => { expect(result.current.movePlacement(firstId, { x: 10, y: 0 })).toBe(false); });
    expect(result.current.placements[0]).toMatchObject({ xMm: -8, yMm: -2 });

    act(() => result.current.selectPlacement(firstId));
    act(() => { expect(result.current.deleteSelected()).toBe(true); });
    expect(result.current.placements).toHaveLength(1);
  });

  it("ekleme, silme ve düzenleme komutlarını geri alıp yineler", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.activateMaterial("mat-bugle-bead"));
    act(() => { result.current.addPlacementAt({ x: 0, y: 0 }); });
    const id = result.current.placements[0]!.id;
    act(() => { result.current.updatePlacement(id, { rotationDeg: 45 }); });

    expect(result.current.placements[0]?.rotationDeg).toBe(45);
    act(() => result.current.undo());
    expect(result.current.placements[0]?.rotationDeg).toBe(0);
    act(() => result.current.undo());
    expect(result.current.placements).toHaveLength(0);
    act(() => result.current.redo());
    act(() => result.current.redo());
    expect(result.current.placements[0]?.rotationDeg).toBe(45);
  });

  it("mevcut yerleşimi bozan minimum aralığı reddeder", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.activateMaterial("mat-pearl"));
    act(() => { result.current.addPlacementAt({ x: 0, y: 0 }); });
    act(() => { result.current.addPlacementAt({ x: 4.5, y: 0 }); });

    act(() => { expect(result.current.setMinimumGap(1)).toBe(false); });
    expect(result.current.minimumGapMm).toBe(0);
    act(() => { expect(result.current.setMinimumGap(0.5)).toBe(true); });
    expect(result.current.minimumGapMm).toBe(0.5);
  });

  it("güncel malzeme ölçüsünde çakışma yaratacak eski komutu geri almaz", () => {
    const pearl = INITIAL_MATERIALS.find((material) => material.id === "mat-pearl")!;
    const { result, rerender } = renderHook(
      ({ materials }) => useDesignEditor(materials),
      { initialProps: { materials: [pearl] } },
    );
    act(() => result.current.activateMaterial(pearl.id));
    act(() => { result.current.addPlacementAt({ x: 0, y: 0 }); });
    act(() => { result.current.addPlacementAt({ x: 5, y: 0 }); });
    const firstId = result.current.placements[0]!.id;
    act(() => { result.current.movePlacement(firstId, { x: -5, y: 0 }); });

    rerender({ materials: [{ ...pearl, widthMm: 6, heightMm: 6 }] });
    act(() => result.current.undo());

    expect(result.current.placements[0]?.xMm).toBe(-5);
    expect(result.current.notice).toContain("geri alınamadı");
  });

  it("proje değiştirmede yerleşimleri yükler ve geçmişi sıfırlar", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.activateMaterial("mat-pearl"));
    act(() => { result.current.addPlacementAt({ x: 0, y: 0 }); });
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.replaceProject([
      { id: "loaded", materialId: "mat-pearl", xMm: -20, yMm: 10, rotationDeg: 30 },
    ], 1));
    expect(result.current.placements).toEqual([
      { id: "loaded", materialId: "mat-pearl", xMm: -20, yMm: 10, rotationDeg: 30 },
    ]);
    expect(result.current.minimumGapMm).toBe(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("Shift mantığıyla çoklu seçime ekler ve çıkarır", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
      { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
    ], 0));
    act(() => result.current.selectPlacement("p1"));
    act(() => result.current.selectPlacement("p2", true));
    expect(result.current.selectedIds).toEqual(new Set(["p1", "p2"]));
    act(() => result.current.selectPlacement("p1", true));
    expect(result.current.selectedIds).toEqual(new Set(["p2"]));
  });

  it("dünya koordinatlı dikdörtgenle seçer ve tümünü seçer", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: -10, yMm: 0, rotationDeg: 0 },
      { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
    ], 0));
    act(() => result.current.selectInRect({ minX: -13, maxX: -9, minY: -3, maxY: 3 }));
    expect(result.current.selectedIds).toEqual(new Set(["p1"]));
    act(() => result.current.selectAll());
    expect(result.current.selectedCount).toBe(2);
  });

  it("çoklu seçimi birlikte taşır ve tek adımda geri alıp yineler", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
      { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
    ], 0));
    act(() => result.current.selectAll());
    act(() => { expect(result.current.moveSelectedBy(3, -2)).toBe(true); });
    expect(result.current.placements.map(({ xMm, yMm }) => [xMm, yMm])).toEqual([[3, -2], [13, -2]]);
    act(() => result.current.undo());
    expect(result.current.placements.map(({ xMm, yMm }) => [xMm, yMm])).toEqual([[0, 0], [10, 0]]);
    act(() => result.current.redo());
    expect(result.current.placements.map(({ xMm, yMm }) => [xMm, yMm])).toEqual([[3, -2], [13, -2]]);
  });

  it("kopyala-yapıştır yeni benzersiz kimliklerle özellikleri korur", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-bugle-bead", xMm: 0, yMm: 0, rotationDeg: 45, colorOverride: "#123456" },
    ], 0));
    act(() => result.current.selectAll());
    act(() => { expect(result.current.copySelected()).toBe(true); });
    act(() => { expect(result.current.pasteClipboard()).toBe(true); });
    expect(result.current.placements).toHaveLength(2);
    expect(new Set(result.current.placements.map((item) => item.id)).size).toBe(2);
    expect(result.current.placements[1]).toMatchObject({ materialId: "mat-bugle-bead", xMm: 10, yMm: 10, rotationDeg: 45, colorOverride: "#123456" });
  });

  it("hassas çoğaltmayı atomik uygular ve kısmi sonucu engeller", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
    ], 0));
    act(() => result.current.selectAll());
    act(() => { expect(result.current.duplicatePrecise(10, 0, 3)).toBe(true); });
    expect(result.current.placements.map((item) => item.xMm)).toEqual([0, 10, 20, 30]);
    const count = result.current.placements.length;
    act(() => { expect(result.current.duplicatePrecise(1, 0, 2)).toBe(false); });
    expect(result.current.placements).toHaveLength(count);
  });

  it("gruplar, grup üyesi seçilince tüm grubu seçer ve çözme geri alınabilir", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: -10, yMm: 0, rotationDeg: 0 },
      { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
    ], 0));
    act(() => result.current.selectAll());
    act(() => { expect(result.current.groupSelected()).toBe(true); });
    expect(result.current.groups).toHaveLength(1);
    act(() => result.current.cancelInteraction());
    act(() => result.current.selectPlacement("p1"));
    expect(result.current.selectedCount).toBe(2);
    act(() => { expect(result.current.ungroupSelected()).toBe(true); });
    expect(result.current.groups).toHaveLength(0);
    act(() => result.current.undo());
    expect(result.current.groups).toHaveLength(1);
  });

  it("grubu ortak geometrik merkez çevresinde döndürür", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: -10, yMm: 0, rotationDeg: 0 },
      { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
    ], 0, [{ id: "g", placementIds: ["p1", "p2"] }]));
    act(() => result.current.selectPlacement("p1"));
    act(() => { expect(result.current.rotateSelected(90)).toBe(true); });
    expect(result.current.placements[0]).toMatchObject({ xMm: expect.closeTo(0), yMm: expect.closeTo(-10), rotationDeg: 90 });
    expect(result.current.placements[1]).toMatchObject({ xMm: expect.closeTo(0), yMm: expect.closeTo(10), rotationDeg: 90 });
  });

  it("geometrik hizalama ve eşit dağıtmayı uygular", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
      { id: "p2", materialId: "mat-pearl", xMm: 20, yMm: 10, rotationDeg: 0 },
      { id: "p3", materialId: "mat-pearl", xMm: 50, yMm: 20, rotationDeg: 0 },
    ], 0));
    act(() => result.current.selectAll());
    act(() => { expect(result.current.alignSelected("distribute-horizontal")).toBe(true); });
    expect(result.current.placements.map((item) => item.xMm)).toEqual([0, 25, 50]);
    act(() => { expect(result.current.alignSelected("left")).toBe(true); });
    expect(result.current.placements.map((item) => item.xMm)).toEqual([0, 0, 0]);
  });

  it("çakışan hizalama ve toplu taşıma sonucunu tamamen reddeder", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
      { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
      { id: "block", materialId: "mat-pearl", xMm: 20, yMm: 0, rotationDeg: 0 },
    ], 0));
    act(() => result.current.selectPlacement("p1"));
    act(() => result.current.selectPlacement("p2", true));
    act(() => { expect(result.current.moveSelectedBy(10, 0)).toBe(false); });
    expect(result.current.placements.map((item) => item.xMm)).toEqual([0, 10, 20]);
    act(() => { expect(result.current.alignSelected("left")).toBe(false); });
    expect(result.current.placements.map((item) => item.xMm)).toEqual([0, 10, 20]);
  });

  it("özelleştirilen klavye adımıyla hassas taşıma yapar", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
    ], 0));
    act(() => result.current.selectAll());
    act(() => { expect(result.current.setKeyboardSteps(0.25, 4)).toBe(true); });
    act(() => { expect(result.current.moveSelectedBy(result.current.keyboardStepMm, 0)).toBe(true); });
    expect(result.current.placements[0]?.xMm).toBe(0.25);
  });

  it("çok yüksek hassas çoğaltma sayısını bellek sınırında reddeder", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
    ], 0));
    act(() => result.current.selectAll());
    act(() => { expect(result.current.duplicatePrecise(10, 0, 1001)).toBe(false); });
    expect(result.current.placements).toHaveLength(1);
    expect(result.current.notice).toContain("sınırlıdır");
  });

  it("üretilen motifi tek komutla ekler, geri alır ve yineler", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "existing", materialId: "mat-pearl", xMm: -20, yMm: 0, rotationDeg: 0 },
    ], 0));
    const generated = [
      { id: "preview-1", materialId: "mat-seed-bead", xMm: 10, yMm: 0, rotationDeg: 15 },
      { id: "preview-2", materialId: "mat-seed-bead", xMm: 20, yMm: 0, rotationDeg: 30 },
    ];
    act(() => { expect(result.current.applyGeneratedPlacements(generated, "append")).toBe(true); });
    expect(result.current.placements).toHaveLength(3);
    expect(result.current.placements.slice(1).map(({ materialId, xMm, yMm, rotationDeg }) => ({ materialId, xMm, yMm, rotationDeg })))
      .toEqual(generated.map(({ materialId, xMm, yMm, rotationDeg }) => ({ materialId, xMm, yMm, rotationDeg })));
    act(() => result.current.undo());
    expect(result.current.placements.map((item) => item.id)).toEqual(["existing"]);
    act(() => result.current.redo());
    expect(result.current.placements).toHaveLength(3);
  });

  it("üretilen motif ile mevcut tasarımı atomik değiştirir ve undo ile geri getirir", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "p1", materialId: "mat-pearl", xMm: -10, yMm: 0, rotationDeg: 0 },
      { id: "p2", materialId: "mat-pearl", xMm: 10, yMm: 0, rotationDeg: 0 },
    ], 0, [{ id: "group", placementIds: ["p1", "p2"] }]));
    act(() => { expect(result.current.applyGeneratedPlacements([
      { id: "preview", materialId: "mat-seed-bead", xMm: 0, yMm: 20, rotationDeg: 45 },
    ], "replace")).toBe(true); });
    expect(result.current.placements).toHaveLength(1);
    expect(result.current.groups).toEqual([]);
    act(() => result.current.undo());
    expect(result.current.placements.map((item) => item.id)).toEqual(["p1", "p2"]);
    expect(result.current.groups).toEqual([{ id: "group", placementIds: ["p1", "p2"] }]);
  });

  it("mevcut yerleşimle çakışan motif eklemesini kısmi değişiklik yapmadan reddeder", () => {
    const { result } = renderHook(() => useDesignEditor(INITIAL_MATERIALS));
    act(() => result.current.replaceProject([
      { id: "existing", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
    ], 0));
    act(() => { expect(result.current.applyGeneratedPlacements([
      { id: "preview-1", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
      { id: "preview-2", materialId: "mat-pearl", xMm: 20, yMm: 0, rotationDeg: 0 },
    ], "append")).toBe(false); });
    expect(result.current.placements).toEqual([
      { id: "existing", materialId: "mat-pearl", xMm: 0, yMm: 0, rotationDeg: 0 },
    ]);
    expect(result.current.canUndo).toBe(false);
  });
});

