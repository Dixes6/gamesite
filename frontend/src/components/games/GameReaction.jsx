import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitGameResult } from '../../api/client';
import { PixelIcon } from '../common/PixelIcon';
import { TEXT } from '../../constants/text';

// Древние руны для ячеек поля (до 16 рун для сетки 4х4)
const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛋ'];

// Определение размера сетки в зависимости от уровня
function getGridSize(level) {
  if (level <= 2) return 2; // 2x2 = 4 плитки
  if (level <= 8) return 3; // 3x3 = 9 плиток
  return 4; // 4x4 = 16 плиток
}

// Определение длины цепочки в зависимости от уровня
function getSequenceLength(level) {
  if (level <= 2) return 3;
  if (level <= 4) return 4;
  if (level <= 6) return 5;
  if (level <= 8) return 6;
  return 7 + (level - 8);
}

// Определение скорости свечения рун (в миллисекундах)
function getFlashTiming(level) {
  if (level <= 2) return { on: 580, pause: 200 };
  if (level <= 5) return { on: 440, pause: 150 };
  if (level <= 8) return { on: 340, pause: 110 };
  return { on: 260, pause: 80 };
}

// Расчёт прогрессивной награды: +20 за 1-й, +40 за 2-й, +60 за 3-й... (сумма ряда: 10 * n * (n + 1))
function calculateReactionReward(completed) {
  if (!completed || completed <= 0) return 0;
  return 10 * completed * (completed + 1);
}

export function GameReaction({ onExit }) {
  const { token, refreshUser } = useAuth();

  const [level, setLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState(0);

  // Фазы игры: 'IDLE' | 'SHOWING' | 'PLAYER' | 'CORRECT' | 'WRONG'
  const [phase, setPhase] = useState('IDLE');

  // Активная цепочка и прогресс игрока
  const [sequence, setSequence] = useState([]);
  const [playerStep, setPlayerStep] = useState(0);

  // Текущая подсвеченная плитка
  const [litTile, setLitTile] = useState(null);
  const [wrongTile, setWrongTile] = useState(null);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Защитный флаг от повторного начисления наград
  const hasFinishedRef = useRef(false);

  const levelRef = useRef(1);
  levelRef.current = level;

  const completedLevelsRef = useRef(0);
  completedLevelsRef.current = completedLevels;

  const timeoutsRef = useRef([]);

  // Очистка всех запланированных таймаутов
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // Завершение игры и сохранение на бэкенд
  const handleFinish = useCallback(
    async (reason) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;

      clearAllTimeouts();
      setLitTile(null);

      const finalCompletedLevels = completedLevelsRef.current;
      setSubmitting(true);

      let earnedRubies = 0;
      let errorText = null;

      try {
        if (token) {
          const res = await submitGameResult('reaction', finalCompletedLevels, token);
          earnedRubies =
            res && typeof res.reward === 'number'
              ? res.reward
              : calculateReactionReward(finalCompletedLevels);
          await refreshUser();
        }
      } catch (err) {
        console.error('Ошибка сохранения результата реакции:', err);
        errorText = err.message || 'Ошибка соединения с сервером';
      } finally {
        setSubmitting(false);
      }

      setResultModal({
        title: reason === 'wrong' ? TEXT.GAMES.REACTION.GAME_OVER_TITLE : TEXT.GAMES.REACTION.RESULT_TITLE,
        subtitle: reason === 'wrong' ? TEXT.GAMES.REACTION.GAME_OVER_SUBTITLE : 'Вы успешно завершили раунд испытания.',
        completedLevels: finalCompletedLevels,
        reward: earnedRubies,
        error: errorText,
      });
      setShowExitConfirm(false);
    },
    [token, refreshUser]
  );

  // Воспроизведение последовательности для игрока
  const playSequence = useCallback(
    (seq, currentLvl) => {
      clearAllTimeouts();
      setPhase('SHOWING');
      setLitTile(null);
      setWrongTile(null);

      const { on, pause } = getFlashTiming(currentLvl);
      let cumulativeTime = 400; // небольшая начальная пауза

      seq.forEach((tileIndex, i) => {
        // Включение плитки
        const tOn = setTimeout(() => {
          if (hasFinishedRef.current) return;
          setLitTile(tileIndex);
        }, cumulativeTime);
        timeoutsRef.current.push(tOn);

        cumulativeTime += on;

        // Выключение плитки
        const tOff = setTimeout(() => {
          if (hasFinishedRef.current) return;
          setLitTile(null);
        }, cumulativeTime);
        timeoutsRef.current.push(tOff);

        cumulativeTime += pause;
      });

      // Переход к ходу игрока
      const tEnd = setTimeout(() => {
        if (hasFinishedRef.current) return;
        setPhase('PLAYER');
        setPlayerStep(0);
      }, cumulativeTime);
      timeoutsRef.current.push(tEnd);
    },
    []
  );

  // Запуск очередного уровня
  const startLevel = useCallback(
    (targetLevel) => {
      const gridSize = getGridSize(targetLevel);
      const totalTiles = gridSize * gridSize;
      const length = getSequenceLength(targetLevel);

      // Генерация случайной цепочки плиток
      const newSeq = [];
      for (let i = 0; i < length; i++) {
        newSeq.push(Math.floor(Math.random() * totalTiles));
      }

      setSequence(newSeq);
      setPlayerStep(0);
      playSequence(newSeq, targetLevel);
    },
    [playSequence]
  );

  // Нажатие кнопки «Начать раунд»
  const handleStartGame = () => {
    setLevel(1);
    setCompletedLevels(0);
    levelRef.current = 1;
    completedLevelsRef.current = 0;
    hasFinishedRef.current = false;
    startLevel(1);
  };

  // Нажатие игроком на руническую плитку
  const handleTileClick = (tileIndex) => {
    if (phase !== 'PLAYER' || showExitConfirm || resultModal || hasFinishedRef.current) return;

    // Краткая подсветка нажатой плитки
    setLitTile(tileIndex);
    setTimeout(() => {
      setLitTile(null);
    }, 180);

    const expectedTile = sequence[playerStep];

    // Верный клик!
    if (tileIndex === expectedTile) {
      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);

      // Цепочка уровня завершена полностью!
      if (nextStep >= sequence.length) {
        setPhase('CORRECT');
        const nextCompleted = completedLevels + 1;
        setCompletedLevels(nextCompleted);
        completedLevelsRef.current = nextCompleted;

        // Пауза празднования и переход на следующий уровень
        const tNext = setTimeout(() => {
          if (hasFinishedRef.current) return;
          const nextLevel = level + 1;
          setLevel(nextLevel);
          levelRef.current = nextLevel;
          startLevel(nextLevel);
        }, 900);
        timeoutsRef.current.push(tNext);
      }
    } else {
      // Ошибка!
      setPhase('WRONG');
      setWrongTile(tileIndex);

      const tWrong = setTimeout(() => {
        handleFinish('wrong');
      }, 700);
      timeoutsRef.current.push(tWrong);
    }
  };

  // Перезапуск игры
  const restartGame = useCallback(() => {
    hasFinishedRef.current = false;
    clearAllTimeouts();
    setLevel(1);
    setCompletedLevels(0);
    levelRef.current = 1;
    completedLevelsRef.current = 0;
    setSequence([]);
    setPlayerStep(0);
    setLitTile(null);
    setWrongTile(null);
    setPhase('IDLE');
    setShowExitConfirm(false);
    setResultModal(null);
  }, []);

  const currentGridSize = getGridSize(level);
  const totalTilesCount = currentGridSize * currentGridSize;

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
        @keyframes pulseSuccess {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>

      {/* Верхняя панель: кнопка выхода, уровень и награда */}
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
          {TEXT.GAMES.REACTION.EXIT_BTN}
        </button>

        {/* Индикатор текущего уровня */}
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: 'rgba(255, 246, 228, 0.75)',
            border: '1.5px solid rgba(110, 85, 56, 0.35)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '9px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            {TEXT.GAMES.REACTION.LEVEL}
          </div>
          <div style={{ fontSize: '16px', color: 'var(--ink)', fontFamily: 'var(--font-pixel)', lineHeight: 1.1 }}>
            {level}
          </div>
        </div>

        {/* Накопленная награда */}
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: 'rgba(255, 246, 228, 0.75)',
            border: '1.5px solid rgba(110, 85, 56, 0.35)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '9px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            Награда
          </div>
          <div style={{ fontSize: '15px', color: 'var(--ruby)', fontFamily: 'var(--font-pixel)', lineHeight: 1.1 }}>
            +{calculateReactionReward(completedLevels)} 💎
          </div>
        </div>
      </div>

      {/* Центр экрана: статус-баннер, руническое поле и кнопка старта */}
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
        {/* Статус-баннер текущей фазы */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            margin: '0 auto 12px auto',
            padding: '8px 12px',
            borderRadius: '10px',
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor:
              phase === 'SHOWING'
                ? 'rgba(212, 162, 55, 0.2)'
                : phase === 'PLAYER'
                ? 'rgba(111, 143, 58, 0.25)'
                : phase === 'CORRECT'
                ? 'rgba(111, 143, 58, 0.45)'
                : phase === 'WRONG'
                ? 'rgba(196, 48, 43, 0.4)'
                : 'rgba(255, 246, 228, 0.65)',
            color:
              phase === 'SHOWING'
                ? '#b8860b'
                : phase === 'PLAYER'
                ? '#3f6212'
                : phase === 'CORRECT'
                ? '#14532d'
                : phase === 'WRONG'
                ? '#991b1b'
                : 'var(--ink)',
            border: `1.5px solid ${
              phase === 'SHOWING'
                ? '#d4a237'
                : phase === 'PLAYER'
                ? 'var(--accent-green)'
                : phase === 'CORRECT'
                ? '#22c55e'
                : phase === 'WRONG'
                ? 'var(--ruby)'
                : 'rgba(110, 85, 56, 0.35)'
            }`,
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
            transition: 'all 0.15s ease',
          }}
        >
          {phase === 'IDLE' && 'Нажмите «Начать раунд», чтобы испытать память'}
          {phase === 'SHOWING' && TEXT.GAMES.REACTION.PHASE_SHOWING}
          {phase === 'PLAYER' && `${TEXT.GAMES.REACTION.PHASE_PLAYER} (Шаг ${playerStep + 1} из ${sequence.length})`}
          {phase === 'CORRECT' && TEXT.GAMES.REACTION.PHASE_CORRECT}
          {phase === 'WRONG' && TEXT.GAMES.REACTION.PHASE_WRONG}
        </div>

        {/* Игровая арена с руническими плитками */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px',
            aspectRatio: '1 / 1',
            margin: '0 auto',
            backgroundColor: '#3b2818',
            border: '4px solid #281a0e',
            borderRadius: '16px',
            padding: currentGridSize === 2 ? '24px' : currentGridSize === 3 ? '14px' : '10px',
            display: 'grid',
            gridTemplateColumns: `repeat(${currentGridSize}, 1fr)`,
            gridTemplateRows: `repeat(${currentGridSize}, 1fr)`,
            gap: currentGridSize === 2 ? '16px' : currentGridSize === 3 ? '10px' : '8px',
            boxShadow: 'inset 0 4px 14px rgba(0, 0, 0, 0.7), 0 4px 14px rgba(0,0,0,0.3)',
            animation: phase === 'WRONG' ? 'shakeError 0.4s ease' : phase === 'CORRECT' ? 'pulseSuccess 0.4s ease' : 'none',
          }}
        >
          {Array.from({ length: totalTilesCount }).map((_, idx) => {
            const isLit = litTile === idx;
            const isWrong = wrongTile === idx;
            const isLevelSuccess = phase === 'CORRECT';

            return (
              <button
                key={idx}
                type="button"
                disabled={phase !== 'PLAYER' || showExitConfirm}
                onClick={() => handleTileClick(idx)}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  backgroundColor: isWrong
                    ? '#c4302b'
                    : isLit
                    ? '#ffd700'
                    : isLevelSuccess
                    ? '#4ade80'
                    : 'rgba(59, 40, 24, 0.85)',
                  border: isWrong
                    ? '3px solid #ff7b77'
                    : isLit
                    ? '3px solid #ffffff'
                    : isLevelSuccess
                    ? '3px solid #bbf7d0'
                    : '2px solid rgba(110, 85, 56, 0.45)',
                  borderRadius: currentGridSize === 2 ? '14px' : '10px',
                  boxShadow: isWrong
                    ? '0 0 20px rgba(196, 48, 43, 0.95), inset 0 0 10px #ffffff'
                    : isLit
                    ? '0 0 22px rgba(255, 215, 0, 1), inset 0 0 12px #ffffff'
                    : isLevelSuccess
                    ? '0 0 18px rgba(74, 222, 128, 0.8)'
                    : '0 3px 6px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: phase === 'PLAYER' ? 'pointer' : 'default',
                  transition: 'background-color 0.12s ease, transform 0.08s ease, box-shadow 0.12s ease',
                  transform: isLit || isWrong ? 'scale(0.97)' : 'scale(1)',
                }}
              >
                {/* Древний рунический символ в центре плитки */}
                <span
                  style={{
                    fontFamily: 'serif',
                    fontSize: currentGridSize === 2 ? '38px' : currentGridSize === 3 ? '26px' : '20px',
                    color: isLit
                      ? '#4a3728'
                      : isWrong || isLevelSuccess
                      ? '#ffffff'
                      : 'rgba(212, 162, 55, 0.55)',
                    textShadow: isLit ? '0 0 8px rgba(255,255,255,0.8)' : '1px 1px 2px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                  }}
                >
                  {RUNES[idx] || '✦'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Кнопка старта при первом входе */}
        {phase === 'IDLE' && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleStartGame}
              style={{
                padding: '13px 36px',
                backgroundColor: 'var(--panel-olive)',
                color: 'var(--text-on-dark)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #283121',
                outline: '1.5px solid var(--panel-olive-border)',
                outlineOffset: '-4px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                cursor: 'pointer',
              }}
            >
              {TEXT.GAMES.REACTION.START_ROUND}
            </button>
          </div>
        )}
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
        Запоминайте порядок свечения рун и повторяйте его точь-в-точь!
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
              {TEXT.GAMES.REACTION.CONFIRM_EXIT_TITLE}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
              {TEXT.GAMES.REACTION.CONFIRM_EXIT_TEXT}
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
                {submitting ? TEXT.GAMES.REACTION.SENDING_RESULT : TEXT.GAMES.REACTION.CONFIRM_EXIT}
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
                {TEXT.GAMES.REACTION.CONTINUE_PLAY}
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
              border: resultModal.reward >= 300 ? '3px solid #ffd700' : '3px solid #573f27',
              borderRadius: '16px',
              padding: '24px 18px',
              boxShadow: resultModal.reward >= 300 ? '0 0 25px rgba(255, 215, 0, 0.6)' : '0 10px 30px rgba(0, 0, 0, 0.9)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '38px' }}>
              {resultModal.reward >= 300 ? '🏆' : '📜'}
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
              ) : resultModal.reward > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <PixelIcon name="ruby" size={24} />
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '22px', color: 'var(--ruby)', fontWeight: 700 }}>
                    +{resultModal.reward.toLocaleString('ru-RU')}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
                  {TEXT.GAMES.REACTION.NO_REWARD_HINT}
                </div>
              )}

              {/* Статистика: Пройдено уровней */}
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
                    {TEXT.GAMES.REACTION.COMPLETED_LEVELS}
                  </div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '18px', color: 'var(--ink)' }}>
                    {resultModal.completedLevels}
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
                {TEXT.GAMES.REACTION.PLAY_AGAIN}
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
                {TEXT.GAMES.REACTION.TO_GAMES_MENU}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
