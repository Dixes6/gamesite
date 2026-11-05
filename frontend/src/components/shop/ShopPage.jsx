import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getShop,
  buyShopItem,
  getUserInventory,
  sellInventoryItem,
  getImageUrl,
} from '../../api/client';
import { PixelLandscape } from '../common/PixelLandscape';
import { PixelIcon } from '../common/PixelIcon';
import { ItemBadge } from '../common/ItemBadge';
import { TEXT } from '../../constants/text';
import { THEME } from '../../constants/theme';

export function ShopPage() {
  const { token, user, refreshUser } = useAuth();

  const [activeShopTab, setActiveShopTab] = useState('buy'); // 'buy' | 'sell'
  const [pageInfo, setPageInfo] = useState({
    title: TEXT.SHOP.TITLE,
    description: TEXT.SHOP.DEFAULT_DESCRIPTION,
  });

  const [shopData, setShopData] = useState({ available: [], unavailable: [] });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actionId, setActionId] = useState(null);
  const [boughtItem, setBoughtItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Загрузка товаров магазина и инвентаря
  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [shopRes, invRes] = await Promise.all([
        getShop(token),
        getUserInventory(token),
      ]);

      setPageInfo({
        title: shopRes.page_title || TEXT.SHOP.TITLE,
        description: shopRes.page_description || TEXT.SHOP.DEFAULT_DESCRIPTION,
      });

      setShopData(shopRes.shop || { available: [], unavailable: [] });
      setInventoryItems(invRes || []);
    } catch (err) {
      setErrorMessage(err.message || 'Не удалось загрузить данные магазина');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Фильтрация товаров для витрины:
  // Исключаем:
  // 1) "только из кейсов" (is_exclusive: true) — секретные товары
  // 2) стартовые предметы (is_starter: true)
  // 3) предметы без установленной цены (price == null)
  const filterShopItems = (list) => {
    return list.filter(
      (item) =>
        !item.is_exclusive &&
        !item.is_starter &&
        item.price !== null &&
        item.price !== undefined
    );
  };

  const filteredAvailable = filterShopItems(shopData.available).map((item) => ({
    ...item,
    isAvailable: true,
  }));
  const filteredUnavailable = filterShopItems(shopData.unavailable).map((item) => ({
    ...item,
    isAvailable: false,
  }));

  const allShopItems = [...filteredAvailable, ...filteredUnavailable].sort(
    (a, b) => a.unlock_level - b.unlock_level
  );

  // Сколько таких предметов уже есть в инвентаре
  const getOwnedQuantity = (shopItemId) => {
    const found = inventoryItems.find((inv) => inv.shop_item_id === shopItemId);
    return found ? found.quantity : 0;
  };

  // Покупка товара
  const handleBuy = async (item) => {
    if (!user) return;
    if (user.rubies < item.price) {
      setErrorMessage(TEXT.SHOP.NOT_ENOUGH_RUBIES);
      return;
    }

    try {
      setActionId(item.id);
      const res = await buyShopItem(item.id, token);
      setBoughtItem(res);
      await refreshUser();
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Не удалось купить товар');
    } finally {
      setActionId(null);
    }
  };

  // Продажа предмета из скупки
  const handleSell = async (item) => {
    try {
      setActionId(item.inventory_id);
      await sellInventoryItem(item.inventory_id, token);
      await refreshUser();
      await loadData();
      showToast(`${TEXT.SHOP.SUCCESS_SELL} (+${item.selling_price} 💎)`);
    } catch (err) {
      setErrorMessage(err.message || 'Не удалось продать предмет');
    } finally {
      setActionId(null);
    }
  };

  // Предметы, доступные для продажи (есть цена скупки > 0)
  const sellableItems = inventoryItems.filter(
    (item) => item.selling_price && item.selling_price > 0
  );

  // Проверка надет ли предмет
  const isEquipped = (item) => {
    if (!user) return false;
    if (item.type === 'avatar' && user.avatar_id === item.shop_item_id) return true;
    if (item.type === 'frame' && user.frame_id === item.shop_item_id) return true;
    return false;
  };

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
      {/* Заголовок страницы с линией */}
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

      {/* Верхняя строка: Переключатель вкладок «Витрина» / «Скупка» и баланс */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {/* Вкладки: Витрина / Скупка */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(58, 40, 24, 0.15)',
            padding: '3px',
            borderRadius: '10px',
            border: '1.5px solid rgba(110, 85, 56, 0.25)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveShopTab('buy')}
            style={{
              padding: '6px 14px',
              fontFamily: 'var(--font-pixel)',
              fontSize: '13px',
              borderRadius: '7px',
              color: activeShopTab === 'buy' ? 'var(--text-on-dark)' : 'var(--ink-muted)',
              backgroundColor: activeShopTab === 'buy' ? 'var(--panel-olive)' : 'transparent',
              border: activeShopTab === 'buy' ? '1px solid var(--panel-olive-border)' : 'none',
              boxShadow: activeShopTab === 'buy' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {TEXT.SHOP.TAB_BUY}
          </button>

          <button
            type="button"
            onClick={() => setActiveShopTab('sell')}
            style={{
              padding: '6px 14px',
              fontFamily: 'var(--font-pixel)',
              fontSize: '13px',
              borderRadius: '7px',
              color: activeShopTab === 'sell' ? 'var(--text-on-dark)' : 'var(--ink-muted)',
              backgroundColor: activeShopTab === 'sell' ? 'var(--panel-olive)' : 'transparent',
              border: activeShopTab === 'sell' ? '1px solid var(--panel-olive-border)' : 'none',
              boxShadow: activeShopTab === 'sell' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {TEXT.SHOP.TAB_SELL}
          </button>
        </div>

        {/* Текущий баланс рубинов */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '13px',
            color: 'var(--ink)',
            fontFamily: 'var(--font-pixel)',
          }}
        >
          <PixelIcon name="ruby" size={16} />
          <span>{user ? user.rubies.toLocaleString('ru-RU') : 0}</span>
        </div>
      </div>

      {/* -------------------- ВКЛАДКА 1: ВИТРИНА (ПОКУПКА) -------------------- */}
      {activeShopTab === 'buy' && (
        <>
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
              {TEXT.SHOP.LOADING}
            </div>
          ) : allShopItems.length === 0 ? (
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
              {TEXT.SHOP.EMPTY}
            </div>
          ) : (
            /* Сетка товаров */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              {allShopItems.map((item, index) => {
                // 1-й товар во всю ширину, 2-й и 3-й делят пополам
                const isFullWidth = index % 3 === 0;
                const isAvailable = item.isAvailable;
                const rarityColor = THEME.RARITY[item.rarity] || '#9e9e9e';
                const isBuying = actionId === item.id;
                const canAfford = user && user.rubies >= item.price;
                const ownedQty = getOwnedQuantity(item.id);

                return (
                  <div
                    key={item.id}
                    style={{
                      gridColumn: isFullWidth ? 'span 2' : 'span 1',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: isFullWidth ? '14px 14px 12px 14px' : '12px 10px 10px 10px',
                      backgroundColor: isAvailable
                        ? 'rgba(255, 246, 228, 0.75)'
                        : 'rgba(235, 222, 200, 0.5)',
                      border: `2px solid ${isAvailable ? rarityColor : 'rgba(110, 85, 56, 0.3)'}`,
                      borderRadius: '14px',
                      boxShadow: isAvailable
                        ? '0 3px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                        : 'inset 0 2px 6px rgba(0, 0, 0, 0.08)',
                      overflow: 'hidden',
                      minHeight: isFullWidth ? '200px' : '210px',
                    }}
                  >
                    {/* Бейдж редкости сверху слева */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        zIndex: 3,
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: rarityColor,
                          color: '#ffffff',
                        }}
                      >
                        {TEXT.INVENTORY.RARITY[item.rarity] || item.rarity}
                      </span>

                      {(item.is_exclusive || item.is_starter) && (
                        <ItemBadge
                          isExclusive={item.is_exclusive}
                          isStarter={item.is_starter}
                          compact={true}
                        />
                      )}
                    </div>

                    {/* Счётчик наличия в инвентаре (если уже куплен) */}
                    {ownedQty > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          zIndex: 3,
                          backgroundColor: 'rgba(58, 40, 24, 0.85)',
                          color: 'var(--text-on-dark)',
                          fontSize: '10px',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                        }}
                      >
                        {TEXT.SHOP.IN_BAG} x{ownedQty}
                      </div>
                    )}

                    {/* 1. СВЕРХУ: Изображение товара */}
                    <div
                      style={{
                        width: '100%',
                        height: isFullWidth ? '94px' : '78px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '6px 0',
                        zIndex: 2,
                      }}
                    >
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="pixelated"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          filter: isAvailable ? 'none' : 'grayscale(0.4) opacity(0.65)',
                        }}
                      />
                    </div>

                    {/* Для недоступных: красная лента «НЕДОСТУПНО» */}
                    {!isAvailable && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '44%',
                          left: '-15%',
                          width: '130%',
                          backgroundColor: 'var(--ruby)',
                          color: '#ffffff',
                          fontFamily: 'var(--font-pixel)',
                          fontSize: isFullWidth ? '13px' : '11px',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          padding: '5px 0',
                          textAlign: 'center',
                          transform: 'translateY(-50%) rotate(-12deg)',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
                          borderTop: '1.5px solid #ff7b77',
                          borderBottom: '1.5px solid #6b1411',
                          zIndex: 10,
                          pointerEvents: 'none',
                          textShadow: '1px 1px 0 #5c1411',
                        }}
                      >
                        {TEXT.SHOP.UNAVAILABLE_LABEL}
                      </div>
                    )}

                    {/* 2. РАЗДЕЛИТЕЛЬНАЯ ЛИНИЯ: отделяет изображение от названия и цены */}
                    <div
                      style={{
                        width: '100%',
                        height: '1.5px',
                        backgroundColor: 'rgba(110, 85, 56, 0.35)',
                        margin: '6px 0 8px 0',
                        zIndex: 2,
                      }}
                    />

                    {/* 3. ВНИЗУ БЛОКА */}
                    {isFullWidth ? (
                      /* В широком блоке: Название / Цена разделены косой чертой в одну строку */
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          zIndex: 2,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-pixel)',
                              fontSize: '16px',
                              color: isAvailable ? 'var(--ink)' : 'var(--ink-muted)',
                            }}
                          >
                            {item.name}
                          </span>
                          <span
                            style={{
                              color: 'var(--ink-muted)',
                              fontSize: '18px',
                              fontWeight: 300,
                              opacity: 0.6,
                            }}
                          >
                            /
                          </span>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'var(--font-pixel)',
                              fontSize: '16px',
                              color: isAvailable ? 'var(--ink)' : 'var(--ink-muted)',
                            }}
                          >
                            <PixelIcon name="ruby" size={16} />
                            <span>{item.price.toLocaleString('ru-RU')}</span>
                          </div>
                        </div>

                        {/* Кнопка или бейдж уровня */}
                        {isAvailable ? (
                          <button
                            type="button"
                            disabled={isBuying || !canAfford}
                            onClick={() => handleBuy(item)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              backgroundColor: canAfford ? 'var(--panel-olive)' : 'rgba(58, 40, 24, 0.3)',
                              color: canAfford ? 'var(--text-on-dark)' : 'var(--ink-muted)',
                              fontFamily: 'var(--font-pixel)',
                              fontSize: '14px',
                              borderRadius: '8px',
                              border: '1.5px solid #283121',
                              outline: canAfford ? '1.5px solid var(--panel-olive-border)' : 'none',
                              outlineOffset: '-3px',
                              cursor: canAfford && !isBuying ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {isBuying
                              ? TEXT.SHOP.BUYING
                              : canAfford
                              ? TEXT.SHOP.BUY_BUTTON
                              : TEXT.SHOP.NOT_ENOUGH_RUBIES}
                          </button>
                        ) : (
                          <div
                            style={{
                              padding: '2px 8px',
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
                            <span>🔒 {TEXT.SHOP.REQUIRES_LEVEL} {item.unlock_level}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* В маленьких рамках: Название ВЫНЕСЕНО ОТДЕЛЬНО ВЫШЕ, чтобы полностью читалось! */
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          zIndex: 2,
                        }}
                      >
                        {/* Название товара: занимает всю строку сверху */}
                        <div
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            minHeight: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-pixel)',
                              fontSize: '13px',
                              color: isAvailable ? 'var(--ink)' : 'var(--ink-muted)',
                              lineHeight: 1.2,
                              wordBreak: 'break-word',
                            }}
                          >
                            {item.name}
                          </span>
                        </div>

                        {/* Стоимость с рубином */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: 'var(--font-pixel)',
                            fontSize: '13px',
                            color: isAvailable ? 'var(--ink)' : 'var(--ink-muted)',
                          }}
                        >
                          <PixelIcon name="ruby" size={13} />
                          <span>{item.price.toLocaleString('ru-RU')}</span>
                        </div>

                        {/* Кнопка покупки или уровень блокировки */}
                        {isAvailable ? (
                          <button
                            type="button"
                            disabled={isBuying || !canAfford}
                            onClick={() => handleBuy(item)}
                            style={{
                              width: '100%',
                              padding: '6px 4px',
                              backgroundColor: canAfford ? 'var(--panel-olive)' : 'rgba(58, 40, 24, 0.3)',
                              color: canAfford ? 'var(--text-on-dark)' : 'var(--ink-muted)',
                              fontFamily: 'var(--font-pixel)',
                              fontSize: '12px',
                              borderRadius: '7px',
                              border: '1.5px solid #283121',
                              outline: canAfford ? '1px solid var(--panel-olive-border)' : 'none',
                              outlineOffset: '-2px',
                              cursor: canAfford && !isBuying ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {isBuying
                              ? TEXT.SHOP.BUYING
                              : canAfford
                              ? TEXT.SHOP.BUY_BUTTON
                              : TEXT.SHOP.NOT_ENOUGH_RUBIES}
                          </button>
                        ) : (
                          <div
                            style={{
                              padding: '2px 6px',
                              backgroundColor: 'rgba(58, 40, 24, 0.15)',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontFamily: 'var(--font-body)',
                              fontWeight: 700,
                              color: 'var(--ink-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <span>🔒 {TEXT.SHOP.REQUIRES_LEVEL} {item.unlock_level}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* -------------------- ВКЛАДКА 2: СКУПКА (ПРОДАЖА) -------------------- */}
      {activeShopTab === 'sell' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.3 }}>
            {TEXT.SHOP.SELL_SUBTITLE}
          </p>

          {sellableItems.length === 0 ? (
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
              }}
            >
              {TEXT.SHOP.SELL_EMPTY}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sellableItems.map((invItem) => {
                const rarityColor = THEME.RARITY[invItem.rarity] || '#9e9e9e';
                const equipped = isEquipped(invItem);
                const isSelling = actionId === invItem.inventory_id;

                return (
                  <div
                    key={invItem.inventory_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 246, 228, 0.65)',
                      border: `2px solid ${equipped ? 'var(--accent-green)' : rarityColor}`,
                      borderRadius: '12px',
                      gap: '12px',
                    }}
                  >
                    {/* Картинка */}
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(43, 29, 18, 0.08)',
                        borderRadius: '8px',
                        padding: '3px',
                      }}
                    >
                      <img
                        src={getImageUrl(invItem.image)}
                        alt={invItem.name}
                        className="pixelated"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Инфо */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-pixel)',
                            fontSize: '14px',
                            color: 'var(--ink)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {invItem.name}
                        </span>
                        {invItem.quantity > 1 && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontFamily: 'var(--font-body)',
                              fontWeight: 700,
                              backgroundColor: 'rgba(58, 40, 24, 0.15)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            x{invItem.quantity}
                          </span>
                        )}
                      </div>

                      {/* Бейдж происхождения (Эксклюзив ✨ / Стартовый ⭐) */}
                      {(invItem.is_exclusive || invItem.is_starter) && (
                        <div style={{ marginTop: '2px' }}>
                          <ItemBadge
                            isExclusive={invItem.is_exclusive}
                            isStarter={invItem.is_starter}
                            compact={true}
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Выкуп:</span>
                        <PixelIcon name="ruby" size={13} />
                        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '13px', color: 'var(--ruby)' }}>
                          +{invItem.selling_price}
                        </span>
                      </div>
                    </div>

                    {/* Кнопка продажи или статус «Надето» */}
                    <div style={{ flexShrink: 0 }}>
                      {equipped ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-body)',
                            fontWeight: 700,
                            color: '#496323',
                            backgroundColor: 'rgba(111, 143, 58, 0.2)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            display: 'inline-block',
                          }}
                        >
                          ✓ {TEXT.SHOP.EQUIPPED_WARN}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isSelling}
                          onClick={() => handleSell(invItem)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'rgba(196, 48, 43, 0.15)',
                            color: '#8b1d19',
                            fontFamily: 'var(--font-body)',
                            fontWeight: 700,
                            fontSize: '12px',
                            borderRadius: '8px',
                            border: '1.5px solid var(--ruby)',
                            cursor: isSelling ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isSelling
                            ? TEXT.SHOP.SELLING
                            : `${TEXT.SHOP.SELL_BUTTON} ${invItem.selling_price} 💎`}
                        </button>
                      )}
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

      {/* Модальное окно успешной покупки */}
      {boughtItem && (
        <div
          onClick={() => setBoughtItem(null)}
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
            <span style={{ fontSize: '38px' }}>🛍️</span>
            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '20px', color: 'var(--ink)' }}>
              Удачная покупка!
            </h3>

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
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${THEME.RARITY[boughtItem.rarity] || '#9e9e9e'}`,
                  borderRadius: '10px',
                  padding: '4px',
                  backgroundColor: 'rgba(43, 29, 18, 0.1)',
                }}
              >
                <img
                  src={getImageUrl(boughtItem.image)}
                  alt={boughtItem.name}
                  className="pixelated"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>

              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '18px', color: 'var(--ink)' }}>
                {boughtItem.name}
              </span>

              {(boughtItem.is_exclusive || boughtItem.is_starter) && (
                <ItemBadge
                  isExclusive={boughtItem.is_exclusive}
                  isStarter={boughtItem.is_starter}
                  compact={false}
                />
              )}

              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}>
                {TEXT.SHOP.SUCCESS_BUY}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBoughtItem(null)}
              style={{
                marginTop: '4px',
                padding: '10px 28px',
                backgroundColor: 'var(--panel-olive)',
                color: 'var(--text-on-dark)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #283121',
              }}
            >
              В инвентарь
            </button>
          </div>
        </div>
      )}

      {/* Всплывающее уведомление (Toast) */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '380px',
            backgroundColor: 'var(--nav-bg)',
            color: 'var(--text-on-dark)',
            border: '2px solid var(--panel-olive-border)',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 300,
            textAlign: 'center',
          }}
        >
          {toastMessage}
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
