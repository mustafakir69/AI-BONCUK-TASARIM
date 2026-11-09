import { describe, expect, it } from "vitest";
import { resolveWorkspaceGesture } from "./workspaceGesture";

const base = {
  editorMode: "select" as const,
  isBackground: true,
  button: 0,
  shiftKey: false,
  spacePressed: false,
  pointerType: "mouse" as const,
};

describe("çalışma alanı işaretçi jestleri", () => {
  it("seçim modunda boş alandaki sol sürüklemeyi pan olarak yorumlar", () => {
    expect(resolveWorkspaceGesture(base)).toBe("pan");
  });

  it("Shift + sol sürüklemeyi alan seçimi olarak yorumlar", () => {
    expect(resolveWorkspaceGesture({ ...base, shiftKey: true })).toBe("select-area");
  });

  it("Space + sol, orta tuş ve dokunmayı pan olarak yorumlar", () => {
    expect(resolveWorkspaceGesture({ ...base, spacePressed: true })).toBe("pan");
    expect(resolveWorkspaceGesture({ ...base, button: 1 })).toBe("pan");
    expect(resolveWorkspaceGesture({ ...base, pointerType: "touch" })).toBe("pan");
  });

  it("yerleştirme modunda normal sol tıklamayı yerleştirme için korur", () => {
    expect(resolveWorkspaceGesture({ ...base, editorMode: "place" })).toBe("place-or-pan");
    expect(resolveWorkspaceGesture({ ...base, editorMode: "place", spacePressed: true })).toBe("pan");
  });

  it("boncuk üzerinde başlayan olayı çalışma alanı jestine dönüştürmez", () => {
    expect(resolveWorkspaceGesture({ ...base, isBackground: false })).toBe("none");
    expect(resolveWorkspaceGesture({ ...base, isBackground: false, button: 1 })).toBe("pan");
    expect(resolveWorkspaceGesture({ ...base, isBackground: false, spacePressed: true })).toBe("pan");
  });
});
