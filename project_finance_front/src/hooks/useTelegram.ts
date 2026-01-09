import { useEffect, useState } from 'react';
import type { TelegramWebApp } from '../types';
import { getTelegramWebApp, isTelegramWebApp } from '../utils/telegram';

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const checkTelegram = () => {
      const tgWebApp = getTelegramWebApp();
      const isTg = isTelegramWebApp();
      
      if (tgWebApp && isTg) {
        // Инициализируем WebApp
        tgWebApp.ready();
        tgWebApp.expand();
        
        // Настраиваем тему
        if (tgWebApp.colorScheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        
        setWebApp(tgWebApp);
        setIsTelegram(true);
      }
    };

    // Проверяем сразу
    checkTelegram();

    // Также проверяем через небольшую задержку на случай, если скрипт загрузится позже
    const timer = setTimeout(checkTelegram, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    webApp,
    isTelegram,
    user: webApp?.initDataUnsafe?.user,
    hapticFeedback: webApp?.HapticFeedback,
  };
}

