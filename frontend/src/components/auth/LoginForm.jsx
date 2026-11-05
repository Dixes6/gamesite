import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TEXT } from '../../constants/text';

export function LoginForm({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError(TEXT.AUTH.EMPTY_FIELDS);
      return;
    }

    try {
      setLoading(true);
      await login(cleanUser, password);
    } catch (err) {
      setError(err.message || TEXT.AUTH.ERROR_LOGIN_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Поле Имя */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
          disabled={loading}
          autoComplete="username"
        />
      </div>

      {/* Поле Пароль */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
          disabled={loading}
          autoComplete="current-password"
        />
      </div>

      {/* Блок ошибки */}
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

      {/* Кнопка отправки формы */}
      <button
        type="submit"
        disabled={loading}
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
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? TEXT.AUTH.LOADING : TEXT.AUTH.SUBMIT_LOGIN}
      </button>

      {/* Переключатель на регистрацию */}
      <button
        type="button"
        onClick={onSwitchToRegister}
        style={{
          marginTop: '4px',
          color: 'var(--ink-muted)',
          fontSize: '13px',
          textDecoration: 'underline',
          textAlign: 'center',
        }}
      >
        {TEXT.AUTH.SWITCH_TO_REGISTER}
      </button>
    </form>
  );
}
