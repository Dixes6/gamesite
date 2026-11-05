import React from 'react';

/**
 * Форматирование числа с пробелом как разделителем тысяч (например, 1 450)
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Прогресс-бар опыта (XP) в стиле ретро-RPG
 */
export function ProgressBar({ current = 0, max = 100, label, className = '' }) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

  return (
    <div className={`progress-bar-wrapper ${className}`} style={{ width: '100%' }}>
      {/* Тёмный трек полосы прогресса */}
      <div
        style={{
          width: '100%',
          height: '14px',
          backgroundColor: '#261b13',
          borderRadius: '7px',
          padding: '2px',
          border: '1px solid #4a3828',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Заливка прогресса */}
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: 'var(--accent-green)',
            borderRadius: '5px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Подпись под полосой */}
      <div
        style={{
          marginTop: '5px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--ink-muted)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
        }}
      >
        <span>{label || `${formatNumber(current)} / ${formatNumber(max)} XP`}</span>
        <span style={{ fontSize: '11px', opacity: 0.85 }}>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}
