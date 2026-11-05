import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { ProgressBar, formatNumber } from '../common/ProgressBar';
import { RubyBadge } from '../common/RubyBadge';
import { PanelButton } from '../common/PanelButton';
import { PixelLandscape } from '../common/PixelLandscape';
import { TEXT } from '../../constants/text';

/**
 * Расчёт текущего прогресса внутри уровня
 * По spec.md: BASE_XP = 5000, шаг = 500 * (level - 1)
 */
function calculateLevelProgress(level, xpToNextLevel) {
  const stepTotal = 5000 + 500 * ((level || 1) - 1);
  const currentInLevel = Math.max(0, stepTotal - (xpToNextLevel || 0));
  return { currentInLevel, stepTotal };
}

export function ProfilePage({ onOpenInventory, onOpenTasks }) {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          color: 'var(--ink-muted)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
        }}
      >
        {TEXT.PROFILE.LOADING}
      </div>
    );
  }

  const { currentInLevel, stepTotal } = calculateLevelProgress(
    user.level,
    user.xp_to_next_level
  );

  return (
    <div
      className="profile-page-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        flex: 1,
        padding: '16px 18px 84px 18px', // Отступ снизу для нижней навигации
      }}
    >
      {/* Заголовок страницы: «Профиль» с тонкой линией снизу */}
      <div style={{ marginBottom: '16px' }}>
        <h1
          style={{
            fontSize: '26px',
            color: 'var(--ink)',
            lineHeight: 1.1,
            letterSpacing: '0.5px',
          }}
        >
          {TEXT.PROFILE.TITLE}
        </h1>
        <div
          style={{
            marginTop: '6px',
            height: '1.5px',
            backgroundColor: 'rgba(43, 29, 18, 0.35)',
            width: '100%',
          }}
        />
      </div>

      {/* Верхний блок: Аватарка + Рамка, Имя, Уровень, XP-бар */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          marginBottom: '14px',
        }}
      >
        {/* Аватарка с рамкой */}
        <AvatarDisplay
          avatarImage={user.avatar_image}
          frameImage={user.frame_image}
          size={94}
        />

        {/* Инфо о герое */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '20px',
              color: 'var(--ink)',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.username}
          </span>

          <span
            style={{
              fontSize: '13px',
              color: 'var(--ink-muted)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            {TEXT.PROFILE.LEVEL_PREFIX} {user.level}
          </span>

          {/* XP Прогресс-бар */}
          <div style={{ marginTop: '4px' }}>
            <ProgressBar
              current={currentInLevel}
              max={stepTotal}
              label={`${formatNumber(currentInLevel)} / ${formatNumber(stepTotal)} ${TEXT.PROFILE.XP_UNIT}`}
            />
          </div>
        </div>
      </div>

      {/* Блок рубинов */}
      <div style={{ marginBottom: '20px' }}>
        <RubyBadge amount={user.rubies} />
      </div>

      {/* Стрик ежедневного захода (если активен) */}
      {user.current_streak > 0 && (
        <div
          style={{
            marginBottom: '16px',
            padding: '8px 12px',
            backgroundColor: 'rgba(111, 143, 58, 0.15)',
            border: '1.5px dashed var(--accent-green)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            color: 'var(--ink)',
          }}
        >
          <span style={{ fontWeight: 600 }}>🔥 {TEXT.PROFILE.STREAK}:</span>
          <span
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '14px',
              color: 'var(--panel-olive)',
            }}
          >
            {user.current_streak} {TEXT.PROFILE.DAYS}
          </span>
        </div>
      )}

      {/* Основные кнопки-панели (Инвентарь, Активные задания) — Статистика удалена */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <PanelButton
          icon="chest"
          title={TEXT.PROFILE.INVENTORY_TITLE}
          subtitle={TEXT.PROFILE.INVENTORY_SUB}
          onClick={onOpenInventory}
        />

        <PanelButton
          icon="clipboard"
          title={TEXT.PROFILE.TASKS_TITLE}
          subtitle={TEXT.PROFILE.TASKS_SUB}
          onClick={onOpenTasks}
        />
      </div>

      {/* Вторичная кнопка: Выход из аккаунта */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={logout}
          style={{
            padding: '8px 18px',
            border: '1.5px solid rgba(110, 85, 56, 0.4)',
            borderRadius: '8px',
            color: 'var(--ink-muted)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          {TEXT.PROFILE.LOGOUT}
        </button>
      </div>

      {/* Атмосферный пиксельный пейзаж */}
      <PixelLandscape />
    </div>
  );
}
