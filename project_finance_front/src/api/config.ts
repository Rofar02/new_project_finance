import axios from 'axios';

// Определяем API URL автоматически
function getApiBaseUrl(): string {
  // 1. Если проект запущен на сервере (через домен gredzenfinance.ru)
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return '/api'; // На сервере Nginx сам поймет, что это 8000 порт
  }

  // 2. Если ты работаешь локально в PyCharm (localhost)
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'; // Прямой путь к твоему бэкенду
  }

  // 3. Запасной вариант
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
