import axios from 'axios';

// Определяем API URL автоматически
function getApiBaseUrl(): string {
  // Используем переменную окружения, если задана
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Проверяем, открыто ли через туннель
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Если это не localhost, значит открыто через туннель
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Используем прокси через Vite (работает только в dev режиме)
    // В production нужен отдельный туннель для backend
    if (import.meta.env.DEV) {
      // В dev режиме используем прокси
      return '/api';
    } else {
      // В production нужна переменная VITE_API_URL
      console.error('❌ VITE_API_URL не задан для production!');
      console.error('❌ Создайте .env файл с VITE_API_URL=https://ваш-backend-tunnel.xtunnel.ru');
      // Fallback - пытаемся угадать (скорее всего не сработает)
      return `${protocol}//${hostname}:8000`;
    }
  }
  
  // Локальная разработка - используем прокси
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Fallback
  return 'http://127.0.0.1:8000';
}

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Токен истек или невалиден
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Сохранение токена
export function saveToken(token: string): void {
  localStorage.setItem('token', token);
}

// Удаление токена
export function removeToken(): void {
  localStorage.removeItem('token');
}
