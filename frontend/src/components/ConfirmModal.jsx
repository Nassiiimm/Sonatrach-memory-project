import React from 'react';
import { AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'warning', // 'warning' | 'danger' | 'success'
  loading = false
}) {
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle size={24} />,
    danger: <AlertTriangle size={24} />,
    success: <CheckCircle size={24} />
  };

  const colors = {
    warning: 'var(--accent)',
    danger: '#ef4444',
    success: '#22c55e'
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-icon" style={{ color: colors[variant] }}>
          {icons[variant]}
        </div>

        <h3 className="confirm-modal-title">{title}</h3>

        {message && <p className="confirm-modal-message">{message}</p>}

        <div className="confirm-modal-actions">
          <button
            className={`btn ${variant === 'danger' ? 'danger' : ''}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="spinning" size={16} />
                Traitement...
              </>
            ) : (
              confirmText
            )}
          </button>
          <button className="btn subtle" onClick={onClose} disabled={loading}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
