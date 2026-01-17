import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, deleteCategory } from '../api/categories';
import { IOSHeader } from '../components/ios/IOSHeader';
import { IOSCard } from '../components/ios/IOSCard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { CreateCategoryModal } from '../components/shared/CreateCategoryModal';
import { Plus, Trash2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback, showNotification } from '../utils/telegram';
import { useTransactions } from '../hooks/useTransactions';
import type { Category } from '../types';

export function Categories() {
  const navigate = useNavigate();
  const { transactions } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories([...categories, newCategory]);
    loadCategories();
  };

  const handleCategoryClick = (category: Category) => {
    hapticFeedback('light');
    setSelectedCategory(category);
  };

  const handleDeleteCategory = async (id: number) => {
    // Проверяем, есть ли транзакции с этой категорией
    const transactionsWithCategory = (transactions || []).filter(
      (t) => t.category_id === id
    );

    if (transactionsWithCategory.length > 0) {
      const message = `Нельзя удалить категорию, так как она используется в ${transactionsWithCategory.length} транзакции(ях).\n\nСначала удалите или измените эти транзакции.`;
      alert(message);
      showNotification('error');
      setSelectedCategory(null);
      return;
    }

    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
      setSelectedCategory(null);
      return;
    }

    hapticFeedback('medium');
    try {
      await deleteCategory(id);
      setCategories(categories.filter((cat) => cat.id !== id));
      showNotification('success');
      setSelectedCategory(null);
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка при удалении категории';
      
      // Проверяем, если ошибка связана с транзакциями
      if (errorMessage.includes('category_id') || errorMessage.includes('NOT NULL')) {
        alert('Нельзя удалить категорию, так как она используется в транзакциях. Сначала удалите или измените эти транзакции.');
      } else {
        alert(errorMessage);
      }
      showNotification('error');
      setSelectedCategory(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ios-dark">
        <IOSHeader title="Категории" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="min-h-screen bg-ios-dark pb-20">
      <IOSHeader 
        title="Категории" 
        showBack
        rightAction={
          <button
            onClick={() => {
              hapticFeedback('light');
              setIsCreateCategoryModalOpen(true);
            }}
            className="p-2 active:opacity-50"
            title="Создать категорию"
          >
            <Plus className="w-5 h-5 text-primary-500" />
          </button>
        }
      />

      <div className="p-4 space-y-6">
        {/* Категории доходов */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <IOSCard>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-ios-text text-green-400">
                Доходы ({incomeCategories.length})
              </h3>
            </div>
            {incomeCategories.length > 0 ? (
              <div className="space-y-2">
                {incomeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex items-center justify-between p-3 bg-ios-dark-tertiary rounded-ios-lg cursor-pointer active:opacity-50 transition-opacity ${
                      selectedCategory?.id === cat.id ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full" 
                           style={cat.color ? { backgroundColor: `${cat.color}20` } : {}}>
                        {cat.icon ? (
                          <span className="text-xl" role="img" aria-label={cat.name}>
                            {cat.icon}
                          </span>
                        ) : cat.color ? (
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-ios-text font-medium">{cat.name}</p>
                      </div>
                    </div>
                    {selectedCategory?.id === cat.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id);
                        }}
                        className="p-2 text-red-400 active:opacity-50 transition-opacity"
                        title="Удалить категорию"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ios-text-tertiary text-sm">Нет категорий доходов</p>
            )}
          </IOSCard>
        </motion.div>

        {/* Категории расходов */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <IOSCard>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-ios-text text-red-400">
                Расходы ({expenseCategories.length})
              </h3>
            </div>
            {expenseCategories.length > 0 ? (
              <div className="space-y-2">
                {expenseCategories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex items-center justify-between p-3 bg-ios-dark-tertiary rounded-ios-lg cursor-pointer active:opacity-50 transition-opacity ${
                      selectedCategory?.id === cat.id ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full" 
                           style={cat.color ? { backgroundColor: `${cat.color}20` } : {}}>
                        {cat.icon ? (
                          <span className="text-xl" role="img" aria-label={cat.name}>
                            {cat.icon}
                          </span>
                        ) : cat.color ? (
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-ios-text font-medium">{cat.name}</p>
                      </div>
                    </div>
                    {selectedCategory?.id === cat.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id);
                        }}
                        className="p-2 text-red-400 active:opacity-50 transition-opacity"
                        title="Удалить категорию"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ios-text-tertiary text-sm">Нет категорий расходов</p>
            )}
          </IOSCard>
        </motion.div>
      </div>

      {/* Модальное окно создания категории */}
      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  );
}


