import React from 'react';
import { PixelIcon } from '../common/PixelIcon';
import { TEXT } from '../../constants/text';

const TABS = [
  { id: 'profile', label: TEXT.NAV.PROFILE, icon: 'nav-profile' },
  { id: 'games', label: TEXT.NAV.GAMES, icon: 'nav-games' },
  { id: 'cases', label: TEXT.NAV.CASES, icon: 'nav-cases' },
  { id: 'shop', label: TEXT.NAV.SHOP, icon: 'nav-shop' },
];

/**
 * Нижняя панель навигации в ретро-стиле
 */
export function BottomNav({ activeTab = 'profile', onTabChange }) {
  return (
    <nav
      className="bottom-nav-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--nav-bg)',
        borderTop: '3px solid #3d2d1f',
        boxShadow: '0 -4px 14px rgba(0, 0, 0, 0.65)',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        display: 'flex',
      }}
    >
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <React.Fragment key={tab.id}>
            <button
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                flex: 1,
                padding: '10px 4px 8px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: isActive ? 'var(--accent-green)' : 'var(--nav-inactive)',
                position: 'relative',
                transition: 'color 0.15s ease',
              }}
            >
              <PixelIcon name={tab.icon} size={22} />
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-pixel)',
                  letterSpacing: '0.3px',
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </span>

              {/* Зелёная полоса активной вкладки */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    width: '28px',
                    height: '2.5px',
                    backgroundColor: 'var(--accent-green)',
                    borderRadius: '2px',
                    boxShadow: '0 0 6px rgba(111, 143, 58, 0.6)',
                  }}
                />
              )}
            </button>

            {/* Разделитель между вкладками */}
            {index < TABS.length - 1 && (
              <div
                style={{
                  width: '1px',
                  height: '24px',
                  alignSelf: 'center',
                  backgroundColor: 'rgba(154, 133, 103, 0.2)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
