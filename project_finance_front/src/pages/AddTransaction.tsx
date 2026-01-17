import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { getCategories } from '../api/categories';
import { IOSHeader } from '../components/ios/IOSHeader';
import { IOSInput } from '../components/ios/IOSInput';
import { IOSSelect } from '../components/ios/IOSSelect';
import { IOSCard } from '../components/ios/IOSCard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ArrowDownRight, ArrowUpRight, Home, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
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
        <IOSHeader 
          title="Новая транзакция" 
          showBack
          rightAction={
            <button
              onClick={() => {
                hapticFeedback('light');
                navigate('/dashboard');
              }}
              className="p-2 active:opacity-50"
              title="На главный экран"
            >
              <Home className="w-5 h-5 text-primary-500" />
            </button>
          }
        />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-dark pb-6">
      <IOSHeader 
        title="Новая транзакция" 
        showBack
        rightAction={
          <button
            onClick={() => {
              hapticFeedback('light');
              navigate('/dashboard');
            }}
            className="p-2 active:opacity-50"
            title="На главный экран"
          >
            <Home className="w-5 h-5 text-primary-500" />
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Выбор типа */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <IOSCard className="p-2">
            <div className="relative flex gap-2 p-1 bg-ios-dark-tertiary rounded-ios-lg">
              {/* Анимированный фон для активной кнопки */}
              <motion.div
                className={`absolute top-1 bottom-1 rounded-ios-lg ${
                  transactionType === 'expense'
                    ? 'left-1 right-1/2 bg-gradient-to-r from-red-500/30 to-orange-500/20 border border-red-500/30'
                    : 'left-1/2 right-1 bg-gradient-to-r from-green-500/30 to-emerald-500/20 border border-green-500/30'
                }`}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              
              <motion.button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setTransactionType('expense');
                }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-ios-lg font-semibold transition-all z-10 ${
                  transactionType === 'expense'
                    ? 'text-red-400'
                    : 'text-ios-text-tertiary'
                }`}
              >
                <ArrowDownCircle className={`w-5 h-5 ${transactionType === 'expense' ? 'text-red-400' : 'text-ios-text-tertiary'}`} />
                Расход
              </motion.button>
              
              <motion.button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setTransactionType('income');
                }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-ios-lg font-semibold transition-all z-10 ${
                  transactionType === 'income'
                    ? 'text-green-400'
                    : 'text-ios-text-tertiary'
                }`}
              >
                <ArrowUpCircle className={`w-5 h-5 ${transactionType === 'income' ? 'text-green-400' : 'text-ios-text-tertiary'}`} />
                Доход
              </motion.button>
            </div>
          </IOSCard>
        </motion.div>

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
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 px-6 rounded-ios-lg font-semibold text-white transition-all ${
              transactionType === 'income'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:shadow-md`}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
}

