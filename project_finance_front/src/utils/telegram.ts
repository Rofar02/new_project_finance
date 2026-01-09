import type { TelegramWebApp } from '../types';

/**
 * Проверка, открыто ли приложение в Telegram
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.Telegram?.WebApp;
}

/**
 * Получение экземпляра Telegram WebApp
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

/**
 * Вибрация при взаимодействии
 */
export function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  const webApp = getTelegramWebApp();
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.impactOccurred(style);
  } else if (navigator.vibrate) {
    // Fallback для браузера
    const patterns: Record<string, number> = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[style] || 10);
  }
}

/**
 * Показать уведомление
 */
export function showNotification(type: 'error' | 'success' | 'warning'): void {
  const webApp = getTelegramWebApp();
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.notificationOccurred(type);
  }
}

