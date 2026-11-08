import type { ReactNode } from "react";

export type IconName =
  | "add"
  | "arrow-down"
  | "export"
  | "file"
  | "fit"
  | "folder"
  | "grid"
  | "minus"
  | "plus"
  | "redo"
  | "save"
  | "undo";

const paths: Record<IconName, ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  "arrow-down": <path d="m7 10 5 5 5-5" />,
  export: (
    <>
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
    </>
  ),
  fit: (
    <>
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
      <path d="M9 9h6v6H9z" />
    </>
  ),
  folder: <path d="M3 6h7l2 2h9v11H3z" />,
  grid: (
    <>
      <path d="M4 4h16v16H4zM4 10h16M4 15h16M10 4v16M15 4v16" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  redo: <path d="M20 7v5h-5M20 12a8 8 0 1 0-2.3 5.7" />,
  save: (
    <>
      <path d="M5 3h12l2 2v16H5z" />
      <path d="M8 3v6h8V3M8 21v-7h8v7" />
    </>
  ),
  undo: <path d="M4 7v5h5M4 12a8 8 0 1 1 2.3 5.7" />,
};

interface IconProps {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
        {paths[name]}
      </g>
    </svg>
  );
}

