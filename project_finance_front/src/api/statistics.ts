import { api } from './config';

export interface Statistics {
  total_income: number;
  total_expense: number;
  balance: number;
  transactions_count: number;
  income_count: number;
  expense_count: number;
  period_start?: string;
  period_end?: string;
}

export interface StatsItem {
  period: string;
  income: number;
  expense: number;
}

/**
 * Получение статистики за период
 */
export async function getStatisticsForPeriod(
  dateFrom: Date,
  dateTo: Date,
  groupBy: 'day' | 'month' | 'year' = 'month'
): Promise<StatsItem[]> {
  try {
    const dateFromStr = dateFrom.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateToStr = dateTo.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const response = await api.get<StatsItem[]>('/stats/', {
      params: {
        date_from: dateFromStr,
        date_to: dateToStr,
        group_by: groupBy,
      },
    });
    return response.data;
  } catch (error) {
    console.warn('Statistics endpoint not available:', error);
    return [];
  }
}

/**
 * Получение общей статистики (вычисляется на основе транзакций)
 * Используется как fallback, если нужна общая статистика без периода
 */
export async function getStatistics(): Promise<Statistics | null> {
  // Этот эндпоинт не существует на бэкенде в текущей реализации
  // Возвращаем null, статистика будет вычисляться на фронтенде
  return null;
}

