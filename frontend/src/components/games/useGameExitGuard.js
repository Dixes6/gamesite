import { useState, useEffect, useCallback, useRef } from 'react';
import { TEXT } from '../../constants/text';

const TAB_LABELS = {
  profile: TEXT.NAV.PROFILE,
  games: TEXT.NAV.GAMES,
  cases: TEXT.NAV.CASES,
  shop: TEXT.NAV.SHOP,
};

/**
 * Хук защиты от случайного выхода из активной игры.
 * Перехватывает:
 * 1) Нажатие вкладок нижней навигации (BottomNav)
 * 2) Кнопку «Назад» / жест возврата в браузере (popstate)
 * 3) Перезагрузку или закрытие вкладки браузера (beforeunload)
 * 4) Нажатие внутриигровой кнопки выхода
 */
export function useGameExitGuard({
  isFinished,
  submitting,
  onExit,
  registerNavigationGuard,
  onNavigateTab,
  onBeforePause,
  onAfterResume,
}) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // Куда хотел уйти пользователь: null | { type: 'menu' } | { type: 'back' } | { type: 'tab', tabId: string }
  const [pendingTarget, setPendingTarget] = useState(null);

  const showExitConfirmRef = useRef(false);
  showExitConfirmRef.current = showExitConfirm;

  const isFinishedRef = useRef(isFinished);
  isFinishedRef.current = isFinished;

  const submittingRef = useRef(submitting);
  submittingRef.current = submitting;

  const pendingTargetRef = useRef(pendingTarget);
  pendingTargetRef.current = pendingTarget;

  const exitingCleanlyRef = useRef(false);

  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const onNavigateTabRef = useRef(onNavigateTab);
  onNavigateTabRef.current = onNavigateTab;

  const onBeforePauseRef = useRef(onBeforePause);
  onBeforePauseRef.current = onBeforePause;

  const onAfterResumeRef = useRef(onAfterResume);
  onAfterResumeRef.current = onAfterResume;

  // Запрос на выход из игры (открывает модалку и ставит игру на паузу)
  const requestExit = useCallback((target = { type: 'menu' }) => {
    if (isFinishedRef.current || submittingRef.current) return;
    setPendingTarget(target);
    pendingTargetRef.current = target;
    if (!showExitConfirmRef.current) {
      showExitConfirmRef.current = true;
      setShowExitConfirm(true);
      if (onBeforePauseRef.current) {
        onBeforePauseRef.current();
      }
    }
  }, []);

  // Отмена выхода (кнопка «Продолжить», клик по фону или Escape)
  const cancelExit = useCallback(() => {
    if (submittingRef.current) return;
    showExitConfirmRef.current = false;
    setShowExitConfirm(false);
    setPendingTarget(null);
    pendingTargetRef.current = null;
    if (onAfterResumeRef.current) {
      onAfterResumeRef.current();
    }
  }, []);

  // Сброс состояния при «Сыграть снова»
  const resetExitGuard = useCallback(() => {
    showExitConfirmRef.current = false;
    setShowExitConfirm(false);
    setPendingTarget(null);
    pendingTargetRef.current = null;
    exitingCleanlyRef.current = false;
  }, []);

  // Окончательный выход из игры (после экрана итогов или после завершения)
  const performExit = useCallback(
    (overrideTarget = null) => {
      const target = overrideTarget || pendingTargetRef.current;
      exitingCleanlyRef.current = true;

      // Снимаем guard-запись из истории браузера, если она активна
      if (window.history.state?.activeGameGuard) {
        window.history.back();
      }

      if (target && target.type === 'tab' && target.tabId !== 'games' && onNavigateTabRef.current) {
        onNavigateTabRef.current(target.tabId);
      } else if (onExitRef.current) {
        onExitRef.current();
      }
    },
    []
  );

  // Регистрация перехватчика вкладок нижней навигации
  useEffect(() => {
    if (!registerNavigationGuard) return undefined;

    const guard = (tabId) => {
      if (isFinishedRef.current) {
        exitingCleanlyRef.current = true;
        if (window.history.state?.activeGameGuard) {
          window.history.back();
        }
        if (tabId === 'games') {
          if (onExitRef.current) onExitRef.current();
          return false;
        }
        return true;
      }

      requestExit({ type: 'tab', tabId });
      return false;
    };

    registerNavigationGuard(guard);
    return () => registerNavigationGuard(null);
  }, [registerNavigationGuard, requestExit]);

  // Перехват кнопки «Назад» в браузере (popstate)
  useEffect(() => {
    // Добавляем guard-состояние в историю, только если его ещё нет (безопасно для React StrictMode)
    if (!window.history.state?.activeGameGuard) {
      window.history.pushState({ ...(window.history.state || {}), activeGameGuard: true }, '');
    }

    const handlePopState = () => {
      if (exitingCleanlyRef.current) return;

      // Если итоги игры уже показаны — просто выходим в меню игр
      if (isFinishedRef.current) {
        exitingCleanlyRef.current = true;
        if (onExitRef.current) onExitRef.current();
        return;
      }

      // Возвращаем guard-запись обратно, чтобы пользователь оставался на странице игры
      if (!window.history.state?.activeGameGuard) {
        window.history.pushState({ ...(window.history.state || {}), activeGameGuard: true }, '');
      }

      requestExit({ type: 'back' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [requestExit]);

  // Перехват обновления страницы, закрытия вкладки и перехода по внешнему URL
  useEffect(() => {
    if (isFinished) return undefined;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFinished]);

  // Закрытие модалки подтверждения по клавише Escape
  useEffect(() => {
    if (!showExitConfirm) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExitConfirm, cancelExit]);

  // Текст кнопки выхода на экране итогов (учитывает вкладку, на которую хотел перейти игрок)
  const getResultExitLabel = useCallback(
    (defaultLabel) => {
      if (pendingTarget?.type === 'tab' && pendingTarget.tabId !== 'games') {
        const tabName = TAB_LABELS[pendingTarget.tabId];
        if (tabName) {
          return `${TEXT.GAMES.GO_TO_TAB_PREFIX}${tabName}${TEXT.GAMES.GO_TO_TAB_SUFFIX}`;
        }
      }
      return defaultLabel;
    },
    [pendingTarget]
  );

  return {
    showExitConfirm,
    setShowExitConfirm,
    requestExit,
    cancelExit,
    resetExitGuard,
    performExit,
    getResultExitLabel,
  };
}
