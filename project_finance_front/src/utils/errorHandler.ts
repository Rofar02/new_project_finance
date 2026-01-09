import { AxiosError } from 'axios';

/**
 * Извлечение сообщения об ошибке из ответа FastAPI
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response;
    
    if (response?.data) {
      // FastAPI обычно возвращает ошибки в поле detail
      const detail = response.data.detail;
      
      if (typeof detail === 'string') {
        return detail;
      }
      
      if (Array.isArray(detail)) {
        // Валидационные ошибки - массив объектов
        const firstError = detail[0];
        if (firstError?.msg) {
          return firstError.msg;
        }
        if (firstError?.loc && firstError?.msg) {
          return `${firstError.loc[firstError.loc.length - 1]}: ${firstError.msg}`;
        }
      }
      
      // Если detail - объект с сообщением
      if (detail?.message) {
        return detail.message;
      }
    }
    
    // Стандартные HTTP ошибки
    if (response?.status === 400) {
      return 'Неверный запрос. Проверьте введенные данные.';
    }
    if (response?.status === 401) {
      return 'Не авторизован. Войдите в систему.';
    }
    if (response?.status === 403) {
      return 'Доступ запрещен.';
    }
    if (response?.status === 404) {
      return 'Ресурс не найден.';
    }
    if (response?.status === 409) {
      return 'Конфликт данных. Возможно, email уже используется.';
    }
    if (response?.status === 422) {
      return 'Ошибка валидации данных.';
    }
    if (response?.status === 500) {
      return 'Ошибка сервера. Попробуйте позже.';
    }
    
    return error.message || 'Произошла ошибка при выполнении запроса.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Неизвестная ошибка';
}

/**
 * Проверка, является ли ошибка связанной с дублированием email
 */
export function isEmailExistsError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('email') && 
    (message.includes('уже') || message.includes('already') || message.includes('exists') || message.includes('duplicate'))
  );
}








