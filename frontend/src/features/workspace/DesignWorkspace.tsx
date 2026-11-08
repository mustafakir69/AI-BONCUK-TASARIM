import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Ring, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Group as KonvaGroup } from "konva/lib/Group";
import {
  DEFAULT_PIXELS_PER_MM,
  MAX_PIXELS_PER_MM,
  MIN_PIXELS_PER_MM,
  clamp,
  createViewportTransform,
  fitPhysicalSizeToRect,
  formatCoordinate,
  formatRulerValue,
  getVisibleTickValues,
  getVisibleWorldBounds,
  panViewCenterByPixels,
  screenToWorld,
  selectMinorStep,
  selectRulerStep,
  worldToScreen,
  zoomViewCenterAtPoint,
  type PointMm,
  type PointPx,
  type ScreenRect,
} from "../../domain/coordinates";
import type { MotifDimensions } from "../../domain/motif";
import type { WorldRect } from "../../domain/editing";
import type { Material } from "../../domain/material";
import type { Placement } from "../../domain/placement";
import type { PlacementValidationResult } from "../../domain/geometry/validation";
import type { EditorMode } from "../editor/useDesignEditor";
import { Icon } from "../../shared/Icon";
import { useElementSize } from "../../shared/useElementSize";

interface DesignWorkspaceProps {
  motif: MotifDimensions;
  gridVisible: boolean;
  motifGuideVisible: boolean;
  materials: Material[];
  placements: Placement[];
  selectedIds: ReadonlySet<string>;
  editorMode: EditorMode;
  activeMaterialId?: string;
  notice: string | null;
  projectName: string;
  isDirty: boolean;
  onActivateSelection(): void;
  onResumePlacement(): void;
  onAddPlacement(point: PointMm): boolean;
  onMovePlacement(placementId: string, point: PointMm): boolean;
  onSelectPlacement(placementId?: string, additive?: boolean): void;
  onSelectRect(rect: WorldRect, additive?: boolean): void;
  onDeleteSelected(): boolean;
  onRotateSelected(deltaDeg?: number): boolean;
  validateCandidate(candidate: Placement): PlacementValidationResult;
  validateSelectionMove(placementId: string, point: PointMm): PlacementValidationResult;
}

interface PanStart {
  pointerPx: PointPx;
  viewCenterMm: PointMm;
}

interface SelectionStart {
  pointerPx: PointPx;
  additive: boolean;
}

const RULER_SIZE_PX = 30;
const ZOOM_FACTOR = 1.2;

interface MaterialShapeNodeProps {
  material: Material;
  pixelsPerMm: number;
  selected?: boolean;
  invalid?: boolean;
  opacity?: number;
}

function MaterialShapeNode({
  material,
  pixelsPerMm,
  selected = false,
  invalid = false,
  opacity = 1,
}: MaterialShapeNodeProps) {
  const width = material.widthMm * pixelsPerMm;
  const height = material.heightMm * pixelsPerMm;
  const stroke = invalid ? "#c9483b" : selected ? "#1f7568" : "rgba(32, 45, 41, 0.42)";
  const strokeWidth = selected || invalid ? 2 : 0.8;
  const shared = {
    fill: material.color,
    name: "placement-shape",
    opacity,
    shadowBlur: selected ? 7 : 2,
    shadowColor: selected ? "rgba(31, 117, 104, 0.45)" : "rgba(20, 33, 29, 0.18)",
    shadowOffsetY: 1,
    stroke,
    strokeWidth,
  };

  if (material.shape === "circle") {
    return <Circle {...shared} radius={width / 2} />;
  }
  if (material.shape === "ring") {
    return (
      <Ring
        {...shared}
        innerRadius={(material.holeDiameterMm ?? 0) * pixelsPerMm / 2}
        outerRadius={width / 2}
      />
    );
  }
  return (
    <Rect
      {...shared}
      cornerRadius={Math.min(3, width / 5, height / 5)}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      width={width}
    />
  );
}

interface PlacementNodesProps {
  placements: Placement[];
  materials: Material[];
  selectedIds: ReadonlySet<string>;
  viewport: ReturnType<typeof createViewportTransform>;
  pixelsPerMm: number;
  editorMode: EditorMode;
  onMovePlacement(placementId: string, point: PointMm): boolean;
  onSelectPlacement(placementId?: string, additive?: boolean): void;
  validateSelectionMove(placementId: string, point: PointMm): PlacementValidationResult;
}

interface DragPreview {
  placementId: string;
  dxPx: number;
  dyPx: number;
  valid: boolean;
}

const PlacementNodes = memo(function PlacementNodes({
  placements,
  materials,
  selectedIds,
  viewport,
  pixelsPerMm,
  editorMode,
  onMovePlacement,
  onSelectPlacement,
  validateSelectionMove,
}: PlacementNodesProps) {
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  return placements.map((placement) => {
    const material = materials.find((item) => item.id === placement.materialId);
    if (!material) return null;
    const baseScreen = worldToScreen({ x: placement.xMm, y: placement.yMm }, viewport);
    const selected = selectedIds.has(placement.id);
    const previewOffset = dragPreview && selected
      ? { x: dragPreview.dxPx, y: dragPreview.dyPx }
      : { x: 0, y: 0 };
    const screen = { x: baseScreen.x + previewOffset.x, y: baseScreen.y + previewOffset.y };

    return (
      <Group
        draggable={editorMode === "select"}
        key={placement.id}
        name={`placement-${placement.id}`}
        onClick={(event) => {
          event.cancelBubble = true;
          onSelectPlacement(placement.id, event.evt instanceof MouseEvent && event.evt.shiftKey);
        }}
        onDragEnd={(event) => {
          const point = screenToWorld({ x: event.target.x(), y: event.target.y() }, viewport);
          const accepted = onMovePlacement(placement.id, point);
          setDragPreview(null);
          if (!accepted) event.target.position(baseScreen);
          event.target.opacity(1);
          (event.target as unknown as KonvaGroup).findOne(".placement-shape")?.setAttr("stroke", selected ? "#1f7568" : "rgba(32, 45, 41, 0.42)");
        }}
        onDragMove={(event) => {
          const point = screenToWorld({ x: event.target.x(), y: event.target.y() }, viewport);
          const valid = validateSelectionMove(placement.id, point).valid;
          setDragPreview({
            placementId: placement.id,
            dxPx: event.target.x() - baseScreen.x,
            dyPx: event.target.y() - baseScreen.y,
            valid,
          });
          event.target.opacity(valid ? 0.82 : 0.58);
          (event.target as unknown as KonvaGroup).findOne(".placement-shape")?.setAttr("stroke", valid ? "#1f7568" : "#c9483b");
        }}
        onDragStart={(event) => {
          event.cancelBubble = true;
          if (!selected) onSelectPlacement(placement.id, event.evt instanceof MouseEvent && event.evt.shiftKey);
        }}
        onTap={(event) => {
          event.cancelBubble = true;
          onSelectPlacement(placement.id, false);
        }}
        rotation={placement.rotationDeg}
        x={screen.x}
        y={screen.y}
      >
        <MaterialShapeNode material={material} invalid={Boolean(dragPreview && selected && !dragPreview.valid)} pixelsPerMm={pixelsPerMm} selected={selected} />
      </Group>
    );
  });
});

function isMajorTick(valueMm: number, majorStepMm: number): boolean {
  const quotient = valueMm / majorStepMm;
  return Math.abs(quotient - Math.round(quotient)) < 1e-7;
}

function isZero(value: number): boolean {
  return Math.abs(value) < 1e-7;
}

export function DesignWorkspace({
  motif,
  gridVisible,
  motifGuideVisible,
  materials,
  placements,
  selectedIds,
  editorMode,
  activeMaterialId,
  notice,
  projectName,
  isDirty,
  onActivateSelection,
  onResumePlacement,
  onAddPlacement,
  onMovePlacement,
  onSelectPlacement,
  onSelectRect,
  onDeleteSelected,
  onRotateSelected,
  validateCandidate,
  validateSelectionMove,
}: DesignWorkspaceProps) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const stageRef = useRef<import("konva/lib/Stage").Stage>(null);
  const panStartRef = useRef<PanStart | null>(null);
  const selectionStartRef = useRef<SelectionStart | null>(null);
  const spacePressedRef = useRef(false);
  const panMovedRef = useRef(false);
  const [pixelsPerMm, setPixelsPerMm] = useState(DEFAULT_PIXELS_PER_MM);
  const [viewCenterMm, setViewCenterMm] = useState<PointMm>({ x: 0, y: 0 });
  const [cursorMm, setCursorMm] = useState<PointMm>({ x: 0, y: 0 });
  const [cursorInside, setCursorInside] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [selectionRectPx, setSelectionRectPx] = useState<{ start: PointPx; end: PointPx } | null>(null);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !(event.target instanceof Element && event.target.matches("input, textarea, select"))) {
        event.preventDefault();
        spacePressedRef.current = true;
      }
    };
    const keyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") spacePressedRef.current = false;
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  const drawableRect: ScreenRect = useMemo(() => ({
    x: RULER_SIZE_PX,
    y: RULER_SIZE_PX,
    width: Math.max(1, size.width - RULER_SIZE_PX),
    height: Math.max(1, size.height - RULER_SIZE_PX),
  }), [size.height, size.width]);

  const viewport = useMemo(
    () => createViewportTransform(viewCenterMm, pixelsPerMm, drawableRect),
    [drawableRect, pixelsPerMm, viewCenterMm],
  );
  const worldBounds = useMemo(
    () => getVisibleWorldBounds(viewport, drawableRect),
    [drawableRect, viewport],
  );
  const majorStepMm = selectRulerStep(pixelsPerMm);
  const minorStepMm = selectMinorStep(majorStepMm);
  const xTicks = useMemo(
    () => getVisibleTickValues(worldBounds.minX, worldBounds.maxX, minorStepMm),
    [minorStepMm, worldBounds.maxX, worldBounds.minX],
  );
  const yTicks = useMemo(
    () => getVisibleTickValues(worldBounds.minY, worldBounds.maxY, minorStepMm),
    [minorStepMm, worldBounds.maxY, worldBounds.minY],
  );

  const originScreen = worldToScreen({ x: 0, y: 0 }, viewport);
  const motifTopLeft = worldToScreen(
    { x: -motif.widthMm / 2, y: -motif.heightMm / 2 },
    viewport,
  );
  const motifWidthPx = motif.widthMm * pixelsPerMm;
  const motifHeightPx = motif.heightMm * pixelsPerMm;
  const zoomPercent = Math.round((pixelsPerMm / DEFAULT_PIXELS_PER_MM) * 100);
  const activeMaterial = materials.find((material) => material.id === activeMaterialId);
  const previewPlacement: Placement | null = activeMaterial && editorMode === "place"
    ? {
        id: "__placement-preview__",
        materialId: activeMaterial.id,
        xMm: cursorMm.x,
        yMm: cursorMm.y,
        rotationDeg: 0,
      }
    : null;
  const previewValid = previewPlacement ? validateCandidate(previewPlacement).valid : false;
  const previewScreen = worldToScreen(cursorMm, viewport);

  const pointerPosition = (): PointPx | null => {
    const pointer = stageRef.current?.getPointerPosition();
    return pointer ? { x: pointer.x, y: pointer.y } : null;
  };

  const updateCursor = (pointerPx: PointPx, nextViewCenterMm = viewCenterMm) => {
    const nextViewport = createViewportTransform(nextViewCenterMm, pixelsPerMm, drawableRect);
    setCursorMm(screenToWorld(pointerPx, nextViewport));
  };

  const startPan = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (event.target.name() !== "viewport-background") return;
    const pointerPx = pointerPosition();
    if (!pointerPx || pointerPx.x < drawableRect.x || pointerPx.y < drawableRect.y) return;

    const mouseEvent = event.evt instanceof MouseEvent ? event.evt : null;
    if (editorMode === "select" && mouseEvent?.button === 0 && !spacePressedRef.current) {
      selectionStartRef.current = { pointerPx, additive: mouseEvent.shiftKey };
      setSelectionRectPx({ start: pointerPx, end: pointerPx });
      panMovedRef.current = false;
      return;
    }

    panStartRef.current = { pointerPx, viewCenterMm };
    panMovedRef.current = false;
    setIsPanning(true);
  };

  const movePointer = () => {
    const pointerPx = pointerPosition();
    if (!pointerPx) return;

    const selectionStart = selectionStartRef.current;
    if (selectionStart) {
      if (Math.hypot(pointerPx.x - selectionStart.pointerPx.x, pointerPx.y - selectionStart.pointerPx.y) > 3) {
        panMovedRef.current = true;
      }
      setSelectionRectPx({ start: selectionStart.pointerPx, end: pointerPx });
      updateCursor(pointerPx);
      return;
    }

    const panStart = panStartRef.current;
    if (!panStart) {
      if (pointerPx.x >= drawableRect.x && pointerPx.y >= drawableRect.y) {
        setCursorInside(true);
        updateCursor(pointerPx);
      }
      return;
    }

    const deltaPx = {
      x: pointerPx.x - panStart.pointerPx.x,
      y: pointerPx.y - panStart.pointerPx.y,
    };
    if (Math.hypot(deltaPx.x, deltaPx.y) <= 3) {
      updateCursor(pointerPx);
      return;
    }
    panMovedRef.current = true;
    const nextViewCenter = panViewCenterByPixels(
      panStart.viewCenterMm,
      deltaPx,
      pixelsPerMm,
    );
    setViewCenterMm(nextViewCenter);
    updateCursor(pointerPx, nextViewCenter);
  };

  const finishPan = () => {
    const selectionStart = selectionStartRef.current;
    const selectionEnd = pointerPosition() ?? selectionRectPx?.end;
    if (selectionStart && selectionEnd && panMovedRef.current) {
      const first = screenToWorld(selectionStart.pointerPx, viewport);
      const second = screenToWorld(selectionEnd, viewport);
      onSelectRect({
        minX: Math.min(first.x, second.x), maxX: Math.max(first.x, second.x),
        minY: Math.min(first.y, second.y), maxY: Math.max(first.y, second.y),
      }, selectionStart.additive);
    }
    selectionStartRef.current = null;
    setSelectionRectPx(null);
    panStartRef.current = null;
    setIsPanning(false);
  };

  const handleBackgroundClick = () => {
    if (panMovedRef.current) {
      panMovedRef.current = false;
      return;
    }
    const pointerPx = pointerPosition();
    if (!pointerPx) return;
    if (editorMode === "place") onAddPlacement(screenToWorld(pointerPx, viewport));
    else onSelectPlacement();
  };

  const setZoomAtPoint = (nextPixelsPerMm: number, anchorPx: PointPx) => {
    const clampedScale = clamp(nextPixelsPerMm, MIN_PIXELS_PER_MM, MAX_PIXELS_PER_MM);
    const nextViewCenter = zoomViewCenterAtPoint(
      viewCenterMm,
      pixelsPerMm,
      clampedScale,
      anchorPx,
      drawableRect,
    );
    setPixelsPerMm(clampedScale);
    setViewCenterMm(nextViewCenter);

    const nextViewport = createViewportTransform(nextViewCenter, clampedScale, drawableRect);
    setCursorMm(screenToWorld(anchorPx, nextViewport));
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const pointerPx = pointerPosition();
    if (!pointerPx || pointerPx.x < drawableRect.x || pointerPx.y < drawableRect.y) return;

    const nextScale = event.evt.deltaY > 0
      ? pixelsPerMm / 1.12
      : pixelsPerMm * 1.12;
    setZoomAtPoint(nextScale, pointerPx);
  };

  const changeZoom = (factor: number) => {
    const anchorPx = {
      x: drawableRect.x + drawableRect.width / 2,
      y: drawableRect.y + drawableRect.height / 2,
    };
    setZoomAtPoint(pixelsPerMm * factor, anchorPx);
  };

  const fitMotif = () => {
    setPixelsPerMm(fitPhysicalSizeToRect(motif, drawableRect));
    setViewCenterMm({ x: 0, y: 0 });
    setCursorMm({ x: 0, y: 0 });
  };

  return (
    <section aria-labelledby="workspace-title" className="workspace-panel">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Sonsuz çalışma düzlemi</p>
          <div className="workspace-title-row">
            <h1 id="workspace-title">{projectName}</h1>
            <span className={isDirty ? "save-state save-state--dirty" : "save-state"}>
              <span /> {isDirty ? "Kaydedilmemiş değişiklikler" : "Tüm değişiklikler kaydedildi"}
            </span>
          </div>
        </div>
        <div aria-label="Editör araçları" className="editor-tools" role="toolbar">
          <button
            aria-pressed={editorMode === "select"}
            className={editorMode === "select" ? "editor-tool editor-tool--active" : "editor-tool"}
            onClick={onActivateSelection}
            type="button"
          >
            <Icon name="cursor" size={15} />
            Seç
          </button>
          <button
            aria-pressed={editorMode === "place"}
            className={editorMode === "place" ? "editor-tool editor-tool--active" : "editor-tool"}
            onClick={onResumePlacement}
            type="button"
          >
            <Icon name="bead" size={15} />
            Yerleştir
          </button>
          <button disabled={selectedIds.size === 0} onClick={() => onRotateSelected(15)} className="editor-tool" type="button">
            <Icon name="rotate" size={15} />
            Döndür
          </button>
          <button disabled={selectedIds.size === 0} onClick={onDeleteSelected} className="editor-tool editor-tool--danger" type="button">
            <Icon name="trash" size={15} />
            Sil
          </button>
        </div>
        <div className="workspace-meta" aria-label="Tasarım görünümü bilgileri">
          <span>{selectedIds.size} seçili</span>
          <span className="workspace-meta__divider" />
          <span>Motif {motif.widthMm} × {motif.heightMm} mm</span>
          <span className="workspace-meta__divider" />
          <span>Cetvel {majorStepMm} mm</span>
          <span className="workspace-meta__divider" />
          <span>Izgara {gridVisible ? `${minorStepMm} mm` : "kapalı"}</span>
        </div>
      </div>

      <div
        className={isPanning ? "canvas-shell canvas-shell--panning" : editorMode === "place" ? "canvas-shell canvas-shell--placing" : "canvas-shell"}
        ref={containerRef}
      >
        <div className="canvas-hint">
          <span className="canvas-hint__key">{editorMode === "place" ? "Tıkla" : "Sürükle"}</span>
          <span>{editorMode === "place" ? "Boncuğu yerleştir" : "Alan seç"}</span>
          <span className="canvas-hint__dot" />
          <span>{editorMode === "select" ? "Boşluk + sürükle ile kaydır" : "Fare tekeriyle yakınlaştır"}</span>
        </div>
        {notice ? <div className="editor-notice" role="status">{notice}</div> : null}

        <Stage
          height={size.height}
          onMouseDown={startPan}
          onMouseLeave={() => {
            setCursorInside(false);
            finishPan();
          }}
          onMouseMove={movePointer}
          onMouseUp={finishPan}
          onTouchEnd={finishPan}
          onTouchMove={movePointer}
          onTouchStart={startPan}
          onWheel={handleWheel}
          ref={stageRef}
          width={size.width}
        >
          <Layer>
            <Rect
              fill="#e8ebe9"
              height={drawableRect.height}
              name="viewport-background"
              onClick={handleBackgroundClick}
              onTap={handleBackgroundClick}
              width={drawableRect.width}
              x={drawableRect.x}
              y={drawableRect.y}
            />

            <Group
              clipHeight={drawableRect.height}
              clipWidth={drawableRect.width}
              clipX={drawableRect.x}
              clipY={drawableRect.y}
              listening={false}
            >
              {gridVisible && xTicks.map((valueMm) => {
                const x = worldToScreen({ x: valueMm, y: 0 }, viewport).x;
                const major = isMajorTick(valueMm, majorStepMm);
                return (
                  <Line
                    key={`grid-x-${valueMm}`}
                    points={[x, drawableRect.y, x, drawableRect.y + drawableRect.height]}
                    stroke={isZero(valueMm) ? "#aab8b3" : major ? "#cbd2ce" : "#dce1de"}
                    strokeWidth={isZero(valueMm) ? 1.15 : major ? 0.8 : 0.55}
                  />
                );
              })}

              {gridVisible && yTicks.map((valueMm) => {
                const y = worldToScreen({ x: 0, y: valueMm }, viewport).y;
                const major = isMajorTick(valueMm, majorStepMm);
                return (
                  <Line
                    key={`grid-y-${valueMm}`}
                    points={[drawableRect.x, y, drawableRect.x + drawableRect.width, y]}
                    stroke={isZero(valueMm) ? "#aab8b3" : major ? "#cbd2ce" : "#dce1de"}
                    strokeWidth={isZero(valueMm) ? 1.15 : major ? 0.8 : 0.55}
                  />
                );
              })}

              {!gridVisible && (
                <>
                  <Line
                    points={[drawableRect.x, originScreen.y, drawableRect.x + drawableRect.width, originScreen.y]}
                    stroke="#aab8b3"
                    strokeWidth={1.15}
                  />
                  <Line
                    points={[originScreen.x, drawableRect.y, originScreen.x, drawableRect.y + drawableRect.height]}
                    stroke="#aab8b3"
                    strokeWidth={1.15}
                  />
                </>
              )}

              {motifGuideVisible && (
                <>
                  <Rect
                    dash={[8, 5]}
                    fill="rgba(218, 120, 75, 0.035)"
                    height={motifHeightPx}
                    stroke="#d7774d"
                    strokeWidth={1.25}
                    width={motifWidthPx}
                    x={motifTopLeft.x}
                    y={motifTopLeft.y}
                  />
                  <Rect
                    cornerRadius={4}
                    fill="rgba(255, 250, 247, 0.94)"
                    height={21}
                    stroke="rgba(215, 119, 77, 0.35)"
                    width={112}
                    x={motifTopLeft.x + 7}
                    y={motifTopLeft.y + 7}
                  />
                  <Text
                    fill="#a45535"
                    fontFamily="Inter, Arial, sans-serif"
                    fontSize={9}
                    fontStyle="bold"
                    text={`${motif.widthMm} × ${motif.heightMm} mm`}
                    width={100}
                    x={motifTopLeft.x + 13}
                    y={motifTopLeft.y + 13}
                  />
                </>
              )}

              {originScreen.x >= drawableRect.x
                && originScreen.x <= drawableRect.x + drawableRect.width
                && originScreen.y >= drawableRect.y
                && originScreen.y <= drawableRect.y + drawableRect.height
                && (
                  <>
                    <Circle
                      fill="#f8faf8"
                      radius={6}
                      stroke="#c8663f"
                      strokeWidth={1.4}
                      x={originScreen.x}
                      y={originScreen.y}
                    />
                    <Circle fill="#c8663f" radius={1.8} x={originScreen.x} y={originScreen.y} />
                    <Text
                      fill="#a45535"
                      fontFamily="Inter, Arial, sans-serif"
                      fontSize={9}
                      fontStyle="bold"
                      text="0,0"
                      x={originScreen.x + 9}
                      y={originScreen.y + 7}
                    />
                  </>
                )}
            </Group>

            <Group
              clipHeight={drawableRect.height}
              clipWidth={drawableRect.width}
              clipX={drawableRect.x}
              clipY={drawableRect.y}
            >
              <PlacementNodes
                editorMode={editorMode}
                materials={materials}
                onMovePlacement={onMovePlacement}
                onSelectPlacement={onSelectPlacement}
                pixelsPerMm={pixelsPerMm}
                placements={placements}
                selectedIds={selectedIds}
                validateSelectionMove={validateSelectionMove}
                viewport={viewport}
              />
              {selectionRectPx ? (
                <Rect
                  dash={[6, 4]}
                  fill="rgba(31, 117, 104, 0.12)"
                  height={Math.abs(selectionRectPx.end.y - selectionRectPx.start.y)}
                  listening={false}
                  stroke="#1f7568"
                  strokeWidth={1.2}
                  width={Math.abs(selectionRectPx.end.x - selectionRectPx.start.x)}
                  x={Math.min(selectionRectPx.start.x, selectionRectPx.end.x)}
                  y={Math.min(selectionRectPx.start.y, selectionRectPx.end.y)}
                />
              ) : null}
              {cursorInside && previewPlacement && activeMaterial ? (
                <Group listening={false} rotation={previewPlacement.rotationDeg} x={previewScreen.x} y={previewScreen.y}>
                  <MaterialShapeNode
                    invalid={!previewValid}
                    material={activeMaterial}
                    opacity={0.55}
                    pixelsPerMm={pixelsPerMm}
                  />
                </Group>
              ) : null}
            </Group>

            <Group listening={false}>
              <Rect fill="#f6f7f6" height={RULER_SIZE_PX} width={size.width} x={0} y={0} />
              <Rect fill="#f6f7f6" height={size.height} width={RULER_SIZE_PX} x={0} y={0} />
              <Line
                points={[RULER_SIZE_PX, RULER_SIZE_PX - 0.5, size.width, RULER_SIZE_PX - 0.5]}
                stroke="#bfc7c3"
                strokeWidth={1}
              />
              <Line
                points={[RULER_SIZE_PX - 0.5, RULER_SIZE_PX, RULER_SIZE_PX - 0.5, size.height]}
                stroke="#bfc7c3"
                strokeWidth={1}
              />

              {xTicks.map((valueMm) => {
                const x = worldToScreen({ x: valueMm, y: 0 }, viewport).x;
                const major = isMajorTick(valueMm, majorStepMm);
                const zero = isZero(valueMm);
                return (
                  <Group key={`ruler-x-${valueMm}`}>
                    <Line
                      points={[x, major ? 14 : 21, x, RULER_SIZE_PX]}
                      stroke={zero ? "#c8663f" : major ? "#687570" : "#aab3af"}
                      strokeWidth={zero ? 1.5 : major ? 1 : 0.7}
                    />
                    {major && (
                      <Text
                        fill={zero ? "#b65b38" : "#4f5d58"}
                        fontFamily="Inter, Arial, sans-serif"
                        fontSize={9}
                        fontStyle={zero ? "bold" : "normal"}
                        text={formatRulerValue(valueMm)}
                        x={x + 3}
                        y={3}
                      />
                    )}
                  </Group>
                );
              })}

              {yTicks.map((valueMm) => {
                const y = worldToScreen({ x: 0, y: valueMm }, viewport).y;
                const major = isMajorTick(valueMm, majorStepMm);
                const zero = isZero(valueMm);
                return (
                  <Group key={`ruler-y-${valueMm}`}>
                    <Line
                      points={[major ? 14 : 21, y, RULER_SIZE_PX, y]}
                      stroke={zero ? "#c8663f" : major ? "#687570" : "#aab3af"}
                      strokeWidth={zero ? 1.5 : major ? 1 : 0.7}
                    />
                    {major && (
                      <Text
                        align="center"
                        fill={zero ? "#b65b38" : "#4f5d58"}
                        fontFamily="Inter, Arial, sans-serif"
                        fontSize={9}
                        fontStyle={zero ? "bold" : "normal"}
                        rotation={-90}
                        text={formatRulerValue(valueMm)}
                        width={48}
                        x={3}
                        y={y + 24}
                      />
                    )}
                  </Group>
                );
              })}

              <Rect
                fill="#e9eeeb"
                height={RULER_SIZE_PX}
                stroke="#bfc7c3"
                strokeWidth={1}
                width={RULER_SIZE_PX}
                x={0}
                y={0}
              />
              <Text
                align="center"
                fill="#596761"
                fontFamily="Inter, Arial, sans-serif"
                fontSize={8}
                fontStyle="bold"
                text="mm"
                width={RULER_SIZE_PX}
                x={0}
                y={10}
              />
            </Group>
          </Layer>
        </Stage>

        {placements.length === 0 ? <div className="canvas-empty-state" aria-hidden="true">
          <div className="canvas-empty-state__mark canvas-empty-state__mark--axes">
            <span /><span />
          </div>
          <strong>Sonsuz tasarım düzlemi</strong>
          <span>Orijin merkezde; negatif koordinatlar kullanılabilir</span>
        </div> : null}

        <div aria-label="Görünüm kontrolleri" className="zoom-controls">
          <button
            aria-label="Uzaklaştır"
            disabled={pixelsPerMm <= MIN_PIXELS_PER_MM}
            onClick={() => changeZoom(1 / ZOOM_FACTOR)}
            title="Uzaklaştır"
            type="button"
          >
            <Icon name="minus" size={16} />
          </button>
          <span aria-live="polite">%{zoomPercent}</span>
          <button
            aria-label="Yakınlaştır"
            disabled={pixelsPerMm >= MAX_PIXELS_PER_MM}
            onClick={() => changeZoom(ZOOM_FACTOR)}
            title="Yakınlaştır"
            type="button"
          >
            <Icon name="plus" size={16} />
          </button>
          <span className="zoom-controls__divider" />
          <button
            aria-label="Motifi ekrana sığdır"
            onClick={fitMotif}
            title="Motif kılavuzunu ekrana sığdır"
            type="button"
          >
            <Icon name="fit" size={16} />
          </button>
        </div>
      </div>

      <div className="workspace-statusbar">
        <span><strong>X</strong> {formatCoordinate(cursorMm.x)} mm</span>
        <span><strong>Y</strong> {formatCoordinate(cursorMm.y)} mm</span>
        <span>{editorMode === "place" ? "Yerleştirme modu" : selectedIds.size > 0 ? "Nesne seçili" : "Seçim modu"}</span>
        <span className="workspace-statusbar__spacer" />
        <span>Motif hedefi: {motif.widthMm} × {motif.heightMm} mm</span>
        <span>Ölçek: {pixelsPerMm.toFixed(2)} px/mm</span>
        <span>Görünüm: %{zoomPercent}</span>
      </div>
    </section>
  );
}

