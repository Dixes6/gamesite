import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitGameResult } from '../../api/client';
import { PixelIcon } from '../common/PixelIcon';
import { TEXT } from '../../constants/text';

// Палитра градиентов для обычных сфер
const SPHERE_COLORS = [
  { bg: 'radial-gradient(circle at 35% 35%, #ff6b6b, #c4302b 70%, #68120f)', border: '#ffa8a8', shadow: 'rgba(196, 48, 43, 0.6)' },
  { bg: 'radial-gradient(circle at 35% 35%, #69db7c, #2b8a3e 70%, #14491f)', border: '#b2f2bb', shadow: 'rgba(43, 138, 62, 0.6)' },
  { bg: 'radial-gradient(circle at 35% 35%, #4dabf7, #1864ab 70%, #0c3358)', border: '#a5d8ff', shadow: 'rgba(24, 100, 171, 0.6)' },
  { bg: 'radial-gradient(circle at 35% 35%, #da77f2, #862e9c 70%, #461453)', border: '#eebefa', shadow: 'rgba(134, 46, 156, 0.6)' },
  { bg: 'radial-gradient(circle at 35% 35%, #ffa94d, #d9480f 70%, #6d2204)', border: '#ffd8a8', shadow: 'rgba(217, 72, 15, 0.6)' },
];

// Золотая сфера
const GOLDEN_COLOR = {
  bg: 'radial-gradient(circle at 35% 35%, #fff9db, #ffd43b 45%, #f59f00 75%, #a66300)',
  border: '#ffe066',
  shadow: 'rgba(255, 212, 59, 0.95)',
};

export function GameClicker({ onExit }) {
  const { token, refreshUser } = useAuth();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targets, setTargets] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Защитный флаг от повторного начисления наград
  const hasFinishedRef = useRef(false);

  const targetsRef = useRef([]);
  targetsRef.current = targets;

  const livesRef = useRef(3);
  livesRef.current = lives;

  const scoreRef = useRef(0);
  scoreRef.current = score;

  const spawnTimerRef = useRef(null);

  // Завершение игры: очищает все таймеры и активные цели
  const handleFinish = useCallback(
    async (reason) => {
      // Защита от повторного вызова
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;

      // Мгновенно останавливаем процесс и удаляем цели с поля
      setIsPlaying(false);
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
      setTargets([]);
      setFloatingTexts([]);

      const finalScore = scoreRef.current;
      setSubmitting(true);

      let earnedRubies = 0;
      let errorText = null;

      try {
        if (token) {
          const res = await submitGameResult('clicker', finalScore, token);
          earnedRubies = res && typeof res.reward === 'number' ? res.reward : finalScore;
          await refreshUser();
        }
      } catch (err) {
        console.error('Ошибка сохранения результата кликера:', err);
        errorText = err.message || 'Ошибка соединения с сервером';
      } finally {
        setSubmitting(false);
      }

      setResultModal({
        title: reason === 'game_over' ? TEXT.GAMES.CLICKER.GAME_OVER_TITLE : TEXT.GAMES.CLICKER.RESULT_TITLE,
        subtitle: reason === 'game_over' ? TEXT.GAMES.CLICKER.GAME_OVER_SUBTITLE : 'Вы успешно завершили сессию.',
        score: finalScore,
        reward: earnedRubies,
        error: errorText,
      });
      setShowExitConfirm(false);
    },
    [token, refreshUser]
  );

  // Обработка пропущенной сферы (закончилось время жизни)
  const handleTargetTimeout = useCallback(
    (targetId, isGolden) => {
      // Если игра уже завершена или на паузе (модалка выхода) — игнорируем
      if (hasFinishedRef.current || !isPlaying || showExitConfirm) return;

      // Удаляем сферу из списка
      setTargets((prev) => prev.filter((t) => t.id !== targetId));

      // Золотая сфера — бонусная, пропуск не снимает жизнь
      if (isGolden) return;

      // Обычная сфера — отнимаем 1 жизнь
      setLives((prevLives) => {
        const newLives = prevLives - 1;
        livesRef.current = newLives;
        if (newLives <= 0) {
          handleFinish('game_over');
          return 0;
        }
        return newLives;
      });
    },
    [handleFinish, isPlaying, showExitConfirm]
  );

  // Нажатие на сферу игроком
  const handleTargetClick = (e, target) => {
    e.stopPropagation();
    if (!isPlaying || resultModal || showExitConfirm || hasFinishedRef.current) return;

    // Добавляем очки: обычная +1, золотая +50
    const pointsGain = target.isGolden ? 50 : 1;
    const newScore = scoreRef.current + pointsGain;
    scoreRef.current = newScore;
    setScore(newScore);

    // Удаляем нажатую сферу
    setTargets((prev) => prev.filter((t) => t.id !== target.id));

    // Всплывающий текст с очками
    const popupId = Date.now() + Math.random();
    setFloatingTexts((prev) => [
      ...prev,
      {
        id: popupId,
        text: target.isGolden ? '+50 ⭐' : '+1',
        isGolden: target.isGolden,
        x: target.x,
        y: target.y,
      },
    ]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== popupId));
    }, 800);
  };

  // Спавн новой сферы
  const spawnNewTarget = useCallback(() => {
    if (!isPlaying || showExitConfirm || resultModal || hasFinishedRef.current) return;

    const currentScore = scoreRef.current;

    // Лимит одновременных целей на экране увеличивается с прогрессом
    const maxConcurrent =
      currentScore < 5 ? 2 :
      currentScore < 15 ? 3 :
      currentScore < 30 ? 4 : 5;

    if (targetsRef.current.length >= maxConcurrent) return;

    const difficultyLevel = Math.min(10, Math.floor(currentScore / 15));

    // Шанс золотой сферы: 12% (не более 1 золотой на экране одновременно)
    const hasGoldenAlready = targetsRef.current.some((t) => t.isGolden);
    const isGolden = !hasGoldenAlready && Math.random() < 0.12;

    const baseDuration = isGolden ? 1.2 : 2.4;
    const duration = Math.max(isGolden ? 0.65 : 1.1, baseDuration - difficultyLevel * 0.12);

    const baseSize = isGolden ? 60 : 70;
    const size = Math.max(42, baseSize - difficultyLevel * 2.5);

    const color = isGolden
      ? GOLDEN_COLOR
      : SPHERE_COLORS[Math.floor(Math.random() * SPHERE_COLORS.length)];

    // Подбор позиции без наложения на другие сферы
    let bestX = Math.floor(Math.random() * 68) + 12;
    let bestY = Math.floor(Math.random() * 62) + 14;
    let maxMinDist = 0;

    for (let attempt = 0; attempt < 8; attempt++) {
      const testX = Math.floor(Math.random() * 68) + 12;
      const testY = Math.floor(Math.random() * 62) + 14;

      let minDist = 999;
      for (const t of targetsRef.current) {
        const dist = Math.hypot(testX - t.x, testY - t.y);
        if (dist < minDist) minDist = dist;
      }

      if (minDist > 18) {
        bestX = testX;
        bestY = testY;
        break;
      }
      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        bestX = testX;
        bestY = testY;
      }
    }

    const newTarget = {
      id: Date.now() + Math.random(),
      isGolden,
      duration,
      size,
      color,
      x: bestX,
      y: bestY,
    };

    setTargets((prev) => [...prev, newTarget]);
  }, [isPlaying, showExitConfirm, resultModal]);

  // Запуск интервала спавна: чем больше очков, тем чаще появляются новые сферы
  useEffect(() => {
    if (!isPlaying || showExitConfirm || resultModal) return;

    // Частота спавна:
    // 0-4 очков: каждые 950ms
    // 5-14 очков: каждые 750ms
    // 15-29 очков: каждые 550ms
    // 30+ очков: каждые 420ms
    const intervalTime =
      score < 5 ? 950 :
      score < 15 ? 750 :
      score < 30 ? 550 : 420;

    spawnTimerRef.current = setInterval(spawnNewTarget, intervalTime);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [isPlaying, showExitConfirm, resultModal, score, spawnNewTarget]);

  // Первичный спавн при старте
  useEffect(() => {
    spawnNewTarget();
  }, []);

  // Перезапуск игры
  const restartGame = useCallback(() => {
    hasFinishedRef.current = false;
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    setTargets([]);
    setFloatingTexts([]);
    setIsPlaying(true);
    setShowExitConfirm(false);
    setResultModal(null);
    setTimeout(spawnNewTarget, 200);
  }, [spawnNewTarget]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        flex: 1,
        padding: '14px 16px 20px 16px',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes shrinkSphere {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75% {
            opacity: 0.95;
          }
          100% {
            transform: scale(0.12);
            opacity: 0.25;
          }
        }
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-30px) scale(1.2);
          }
        }
        @keyframes goldenPulse {
          0%, 100% {
            box-shadow: 0 0 14px rgba(255, 212, 59, 0.8), inset 0 0 8px #ffffff;
          }
          50% {
            box-shadow: 0 0 24px rgba(255, 212, 59, 1), inset 0 0 12px #ffffff;
          }
        }
      `}</style>

      {/* Верхняя панель: кнопка выхода, жизни и счётчик */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          gap: '8px',
        }}
      >
        {/* Кнопка выхода */}
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          style={{
            padding: '7px 12px',
            backgroundColor: 'rgba(196, 48, 43, 0.12)',
            color: 'var(--ruby)',
            border: '1.5px solid rgba(196, 48, 43, 0.4)',
            borderRadius: '8px',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {TEXT.GAMES.CLICKER.EXIT_BTN}
        </button>

        {/* Жизни */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            backgroundColor: 'rgba(255, 246, 228, 0.75)',
            border: '1.5px solid rgba(110, 85, 56, 0.35)',
            borderRadius: '8px',
            fontSize: '16px',
          }}
        >
          <span style={{ filter: lives >= 1 ? 'none' : 'grayscale(1) opacity(0.3)' }}>❤️</span>
          <span style={{ filter: lives >= 2 ? 'none' : 'grayscale(1) opacity(0.3)' }}>❤️</span>
          <span style={{ filter: lives >= 3 ? 'none' : 'grayscale(1) opacity(0.3)' }}>❤️</span>
        </div>

        {/* Счёт */}
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: 'rgba(255, 246, 228, 0.75)',
            border: '1.5px solid rgba(110, 85, 56, 0.35)',
            borderRadius: '8px',
            textAlign: 'center',
            minWidth: '70px',
          }}
        >
          <div style={{ fontSize: '9px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            {TEXT.GAMES.CLICKER.SCORE}
          </div>
          <div style={{ fontSize: '16px', color: 'var(--ink)', fontFamily: 'var(--font-pixel)', lineHeight: 1.1 }}>
            {score}
          </div>
        </div>
      </div>

      {/* Центр экрана: Игровая арена кликера */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '420px',
            height: '100%',
            minHeight: '400px',
            maxHeight: 'calc(100vh - 210px)',
            margin: '0 auto',
            backgroundColor: '#3b2818',
            border: '4px solid #281a0e',
            borderRadius: '16px',
            boxShadow: 'inset 0 4px 14px rgba(0, 0, 0, 0.7), 0 4px 14px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            touchAction: 'manipulation',
            cursor: 'crosshair',
          }}
        >
          {/* Фоновый пергаментный узор арены */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.12,
              backgroundImage:
                'radial-gradient(#ffd700 1px, transparent 1px), radial-gradient(#ffd700 1px, #3b2818 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
              pointerEvents: 'none',
            }}
          />

          {/* Сферы (кнопки-мишени) */}
          {targets.map((target) => (
            <div
              key={target.id}
              onPointerDown={(e) => handleTargetClick(e, target)}
              onAnimationEnd={() => handleTargetTimeout(target.id, target.isGolden)}
              style={{
                position: 'absolute',
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}px`,
                height: `${target.size}px`,
                borderRadius: '50%',
                background: target.color.bg,
                border: `2.5px solid ${target.color.border}`,
                boxShadow: target.isGolden
                  ? '0 0 16px rgba(255, 212, 59, 0.95), inset 0 0 10px #ffffff'
                  : `0 3px 10px ${target.color.shadow}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                animation: target.isGolden
                  ? `shrinkSphere ${target.duration}s linear forwards, goldenPulse 0.6s infinite`
                  : `shrinkSphere ${target.duration}s linear forwards`,
                animationPlayState: showExitConfirm ? 'paused' : 'running',
                transformOrigin: 'center center',
                zIndex: target.isGolden ? 10 : 5,
              }}
            >
              {target.isGolden ? (
                <span style={{ fontSize: '20px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
                  ⭐
                </span>
              ) : (
                <div
                  style={{
                    width: '32%',
                    height: '32%',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.55)',
                    boxShadow: '0 0 4px #ffffff',
                  }}
                />
              )}
            </div>
          ))}

          {/* Всплывающие очки (+1, +50 ⭐) */}
          {floatingTexts.map((item) => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                fontFamily: 'var(--font-pixel)',
                fontSize: item.isGolden ? '20px' : '16px',
                fontWeight: 'bold',
                color: item.isGolden ? '#ffd700' : '#ffffff',
                textShadow: item.isGolden
                  ? '0 0 8px rgba(255, 215, 0, 0.9), 1px 1px 0 #000'
                  : '1px 1px 2px #000',
                animation: 'floatUp 0.8s ease-out forwards',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Подсказка */}
      <div
        style={{
          marginTop: '8px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--ink-muted)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {TEXT.GAMES.CLICKER.HINT_DIFFICULTY}
      </div>

      {/* Модальное окно подтверждения выхода */}
      {showExitConfirm && (
        <div
          onClick={() => setShowExitConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(18, 11, 7, 0.8)',
            zIndex: 250,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '320px',
              backgroundColor: 'var(--bg-parchment)',
              border: '3px solid #573f27',
              borderRadius: '16px',
              padding: '22px 18px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '32px' }}>🚪</span>
            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '19px', color: 'var(--ink)' }}>
              {TEXT.GAMES.CLICKER.CONFIRM_EXIT_TITLE}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
              {TEXT.GAMES.CLICKER.CONFIRM_EXIT_TEXT}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinish('exit')}
                style={{
                  padding: '11px',
                  backgroundColor: 'var(--panel-olive)',
                  color: 'var(--text-on-dark)',
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '2px solid #283121',
                  cursor: 'pointer',
                }}
              >
                {submitting ? TEXT.GAMES.CLICKER.SENDING_RESULT : TEXT.GAMES.CLICKER.CONFIRM_EXIT}
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                style={{
                  padding: '9px',
                  backgroundColor: 'transparent',
                  color: 'var(--ink-muted)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: '1px solid rgba(110, 85, 56, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {TEXT.GAMES.CLICKER.CONTINUE_PLAY}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно итогов игры */}
      {resultModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(18, 11, 7, 0.85)',
            zIndex: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              backgroundColor: 'var(--bg-parchment)',
              border: resultModal.reward >= 50 ? '3px solid #ffd700' : '3px solid #573f27',
              borderRadius: '16px',
              padding: '24px 18px',
              boxShadow: resultModal.reward >= 50 ? '0 0 25px rgba(255, 212, 59, 0.6)' : '0 10px 30px rgba(0, 0, 0, 0.9)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '38px' }}>
              {resultModal.reward >= 50 ? '🏆' : '🎯'}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '20px', color: 'var(--ink)' }}>
                {resultModal.title}
              </h3>
              {resultModal.subtitle && (
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.3 }}>
                  {resultModal.subtitle}
                </p>
              )}
            </div>

            {/* Карточка наград и счета */}
            <div
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'rgba(255, 246, 228, 0.75)',
                border: '1.5px solid rgba(110, 85, 56, 0.35)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Ошибка отправки результата */}
              {resultModal.error ? (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#fff',
                    backgroundColor: 'rgba(196, 48, 43, 0.9)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {resultModal.error}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <PixelIcon name="ruby" size={24} />
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '22px', color: 'var(--ruby)', fontWeight: 700 }}>
                    +{resultModal.reward.toLocaleString('ru-RU')}
                  </span>
                </div>
              )}

              {/* Статистика: Набрано очков */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  paddingTop: '6px',
                  borderTop: '1px dashed rgba(110, 85, 56, 0.3)',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}>
                    {TEXT.GAMES.CLICKER.SCORE}
                  </div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '18px', color: 'var(--ink)' }}>
                    {resultModal.score}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}>
                    Награда
                  </div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '18px', color: 'var(--ruby)' }}>
                    +{resultModal.reward} 💎
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={restartGame}
                style={{
                  padding: '11px',
                  backgroundColor: 'var(--panel-olive)',
                  color: 'var(--text-on-dark)',
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '2px solid #283121',
                  cursor: 'pointer',
                }}
              >
                {TEXT.GAMES.CLICKER.PLAY_AGAIN}
              </button>

              <button
                type="button"
                onClick={onExit}
                style={{
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: 'var(--ink-muted)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: '1.5px solid rgba(110, 85, 56, 0.35)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {TEXT.GAMES.CLICKER.TO_GAMES_MENU}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
