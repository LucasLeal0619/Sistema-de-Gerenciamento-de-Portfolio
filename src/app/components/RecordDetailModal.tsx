import { useEffect } from "react";

export type RecordDetailField = {
  label: string;
  value?: unknown;
  full?: boolean;
  multiline?: boolean;
};

function displayValue(value: unknown) {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  const text = String(value).trim();
  if (!text || text.toLowerCase() === "undefined" || text.toLowerCase() === "null") return "—";
  return text;
}

export function RecordDetailModal({
  title = "Detalhes do Registro",
  subtitle,
  fields,
  onClose,
  onEdit,
  canEdit = true,
  editLabel = "Editar",
  wide = false,
}: {
  title?: string;
  subtitle: string;
  fields: RecordDetailField[];
  onClose: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  editLabel?: string;
  wide?: boolean;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="rdm-overlay" onClick={onClose}>
      <div
        className={`rdm-modal${wide ? " rdm-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rdm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rdm-header">
          <div>
            <h2 id="rdm-title">{title}</h2>
            <p className="rdm-subtitle">{subtitle}</p>
          </div>
          <button type="button" className="rdm-close" onClick={onClose} aria-label="Fechar" title="Fechar">
            ×
          </button>
        </div>

        <div className="rdm-body">
          <div className="rdm-grid">
            {fields.map((field) => (
              <div
                key={field.label}
                className={`rdm-field${field.full || field.multiline ? " rdm-field-full" : ""}`}
              >
                <span className="rdm-label">{field.label}</span>
                <div className={`rdm-value${field.multiline ? " rdm-value-multi" : ""}`}>
                  {displayValue(field.value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rdm-actions">
          {canEdit && onEdit ? (
            <button type="button" className="rdm-btn-edit" onClick={onEdit}>
              {editLabel}
            </button>
          ) : null}
          <button type="button" className="rdm-btn-close" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
