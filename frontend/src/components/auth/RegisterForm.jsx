import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStarterItems, getImageUrl } from '../../api/client';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { ItemBadge } from '../common/ItemBadge';
import { TEXT } from '../../constants/text';

export function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Стартовые предметы с сервера
  const [starters, setStarters] = useState({ avatars: [], frames: [] });
  const [loadingStarters, setLoadingStarters] = useState(true);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
  const [selectedFrameId, setSelectedFrameId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Загружаем стартовые аватарки и рамки из GET /auth/starter-items
  useEffect(() => {
    let isMounted = true;
    async function loadStarters() {
      try {
        setLoadingStarters(true);
        const data = await getStarterItems();
        if (isMounted) {
          setStarters(data);
          if (data.avatars && data.avatars.length > 0) {
            setSelectedAvatarId(data.avatars[0].id);
          }
          if (data.frames && data.frames.length > 0) {
            setSelectedFrameId(data.frames[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(TEXT.AUTH.STARTER_LOADING + ' (' + err.message + ')');
        }
      } finally {
        if (isMounted) setLoadingStarters(false);
      }
    }
    loadStarters();
    return () => {
      isMounted = false;
    };
  }, []);

  // Находим выбранные объекты для предпросмотра
  const currentAvatar = starters.avatars.find((a) => a.id === selectedAvatarId);
  const currentFrame = starters.frames.find((f) => f.id === selectedFrameId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError(TEXT.AUTH.EMPTY_FIELDS);
      return;
    }

    if (!selectedAvatarId || !selectedFrameId) {
      setError(TEXT.AUTH.SELECT_REQUIRED);
      return;
    }

    try {
      setSubmitting(true);
      await register({
        username: cleanUser,
        password,
        avatarId: selectedAvatarId,
        frameId: selectedFrameId,
      });
    } catch (err) {
      setError(err.message || TEXT.AUTH.ERROR_GENERIC);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Живой предпросмотр персонажа */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '12px 14px',
          backgroundColor: 'rgba(255, 246, 228, 0.55)',
          border: '1.5px solid rgba(110, 85, 56, 0.4)',
          borderRadius: '12px',
        }}
      >
        <AvatarDisplay
          avatarImage={currentAvatar?.image}
          frameImage={currentFrame?.image}
          size={76}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
            {TEXT.AUTH.HERO_PREVIEW_TITLE}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '18px',
              color: 'var(--ink)',
              fontWeight: 700,
            }}
          >
            {username.trim() || 'Безымянный герой'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
            {TEXT.PROFILE.LEVEL_PREFIX} 1 (0 XP)
          </span>
        </div>
      </div>

      {/* Поля ввода логина и пароля */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '14px',
              color: 'var(--ink)',
              fontWeight: 700,
            }}
          >
            {TEXT.AUTH.USERNAME_LABEL}
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={TEXT.AUTH.USERNAME_PLACEHOLDER}
            disabled={submitting}
            autoComplete="username"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '14px',
              color: 'var(--ink)',
              fontWeight: 700,
            }}
          >
            {TEXT.AUTH.PASSWORD_LABEL}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={TEXT.AUTH.PASSWORD_PLACEHOLDER}
            disabled={submitting}
            autoComplete="new-password"
          />
        </div>
      </div>

      {/* Выбор стартовой аватарки */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '14px',
            color: 'var(--ink)',
            fontWeight: 700,
          }}
        >
          {TEXT.AUTH.AVATAR_SELECT_TITLE}
        </span>

        {loadingStarters ? (
          <div style={{ fontSize: '13px', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            {TEXT.AUTH.STARTER_LOADING}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {starters.avatars.map((ava) => {
              const isSelected = ava.id === selectedAvatarId;
              return (
                <button
                  key={ava.id}
                  type="button"
                  onClick={() => setSelectedAvatarId(ava.id)}
                  style={{
                    position: 'relative',
                    width: '62px',
                    height: '62px',
                    padding: '3px',
                    backgroundColor: isSelected ? 'rgba(111, 143, 58, 0.35)' : 'rgba(255, 246, 228, 0.5)',
                    border: isSelected ? '2px solid var(--accent-green)' : '2px solid rgba(110, 85, 56, 0.35)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? '0 0 8px rgba(111, 143, 58, 0.5)' : 'none',
                  }}
                >
                  {/* Иконка стартового предмета */}
                  <div style={{ position: 'absolute', top: '-4px', left: '-4px', zIndex: 3 }}>
                    <ItemBadge isStarter={true} iconOnly={true} />
                  </div>

                  <img
                    src={getImageUrl(ava.image)}
                    alt={ava.name}
                    className="pixelated"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '6px',
                    }}
                  />
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-3px',
                        right: '-3px',
                        backgroundColor: 'var(--accent-green)',
                        color: '#fff',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Выбор стартовой рамки */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '14px',
            color: 'var(--ink)',
            fontWeight: 700,
          }}
        >
          {TEXT.AUTH.FRAME_SELECT_TITLE}
        </span>

        {loadingStarters ? (
          <div style={{ fontSize: '13px', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            {TEXT.AUTH.STARTER_LOADING}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {starters.frames.map((frm) => {
              const isSelected = frm.id === selectedFrameId;
              return (
                <button
                  key={frm.id}
                  type="button"
                  onClick={() => setSelectedFrameId(frm.id)}
                  style={{
                    position: 'relative',
                    width: '62px',
                    height: '62px',
                    padding: '3px',
                    backgroundColor: isSelected ? 'rgba(111, 143, 58, 0.35)' : 'rgba(255, 246, 228, 0.5)',
                    border: isSelected ? '2px solid var(--accent-green)' : '2px solid rgba(110, 85, 56, 0.35)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? '0 0 8px rgba(111, 143, 58, 0.5)' : 'none',
                  }}
                >
                  {/* Иконка стартового предмета */}
                  <div style={{ position: 'absolute', top: '-4px', left: '-4px', zIndex: 3 }}>
                    <ItemBadge isStarter={true} iconOnly={true} />
                  </div>

                  <img
                    src={getImageUrl(frm.image)}
                    alt={frm.name}
                    className="pixelated"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-3px',
                        right: '-3px',
                        backgroundColor: 'var(--accent-green)',
                        color: '#fff',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Ошибка */}
      {error && (
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(196, 48, 43, 0.15)',
            border: '1.5px solid var(--ruby)',
            borderRadius: '8px',
            color: '#7a1815',
            fontSize: '13px',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Кнопка регистрации */}
      <button
        type="submit"
        disabled={submitting || loadingStarters}
        style={{
          marginTop: '6px',
          padding: '14px',
          backgroundColor: 'var(--panel-olive)',
          color: 'var(--text-on-dark)',
          fontFamily: 'var(--font-pixel)',
          fontSize: '17px',
          borderRadius: '10px',
          border: '2px solid #283121',
          outline: '1.5px solid var(--panel-olive-border)',
          outlineOffset: '-4px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          cursor: submitting || loadingStarters ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? TEXT.AUTH.LOADING : TEXT.AUTH.SUBMIT_REGISTER}
      </button>

      {/* Переключатель на вход */}
      <button
        type="button"
        onClick={onSwitchToLogin}
        style={{
          marginTop: '4px',
          color: 'var(--ink-muted)',
          fontSize: '13px',
          textDecoration: 'underline',
          textAlign: 'center',
        }}
      >
        {TEXT.AUTH.SWITCH_TO_LOGIN}
      </button>
    </form>
  );
}
