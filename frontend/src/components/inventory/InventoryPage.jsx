import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserInventory, equipAvatar, equipFrame, sellInventoryItem, getImageUrl } from '../../api/client';
import { PixelLandscape } from '../common/PixelLandscape';
import { PixelIcon } from '../common/PixelIcon';
import { TEXT } from '../../constants/text';
import { THEME } from '../../constants/theme';

export function InventoryPage({ onBack }) {
  const { token, user, refreshUser } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'avatar', 'frame'
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadInventory = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getUserInventory(token);
      setItems(data);
    } catch (err) {
      showToast(err.message || 'Не удалось загрузить инвентарь');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Фильтрация предметов
  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  // Проверка надет ли предмет
  const isItemEquipped = (item) => {
    if (!user || !item) return false;
    if (item.type === 'avatar' && user.avatar_id === item.shop_item_id) return true;
    if (item.type === 'frame' && user.frame_id === item.shop_item_id) return true;
    return false;
  };

  // Экипировка предмета
  const handleEquip = async (item) => {
    try {
      setActionLoading(true);
      if (item.type === 'avatar') {
        await equipAvatar(item.shop_item_id, token);
      } else if (item.type === 'frame') {
        await equipFrame(item.shop_item_id, token);
      }
      await refreshUser();
      showToast(TEXT.INVENTORY.SUCCESS_EQUIP);
      setSelectedItem(null);
    } catch (err) {
      showToast(err.message || 'Не удалось надеть предмет');
    } finally {
      setActionLoading(false);
    }
  };

  // Продажа предмета
  const handleSell = async (item) => {
    if (!window.confirm(`${TEXT.INVENTORY.CONFIRM_SELL} (+${item.selling_price} рубинов)`)) {
      return;
    }
    try {
      setActionLoading(true);
      await sellInventoryItem(item.inventory_id, token);
      await refreshUser();
      await loadInventory();
      showToast(TEXT.INVENTORY.SUCCESS_SELL);
      setSelectedItem(null);
    } catch (err) {
      showToast(err.message || 'Не удалось продать предмет');
    } finally {
      setActionLoading(false);
    }
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
          {TEXT.INVENTORY.BACK_TO_PROFILE}
        </button>
      </div>

      {/* Заголовок страницы с линией */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--ink)', lineHeight: 1.1 }}>
          {TEXT.INVENTORY.TITLE}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '2px' }}>
          {TEXT.INVENTORY.SUBTITLE}
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

      {/* Вкладки фильтров: Все / Аватарки / Рамки */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        {[
          { id: 'all', label: TEXT.INVENTORY.TAB_ALL },
          { id: 'avatar', label: TEXT.INVENTORY.TAB_AVATAR },
          { id: 'frame', label: TEXT.INVENTORY.TAB_FRAME },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                fontFamily: 'var(--font-pixel)',
                fontSize: '13px',
                borderRadius: '8px',
                color: isActive ? 'var(--text-on-dark)' : 'var(--ink-muted)',
                backgroundColor: isActive ? 'var(--panel-olive)' : 'rgba(255, 246, 228, 0.5)',
                border: isActive
                  ? '1.5px solid var(--panel-olive-border)'
                  : '1.5px solid rgba(110, 85, 56, 0.3)',
                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Содержимое инвентаря */}
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
          {TEXT.INVENTORY.LOADING}
        </div>
      ) : filteredItems.length === 0 ? (
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
          {TEXT.INVENTORY.EMPTY}
        </div>
      ) : (
        /* Сетка плиток предметов */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          {filteredItems.map((item) => {
            const rarityColor = THEME.RARITY[item.rarity] || '#9e9e9e';
            const equipped = isItemEquipped(item);

            return (
              <div
                key={item.inventory_id}
                onClick={() => setSelectedItem(item)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 6px',
                  backgroundColor: 'rgba(255, 246, 228, 0.6)',
                  border: `2px solid ${equipped ? 'var(--accent-green)' : rarityColor}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: equipped
                    ? '0 0 8px rgba(111, 143, 58, 0.6)'
                    : '0 2px 5px rgba(0,0,0,0.1)',
                  transition: 'transform 0.1s ease',
                }}
              >
                {/* Бейдж «Надето» */}
                {equipped && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-4px',
                      backgroundColor: 'var(--accent-green)',
                      color: '#fff',
                      fontSize: '9px',
                      fontFamily: 'var(--font-pixel)',
                      padding: '1px 5px',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      zIndex: 2,
                    }}
                  >
                    ✓ {TEXT.INVENTORY.EQUIPPED}
                  </div>
                )}

                {/* Количество (если больше 1) */}
                {item.quantity > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '22px',
                      right: '6px',
                      backgroundColor: 'rgba(33, 24, 18, 0.85)',
                      color: 'var(--text-on-dark)',
                      fontSize: '10px',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      zIndex: 2,
                    }}
                  >
                    x{item.quantity}
                  </div>
                )}

                {/* Иконка предмета */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '6px',
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
                    }}
                  />
                </div>

                {/* Название */}
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-pixel)',
                    color: 'var(--ink)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Пейзаж внизу */}
      <PixelLandscape />

      {/* Модальное окно свойств предмета */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
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
              maxWidth: '340px',
              backgroundColor: 'var(--bg-parchment)',
              border: '3px solid #573f27',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Кнопка закрытия [X] */}
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--ink-muted)',
                padding: '4px',
              }}
            >
              ✕
            </button>

            {/* Картинка предмета в увеличенном виде */}
            <div
              style={{
                width: '90px',
                height: '90px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(43, 29, 18, 0.1)',
                border: `2px solid ${THEME.RARITY[selectedItem.rarity] || '#9e9e9e'}`,
                borderRadius: '12px',
                padding: '6px',
              }}
            >
              <img
                src={getImageUrl(selectedItem.image)}
                alt={selectedItem.name}
                className="pixelated"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Название и редкость */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '20px', color: 'var(--ink)' }}>
                {selectedItem.name}
              </h3>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: THEME.RARITY[selectedItem.rarity] || '#9e9e9e',
                    color: '#fff',
                  }}
                >
                  {TEXT.INVENTORY.RARITY[selectedItem.rarity] || selectedItem.rarity}
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(58, 40, 24, 0.15)',
                    color: 'var(--ink)',
                  }}
                >
                  {selectedItem.type === 'avatar'
                    ? TEXT.INVENTORY.TYPE_AVATAR
                    : selectedItem.type === 'frame'
                    ? TEXT.INVENTORY.TYPE_FRAME
                    : TEXT.INVENTORY.TYPE_OTHER}
                </span>
              </div>
            </div>

            {/* Кнопки действий: Надеть / Продать */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {(selectedItem.type === 'avatar' || selectedItem.type === 'frame') && (
                <button
                  type="button"
                  disabled={actionLoading || isItemEquipped(selectedItem)}
                  onClick={() => handleEquip(selectedItem)}
                  style={{
                    padding: '12px',
                    backgroundColor: isItemEquipped(selectedItem) ? '#556644' : 'var(--panel-olive)',
                    color: 'var(--text-on-dark)',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '2px solid #283121',
                    outline: '1.5px solid var(--panel-olive-border)',
                    outlineOffset: '-4px',
                    opacity: isItemEquipped(selectedItem) ? 0.75 : 1,
                  }}
                >
                  {isItemEquipped(selectedItem)
                    ? `✓ ${TEXT.INVENTORY.EQUIPPED}`
                    : actionLoading
                    ? TEXT.INVENTORY.EQUIPPING
                    : TEXT.INVENTORY.EQUIP}
                </button>
              )}

              {/* Кнопка продажи (если есть selling_price и не надето) */}
              {selectedItem.selling_price && !isItemEquipped(selectedItem) && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleSell(selectedItem)}
                  style={{
                    padding: '10px',
                    backgroundColor: 'rgba(196, 48, 43, 0.15)',
                    color: '#8b1d19',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--ruby)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <PixelIcon name="ruby" size={16} />
                  <span>
                    {TEXT.INVENTORY.SELL} {selectedItem.selling_price}
                  </span>
                </button>
              )}
            </div>
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
    </div>
  );
}
