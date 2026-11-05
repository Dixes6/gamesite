import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitGameResult } from '../../api/client';
import { PixelIcon } from '../common/PixelIcon';
import { TEXT } from '../../constants/text';

/**
 * Цветовая палитра плиток 2048 в стилистике RPG
 */
const TILE_STYLES = {
  2: { bg: '#e8d8be', color: '#4a3728', border: '#c4ad8b', shadow: 'none', size: '28px' },
  4: { bg: '#dfcba8', color: '#4a3728', border: '#b89f78', shadow: 'none', size: '28px' },
  8: { bg: '#cd9053', color: '#fff9ee', border: '#9e622b', shadow: '0 2px 4px rgba(158, 98, 43, 0.4)', size: '28px' },
  16: { bg: '#bd6a35', color: '#fff9ee', border: '#8b4315', shadow: '0 2px 5px rgba(139, 67, 21, 0.4)', size: '26px' },
  32: { bg: '#9c4b31', color: '#ffffff', border: '#6c2b17', shadow: '0 2px 6px rgba(108, 43, 23, 0.5)', size: '26px' },
  64: { bg: '#7d3326', color: '#ffffff', border: '#521910', shadow: '0 2px 6px rgba(82, 25, 16, 0.5)', size: '26px' },
  128: { bg: '#d4a237', color: '#ffffff', border: '#997017', shadow: '0 0 10px rgba(212, 162, 55, 0.6)', size: '23px' },
  256: { bg: '#e0b236', color: '#ffffff', border: '#a87f16', shadow: '0 0 12px rgba(224, 178, 54, 0.7)', size: '23px' },
  512: { bg: '#548f43', color: '#ffffff', border: '#336125', shadow: '0 0 14px rgba(84, 143, 67, 0.7)', size: '23px' },
  1024: { bg: '#367fa6', color: '#ffffff', border: '#1d5472', shadow: '0 0 16px rgba(54, 127, 166, 0.75)', size: '20px' },
  2048: {
    bg: 'linear-gradient(135deg, #c4302b 0%, #851814 100%)',
    color: '#ffd700',
    border: '#ffd700',
    shadow: '0 0 18px rgba(255, 215, 0, 0.85)',
    size: '19px',
  },
  4096: {
    bg: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    color: '#ffffff',
    border: '#c4b5fd',
    shadow: '0 0 20px rgba(124, 58, 237, 0.85)',
    size: '19px',
  },
};

// Создание пустой сетки 4х4
function createEmptyBoard() {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

// Поиск свободных ячеек и добавление новой плитки (2 или 4)
function spawnTile(board) {
  const empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return board;

  const chosen = empty[Math.floor(Math.random() * empty.length)];
  const newBoard = board.map((row) => [...row]);
  newBoard[chosen.r][chosen.c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

// Расчёт максимальной плитки на доске
function getMaxTile(board) {
  let max = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] > max) max = board[r][c];
    }
  }
  return max;
}

// Проверка возможности продолжения игры
function canMove(board) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return true;
      if (c < 3 && board[r][c] === board[r][c + 1]) return true;
      if (r < 3 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

// Сдвиг и объединение одной строки влево
function slideAndMergeRow(row) {
  const nonZero = row.filter((val) => val !== 0);
  const result = [];
  let scoreGain = 0;

  for (let i = 0; i < nonZero.length; i++) {
    if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
      const merged = nonZero[i] * 2;
      result.push(merged);
      scoreGain += merged;
      i++; // пропускаем следующий объединенный элемент
    } else {
      result.push(nonZero[i]);
    }
  }

  while (result.length < 4) {
    result.push(0);
  }

  return { row: result, scoreGain };
}

export function Game2048({ onExit }) {
  const { token, user, refreshUser } = useAuth();

  const [board, setBoard] = useState(() => {
    let b = createEmptyBoard();
    b = spawnTile(b);
    b = spawnTile(b);
    return b;
  });

  const [score, setScore] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Ссылки для свайпов на тачскрине
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Перезапуск игры
  const restartGame = useCallback(() => {
    let b = createEmptyBoard();
    b = spawnTile(b);
    b = spawnTile(b);
    setBoard(b);
    setScore(0);
    setHasWon(false);
    setShowExitConfirm(false);
    setResultModal(null);
  }, []);

  // Фиксация результата и отправка на бэкенд
  const handleFinish = useCallback(
    async (reason, overrideMax = null, overrideScore = null) => {
      const currentMax = overrideMax !== null ? overrideMax : getMaxTile(board);
      const currentScore = overrideScore !== null ? overrideScore : score;
      setSubmitting(true);

      let earnedRubies = 0;
      let errorText = null;

      try {
        if (token) {
          const res = await submitGameResult('2048', currentMax, token);
          earnedRubies = res && typeof res.reward === 'number' ? res.reward : 0;
          await refreshUser();
        }
      } catch (err) {
        console.error('Ошибка сохранения результата 2048:', err);
        errorText = err.message || 'Ошибка соединения с сервером';
      } finally {
        setSubmitting(false);
      }

      let title = TEXT.GAMES.GAME_2048.RESULT_TITLE;
      let subtitle = '';

      if (reason === 'win') {
        title = TEXT.GAMES.GAME_2048.WIN_TITLE;
        subtitle = TEXT.GAMES.GAME_2048.WIN_SUBTITLE;
      } else if (reason === 'game_over') {
        title = TEXT.GAMES.GAME_2048.GAME_OVER_TITLE;
        subtitle = TEXT.GAMES.GAME_2048.GAME_OVER_SUBTITLE;
      } else {
        title = TEXT.GAMES.GAME_2048.RESULT_TITLE;
        subtitle = 'Вы завершили игровую сессию.';
      }

      setResultModal({
        title,
        subtitle,
        score: currentScore,
        maxTile: currentMax,
        reward: earnedRubies,
        error: errorText,
      });
      setShowExitConfirm(false);
    },
    [board, score, token, refreshUser]
  );

  // Сдвиг доски в заданном направлении
  const makeMove = useCallback(
    (direction) => {
      if (resultModal || showExitConfirm || submitting) return;

      let changed = false;
      let gainedScore = 0;
      const newBoard = createEmptyBoard();

      if (direction === 'left') {
        for (let r = 0; r < 4; r++) {
          const { row, scoreGain } = slideAndMergeRow(board[r]);
          newBoard[r] = row;
          gainedScore += scoreGain;
          if (row.some((val, idx) => val !== board[r][idx])) changed = true;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < 4; r++) {
          const reversed = [...board[r]].reverse();
          const { row, scoreGain } = slideAndMergeRow(reversed);
          const finalRow = row.reverse();
          newBoard[r] = finalRow;
          gainedScore += scoreGain;
          if (finalRow.some((val, idx) => val !== board[r][idx])) changed = true;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < 4; c++) {
          const column = [board[0][c], board[1][c], board[2][c], board[3][c]];
          const { row, scoreGain } = slideAndMergeRow(column);
          gainedScore += scoreGain;
          for (let r = 0; r < 4; r++) {
            newBoard[r][c] = row[r];
            if (row[r] !== board[r][c]) changed = true;
          }
        }
      } else if (direction === 'down') {
        for (let c = 0; c < 4; c++) {
          const column = [board[3][c], board[2][c], board[1][c], board[0][c]];
          const { row, scoreGain } = slideAndMergeRow(column);
          gainedScore += scoreGain;
          const reversedCol = row.reverse();
          for (let r = 0; r < 4; r++) {
            newBoard[r][c] = reversedCol[r];
            if (reversedCol[r] !== board[r][c]) changed = true;
          }
        }
      }

      if (changed) {
        const boardWithSpawn = spawnTile(newBoard);
        const newScore = score + gainedScore;
        const currentMax = getMaxTile(boardWithSpawn);

        setBoard(boardWithSpawn);
        setScore(newScore);

        // Проверка победы (достижение 2048)
        if (currentMax >= 2048 && !hasWon) {
          setHasWon(true);
          handleFinish('win', currentMax, newScore);
          return;
        }

        // Проверка окончания ходов
        if (!canMove(boardWithSpawn)) {
          handleFinish('game_over', currentMax, newScore);
        }
      }
    },
    [board, score, hasWon, resultModal, showExitConfirm, submitting, handleFinish]
  );

  // Управление с клавиатуры (Стрелки и WASD)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
        makeMove('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
        makeMove('right');
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'ц' || e.key === 'Ц') {
        makeMove('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы') {
        makeMove('down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [makeMove]);

  // Обработчики свайпов на тачскрине
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e) => {
    // Предотвращаем скролл страницы жестом во время свайпа
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartRef.current.x;
    const dy = endY - touchStartRef.current.y;

    const threshold = 25; // Минимальная дистанция свайпа
    if (Math.max(Math.abs(dx), Math.abs(dy)) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) makeMove('right');
        else makeMove('left');
      } else {
        if (dy > 0) makeMove('down');
        else makeMove('up');
      }
    }
  };

  const currentMaxTile = getMaxTile(board);

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
      {/* Верхняя панель: кнопка выхода и счётчики */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
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
          {TEXT.GAMES.GAME_2048.EXIT_BTN}
        </button>

        {/* Счёт и максимальная плитка */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Счёт */}
          <div
            style={{
              padding: '4px 10px',
              backgroundColor: 'rgba(255, 246, 228, 0.7)',
              border: '1.5px solid rgba(110, 85, 56, 0.35)',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '70px',
            }}
          >
            <div style={{ fontSize: '9px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              {TEXT.GAMES.GAME_2048.SCORE}
            </div>
            <div style={{ fontSize: '15px', color: 'var(--ink)', fontFamily: 'var(--font-pixel)', lineHeight: 1.1 }}>
              {score}
            </div>
          </div>

          {/* Макс. плитка */}
          <div
            style={{
              padding: '4px 10px',
              backgroundColor: currentMaxTile >= 128 ? 'rgba(212, 162, 55, 0.2)' : 'rgba(255, 246, 228, 0.7)',
              border: `1.5px solid ${currentMaxTile >= 128 ? '#d4a237' : 'rgba(110, 85, 56, 0.35)'}`,
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '70px',
            }}
          >
            <div style={{ fontSize: '9px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              {TEXT.GAMES.GAME_2048.MAX_TILE}
            </div>
            <div
              style={{
                fontSize: '15px',
                color: currentMaxTile >= 128 ? '#b8860b' : 'var(--ink)',
                fontFamily: 'var(--font-pixel)',
                lineHeight: 1.1,
              }}
            >
              {currentMaxTile}
            </div>
          </div>
        </div>
      </div>

      {/* Центр экрана: игровое поле 4х4 со свайпами */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          touchAction: 'none', // Предотвращает прокрутку страницы при свайпах
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            aspectRatio: '1 / 1',
            margin: '0 auto',
            backgroundColor: '#3b2818',
            border: '4px solid #281a0e',
            borderRadius: '16px',
            padding: '10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '8px',
            boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.6), 0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          {board.map((row, r) =>
            row.map((val, c) => {
              const style = TILE_STYLES[val] || {
                bg: '#e8d8be',
                color: '#4a3728',
                border: '#c4ad8b',
                shadow: 'none',
                size: '18px',
              };

              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    backgroundColor: val === 0 ? 'rgba(74, 55, 40, 0.45)' : undefined,
                    background: val > 0 ? style.bg : undefined,
                    border: val === 0 ? '1px solid rgba(110, 85, 56, 0.3)' : `2px solid ${style.border}`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: val > 0 ? style.shadow : 'inset 0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.1s ease',
                    position: 'relative',
                  }}
                >
                  {val > 0 && (
                    <span
                      style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: style.size,
                        fontWeight: 700,
                        color: style.color,
                        textShadow: val >= 8 ? '1px 1px 0 rgba(0,0,0,0.3)' : 'none',
                      }}
                    >
                      {val}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Подсказка по управлению */}
      <div
        style={{
          marginTop: '8px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--ink-muted)',
          fontFamily: 'var(--font-body)',
        }}
      >
        Управление: свайпы пальцем по экрану или стрелки / WASD на клавиатуре
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
              {TEXT.GAMES.GAME_2048.CONFIRM_EXIT_TITLE}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
              {TEXT.GAMES.GAME_2048.CONFIRM_EXIT_TEXT}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinish('exit', getMaxTile(board), score)}
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
                {submitting ? TEXT.GAMES.GAME_2048.SENDING_RESULT : TEXT.GAMES.GAME_2048.CONFIRM_EXIT}
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
                {TEXT.GAMES.GAME_2048.CONTINUE_PLAY}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно итогов игры (Победа / Поражение / Фиксация выхода) */}
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
              border: resultModal.maxTile >= 2048 ? '3px solid #ffd700' : '3px solid #573f27',
              borderRadius: '16px',
              padding: '24px 18px',
              boxShadow: resultModal.maxTile >= 2048 ? '0 0 25px rgba(255, 215, 0, 0.6)' : '0 10px 30px rgba(0, 0, 0, 0.9)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '38px' }}>
              {resultModal.maxTile >= 2048 ? '🏆' : resultModal.reward > 0 ? '🎉' : '📜'}
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
              ) : resultModal.reward > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <PixelIcon name="ruby" size={24} />
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '22px', color: 'var(--ruby)', fontWeight: 700 }}>
                    +{resultModal.reward.toLocaleString('ru-RU')}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
                  {TEXT.GAMES.GAME_2048.NO_REWARD_HINT}
                </div>
              )}

              {/* Статистика: Очки и Максимальная плитка */}
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
                    {TEXT.GAMES.GAME_2048.SCORE}
                  </div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--ink)' }}>
                    {resultModal.score}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}>
                    {TEXT.GAMES.GAME_2048.MAX_TILE}
                  </div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: '#b8860b' }}>
                    {resultModal.maxTile}
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
                {TEXT.GAMES.GAME_2048.PLAY_AGAIN}
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
                {TEXT.GAMES.GAME_2048.TO_GAMES_MENU}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
