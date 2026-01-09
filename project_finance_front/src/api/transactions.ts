import { api } from './config';
import type { Transaction, CreateTransactionData, GroupedTransaction } from '../types';

/**
 * Получение списка транзакций
 */
export async function getTransactions(): Promise<Transaction[]> {
  const response = await api.get<Transaction[]>('/transactions/');
  return response.data;
}

/**
 * Создание новой транзакции
 */
export async function createTransaction(data: CreateTransactionData): Promise<Transaction> {
  const response = await api.post<Transaction>('/transactions/', data);
  return response.data;
}

/**
 * Удаление транзакции
 */
export async function deleteTransaction(id: number): Promise<void> {
  try {
    await api.delete(`/transactions/${id}`);
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    // Пробрасываем ошибку дальше с дополнительной информацией
    if (error.response) {
      throw new Error(error.response.data?.detail || `Ошибка удаления: ${error.response.status}`);
    }
    throw error;
  }
}

/**
 * Группировка транзакций по датам
 */
export function groupTransactionsByDate(transactions: Transaction[]): GroupedTransaction[] {
  const grouped: Record<string, Transaction[]> = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.created_at).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(transaction);
  });

  return Object.entries(grouped)
    .map(([date, transactions]) => ({
      date,
      transactions,
      total: transactions.reduce((sum, t) => sum + (t.transaction_type === 'income' ? t.amount : -t.amount), 0),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Вычисление баланса
 */
export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((balance, transaction) => {
    return balance + (transaction.transaction_type === 'income' ? transaction.amount : -transaction.amount);
  }, 0);
}

/**
 * Получение статистики по категориям (расходы)
 */
export function getCategoryStats(transactions: Transaction[], categories?: Array<{ id: number; name: string }>) {
  const stats: Record<number, { category: Transaction['category']; total: number }> = {};

  transactions.forEach((transaction) => {
    if (transaction.transaction_type === 'expense' && transaction.category_id) {
      if (!stats[transaction.category_id]) {
        // Если категория не загружена в транзакции, пытаемся найти её в списке категорий
        let category = transaction.category;
        if (!category && categories) {
          const foundCategory = categories.find((cat) => cat.id === transaction.category_id);
          if (foundCategory) {
            category = { id: foundCategory.id, name: foundCategory.name } as Transaction['category'];
          }
        }
        stats[transaction.category_id] = {
          category: category,
          total: 0,
        };
      }
      stats[transaction.category_id].total += transaction.amount;
    }
  });

  return Object.values(stats).sort((a, b) => b.total - a.total);
}

/**
 * Получение статистики по категориям (доходы)
 */
export function getIncomeCategoryStats(transactions: Transaction[], categories?: Array<{ id: number; name: string }>) {
  const stats: Record<number, { category: Transaction['category']; total: number }> = {};

  transactions.forEach((transaction) => {
    if (transaction.transaction_type === 'income' && transaction.category_id) {
      if (!stats[transaction.category_id]) {
        // Если категория не загружена в транзакции, пытаемся найти её в списке категорий
        let category = transaction.category;
        if (!category && categories) {
          const foundCategory = categories.find((cat) => cat.id === transaction.category_id);
          if (foundCategory) {
            category = { id: foundCategory.id, name: foundCategory.name } as Transaction['category'];
          }
        }
        stats[transaction.category_id] = {
          category: category,
          total: 0,
        };
      }
      stats[transaction.category_id].total += transaction.amount;
    }
  });

  return Object.values(stats).sort((a, b) => b.total - a.total);
}

