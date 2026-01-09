import { useState, useEffect } from 'react';
import { getTransactions, createTransaction, deleteTransaction } from '../api/transactions';
import type { Transaction, CreateTransactionData } from '../types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки транзакций');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const addTransaction = async (data: CreateTransactionData) => {
    try {
      const newTransaction = await createTransaction(data);
      setTransactions((prev) => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      throw err;
    }
  };

  const removeTransaction = async (id: number) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    transactions,
    isLoading,
    error,
    addTransaction,
    removeTransaction,
    refreshTransactions: fetchTransactions,
  };
}








