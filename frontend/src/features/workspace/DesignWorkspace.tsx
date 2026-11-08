import { useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { WorkspaceDimensions } from "../../domain/workspace";
import { Icon } from "../../shared/Icon";
import { useElementSize } from "../../shared/useElementSize";

interface DesignWorkspaceProps {
  workspace: WorkspaceDimensions;
  gridVisible: boolean;
}

interface Point {
  x: number;
  y: number;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const WORKSPACE_PADDING = 72;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function chooseGridStep(scale: number): number {
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  return steps.find((step) => step * scale >= 18) ?? 1000;
}

export function DesignWorkspace({ workspace, gridVisible }: DesignWorkspaceProps) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const stageRef = useRef<import("konva/lib/Stage").Stage>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

  const availableWidth = Math.max(1, size.width - WORKSPACE_PADDING * 2);
  const availableHeight = Math.max(1, size.height - WORKSPACE_PADDING * 2);
  const fitScale = Math.min(
    availableWidth / workspace.widthMm,
    availableHeight / workspace.heightMm,
  );
  const modelScale = Math.max(0.01, fitScale * zoom);
  const gridStepMm = chooseGridStep(modelScale);

  const gridLines = useMemo(() => {
    if (!gridVisible) return { vertical: [], horizontal: [] };

    const vertical = Array.from(
      { length: Math.floor(workspace.widthMm / gridStepMm) + 1 },
      (_, index) => index * gridStepMm,
    );
    const horizontal = Array.from(
      { length: Math.floor(workspace.heightMm / gridStepMm) + 1 },
      (_, index) => index * gridStepMm,
    );

    return { vertical, horizontal };
  }, [gridStepMm, gridVisible, workspace.heightMm, workspace.widthMm]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const changeZoom = (nextZoom: number) => {
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();

    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const previousScale = modelScale;
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const nextZoom = clamp(zoom * (direction > 0 ? 1.12 : 1 / 1.12), MIN_ZOOM, MAX_ZOOM);
    const nextScale = fitScale * nextZoom;
    const center = { x: size.width / 2, y: size.height / 2 };
    const modelPoint = {
      x: (pointer.x - center.x - pan.x) / previousScale,
      y: (pointer.y - center.y - pan.y) / previousScale,
    };

    setZoom(nextZoom);
    setPan({
      x: pointer.x - center.x - modelPoint.x * nextScale,
      y: pointer.y - center.y - modelPoint.y * nextScale,
    });
  };

  return (
    <section aria-labelledby="workspace-title" className="workspace-panel">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Çalışma alanı</p>
          <div className="workspace-title-row">
            <h1 id="workspace-title">İsimsiz tasarım</h1>
            <span className="save-state"><span /> Yerel taslak</span>
          </div>
        </div>
        <div className="workspace-meta" aria-label="Çalışma alanı bilgileri">
          <span>{workspace.widthMm} × {workspace.heightMm} mm</span>
          <span className="workspace-meta__divider" />
          <span>Izgara {gridVisible ? `${gridStepMm} mm` : "kapalı"}</span>
        </div>
      </div>

      <div className="canvas-shell" ref={containerRef}>
        <div className="canvas-hint">
          <span className="canvas-hint__key">Sürükle</span>
          <span>Kaydır</span>
          <span className="canvas-hint__dot" />
          <span>Fare tekeriyle yakınlaştır</span>
        </div>

        <Stage
          height={size.height}
          onWheel={handleWheel}
          ref={stageRef}
          width={size.width}
        >
          <Layer>
            <Group
              draggable
              onDragEnd={(event) => setPan({
                x: event.target.x() - size.width / 2,
                y: event.target.y() - size.height / 2,
              })}
              scaleX={modelScale}
              scaleY={modelScale}
              x={size.width / 2 + pan.x}
              y={size.height / 2 + pan.y}
            >
              <Rect
                cornerRadius={1 / modelScale}
                fill="#f9faf7"
                height={workspace.heightMm}
                shadowBlur={18 / modelScale}
                shadowColor="rgba(25, 35, 33, 0.15)"
                shadowOffsetY={6 / modelScale}
                shadowOpacity={1}
                stroke="#cfd5d1"
                strokeWidth={1 / modelScale}
                width={workspace.widthMm}
                x={-workspace.widthMm / 2}
                y={-workspace.heightMm / 2}
              />

              {gridLines.vertical.map((x) => (
                <Line
                  key={`v-${x}`}
                  points={[
                    x - workspace.widthMm / 2,
                    -workspace.heightMm / 2,
                    x - workspace.widthMm / 2,
                    workspace.heightMm / 2,
                  ]}
                  stroke={x % (gridStepMm * 5) === 0 ? "#cbd2ce" : "#e2e6e3"}
                  strokeWidth={(x % (gridStepMm * 5) === 0 ? 0.7 : 0.4) / modelScale}
                />
              ))}

              {gridLines.horizontal.map((y) => (
                <Line
                  key={`h-${y}`}
                  points={[
                    -workspace.widthMm / 2,
                    y - workspace.heightMm / 2,
                    workspace.widthMm / 2,
                    y - workspace.heightMm / 2,
                  ]}
                  stroke={y % (gridStepMm * 5) === 0 ? "#cbd2ce" : "#e2e6e3"}
                  strokeWidth={(y % (gridStepMm * 5) === 0 ? 0.7 : 0.4) / modelScale}
                />
              ))}

              <Text
                align="center"
                fill="#7a8581"
                fontFamily="Inter, Arial, sans-serif"
                fontSize={12 / modelScale}
                listening={false}
                text={`${workspace.widthMm} mm`}
                width={workspace.widthMm}
                x={-workspace.widthMm / 2}
                y={workspace.heightMm / 2 + 12 / modelScale}
              />
            </Group>
          </Layer>
        </Stage>

        <div className="canvas-empty-state" aria-hidden="true">
          <div className="canvas-empty-state__mark">
            <span /><span /><span /><span />
          </div>
          <strong>Boş tasarım alanı</strong>
          <span>Malzeme yerleştirme Aşama 3'te etkinleşecek</span>
        </div>

        <div aria-label="Görünüm kontrolleri" className="zoom-controls">
          <button
            aria-label="Uzaklaştır"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => changeZoom(zoom / 1.2)}
            title="Uzaklaştır"
            type="button"
          >
            <Icon name="minus" size={16} />
          </button>
          <span aria-live="polite">%{Math.round(zoom * 100)}</span>
          <button
            aria-label="Yakınlaştır"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => changeZoom(zoom * 1.2)}
            title="Yakınlaştır"
            type="button"
          >
            <Icon name="plus" size={16} />
          </button>
          <span className="zoom-controls__divider" />
          <button aria-label="Ekrana sığdır" onClick={resetView} title="Ekrana sığdır" type="button">
            <Icon name="fit" size={16} />
          </button>
        </div>
      </div>

      <div className="workspace-statusbar">
        <span><strong>X</strong> 0,00 mm</span>
        <span><strong>Y</strong> 0,00 mm</span>
        <span className="workspace-statusbar__spacer" />
        <span>Fiziksel ölçü: {workspace.widthMm} × {workspace.heightMm} mm</span>
        <span>Görünüm: %{Math.round(zoom * 100)}</span>
      </div>
    </section>
  );
}

