import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { claimStreakReward } from '../../api/client';
import { PixelIcon } from '../common/PixelIcon';
import { TEXT } from '../../constants/text';

const STREAK_REWARDS = [100, 300, 500, 800, 1000, 1200, 1600];

/**
 * Расчёт оставшегося времени до 00:00 по Москве (UTC+3)
 */
function getTimeUntilMidnightMSK() {
  const now = new Date();
  // Переводим текущее системное время в UTC миллисекунды
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  // Смещение Москвы: UTC+3 часа
  const mskMs = utcMs + 3 * 3600 * 1000;
  const mskDate = new Date(mskMs);

  const hours = mskDate.getHours();
  const minutes = mskDate.getMinutes();
  const seconds = mskDate.getSeconds();
  const passedSeconds = hours * 3600 + minutes * 60 + seconds;

  const totalRemainingSeconds = Math.max(0, 86400 - passedSeconds);

  const h = Math.floor(totalRemainingSeconds / 3600);
  const m = Math.floor((totalRemainingSeconds % 3600) / 60);
  const s = totalRemainingSeconds % 60;

  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
    total: totalRemainingSeconds,
  };
}

export function StreakCard() {
  const { user, token, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [successReward, setSuccessReward] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnightMSK);

  const currentStreak = user?.current_streak || 0;
  const bestStreak = user?.best_streak || 0;
  const canClaim = !!user?.can_claim_streak;

  // Определение дня в цикле 1-7
  // Если можно забрать: день = ((currentStreak) % 7) + 1
  // Если уже забрали сегодня: день = ((currentStreak - 1) % 7) + 1
  const activeDayIndex = canClaim
    ? currentStreak % 7 // 0..6
    : currentStreak > 0
    ? (currentStreak - 1) % 7
    : 0;

  const nextRewardRubies = STREAK_REWARDS[activeDayIndex] || 100;

  // Таймер обратного отсчета до полуночи по МСК
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilMidnightMSK();
      setTimeLeft(remaining);

      // Если таймер дотикал до полуночи и кнопка была неактивна — обновляем профиль
      if (remaining.total === 0 && !canClaim) {
        refreshUser();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [canClaim, refreshUser]);

  // Забрать стрик
  const handleClaim = async () => {
    if (!token || !canClaim || loading) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await claimStreakReward(token);
      setSuccessReward(res);
      await refreshUser();
    } catch (err) {
      setErrorMessage(err.message || 'Не удалось забрать награду');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        padding: '14px',
        backgroundColor: 'var(--panel-olive)',
        border: '2px solid #283121',
        borderRadius: '12px',
        outline: '1.5px solid var(--panel-olive-border)',
        outlineOffset: '-4px',
        boxShadow: '0 3px 6px rgba(22, 15, 10, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
      }}
    >
      {/* Верхняя строка: Иконка + Заголовок + Бейдж стрика */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Иконка огонька */}
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
          <PixelIcon name="flame" size={26} />
        </div>

        {/* Текстовая инфо */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '16px',
                color: 'var(--text-on-dark)',
                lineHeight: 1.2,
              }}
            >
              {TEXT.PROFILE.STREAK_TITLE}
            </span>

            {/* Бейдж текущего стрика */}
            <span
              style={{
                backgroundColor: currentStreak > 0 ? 'var(--ruby)' : 'rgba(27, 34, 22, 0.7)',
                color: '#fff',
                fontFamily: 'var(--font-pixel)',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              🔥 {currentStreak} {TEXT.PROFILE.DAYS}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '4px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                color: 'var(--text-on-dark)',
                opacity: 0.85,
              }}
            >
              {canClaim
                ? currentStreak === 0
                  ? TEXT.PROFILE.STREAK_START_NOTICE
                  : 'Награда ждёт тебя!'
                : `${TEXT.PROFILE.STREAK_CLAIMED} ✓`}
            </span>

            {bestStreak > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-on-dark)',
                  opacity: 0.65,
                }}
              >
                Рекорд: {bestStreak} дн.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 7-дневный трек наград */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          padding: '6px',
          backgroundColor: 'rgba(20, 26, 16, 0.45)',
          borderRadius: '8px',
          border: '1px solid rgba(125, 140, 92, 0.25)',
        }}
      >
        {STREAK_REWARDS.map((rubies, index) => {
          const dayNum = index + 1;
          const isCurrentTarget = index === activeDayIndex;
          const isClaimedInCycle = !canClaim
            ? index <= activeDayIndex
            : index < activeDayIndex;

          let bg = 'rgba(40, 49, 33, 0.5)';
          let borderColor = 'transparent';
          let textColor = 'rgba(239, 227, 200, 0.5)';

          if (isClaimedInCycle) {
            bg = 'rgba(111, 143, 58, 0.35)';
            borderColor = 'var(--accent-green)';
            textColor = '#9dcf5b';
          } else if (isCurrentTarget && canClaim) {
            bg = 'rgba(196, 48, 43, 0.35)';
            borderColor = '#ff7b72';
            textColor = '#fff';
          }

          return (
            <div
              key={dayNum}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '4px 2px',
                borderRadius: '6px',
                backgroundColor: bg,
                border: `1.5px solid ${borderColor}`,
                position: 'relative',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  color: textColor,
                }}
              >
                Д{dayNum}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '10px',
                  color: isCurrentTarget && canClaim ? '#ffdf7a' : textColor,
                  marginTop: '2px',
                }}
              >
                {rubies >= 1000 ? `${rubies / 1000}k` : rubies}
              </span>
              {isClaimedInCycle && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    fontSize: '8px',
                    color: '#9dcf5b',
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Уведомление об успешном получении */}
      {successReward && (
        <div
          style={{
            padding: '8px 10px',
            backgroundColor: 'rgba(111, 143, 58, 0.25)',
            border: '1.5px solid var(--accent-green)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-on-dark)',
          }}
        >
          <span>✨ Получено: +{successReward.amount_rubies} рубинов!</span>
          <span style={{ fontFamily: 'var(--font-pixel)', color: '#9dcf5b' }}>
            Стрик: {successReward.current_streak} дн.
          </span>
        </div>
      )}

      {/* Сообщение об ошибке (если возникла) */}
      {errorMessage && (
        <div
          style={{
            padding: '6px 10px',
            backgroundColor: 'rgba(196, 48, 43, 0.2)',
            border: '1px solid var(--ruby)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#ffb4a2',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Кнопка / Таймер */}
      {canClaim ? (
        <button
          type="button"
          onClick={handleClaim}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: 'var(--accent-green)',
            color: '#fff',
            fontFamily: 'var(--font-pixel)',
            fontSize: '14px',
            borderRadius: '8px',
            border: '2px solid #3c521f',
            outline: '1.5px solid #9dc758',
            outlineOffset: '-4px',
            boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.1s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {loading ? (
            TEXT.PROFILE.STREAK_CLAIMING
          ) : (
            <>
              <span>🔥 {TEXT.PROFILE.STREAK_CLAIM_BTN}</span>
              <span
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                +{nextRewardRubies} 💎
              </span>
            </>
          )}
        </button>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            backgroundColor: 'rgba(27, 34, 22, 0.6)',
            borderRadius: '8px',
            border: '1px solid rgba(125, 140, 92, 0.3)',
            fontSize: '12px',
            color: 'var(--text-on-dark)',
            opacity: 0.9,
          }}
        >
          <span style={{ opacity: 0.8 }}>{TEXT.PROFILE.STREAK_NEXT_IN}:</span>
          <span
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '13px',
              color: '#ffdf7a',
              letterSpacing: '0.5px',
            }}
          >
            ⏳ {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds} (МСК)
          </span>
        </div>
      )}
    </div>
  );
}
