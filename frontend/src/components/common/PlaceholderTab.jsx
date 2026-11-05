import React from 'react';
import { PixelLandscape } from './PixelLandscape';
import { TEXT } from '../../constants/text';

export function PlaceholderTab({ tabId }) {
  const getInfo = () => {
    switch (tabId) {
      case 'games':
        return {
          title: TEXT.NAV.GAMES,
          text: TEXT.COMING_SOON.GAMES,
          icon: '🎮',
        };
      case 'cases':
        return {
          title: TEXT.NAV.CASES,
          text: TEXT.COMING_SOON.CASES,
          icon: '📦',
        };
      case 'shop':
        return {
          title: TEXT.NAV.SHOP,
          text: TEXT.COMING_SOON.SHOP,
          icon: '🏪',
        };
      default:
        return {
          title: 'Раздел',
          text: 'Скоро появится',
          icon: '⚔️',
        };
    }
  };

  const info = getInfo();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        flex: 1,
        padding: '16px 18px 84px 18px',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--ink)' }}>{info.title}</h1>
        <div
          style={{
            marginTop: '6px',
            height: '1.5px',
            backgroundColor: 'rgba(43, 29, 18, 0.35)',
            width: '100%',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 20px',
          backgroundColor: 'rgba(255, 246, 228, 0.4)',
          border: '2px dashed rgba(110, 85, 56, 0.3)',
          borderRadius: '14px',
          textAlign: 'center',
          gap: '12px',
          marginTop: '20px',
        }}
      >
        <span style={{ fontSize: '40px' }}>{info.icon}</span>
        <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '18px', color: 'var(--ink)' }}>
          {info.title}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--ink-muted)', maxWidth: '260px' }}>
          {info.text}
        </p>
      </div>

      <PixelLandscape />
    </div>
  );
}
