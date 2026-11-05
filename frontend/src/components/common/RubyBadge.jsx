import React from 'react';
import { PixelIcon } from './PixelIcon';
import { formatNumber } from './ProgressBar';
import { TEXT } from '../../constants/text';

/**
 * Блок отображения баланса рубинов (как на референсе дизайн.png)
 */
export function RubyBadge({ amount = 0, className = '' }) {
  return (
    <div
      className={`ruby-badge-card ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        backgroundColor: 'rgba(255, 246, 228, 0.45)',
        border: '1.5px solid rgba(110, 85, 56, 0.35)',
        borderRadius: '12px',
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 2px 5px rgba(43, 29, 18, 0.08)',
      }}
    >
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <PixelIcon name="ruby" size={32} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--ink-muted)',
            lineHeight: 1.2,
          }}
        >
          {TEXT.PROFILE.RUBIES}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '22px',
            color: 'var(--ink)',
            lineHeight: 1.1,
            fontWeight: 700,
          }}
        >
          {formatNumber(amount)}
        </span>
      </div>
    </div>
  );
}
