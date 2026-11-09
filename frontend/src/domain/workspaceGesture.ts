import type { EditorMode } from "../features/editor/useDesignEditor";

export type WorkspaceGesture = "pan" | "select-area" | "place-or-pan" | "none";

interface WorkspaceGestureInput {
  editorMode: EditorMode;
  isBackground: boolean;
  button: number;
  shiftKey: boolean;
  spacePressed: boolean;
  pointerType: "mouse" | "touch";
}

export function resolveWorkspaceGesture(input: WorkspaceGestureInput): WorkspaceGesture {
  if (input.button === 1 || (input.button === 0 && input.spacePressed)) return "pan";
  if (!input.isBackground) return "none";
  if (input.pointerType === "touch") return "pan";
  if (input.button !== 0) return "none";
  if (input.editorMode === "select" && input.shiftKey) return "select-area";
  if (input.editorMode === "select") return "pan";
  return input.shiftKey ? "none" : "place-or-pan";
}
