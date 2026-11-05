import React from 'react';
import { TEXT } from '../../constants/text';

/**
 * Бейдж происхождения предмета (Эксклюзивный ✨ / Стартовый ⭐)
 * @param {boolean} isExclusive - эксклюзивный предмет (из кейсов)
 * @param {boolean} isStarter - стартовый предмет персонажа
 * @param {boolean} compact - компактный текст ('Эксклюзив' / 'Стартовый')
 * @param {boolean} iconOnly - только иконка без подписи
 * @param {string} className - дополнительные CSS-классы
 */
export function ItemBadge({
  isExclusive,
  isStarter,
  compact = false,
  iconOnly = false,
  className = '',
}) {
  if (isExclusive) {
    return (
      <span
        className={`item-badge-exclusive ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: iconOnly ? '1px 4px' : compact ? '1px 5px' : '2px 8px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          color: '#ffffff',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: compact ? '9px' : '11px',
          boxShadow: '0 1px 4px rgba(124, 58, 237, 0.4)',
          border: '1px solid #a78bfa',
          letterSpacing: '0.2px',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}
      >
        <span>✨</span>
        {!iconOnly && <span>{compact ? TEXT.BADGES.EXCLUSIVE : TEXT.BADGES.EXCLUSIVE_FULL}</span>}
      </span>
    );
  }

  if (isStarter) {
    return (
      <span
        className={`item-badge-starter ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: iconOnly ? '1px 4px' : compact ? '1px 5px' : '2px 8px',
          borderRadius: '6px',
          backgroundColor: 'rgba(110, 85, 56, 0.25)',
          color: '#422813',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: compact ? '9px' : '11px',
          border: '1px solid rgba(110, 85, 56, 0.45)',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}
      >
        <span>⭐</span>
        {!iconOnly && <span>{compact ? TEXT.BADGES.STARTER : TEXT.BADGES.STARTER_FULL}</span>}
      </span>
    );
  }

  return null;
}
