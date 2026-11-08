import { useRef } from "react";
import { Icon, type IconName } from "../../shared/Icon";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onNewProject(): void;
  onOpenFile(file: File): void;
  onSave(): void;
  onUndo(): void;
  onRedo(): void;
  onExport(): void;
}

interface ToolButtonProps {
  label: string;
  icon: IconName;
  onClick(): void;
  disabled?: boolean;
  prominent?: boolean;
}

function ToolButton({ label, icon, onClick, disabled = false, prominent = false }: ToolButtonProps) {
  return (
    <button className={prominent ? "tool-button tool-button--accent" : "tool-button"} disabled={disabled} onClick={onClick} title={label} type="button">
      <Icon name={icon} /><span>{label}</span>
    </button>
  );
}

export function Toolbar({
  canUndo, canRedo, onNewProject, onOpenFile, onSave, onUndo, onRedo, onExport,
}: ToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <nav aria-label="Proje araçları" className="toolbar">
      <div className="toolbar__item"><ToolButton icon="file" label="Yeni proje" onClick={onNewProject} /></div>
      <div className="toolbar__item">
        <ToolButton icon="folder" label="Aç" onClick={() => inputRef.current?.click()} />
        <input accept=".json,application/json" aria-label="Proje dosyası seç" className="sr-only" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onOpenFile(file);
          event.target.value = "";
        }} ref={inputRef} type="file" />
      </div>
      <div className="toolbar__item"><ToolButton icon="save" label="Kaydet" onClick={onSave} /></div>
      <div className="toolbar__item toolbar__item--separated"><ToolButton disabled={!canUndo} icon="undo" label="Geri al" onClick={onUndo} /></div>
      <div className="toolbar__item"><ToolButton disabled={!canRedo} icon="redo" label="Yinele" onClick={onRedo} /></div>
      <div className="toolbar__item"><ToolButton icon="export" label="Dışa aktar" onClick={onExport} prominent /></div>
    </nav>
  );
}

