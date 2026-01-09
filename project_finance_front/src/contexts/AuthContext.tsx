import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser, loginWithTelegram } from '../api/auth';
import type { User, LoginCredentials, RegisterData } from '../types';
import { getTelegramWebApp } from '../utils/telegram';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Инициализируем hasToken из localStorage при первой загрузке
  const [hasToken, setHasToken] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !!localStorage.getItem('token');
    }
    return false;
  });

  console.log('🔐 AuthProvider initialized, isLoading:', isLoading, 'user:', user, 'hasToken:', hasToken);

  useEffect(() => {
    // Проверка токена при загрузке
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          setHasToken(true);
          // Попытка получить данные пользователя
          try {
            const userData = await getCurrentUser();
            if (userData) {
              setUser(userData);
              console.log('✅ User loaded from token:', userData);
            } else {
              console.warn('⚠️ Token exists but user data not available');
            }
          } catch (error) {
            // Эндпоинт недоступен или токен невалиден
            console.warn('Could not fetch user data:', error);
            // Если токен невалиден, удаляем его
            localStorage.removeItem('token');
            setHasToken(false);
          }
        } else {
          // Telegram авторизация опциональна - пользователь может использовать обычный логин
          // Проверяем Telegram WebApp только для информации, но не авторизуем автоматически
          const tgWebApp = getTelegramWebApp();
          if (tgWebApp) {
            console.log('📱 Telegram WebApp detected, but using standard auth');
            // Можно использовать данные Telegram для предзаполнения формы, но не авторизуем автоматически
          }
        }
      } catch (error) {
        // Игнорируем ошибки при проверке
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Небольшая задержка для предотвращения проблем с инициализацией
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    console.log('🔐 Starting login process...');
    await apiLogin(credentials);
    setHasToken(true);
    console.log('✅ Token saved, fetching user data...');
    const userData = await getCurrentUser();
    if (userData) {
      setUser(userData);
      console.log('✅ Login successful, user set:', userData);
    } else {
      console.warn('⚠️ Login successful but user data not available');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      console.log('📝 Registering user:', data.email);
      // Сохраняем пароль перед регистрацией, так как после регистрации он будет захеширован
      const password = data.hashed_password;
      await apiRegister(data);
      console.log('✅ Registration successful, logging in...');
      // После регистрации автоматически логинимся
      await login({ email: data.email, password });
    } catch (error) {
      console.error('❌ Registration failed:', error);
      // Пробрасываем ошибку дальше, чтобы Register.tsx мог её обработать
      throw error;
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setHasToken(false);
  };

  // isAuthenticated проверяет наличие токена или пользователя
  // Это позволяет избежать проблем, когда токен есть, но данные пользователя еще не загружены
  const isAuthenticated = hasToken || !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

