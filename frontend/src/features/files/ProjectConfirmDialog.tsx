interface ProjectConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel(): void;
  onConfirm(): void;
}

export function ProjectConfirmDialog({
  title, message, confirmLabel, onCancel, onConfirm,
}: ProjectConfirmDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="project-confirm-title" aria-modal="true" className="dialog project-confirm-dialog" role="alertdialog">
        <div className="dialog__header">
          <div>
            <span className="eyebrow">Kaydedilmemiş değişiklikler</span>
            <h2 id="project-confirm-title">{title}</h2>
          </div>
        </div>
        <p>{message}</p>
        <div className="dialog__actions">
          <button className="button button--secondary" onClick={onCancel} type="button">Vazgeç</button>
          <button className="button button--danger" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
