import React from 'react';
import { PixelIcon } from './PixelIcon';

/**
 * Главная кнопка-панель (как на эталонном экране профиля)
 * Имеет оливковый фон, рельефную двойную рамку, пиксельную иконку и шеврон
 */
export function PanelButton({
  icon,
  title,
  subtitle,
  onClick,
  disabled = false,
  badge = null,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`panel-button ${className}`}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 14px',
        backgroundColor: 'var(--panel-olive)',
        border: '2px solid #283121',
        borderRadius: '12px',
        outline: '1.5px solid var(--panel-olive-border)',
        outlineOffset: '-4px',
        boxShadow: '0 3px 6px rgba(22, 15, 10, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        textAlign: 'left',
        gap: '14px',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {/* Пиксельная иконка слева */}
      {icon && (
        <div
          style={{
            width: '42px',
            height: '42px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(27, 34, 22, 0.55)',
            border: '1.5px solid rgba(125, 140, 92, 0.4)',
            borderRadius: '8px',
          }}
        >
          {typeof icon === 'string' ? <PixelIcon name={icon} size={28} /> : icon}
        </div>
      )}

      {/* Текстовый блок (название + пояснение) */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '16px',
              color: 'var(--text-on-dark)',
              fontWeight: 400,
              lineHeight: 1.2,
            }}
          >
            {title}
          </span>
          {badge !== null && (
            <span
              style={{
                backgroundColor: 'var(--ruby)',
                color: '#fff',
                fontSize: '11px',
                fontFamily: 'var(--font-pixel)',
                padding: '1px 6px',
                borderRadius: '8px',
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {subtitle && (
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-on-dark)',
              opacity: 0.82,
              marginTop: '3px',
              lineHeight: 1.2,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Шеврон перехода справа */}
      <div style={{ flexShrink: 0, opacity: 0.8, display: 'flex', alignItems: 'center' }}>
        <PixelIcon name="chevron" size={14} color="var(--text-on-dark)" />
      </div>
    </button>
  );
}
