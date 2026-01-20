import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { groupTransactionsByDate } from '../api/transactions';
import { IOSHeader } from '../components/ios/IOSHeader';
import { IOSCard } from '../components/ios/IOSCard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { EditTransactionModal } from '../components/shared/EditTransactionModal';
import { EmptyState } from '../components/shared/EmptyState';
import { Trash2, ArrowUpRight, ArrowDownRight, Home, Edit, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticFeedback, showNotification } from '../utils/telegram';
import type { Transaction } from '../types';

export function Transactions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('type') as 'income' | 'expense' | null;
  const { transactions, isLoading, error, removeTransaction, updateTransaction, refreshTransactions } = useTransactions();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [swipedId, setSwipedId] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Фильтруем транзакции по типу, если указан фильтр
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!filterType) return transactions;
    return transactions.filter(t => t.transaction_type === filterType);
  }, [transactions, filterType]);

  const grouped = groupTransactionsByDate(filteredTransactions);

  const handleDelete = async (id: number) => {
    hapticFeedback('medium');
    setDeletingId(id);
    try {
      await removeTransaction(id);
      showNotification('success');
      setSwipedId(null);
    } catch (err: any) {
      console.error('Failed to delete transaction:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка при удалении транзакции';
      alert(errorMessage);
      showNotification('error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSwipe = (id: number, direction: 'left' | 'right') => {
    if (swipedId === id && swipeDirection === direction) {
      // Закрываем свайп
      setSwipedId(null);
      setSwipeDirection(null);
    } else {
      // Открываем свайп
      setSwipedId(id);
      setSwipeDirection(direction);
      hapticFeedback('light');
    }
  };

  const handleSwipeClose = () => {
    setSwipedId(null);
    setSwipeDirection(null);
  };

  const handleEdit = (transaction: Transaction) => {
    hapticFeedback('light');
    setEditingTransaction(transaction);
    setSwipedId(null);
    setSwipeDirection(null);
  };

  const handleTransactionUpdated = async (updatedTransaction: Transaction) => {
    try {
      await updateTransaction(updatedTransaction.id, {
        amount: updatedTransaction.amount,
        description: updatedTransaction.description || undefined,
        category_id: updatedTransaction.category_id,
        transaction_type: updatedTransaction.transaction_type,
      });
      showNotification('success');
      setEditingTransaction(null);
    } catch (err: any) {
      console.error('Failed to update transaction:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка при обновлении транзакции';
      alert(errorMessage);
      showNotification('error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ios-dark">
        <IOSHeader title="Транзакции" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ios-dark p-4">
        <IOSHeader title="Транзакции" showBack />
        <ErrorMessage message={error} onRetry={refreshTransactions} />
      </div>
    );
  }

  const getTitle = () => {
    if (filterType === 'income') return 'Доходы';
    if (filterType === 'expense') return 'Расходы';
    return 'Транзакции';
  };

  return (
    <div className="min-h-screen bg-ios-dark">
      <IOSHeader 
        title={getTitle()} 
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

      <div className="p-4 space-y-6">
        {grouped.length === 0 ? (
          <IOSCard>
            <EmptyState
              icon={Receipt}
              title="Нет транзакций"
              description={
                filterType === 'income'
                  ? "У вас пока нет доходов. Начните добавлять транзакции, чтобы отслеживать свои финансы."
                  : filterType === 'expense'
                  ? "У вас пока нет расходов. Добавьте первую транзакцию, чтобы начать вести учет."
                  : "У вас пока нет транзакций. Добавьте первую транзакцию, чтобы начать вести учет своих финансов."
              }
              actionLabel="Добавить транзакцию"
              onAction={() => navigate('/add-transaction')}
            />
          </IOSCard>
        ) : (
          grouped.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="flex items-center justify-between px-3 mb-3 py-2 bg-ios-dark-tertiary/50 rounded-ios-lg">
                <h3 className="text-sm font-semibold text-ios-text">
                  {group.date}
                </h3>
                <span
                  className={`text-sm font-bold ${
                    group.total >= 0 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent'
                  }`}
                >
                  {group.total >= 0 ? '+' : ''}
                  {group.total.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              {group.transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  isSwiped={swipedId === transaction.id}
                  swipeDirection={swipeDirection}
                  isDeleting={deletingId === transaction.id}
                  onSwipe={(direction) => {
                    // Если уже свайпнут в том же направлении - закрываем
                    if (swipedId === transaction.id && swipeDirection === direction) {
                      handleSwipeClose();
                    } else {
                      handleSwipe(transaction.id, direction);
                    }
                  }}
                  onDelete={() => handleDelete(transaction.id)}
                  onEdit={() => handleEdit(transaction)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Модальное окно редактирования */}
      <EditTransactionModal
        isOpen={editingTransaction !== null}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onTransactionUpdated={handleTransactionUpdated}
      />
    </div>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
  isSwiped: boolean;
  swipeDirection: 'left' | 'right' | null;
  isDeleting: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  onDelete: () => void;
  onEdit: () => void;
}

function TransactionItem({
  transaction,
  isSwiped,
  swipeDirection,
  isDeleting,
  onSwipe,
  onDelete,
  onEdit,
}: TransactionItemProps) {
  const isIncome = transaction.transaction_type === 'income';

  return (
    <div className="relative overflow-hidden">
      {/* Кнопка редактирования (слева) */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="bg-primary-500 w-12 h-12 rounded-full flex items-center justify-center active:scale-95 shadow-lg"
          title="Редактировать"
        >
          <Edit className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Кнопка удаления (справа) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          className="bg-red-500 w-12 h-12 rounded-full flex items-center justify-center active:scale-95 disabled:opacity-50 shadow-lg"
          title={isDeleting ? 'Удаление...' : 'Удалить'}
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Карточка транзакции */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -60, right: 60 }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const threshold = 40; // Увеличен порог для более четкого срабатывания
          
          if (info.offset.x < -threshold) {
            // Свайп влево - показываем кнопку редактирования
            if (!isSwiped || swipeDirection !== 'left') {
              onSwipe('left');
            }
          } else if (info.offset.x > threshold) {
            // Свайп вправо - показываем кнопку удаления
            if (!isSwiped || swipeDirection !== 'right') {
              onSwipe('right');
            }
          } else {
            // Возвращаем на место, если смещение меньше порога
            if (isSwiped) {
              onSwipe(swipeDirection || 'left'); // Тoggle для закрытия
            }
          }
        }}
        animate={{
          x: isSwiped 
            ? (swipeDirection === 'left' ? -60 : swipeDirection === 'right' ? 60 : 0)
            : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 35,
        }}
        className="relative z-20"
        whileTap={{ scale: 0.98 }}
      >
        <IOSCard
          className="cursor-pointer"
          onClick={() => {
            if (isSwiped) {
              onSwipe(swipeDirection || 'left'); // Toggle для закрытия
            }
          }}
        >
          <div className="flex items-center gap-4">
            {/* Иконка категории с градиентом */}
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isIncome 
                    ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20 border border-green-500/30' 
                    : 'bg-gradient-to-br from-red-500/30 to-orange-500/20 border border-red-500/30'
                }`}
                style={transaction.category?.color ? {
                  background: `linear-gradient(135deg, ${transaction.category.color}30, ${transaction.category.color}15)`,
                  borderColor: `${transaction.category.color}40`,
                } : {}}
              >
                {transaction.category?.icon ? (
                  <span className="text-2xl" role="img" aria-label={transaction.category.name}>
                    {transaction.category.icon}
                  </span>
                ) : isIncome ? (
                  <ArrowDownRight className="w-7 h-7 text-green-400" />
                ) : (
                  <ArrowUpRight className="w-7 h-7 text-red-400" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-ios-text font-semibold truncate text-base">
                {transaction.description || transaction.category?.name || 'Без описания'}
              </p>
              <p className="text-ios-text-tertiary text-sm mt-0.5">
                {transaction.category?.name || 'Без категории'}
              </p>
            </div>

            <div className="text-right">
              <p
                className={`font-bold text-lg ${
                  isIncome 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent'
                }`}
              >
                {isIncome ? '+' : '-'}
                {transaction.amount.toLocaleString('ru-RU')} ₽
              </p>
              <p className="text-ios-text-tertiary text-xs mt-1">
                {new Date(transaction.created_at).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </IOSCard>
      </motion.div>
    </div>
  );
}

