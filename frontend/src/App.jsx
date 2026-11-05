import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { InventoryPage } from './components/inventory/InventoryPage';
import { TasksPage } from './components/tasks/TasksPage';
import { CasesPage } from './components/cases/CasesPage';
import { PlaceholderTab } from './components/common/PlaceholderTab';
import { BottomNav } from './components/navigation/BottomNav';

export function App() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileSubView, setProfileSubView] = useState('main'); // 'main', 'inventory', 'tasks'

  // Индикатор первой проверки токена
  if (loading) {
    return (
      <div className="app-viewport" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '18px',
            color: 'var(--ink)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--ink-muted)',
              borderTopColor: 'var(--accent-green)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span>Загрузка мира...</span>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Если не авторизован — показываем экран Входа / Регистрации
  if (!isAuthenticated) {
    return (
      <div className="app-viewport">
        <AuthPage />
      </div>
    );
  }

  // Переключение вкладок нижней навигации
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'profile') {
      // При клике на вкладку «Профиль» возвращаем на главный экран профиля
      setProfileSubView('main');
    }
  };

  // Отрисовка контента активного раздела
  const renderContent = () => {
    if (activeTab === 'profile') {
      if (profileSubView === 'inventory') {
        return <InventoryPage onBack={() => setProfileSubView('main')} />;
      }
      if (profileSubView === 'tasks') {
        return <TasksPage onBack={() => setProfileSubView('main')} />;
      }
      return (
        <ProfilePage
          onOpenInventory={() => setProfileSubView('inventory')}
          onOpenTasks={() => setProfileSubView('tasks')}
        />
      );
    }

    if (activeTab === 'cases') {
      return <CasesPage />;
    }

    return <PlaceholderTab tabId={activeTab} />;
  };

  return (
    <div className="app-viewport">
      {renderContent()}

      {/* Нижняя навигация */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default App;
