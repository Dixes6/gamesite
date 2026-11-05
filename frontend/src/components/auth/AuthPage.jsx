import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { PixelLandscape } from '../common/PixelLandscape';
import { TEXT } from '../../constants/text';

export function AuthPage() {
  const [activeTab, setActiveTab] = useState('register'); // По умолчанию предлагаем начать регистрацию

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        flex: 1,
        padding: '24px 18px 0 18px',
      }}
    >
      {/* Заголовок игры */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1
          style={{
            fontSize: '32px',
            color: 'var(--ink)',
            textShadow: '1px 1px 0 rgba(255,255,255,0.4)',
            marginBottom: '4px',
          }}
        >
          {TEXT.AUTH.APP_TITLE}
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--ink-muted)',
            lineHeight: 1.3,
          }}
        >
          {TEXT.AUTH.APP_SUBTITLE}
        </p>
      </div>

      {/* Переключатель вкладок: Вход / Регистрация */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'rgba(58, 40, 24, 0.2)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '18px',
          border: '1.5px solid rgba(110, 85, 56, 0.3)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          style={{
            flex: 1,
            padding: '10px 0',
            fontFamily: 'var(--font-pixel)',
            fontSize: '15px',
            fontWeight: 700,
            borderRadius: '8px',
            color: activeTab === 'register' ? 'var(--text-on-dark)' : 'var(--ink-muted)',
            backgroundColor: activeTab === 'register' ? 'var(--panel-olive)' : 'transparent',
            border: activeTab === 'register' ? '1.5px solid var(--panel-olive-border)' : 'none',
            boxShadow: activeTab === 'register' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {TEXT.AUTH.TAB_REGISTER}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('login')}
          style={{
            flex: 1,
            padding: '10px 0',
            fontFamily: 'var(--font-pixel)',
            fontSize: '15px',
            fontWeight: 700,
            borderRadius: '8px',
            color: activeTab === 'login' ? 'var(--text-on-dark)' : 'var(--ink-muted)',
            backgroundColor: activeTab === 'login' ? 'var(--panel-olive)' : 'transparent',
            border: activeTab === 'login' ? '1.5px solid var(--panel-olive-border)' : 'none',
            boxShadow: activeTab === 'login' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {TEXT.AUTH.TAB_LOGIN}
        </button>
      </div>

      {/* Форма */}
      <div style={{ marginBottom: '24px' }}>
        {activeTab === 'register' ? (
          <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
        ) : (
          <LoginForm onSwitchToRegister={() => setActiveTab('register')} />
        )}
      </div>

      {/* Атмосферный пиксельный пейзаж внизу экрана */}
      <PixelLandscape />
    </div>
  );
}
