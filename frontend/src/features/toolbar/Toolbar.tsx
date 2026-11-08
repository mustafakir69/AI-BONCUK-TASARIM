import { Icon, type IconName } from "../../shared/Icon";

interface ToolDefinition {
  label: string;
  icon: IconName;
  availableIn: string;
  prominent?: boolean;
}

const tools: ToolDefinition[] = [
  { label: "Yeni proje", icon: "file", availableIn: "Aşama 4" },
  { label: "Aç", icon: "folder", availableIn: "Aşama 4" },
  { label: "Kaydet", icon: "save", availableIn: "Aşama 4" },
  { label: "Geri al", icon: "undo", availableIn: "Aşama 3" },
  { label: "Yinele", icon: "redo", availableIn: "Aşama 3" },
  { label: "Dışa aktar", icon: "export", availableIn: "Aşama 4", prominent: true },
];

export function Toolbar() {
  return (
    <nav aria-label="Proje araçları" className="toolbar">
      {tools.map((tool, index) => (
        <div className={index === 3 ? "toolbar__item toolbar__item--separated" : "toolbar__item"} key={tool.label}>
          <button
            className={tool.prominent ? "tool-button tool-button--accent" : "tool-button"}
            disabled
            title={`${tool.availableIn} kapsamında etkinleşecek`}
            type="button"
          >
            <Icon name={tool.icon} />
            <span>{tool.label}</span>
          </button>
          <span className="sr-only">{tool.availableIn} kapsamında etkinleşecek</span>
        </div>
      ))}
    </nav>
  );
}

