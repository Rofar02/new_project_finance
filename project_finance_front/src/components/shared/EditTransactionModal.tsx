import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IOSInput } from '../ios/IOSInput';
import { IOSSelect } from '../ios/IOSSelect';
import { IOSButton } from '../ios/IOSButton';
import { getCategories } from '../../api/categories';
import { hapticFeedback, showNotification } from '../../utils/telegram';
import type { Category, Transaction } from '../../types';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onTransactionUpdated: (updatedTransaction: Transaction) => Promise<void>;
}

export function EditTransactionModal({
  isOpen,
  transaction,
  onClose,
  onTransactionUpdated,
}: EditTransactionModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [errors, setErrors] = useState<{
    amount?: string;
    categoryId?: string;
  }>({});

  // Загружаем категории
  useEffect(() => {
    if (isOpen) {
      getCategories()
        .then((data) => {
          setCategories(data);
        })
        .finally(() => setIsLoadingCategories(false));
    }
  }, [isOpen]);

  // Заполняем форму данными транзакции
  useEffect(() => {
    if (transaction && isOpen) {
      setTransactionType(transaction.transaction_type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setCategoryId(transaction.category_id);
    }
  }, [transaction, isOpen]);

  // Фильтрация категорий по типу
  const filteredCategories = categories.filter((cat) => cat.type === transactionType);

  // Обновление категории при смене типа транзакции
  useEffect(() => {
    if (categories.length === 0) return;
    
    const filtered = categories.filter((cat) => cat.type === transactionType);
    if (filtered.length > 0) {
      // Проверяем, что текущая категория не подходит для нового типа
      const currentCategory = categories.find((cat) => cat.id === categoryId);
      if (!currentCategory || currentCategory.type !== transactionType) {
        setCategoryId(filtered[0].id);
      }
    } else {
      setCategoryId('');
    }
  }, [transactionType, categories]);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Введите корректную сумму';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Выберите категорию';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticFeedback('light');

    if (!validate() || !transaction) {
      showNotification('error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        amount: parseFloat(amount),
        description: description.trim() || undefined,
        category_id: Number(categoryId),
        transaction_type: transactionType,
      };

      const updatedTransaction = {
        ...transaction,
        ...updateData,
        amount: parseFloat(amount),
        description: description.trim() || null,
        category_id: Number(categoryId),
        transaction_type: transactionType,
      } as Transaction;

      await onTransactionUpdated(updatedTransaction);
      showNotification('success');
      onClose();
    } catch (error: any) {
      console.error('❌ Transaction update error:', error);
      showNotification('error');
      const errorMessage = error.response?.data?.detail || error.message || 'Ошибка при обновлении транзакции';
      setErrors({
        amount: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full bg-ios-dark rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-ios-dark border-b border-ios-dark-quaternary/50 px-4 py-3 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-ios-text">Редактировать транзакцию</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 active:opacity-50"
            >
              <X className="w-6 h-6 text-ios-text" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Выбор типа */}
            <div className="bg-ios-dark-secondary rounded-ios-lg p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('light');
                    setTransactionType('expense');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-ios-lg font-semibold transition-all ${
                    transactionType === 'expense'
                      ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                      : 'bg-ios-dark-tertiary text-ios-text-tertiary'
                  }`}
                >
                  <ArrowUpRight className="w-5 h-5" />
                  Расход
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('light');
                    setTransactionType('income');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-ios-lg font-semibold transition-all ${
                    transactionType === 'income'
                      ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                      : 'bg-ios-dark-tertiary text-ios-text-tertiary'
                  }`}
                >
                  <ArrowDownRight className="w-5 h-5" />
                  Доход
                </button>
              </div>
            </div>

            {/* Сумма */}
            <div className="bg-ios-dark-secondary rounded-ios-lg p-4">
              <IOSInput
                label="Сумма"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                error={errors.amount}
                autoFocus
              />
            </div>

            {/* Категория */}
            <div className="bg-ios-dark-secondary rounded-ios-lg p-4">
              {isLoadingCategories ? (
                <div>
                  <label className="block text-ios-text-secondary text-sm mb-2">
                    Категория
                  </label>
                  <p className="text-ios-text-tertiary text-sm">Загрузка...</p>
                </div>
              ) : filteredCategories.length > 0 ? (
                <IOSSelect
                  label="Категория"
                  value={categoryId ? String(categoryId) : ''}
                  onChange={(e) => {
                    const newCategoryId = Number(e.target.value);
                    if (newCategoryId) {
                      setCategoryId(newCategoryId);
                    }
                  }}
                  error={errors.categoryId}
                  options={filteredCategories.map((cat) => ({
                    value: cat.id,
                    label: cat.icon ? `${cat.icon} ${cat.name}` : cat.name,
                  }))}
                />
              ) : (
                <div>
                  <label className="block text-ios-text-secondary text-sm mb-2">
                    Категория
                  </label>
                  <p className="text-ios-text-tertiary text-sm">
                    {transactionType === 'income' 
                      ? 'Создайте категорию дохода' 
                      : 'Создайте категорию расхода'}
                  </p>
                </div>
              )}
            </div>

            {/* Описание */}
            <div className="bg-ios-dark-secondary rounded-ios-lg p-4">
              <IOSInput
                label="Описание (необязательно)"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Добавьте описание..."
              />
            </div>

            {/* Кнопка сохранения */}
            <IOSButton
              type="submit"
              fullWidth
              disabled={isSubmitting || isLoadingCategories}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </IOSButton>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

