import React from 'react';

/**
 * Пиксель-арт иконки, оптимизированные под стиль ретро-RPG
 * shape-rendering="crispEdges" сохраняет идеальную резкость без размытия
 */
export function PixelIcon({ name, size = 24, color, className = '' }) {
  const s = size;

  switch (name) {
    case 'ruby':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          {/* Тень рубина */}
          <path d="M5 2h6v2h2v2h2v4h-2v2h-2v2H5v-2H3v-2H1V6h2V4h2V2z" fill="#1f0a0a" />
          {/* Основное тело рубина */}
          <path d="M5 3h6v2h2v2h1v2h-1v2h-2v2H5v-2H3v-2H2V7h1V5h2V3z" fill="#9c1c1c" />
          {/* Средние тона */}
          <path d="M5 4h6v2h1v4h-1v1h-2v1H7V9H5V6H4V5h1V4z" fill="#c4302b" />
          {/* Светлые фасетки */}
          <path d="M6 4h4v1h1v2h-1V6H6V5H5V4h1z" fill="#e74c3c" />
          {/* Блик */}
          <rect x="6" y="5" width="2" height="2" fill="#ffb4a2" />
          <rect x="8" y="7" width="1" height="1" fill="#ffffff" />
        </svg>
      );

    case 'chest':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          {/* Контур сундука */}
          <path d="M2 3h12v11H2V3z" fill="#1b120c" />
          {/* Дерево */}
          <path d="M3 4h10v3H3V4zm0 5h10v4H3V9z" fill="#8c6239" />
          {/* Металлическая окантовка и полосы */}
          <path d="M2 3h12v2H2V3zm0 5h12v1H2V8zm0 5h12v1H2v-1z" fill="#5c442c" />
          <path d="M4 3h2v11H4V3zm6 0h2v11h-2V3z" fill="#3a2818" />
          {/* Золотой замок */}
          <rect x="7" y="7" width="2" height="3" fill="#d4af37" />
          <rect x="7" y="8" width="2" height="1" fill="#1b120c" />
        </svg>
      );

    case 'clipboard':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          {/* Планшетка */}
          <rect x="2" y="2" width="12" height="13" fill="#1b120c" />
          <rect x="3" y="3" width="10" height="11" fill="#a48051" />
          {/* Верхний зажим */}
          <rect x="5" y="1" width="6" height="3" fill="#3a2818" />
          <rect x="6" y="2" width="4" height="1" fill="#d4af37" />
          {/* Строки и галочки */}
          <rect x="4" y="5" width="2" height="2" fill="#58792c" />
          <rect x="7" y="5" width="5" height="1" fill="#2b1d12" />
          <rect x="4" y="8" width="2" height="2" fill="#58792c" />
          <rect x="7" y="8" width="5" height="1" fill="#2b1d12" />
          <rect x="4" y="11" width="2" height="2" fill="#58792c" />
          <rect x="7" y="11" width="5" height="1" fill="#2b1d12" />
        </svg>
      );

    case 'stats':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          {/* Столбики графика */}
          <rect x="2" y="10" width="3" height="4" fill="#1b120c" />
          <rect x="3" y="11" width="1" height="2" fill="#8c6239" />

          <rect x="6" y="6" width="3" height="8" fill="#1b120c" />
          <rect x="7" y="7" width="1" height="6" fill="#a48051" />

          <rect x="10" y="2" width="3" height="12" fill="#1b120c" />
          <rect x="11" y="3" width="1" height="10" fill="#6f8f3a" />

          {/* Базовая линия */}
          <rect x="1" y="13" width="14" height="2" fill="#1b120c" />
        </svg>
      );

    case 'chevron':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          <path
            d="M6 3h2v2h2v2h2v2h-2v2H8v2H6v-2h2v-2h2V7H8V5H6V3z"
            fill={color || 'var(--text-on-dark)'}
          />
        </svg>
      );

    case 'nav-profile':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          {/* Голова */}
          <rect x="6" y="2" width="4" height="4" fill="currentColor" />
          <rect x="5" y="3" width="6" height="2" fill="currentColor" />
          {/* Плечи */}
          <rect x="4" y="8" width="8" height="2" fill="currentColor" />
          <rect x="3" y="10" width="10" height="3" fill="currentColor" />
        </svg>
      );

    case 'nav-games':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          {/* Геймпад */}
          <rect x="3" y="5" width="10" height="6" fill="currentColor" />
          <rect x="2" y="7" width="12" height="3" fill="currentColor" />
          {/* Ручки снизу */}
          <rect x="3" y="11" width="2" height="2" fill="currentColor" />
          <rect x="11" y="11" width="2" height="2" fill="currentColor" />
          {/* Крестовина / кнопки */}
          <rect x="4" y="7" width="2" height="2" fill="#160f0a" />
          <rect x="10" y="7" width="2" height="2" fill="#160f0a" />
        </svg>
      );

    case 'nav-cases':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          {/* Куб / Кейс в изометрии */}
          <rect x="4" y="2" width="8" height="3" fill="currentColor" />
          <rect x="3" y="4" width="10" height="3" fill="currentColor" />
          <rect x="3" y="7" width="10" height="6" fill="currentColor" />
          {/* Лента */}
          <rect x="7" y="2" width="2" height="11" fill="#160f0a" />
          <rect x="3" y="7" width="10" height="1" fill="#160f0a" />
        </svg>
      );

    case 'nav-shop':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          {/* Козырёк лавки */}
          <rect x="3" y="3" width="10" height="3" fill="currentColor" />
          <rect x="2" y="5" width="12" height="2" fill="currentColor" />
          {/* Столбы */}
          <rect x="3" y="7" width="2" height="5" fill="currentColor" />
          <rect x="11" y="7" width="2" height="5" fill="currentColor" />
          {/* Прилавок */}
          <rect x="3" y="10" width="10" height="3" fill="currentColor" />
          <rect x="2" y="12" width="12" height="1" fill="currentColor" />
        </svg>
      );

    case 'check':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 16 16"
          fill="none"
          shapeRendering="crispEdges"
          className={className}
        >
          <path
            d="M13 4l-7 7-3-3 1.5-1.5L6 8l5.5-5.5L13 4z"
            fill={color || 'var(--accent-green)'}
          />
        </svg>
      );

    default:
      return null;
  }
}
