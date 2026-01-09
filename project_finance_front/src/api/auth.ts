import { api, saveToken, removeToken } from './config';
import type { LoginCredentials, RegisterData, TokenResponse, User } from '../types';

/**
 * Авторизация пользователя
 * OAuth2PasswordRequestForm ожидает application/x-www-form-urlencoded
 */
export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  // Используем URLSearchParams для правильного формата
  const params = new URLSearchParams();
  params.append('username', credentials.email); // OAuth2 использует username, но мы передаем email
  params.append('password', credentials.password);

  console.log('📤 Sending login request to /token', { 
    email: credentials.email,
    username: credentials.email, // OAuth2 использует username
    passwordLength: credentials.password.length 
  });
  console.log('📤 Request params:', params.toString());

  try {
    const response = await api.post<TokenResponse>(
      '/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('✅ Login response:', response.data);

    if (response.data.access_token) {
      saveToken(response.data.access_token);
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Login API error:', error);
    console.error('Error response data:', error.response?.data);
    console.error('Error response status:', error.response?.status);
    console.error('Error response headers:', error.response?.headers);
    console.error('Full error object:', error);
    
    // Детальная информация об ошибке
    if (error.response?.data) {
      console.error('Error detail:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

/**
 * Регистрация нового пользователя
 */
export async function register(data: RegisterData): Promise<User> {
  try {
    console.log('📤 Sending registration request to /users/', data);
    const response = await api.post<User>('/users/', data);
    console.log('✅ Registration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Registration API error:', error);
    // Пробрасываем ошибку дальше
    throw error;
  }
}

/**
 * Выход из системы
 */
export function logout(): void {
  removeToken();
}

/**
 * Авторизация через Telegram WebApp
 */
export async function loginWithTelegram(initData: string): Promise<{ access_token: string; user: User; is_new_user: boolean; needs_link: boolean }> {
  try {
    console.log('📤 Sending Telegram auth request to /telegram/auth');
    const response = await api.post<{ access_token: string; token_type: string; user: User; is_new_user: boolean; needs_link: boolean }>(
      '/telegram/auth',
      { init_data: initData }
    );

    console.log('✅ Telegram auth response:', response.data);

    // Сохраняем токен только если он есть (не пустой)
    if (response.data.access_token && response.data.access_token.length > 0) {
      saveToken(response.data.access_token);
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Telegram auth API error:', error);
    console.error('Error response data:', error.response?.data);
    throw error;
  }
}

/**
 * Связывание Telegram аккаунта с существующим аккаунтом
 */
export async function linkTelegramAccount(initData: string, email: string, password: string): Promise<{ access_token: string; user: User; message: string }> {
  try {
    console.log('📤 Linking Telegram account');
    const response = await api.post<{ access_token: string; user: User; message: string }>(
      '/telegram/link',
      { init_data: initData, email, password }
    );
    console.log('✅ Telegram account linked successfully:', response.data);
    
    if (response.data.access_token) {
      saveToken(response.data.access_token);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Link Telegram account API error:', error);
    console.error('Error response data:', error.response?.data);
    throw error;
  }
}

/**
 * Получение текущего пользователя
 * Использует эндпоинт /me для получения данных пользователя
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log('📥 Fetching current user from /me');
    const response = await api.get<User>('/me');
    console.log('✅ Current user data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to get current user:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    // Если токен невалиден или пользователь не найден, возвращаем null
    return null;
  }
}

