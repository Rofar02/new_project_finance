import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { getCategories } from '../api/categories';
import { IOSHeader } from '../components/ios/IOSHeader';
import { IOSInput } from '../components/ios/IOSInput';
import { IOSSelect } from '../components/ios/IOSSelect';
import { IOSButton } from '../components/ios/IOSButton';
import { IOSCard } from '../components/ios/IOSCard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback, showNotification } from '../utils/telegram';
import type { Category } from '../types';

export function AddTransaction() {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
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

  // Фильтрация категорий по типу
  const filteredCategories = categories.filter((cat) => cat.type === transactionType);

  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
        // Устанавливаем первую категорию правильного типа
        const filtered = data.filter((cat) => cat.type === transactionType);
        if (filtered.length > 0) {
          setCategoryId(filtered[0].id);
        }
      })
      .finally(() => setIsLoadingCategories(false));
  }, []);

  // Обновление категории при смене типа транзакции
  useEffect(() => {
    if (categories.length === 0) return; // Ждем загрузки категорий
    
    const filtered = categories.filter((cat) => cat.type === transactionType);
    if (filtered.length > 0) {
      // Проверяем, что текущая категория не подходит для нового типа
      const currentCategory = categories.find((cat) => cat.id === categoryId);
      if (!currentCategory || currentCategory.type !== transactionType) {
        setCategoryId(filtered[0].id);
      }
    } else {
      // Если нет категорий нужного типа, сбрасываем выбор
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

    if (!validate()) {
      showNotification('error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Проверяем, что categoryId установлен
      if (!categoryId || categoryId === '') {
        setErrors({
          categoryId: 'Выберите категорию',
        });
        showNotification('error');
        setIsSubmitting(false);
        return;
      }

      const transactionData = {
        amount: parseFloat(amount),
        description: description.trim() || undefined,
        category_id: Number(categoryId),
        transaction_type: transactionType,
      };

      console.log('📤 Creating transaction:', transactionData);

      await addTransaction(transactionData);
      hapticFeedback('medium');
      showNotification('success');
      navigate('/transactions');
    } catch (error: any) {
      console.error('❌ Transaction creation error:', error);
      showNotification('error');
      const errorMessage = error.response?.data?.detail || error.message || 'Ошибка при создании транзакции';
      setErrors({
        amount: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCategories) {
    return (
      <div className="min-h-screen bg-ios-dark">
        <IOSHeader title="Новая транзакция" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-dark pb-6">
      <IOSHeader title="Новая транзакция" showBack />

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Выбор типа */}
        <IOSCard>
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
        </IOSCard>

        {/* Сумма */}
        <IOSCard>
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
        </IOSCard>

        {/* Категория */}
        <IOSCard>
          {filteredCategories.length > 0 ? (
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
                  ? 'Создайте категорию дохода на главной странице' 
                  : 'Создайте категорию расхода на главной странице'}
              </p>
            </div>
          )}
        </IOSCard>

        {/* Описание */}
        <IOSCard>
          <IOSInput
            label="Описание (необязательно)"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Добавьте описание..."
          />
        </IOSCard>

        {/* Кнопка сохранения */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <IOSButton
            type="submit"
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </IOSButton>
        </motion.div>
      </form>
    </div>
  );
}

