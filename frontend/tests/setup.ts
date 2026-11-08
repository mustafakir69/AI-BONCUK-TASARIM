import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

class ResizeObserverMock implements ResizeObserver {
  readonly devicePixelContentBoxSize = [];
  readonly borderBoxSize = [];
  readonly contentBoxSize = [];

  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: () => "blob:test-download",
});

Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: () => undefined,
});

HTMLAnchorElement.prototype.click = () => undefined;

