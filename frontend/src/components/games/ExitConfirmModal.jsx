import React from 'react';

/**
 * Переиспользуемое модальное окно подтверждения выхода из игры.
 * Появляется при нажатии «Выйти», переключении вкладки или кнопке «Назад» в браузере.
 */
export function ExitConfirmModal({
  isOpen,
  title,
  text,
  confirmLabel,
  sendingLabel,
  continueLabel,
  submitting = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={() => {
        if (!submitting) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 11, 7, 0.8)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '320px',
          backgroundColor: 'var(--bg-parchment)',
          border: '3px solid #573f27',
          borderRadius: '16px',
          padding: '22px 18px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '32px' }}>🚪</span>
        <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '19px', color: 'var(--ink)' }}>
          {title}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
          {text}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            style={{
              padding: '11px',
              backgroundColor: 'var(--panel-olive)',
              color: 'var(--text-on-dark)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '14px',
              borderRadius: '8px',
              border: '2px solid #283121',
              cursor: 'pointer',
            }}
          >
            {submitting ? sendingLabel : confirmLabel}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            style={{
              padding: '9px',
              backgroundColor: 'transparent',
              color: 'var(--ink-muted)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '13px',
              border: '1px solid rgba(110, 85, 56, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
