import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserTasks, claimTaskReward } from '../../api/client';
import { PixelLandscape } from '../common/PixelLandscape';
import { PixelIcon } from '../common/PixelIcon';
import { TEXT } from '../../constants/text';

/**
 * Преобразование системного типа задания в красивое человекопонятное описание
 */
function getTaskDetails(task) {
  const periodBadge =
    task.period === 'day'
      ? TEXT.TASKS.PERIOD_DAY
      : task.period === 'week'
      ? TEXT.TASKS.PERIOD_WEEK
      : TEXT.TASKS.PERIOD_MONTH;

  if (task.condition_type === 'score_in_game') {
    const gameName =
      task.game_type === '2048'
        ? '2048'
        : task.game_type === 'clicker'
        ? 'Кликер'
        : task.game_type === 'reaction'
        ? 'Реакция'
        : task.game_type || 'мини-игре';

    return {
      title: `Мастер ${gameName}`,
      description: `Наберите ${task.target_value} очков в игре «${gameName}»`,
      periodBadge,
    };
  }

  if (task.condition_type === 'open_case') {
    const caseWord =
      task.target_value === 1 ? 'кейс' : task.target_value < 5 ? 'кейса' : 'кейсов';
    return {
      title: 'Охотник за сундуками',
      description: `Откройте минеральные кейсы (${task.target_value} ${caseWord})`,
      periodBadge,
    };
  }

  if (task.condition_type === 'pass_levels') {
    const times = task.target_value === 1 ? 'раз' : 'раза';
    return {
      title: 'Путь к вершине',
      description: `Повысьте уровень персонажа ${task.target_value} ${times}`,
      periodBadge,
    };
  }

  return {
    title: 'Поручение гильдии',
    description: `Выполните цель задания (${task.target_value})`,
    periodBadge,
  };
}

export function TasksPage({ onBack }) {
  const { token, refreshUser } = useAuth();

  const [tasks, setTasks] = useState({ completed: [], unfulfilled: [] });
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'day', 'week', 'month'
  const [claimingId, setClaimingId] = useState(null);
  const [rewardModal, setRewardModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadTasks = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getUserTasks(token);
      setTasks(data);
    } catch (err) {
      setErrorMessage(err.message || 'Не удалось загрузить список заданий');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Забрать награду за задание
  const handleClaim = async (taskId) => {
    try {
      setClaimingId(taskId);
      const res = await claimTaskReward(taskId, token);
      setRewardModal(res);
      await refreshUser();
      await loadTasks();
    } catch (err) {
      setErrorMessage(err.message || 'Не удалось забрать награду');
    } finally {
      setClaimingId(null);
    }
  };

  // Фильтрация по периоду
  const filterList = (list) => {
    if (filterPeriod === 'all') return list;
    return list.filter((t) => t.period === filterPeriod);
  };

  const filteredCompleted = filterList(tasks.completed);
  const filteredUnfulfilled = filterList(tasks.unfulfilled);
  const hasTasks = filteredCompleted.length > 0 || filteredUnfulfilled.length > 0;

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
      {/* Кнопка «Назад в профиль» */}
      <div style={{ marginBottom: '10px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            color: 'var(--ink-muted)',
            backgroundColor: 'rgba(255, 246, 228, 0.45)',
            border: '1.5px solid rgba(110, 85, 56, 0.35)',
            borderRadius: '8px',
            padding: '6px 12px',
          }}
        >
          {TEXT.TASKS.BACK_TO_PROFILE}
        </button>
      </div>

      {/* Заголовок страницы */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--ink)', lineHeight: 1.1 }}>
          {TEXT.TASKS.TITLE}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '2px' }}>
          {TEXT.TASKS.SUBTITLE}
        </p>
        <div
          style={{
            marginTop: '8px',
            height: '1.5px',
            backgroundColor: 'rgba(43, 29, 18, 0.35)',
            width: '100%',
          }}
        />
      </div>

      {/* Фильтр по периодам (Все, День, Неделя, Месяц) */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {[
          { id: 'all', label: TEXT.TASKS.TAB_ALL },
          { id: 'day', label: TEXT.TASKS.TAB_DAY },
          { id: 'week', label: TEXT.TASKS.TAB_WEEK },
          { id: 'month', label: TEXT.TASKS.TAB_MONTH },
        ].map((tab) => {
          const isActive = filterPeriod === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterPeriod(tab.id)}
              style={{
                flex: 1,
                padding: '7px 2px',
                fontFamily: 'var(--font-pixel)',
                fontSize: '12px',
                borderRadius: '8px',
                color: isActive ? 'var(--text-on-dark)' : 'var(--ink-muted)',
                backgroundColor: isActive ? 'var(--panel-olive)' : 'rgba(255, 246, 228, 0.5)',
                border: isActive
                  ? '1.5px solid var(--panel-olive-border)'
                  : '1.5px solid rgba(110, 85, 56, 0.3)',
                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.25)' : 'none',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Загрузка */}
      {loading ? (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            color: 'var(--ink-muted)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {TEXT.TASKS.LOADING}
        </div>
      ) : !hasTasks ? (
        <div
          style={{
            padding: '36px 16px',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 246, 228, 0.45)',
            border: '2px dashed rgba(110, 85, 56, 0.35)',
            borderRadius: '12px',
            color: 'var(--ink-muted)',
            fontSize: '13px',
            lineHeight: 1.4,
            marginTop: '10px',
          }}
        >
          {TEXT.TASKS.EMPTY}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px' }}>
          {/* Секция: Готовы к награде */}
          {filteredCompleted.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>✨</span>
                <h3
                  style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '15px',
                    color: 'var(--panel-olive)',
                  }}
                >
                  {TEXT.TASKS.SECTION_COMPLETED} ({filteredCompleted.length})
                </h3>
              </div>

              {filteredCompleted.map((task) => {
                const details = getTaskDetails(task);
                const isClaiming = claimingId === task.id;

                return (
                  <div
                    key={task.id}
                    style={{
                      padding: '14px',
                      backgroundColor: 'rgba(255, 246, 228, 0.75)',
                      border: '2px solid var(--accent-green)',
                      borderRadius: '12px',
                      boxShadow: '0 0 10px rgba(111, 143, 58, 0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* Верхняя строка: Заголовок + Период */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '16px',
                          color: 'var(--ink)',
                        }}
                      >
                        {details.title}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 700,
                          padding: '2px 6px',
                          backgroundColor: 'rgba(111, 143, 58, 0.25)',
                          color: '#465d21',
                          borderRadius: '6px',
                        }}
                      >
                        {details.periodBadge}
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.25 }}>
                      {details.description}
                    </p>

                    {/* Награды */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)' }}>
                        {TEXT.TASKS.REWARDS_LABEL}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '13px',
                          color: 'var(--ruby)',
                        }}
                      >
                        <PixelIcon name="ruby" size={14} /> +{task.reward_rubies}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '13px',
                          color: 'var(--accent-green)',
                        }}
                      >
                        +{task.reward_xp} XP
                      </span>
                    </div>

                    {/* Кнопка «Забрать награду» */}
                    <button
                      type="button"
                      disabled={isClaiming}
                      onClick={() => handleClaim(task.id)}
                      style={{
                        marginTop: '2px',
                        padding: '10px',
                        backgroundColor: 'var(--panel-olive)',
                        color: 'var(--text-on-dark)',
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '14px',
                        borderRadius: '8px',
                        border: '2px solid #283121',
                        outline: '1.5px solid var(--panel-olive-border)',
                        outlineOffset: '-4px',
                        boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
                      }}
                    >
                      {isClaiming ? TEXT.TASKS.CLAIMING : `🎁 ${TEXT.TASKS.CLAIM_REWARD}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Секция: В процессе выполнения */}
          {filteredUnfulfilled.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '15px',
                  color: 'var(--ink)',
                }}
              >
                {TEXT.TASKS.SECTION_IN_PROGRESS} ({filteredUnfulfilled.length})
              </h3>

              {filteredUnfulfilled.map((task) => {
                const details = getTaskDetails(task);
                const progressPct = Math.min(100, Math.round((task.progress / task.target_value) * 100));

                return (
                  <div
                    key={task.id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'rgba(255, 246, 228, 0.55)',
                      border: '1.5px solid rgba(110, 85, 56, 0.35)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {/* Заголовок + период */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '15px',
                          color: 'var(--ink)',
                        }}
                      >
                        {details.title}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 600,
                          padding: '2px 6px',
                          backgroundColor: 'rgba(58, 40, 24, 0.15)',
                          color: 'var(--ink-muted)',
                          borderRadius: '6px',
                        }}
                      >
                        {details.periodBadge}
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.25 }}>
                      {details.description}
                    </p>

                    {/* Полоса прогресса задания */}
                    <div>
                      <div
                        style={{
                          width: '100%',
                          height: '10px',
                          backgroundColor: '#261b13',
                          borderRadius: '5px',
                          overflow: 'hidden',
                          border: '1px solid #4a3828',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${progressPct}%`,
                            backgroundColor: 'var(--accent-green)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '3px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 600,
                          color: 'var(--ink-muted)',
                        }}
                      >
                        <span>
                          {task.progress} / {task.target_value}
                        </span>
                        <span>{progressPct}%</span>
                      </div>
                    </div>

                    {/* Награды */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        fontSize: '12px',
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ color: 'var(--ink-muted)' }}>{TEXT.TASKS.REWARDS_LABEL}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontFamily: 'var(--font-pixel)',
                          color: 'var(--ruby)',
                        }}
                      >
                        <PixelIcon name="ruby" size={13} /> +{task.reward_rubies}
                      </span>
                      <span style={{ fontFamily: 'var(--font-pixel)', color: 'var(--accent-green)' }}>
                        +{task.reward_xp} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Пейзаж внизу */}
      <PixelLandscape />

      {/* Модальное окно получения награды */}
      {rewardModal && (
        <div
          onClick={() => setRewardModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(18, 11, 7, 0.75)',
            zIndex: 200,
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
              borderRadius: '14px',
              padding: '22px 18px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '36px' }}>🏆</span>
            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '20px', color: 'var(--ink)' }}>
              {TEXT.TASKS.CLAIM_SUCCESS_TITLE}
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 246, 228, 0.6)',
                borderRadius: '10px',
                border: '1.5px solid rgba(110, 85, 56, 0.3)',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '18px',
                  color: 'var(--ruby)',
                }}
              >
                <PixelIcon name="ruby" size={20} /> +{rewardModal.amount_rubies} {TEXT.TASKS.RUBIES}
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '18px',
                  color: 'var(--accent-green)',
                }}
              >
                +{rewardModal.amount_xp} {TEXT.TASKS.XP}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRewardModal(null)}
              style={{
                marginTop: '4px',
                padding: '10px 24px',
                backgroundColor: 'var(--panel-olive)',
                color: 'var(--text-on-dark)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #283121',
              }}
            >
              Забрать
            </button>
          </div>
        </div>
      )}

      {/* Ошибка всплывающая */}
      {errorMessage && (
        <div
          onClick={() => setErrorMessage(null)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '380px',
            backgroundColor: 'rgba(196, 48, 43, 0.95)',
            color: '#fff',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 300,
            cursor: 'pointer',
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
