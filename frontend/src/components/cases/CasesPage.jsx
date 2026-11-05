import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCases, openCase, getImageUrl } from '../../api/client';
import { PixelLandscape } from '../common/PixelLandscape';
import { PixelIcon } from '../common/PixelIcon';
import { TEXT } from '../../constants/text';
import { THEME } from '../../constants/theme';

export function CasesPage() {
  const { token, user, refreshUser } = useAuth();

  const [pageInfo, setPageInfo] = useState({
    title: TEXT.CASES.TITLE,
    description: TEXT.CASES.DEFAULT_DESCRIPTION,
  });
  const [casesList, setCasesList] = useState({ available: [], unavailable: [] });
  const [loading, setLoading] = useState(true);
  const [openingCaseId, setOpeningCaseId] = useState(null);
  const [dropResult, setDropResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadCases = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getCases(token);
      setPageInfo({
        title: data.page_title || TEXT.CASES.TITLE,
        description: data.page_description || TEXT.CASES.DEFAULT_DESCRIPTION,
      });
      setCasesList(data.cases || { available: [], unavailable: [] });
    } catch (err) {
      setErrorMessage(err.message || 'Не удалось загрузить кейсы');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Обработка открытия кейса
  const handleOpenCase = async (caseItem) => {
    if (!user) return;
    if (user.rubies < caseItem.price) {
      setErrorMessage(TEXT.CASES.NOT_ENOUGH_RUBIES);
      return;
    }

    try {
      setOpeningCaseId(caseItem.id);
      const result = await openCase(caseItem.id, token);
      setDropResult({
        ...result,
        caseName: caseItem.name,
      });
      await refreshUser();
      await loadCases();
    } catch (err) {
      setErrorMessage(err.message || 'Не удалось открыть кейс');
    } finally {
      setOpeningCaseId(null);
    }
  };

  // Объединяем и сортируем по требуемому уровню
  const allCases = [
    ...casesList.available.map((c) => ({ ...c, isAvailable: true })),
    ...casesList.unavailable.map((c) => ({ ...c, isAvailable: false })),
  ].sort((a, b) => a.unlock_level - b.unlock_level);

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
      {/* Заголовок страницы с подчеркивающей линией */}
      <div style={{ marginBottom: '14px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--ink)', lineHeight: 1.1 }}>
          {pageInfo.title}
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--ink-muted)',
            marginTop: '4px',
            lineHeight: 1.3,
          }}
        >
          {pageInfo.description}
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

      {/* Индикатор текущего баланса рубинов в шапке раздела */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--ink)',
          fontFamily: 'var(--font-pixel)',
        }}
      >
        <span style={{ color: 'var(--ink-muted)', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          Баланс:
        </span>
        <PixelIcon name="ruby" size={16} />
        <span>{user ? user.rubies.toLocaleString('ru-RU') : 0}</span>
      </div>

      {/* Загрузка */}
      {loading ? (
        <div
          style={{
            padding: '50px 0',
            textAlign: 'center',
            color: 'var(--ink-muted)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {TEXT.CASES.LOADING}
        </div>
      ) : allCases.length === 0 ? (
        <div
          style={{
            padding: '36px 16px',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 246, 228, 0.45)',
            border: '2px dashed rgba(110, 85, 56, 0.35)',
            borderRadius: '12px',
            color: 'var(--ink-muted)',
            fontSize: '13px',
          }}
        >
          {TEXT.CASES.EMPTY}
        </div>
      ) : (
        /* Сетка всех кейсов (2 колонки) */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          {allCases.map((caseItem) => {
            const isAvailable = caseItem.isAvailable;
            const isOpening = openingCaseId === caseItem.id;
            const canAfford = user && user.rubies >= caseItem.price;

            return (
              <div
                key={caseItem.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 10px 12px 10px',
                  backgroundColor: isAvailable
                    ? 'rgba(255, 246, 228, 0.75)'
                    : 'rgba(235, 222, 200, 0.5)',
                  border: isAvailable
                    ? '2px solid rgba(110, 85, 56, 0.5)'
                    : '2px solid rgba(110, 85, 56, 0.25)',
                  borderRadius: '14px',
                  boxShadow: isAvailable
                    ? '0 3px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                    : 'inset 0 2px 6px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  minHeight: '230px',
                }}
              >
                {/* 1. Сверху: Название кейса */}
                <div
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    marginBottom: '8px',
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '14px',
                      color: isAvailable ? 'var(--ink)' : 'var(--ink-muted)',
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {caseItem.name}
                  </span>
                </div>

                {/* 2. По центру: Картинка кейса */}
                <div
                  style={{
                    position: 'relative',
                    width: '94px',
                    height: '94px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '4px 0',
                    zIndex: 2,
                  }}
                >
                  <img
                    src={getImageUrl(caseItem.image)}
                    alt={caseItem.name}
                    className="pixelated"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      filter: isAvailable ? 'none' : 'grayscale(0.4) opacity(0.65)',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </div>

                {/* Для недоступных: красная перечёркивающая линия с надписью «НЕДОСТУПНО» */}
                {!isAvailable && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '48%',
                      left: '-15%',
                      width: '130%',
                      backgroundColor: 'var(--ruby)',
                      color: '#ffffff',
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      padding: '5px 0',
                      textAlign: 'center',
                      transform: 'translateY(-50%) rotate(-14deg)',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
                      borderTop: '1.5px solid #ff7b77',
                      borderBottom: '1.5px solid #6b1411',
                      zIndex: 10,
                      pointerEvents: 'none',
                      textShadow: '1px 1px 0 #5c1411',
                    }}
                  >
                    {TEXT.CASES.UNAVAILABLE_LABEL}
                  </div>
                )}

                {/* 3. Снизу: Информация о требуемом уровне (если недоступен) и Цена */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    zIndex: 2,
                  }}
                >
                  {!isAvailable ? (
                    /* Бейдж с требуемым уровнем */
                    <div
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'rgba(58, 40, 24, 0.15)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        color: 'var(--ink-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>🔒 {TEXT.CASES.REQUIRES_LEVEL} {caseItem.unlock_level}</span>
                    </div>
                  ) : null}

                  {/* Цена кейса */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '15px',
                      color: isAvailable ? 'var(--ink)' : 'var(--ink-muted)',
                    }}
                  >
                    <PixelIcon name="ruby" size={16} />
                    <span>{caseItem.price.toLocaleString('ru-RU')}</span>
                  </div>

                  {/* Кнопка открытия для доступных кейсов */}
                  {isAvailable && (
                    <button
                      type="button"
                      disabled={isOpening || !canAfford}
                      onClick={() => handleOpenCase(caseItem)}
                      style={{
                        width: '100%',
                        padding: '8px 4px',
                        backgroundColor: canAfford ? 'var(--panel-olive)' : 'rgba(58, 40, 24, 0.3)',
                        color: canAfford ? 'var(--text-on-dark)' : 'var(--ink-muted)',
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '13px',
                        borderRadius: '8px',
                        border: '1.5px solid #283121',
                        outline: canAfford ? '1.5px solid var(--panel-olive-border)' : 'none',
                        outlineOffset: '-3px',
                        cursor: canAfford && !isOpening ? 'pointer' : 'not-allowed',
                        opacity: canAfford ? 1 : 0.7,
                      }}
                    >
                      {isOpening
                        ? TEXT.CASES.OPENING
                        : canAfford
                        ? TEXT.CASES.OPEN_BUTTON
                        : TEXT.CASES.NOT_ENOUGH_RUBIES}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Пейзаж внизу */}
      <PixelLandscape />

      {/* Модальное окно выпавшего дропа */}
      {dropResult && (
        <div
          onClick={() => setDropResult(null)}
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
              padding: '24px 18px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '38px' }}>🎉</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                {dropResult.caseName}
              </span>
              <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '20px', color: 'var(--ink)' }}>
                {TEXT.CASES.DROP_TITLE}
              </h3>
            </div>

            {/* Карточка содержимого дропа */}
            <div
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'rgba(255, 246, 228, 0.7)',
                borderRadius: '12px',
                border: '1.5px solid rgba(110, 85, 56, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {dropResult.item_type === 'rubies' && (
                <>
                  <PixelIcon name="ruby" size={42} />
                  <span
                    style={{
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '24px',
                      color: 'var(--ruby)',
                      fontWeight: 700,
                    }}
                  >
                    +{dropResult.value} {TEXT.CASES.DROP_RUBIES}
                  </span>
                </>
              )}

              {dropResult.item_type === 'xp' && (
                <>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-green)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '16px',
                    }}
                  >
                    XP
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '24px',
                      color: 'var(--accent-green)',
                      fontWeight: 700,
                    }}
                  >
                    +{dropResult.value} {TEXT.CASES.DROP_XP}
                  </span>
                </>
              )}

              {dropResult.item_type === 'shop_item' && (
                <>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${THEME.RARITY[dropResult.rarity] || '#9e9e9e'}`,
                      borderRadius: '10px',
                      padding: '4px',
                      backgroundColor: 'rgba(43, 29, 18, 0.1)',
                    }}
                  >
                    <img
                      src={getImageUrl(dropResult.image)}
                      alt={dropResult.name || 'Награда'}
                      className="pixelated"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '17px', color: 'var(--ink)' }}>
                    {dropResult.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: THEME.RARITY[dropResult.rarity] || '#9e9e9e',
                      color: '#fff',
                    }}
                  >
                    {TEXT.INVENTORY.RARITY[dropResult.rarity] || dropResult.rarity}
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDropResult(null)}
              style={{
                marginTop: '6px',
                padding: '12px 28px',
                backgroundColor: 'var(--panel-olive)',
                color: 'var(--text-on-dark)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #283121',
              }}
            >
              {TEXT.CASES.TAKE_REWARD}
            </button>
          </div>
        </div>
      )}

      {/* Ошибка */}
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
