import { useCallback, useEffect, useState, type RefCallback } from "react";

interface ElementSize {
  width: number;
  height: number;
}

export function useElementSize<T extends HTMLElement>(): [RefCallback<T>, ElementSize] {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 800, height: 560 });
  const ref = useCallback<RefCallback<T>>((node) => setElement(node), []);

  useEffect(() => {
    if (!element) return;

    const updateSize = (width: number, height: number) => {
      setSize({ width: Math.max(1, width), height: Math.max(1, height) });
    };

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      updateSize(entry.contentRect.width, entry.contentRect.height);
    });

    const bounds = element.getBoundingClientRect();
    updateSize(bounds.width, bounds.height);
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return [ref, size];
}

