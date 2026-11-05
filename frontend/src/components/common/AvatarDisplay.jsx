import React, { useState } from 'react';
import { getImageUrl } from '../../api/client';

/**
 * Компонент для отображения Аватарки с наложенной Рамкой
 * При наличии рамки аватарка аккуратно масштабируется (inset: 16%),
 * чтобы рамка не перекрывала лицо героя.
 */
export function AvatarDisplay({
  avatarImage,
  frameImage,
  size = 88,
  alt = 'Аватар героя',
  className = '',
  onClick,
  isSelected = false,
}) {
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);

  const avatarUrl = getImageUrl(avatarImage);
  const frameUrl = getImageUrl(frameImage);

  const hasFrame = Boolean(frameUrl);
  // Толщина металлической окантовки рамки составляет около 18-20%.
  // Чтобы рамка не закрывала пол-лица, задаём отступ 16% (аватарка занимает 68% по центру
  // и аккуратно заходит под края рамки без зазоров).
  const avatarInset = hasFrame ? '16%' : '4px';
  const avatarSize = hasFrame ? '68%' : 'calc(100% - 8px)';
  const avatarRadius = hasFrame ? '4px' : '8px';

  return (
    <div
      onClick={onClick}
      className={`avatar-display-container ${className} ${isSelected ? 'selected' : ''}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '10px',
      }}
    >
      {/* Тёмная подложка под аватарку */}
      <div
        style={{
          position: 'absolute',
          top: avatarInset,
          left: avatarInset,
          width: avatarSize,
          height: avatarSize,
          backgroundColor: '#352517',
          borderRadius: avatarRadius,
          zIndex: 1,
        }}
      />

      {/* Картинка самой аватарки */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={alt}
          className="pixelated"
          onLoad={() => setAvatarLoaded(true)}
          style={{
            position: 'absolute',
            top: avatarInset,
            left: avatarInset,
            width: avatarSize,
            height: avatarSize,
            objectFit: 'cover',
            borderRadius: avatarRadius,
            zIndex: 2,
            opacity: avatarLoaded ? 1 : 0.6,
            transition: 'opacity 0.2s ease',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: avatarInset,
            left: avatarInset,
            width: avatarSize,
            height: avatarSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-on-dark)',
            fontFamily: 'var(--font-pixel)',
            fontSize: '12px',
            zIndex: 2,
          }}
        >
          ?
        </div>
      )}

      {/* Наложенная рамка поверх аватарки */}
      {frameUrl && (
        <img
          src={frameUrl}
          alt="Рамка"
          className="pixelated"
          onLoad={() => setFrameLoaded(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 3,
            opacity: frameLoaded ? 1 : 0.6,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      {/* Подсветка выбора */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            inset: '-4px',
            border: '2px solid var(--accent-green)',
            borderRadius: '12px',
            boxShadow: '0 0 8px rgba(111, 143, 58, 0.7)',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />
      )}
    </div>
  );
}
