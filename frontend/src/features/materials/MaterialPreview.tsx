import { useId } from "react";
import type { MaterialDraft } from "../../domain/material";

interface MaterialPreviewProps {
  material: Pick<MaterialDraft, "name" | "shape" | "widthMm" | "heightMm" | "color" | "holeDiameterMm">;
  large?: boolean;
}

function safeDimension(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function MaterialPreview({ material, large = false }: MaterialPreviewProps) {
  const gradientId = useId();
  const widthMm = safeDimension(material.widthMm);
  const heightMm = safeDimension(material.heightMm);
  const longestSide = Math.max(widthMm, heightMm);
  const maximumSize = large ? 54 : 28;
  const minimumSize = large ? 12 : 7;
  const visualWidth = Math.max(minimumSize, (widthMm / longestSide) * maximumSize);
  const visualHeight = Math.max(minimumSize, (heightMm / longestSide) * maximumSize);
  const x = (64 - visualWidth) / 2;
  const y = (64 - visualHeight) / 2;
  const stroke = "rgba(37, 48, 45, 0.28)";

  return (
    <svg
      aria-label={`${material.name || "Malzeme"} geometrik önizlemesi`}
      className={large ? "material-preview material-preview--large" : "material-preview"}
      role="img"
      viewBox="0 0 64 64"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#17211f" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {material.shape === "square" || material.shape === "rectangle" ? (
        <>
          <rect
            fill={material.color}
            height={visualHeight}
            rx={Math.min(4, visualWidth / 5)}
            stroke={stroke}
            width={visualWidth}
            x={x}
            y={y}
          />
          <rect
            fill={`url(#${gradientId})`}
            height={visualHeight}
            rx={Math.min(4, visualWidth / 5)}
            width={visualWidth}
            x={x}
            y={y}
          />
        </>
      ) : (
        <>
          <circle cx="32" cy="32" fill={material.color} r={maximumSize / 2} stroke={stroke} />
          <circle
            cx="32"
            cy="32"
            fill={`url(#${gradientId})`}
            r={maximumSize / 2}
          />
          {material.shape === "ring" ? (
            <circle
              className="material-preview__hole"
              cx="32"
              cy="32"
              r={Math.max(2, ((material.holeDiameterMm ?? 0) / widthMm) * (maximumSize / 2))}
              stroke={stroke}
            />
          ) : null}
        </>
      )}
    </svg>
  );
}

