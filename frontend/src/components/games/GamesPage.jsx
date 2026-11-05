import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getGames, getImageUrl } from '../../api/client';
import { PixelLandscape } from '../common/PixelLandscape';
import { PixelIcon } from '../common/PixelIcon';
import { Game2048 } from './Game2048';
import { GameClicker } from './GameClicker';
import { GameReaction } from './GameReaction';
import { TEXT } from '../../constants/text';

// Строгий порядок отображения игр сверху вниз: 2048 -> clicker -> reaction
const GAME_ORDER = { '2048': 0, 'clicker': 1, 'reaction': 2 };

export function GamesPage() {
  const { token, user } = useAuth();

  const [pageInfo, setPageInfo] = useState({
    title: TEXT.GAMES.TITLE,
    description: TEXT.GAMES.DEFAULT_DESCRIPTION,
  });
  const [gamesList, setGamesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Выбранная игра для модалки «Как играть»
  const [selectedGame, setSelectedGame] = useState(null);

  // Активная запущенная игра ('2048' | 'clicker' | 'reaction' | null)
  const [activePlayingGame, setActivePlayingGame] = useState(null);

  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGames(token);
      setPageInfo({
        title: data.page_title || TEXT.GAMES.TITLE,
        description: data.page_description || TEXT.GAMES.DEFAULT_DESCRIPTION,
      });
      setGamesList(data.games || []);
    } catch (err) {
      console.error('Ошибка загрузки списка игр:', err);
      // Fallback на полный список активных игр
      setGamesList([
        {
          game_type: '2048',
          game_name: '2048',
          game_icon: 'image/games/2048.png',
        },
        {
          game_type: 'clicker',
          game_name: 'Кликер',
          game_icon: 'image/games/clicker.png',
        },
        {
          game_type: 'reaction',
          game_name: 'Тест реакции',
          game_icon: 'image/games/reaction.png',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // Запуск игры 2048
  if (activePlayingGame === '2048') {
    return <Game2048 onExit={() => setActivePlayingGame(null)} />;
  }

  // Запуск игры Кликер
  if (activePlayingGame === 'clicker') {
    return <GameClicker onExit={() => setActivePlayingGame(null)} />;
  }

  // Запуск игры Тест реакции
  if (activePlayingGame === 'reaction') {
    return <GameReaction onExit={() => setActivePlayingGame(null)} />;
  }

  // Активные игры, отсортированные строго: 2048 -> clicker -> reaction
  const availableGames = gamesList
    .filter((g) => ['2048', 'clicker', 'reaction'].includes(g.game_type))
    .sort((a, b) => (GAME_ORDER[a.game_type] ?? 99) - (GAME_ORDER[b.game_type] ?? 99));

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

      {/* Список игр: каждое изображение само по себе является кнопкой на всю ширину */}
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
          {TEXT.GAMES.LOADING}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {availableGames.map((game) => (
            <button
              key={game.game_type}
              type="button"
              onClick={() => setSelectedGame(game)}
              style={{
                width: '100%',
                padding: 0,
                backgroundColor: 'transparent',
                border: '2.5px solid #4a331c',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                cursor: 'pointer',
                position: 'relative',
                display: 'block',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
              }}
            >
              <img
                src={getImageUrl(game.game_icon)}
                alt={game.game_name}
                className="pixelated"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Пейзаж внизу */}
      <PixelLandscape />

      {/* Модальное окно «Как играть» (Плашка с описанием и кнопкой «Играть») */}
      {selectedGame && (
        <div
          onClick={() => setSelectedGame(null)}
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
              maxWidth: '350px',
              backgroundColor: 'var(--bg-parchment)',
              border: '3px solid #573f27',
              borderRadius: '16px',
              padding: '20px 18px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Кнопка закрытия [X] */}
            <button
              type="button"
              onClick={() => setSelectedGame(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--ink-muted)',
                padding: '4px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            {/* Изображение игры в шапке модалки */}
            <div
              style={{
                width: '100%',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '2px solid rgba(110, 85, 56, 0.4)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              <img
                src={getImageUrl(selectedGame.game_icon)}
                alt={selectedGame.game_name}
                className="pixelated"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Название и описание */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '22px', color: 'var(--ink)' }}>
                {selectedGame.game_name}
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--ink-muted)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.35,
                }}
              >
                {selectedGame.game_type === 'clicker'
                  ? TEXT.GAMES.CLICKER.SHORT_DESC
                  : selectedGame.game_type === 'reaction'
                  ? TEXT.GAMES.REACTION.SHORT_DESC
                  : TEXT.GAMES.GAME_2048.SHORT_DESC}
              </p>
            </div>

            {/* Блок правил и наград */}
            <div
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: 'rgba(255, 246, 228, 0.7)',
                borderRadius: '10px',
                border: '1.5px solid rgba(110, 85, 56, 0.35)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--ink)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.35,
              }}
            >
              {selectedGame.game_type === 'clicker' ? (
                <>
                  <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    📖 {TEXT.GAMES.CLICKER.RULES_TITLE}:
                  </div>
                  <div>🔸 {TEXT.GAMES.CLICKER.RULE_1}</div>
                  <div>🔸 {TEXT.GAMES.CLICKER.RULE_2}</div>
                  <div>⭐ <strong style={{ color: '#b8860b' }}>{TEXT.GAMES.CLICKER.RULE_3}</strong></div>
                  <div>❤️ {TEXT.GAMES.CLICKER.RULE_4}</div>
                </>
              ) : selectedGame.game_type === 'reaction' ? (
                <>
                  <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    📖 {TEXT.GAMES.REACTION.RULES_TITLE}:
                  </div>
                  <div>👁️ {TEXT.GAMES.REACTION.RULE_1}</div>
                  <div>🎯 {TEXT.GAMES.REACTION.RULE_2}</div>
                  <div>⚡ {TEXT.GAMES.REACTION.RULE_3}</div>
                  <div>💎 <strong style={{ color: 'var(--ruby)' }}>{TEXT.GAMES.REACTION.RULE_4}</strong></div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    📖 {TEXT.GAMES.GAME_2048.RULES_TITLE}:
                  </div>
                  <div>🔸 {TEXT.GAMES.GAME_2048.RULE_1}</div>
                  <div>🔸 {TEXT.GAMES.GAME_2048.RULE_2}</div>
                  <div>
                    💎 <strong>Награды в рубинах:</strong>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '4px 10px',
                        marginTop: '4px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-pixel)',
                      }}
                    >
                      <span style={{ color: 'var(--ink)' }}>128 ➔ <span style={{ color: 'var(--ruby)' }}>+100 💎</span></span>
                      <span style={{ color: 'var(--ink)' }}>256 ➔ <span style={{ color: 'var(--ruby)' }}>+200 💎</span></span>
                      <span style={{ color: 'var(--ink)' }}>512 ➔ <span style={{ color: 'var(--ruby)' }}>+400 💎</span></span>
                      <span style={{ color: 'var(--ink)' }}>1024 ➔ <span style={{ color: 'var(--ruby)' }}>+800 💎</span></span>
                      <span style={{ color: '#b8860b', gridColumn: 'span 2' }}>
                        2048 ➔ <span style={{ color: 'var(--ruby)', fontWeight: 'bold' }}>+1 600 💎</span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Большая кнопка «Играть» */}
            <button
              type="button"
              onClick={() => {
                const gameType = selectedGame.game_type;
                setSelectedGame(null);
                setActivePlayingGame(gameType);
              }}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '13px',
                backgroundColor: 'var(--panel-olive)',
                color: 'var(--text-on-dark)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #283121',
                outline: '1.5px solid var(--panel-olive-border)',
                outlineOffset: '-4px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer',
              }}
            >
              {TEXT.GAMES.PLAY_BUTTON}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
