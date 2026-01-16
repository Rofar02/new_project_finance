import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { IOSInput } from '../ios/IOSInput';
import { IOSSelect } from '../ios/IOSSelect';
import { IOSButton } from '../ios/IOSButton';
import { createCategory, type CreateCategoryData } from '../../api/categories';
import { hapticFeedback, showNotification } from '../../utils/telegram';
import type { Category } from '../../types';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: Category) => void;
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  onCategoryCreated,
}: CreateCategoryModalProps) {
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    type: 'expense',
    icon: '',
    color: '#8E44FD',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Введите название категории');
      return;
    }

    setIsLoading(true);
    hapticFeedback('light');

    try {
      const newCategory = await createCategory({
        name: formData.name.trim(),
        type: formData.type,
        icon: formData.icon || undefined,
        color: formData.color || undefined,
      });
      onCategoryCreated(newCategory);
      setFormData({ name: '', type: 'expense', icon: '', color: '#8E44FD' });
      onClose();
      showNotification('success');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании категории');
      showNotification('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-ios-dark-secondary rounded-ios-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-ios-dark-tertiary">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 -ml-2 active:opacity-50 transition-opacity"
                aria-label="Назад"
              >
                <ArrowLeft className="w-5 h-5 text-ios-text" />
              </button>
              <h2 className="text-xl font-semibold text-ios-text">Новая категория</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 active:opacity-50 transition-opacity"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-ios-text-tertiary" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <IOSInput
              label="Название"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: Продукты"
              required
              autoFocus
            />

            <IOSSelect
              label="Тип"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
              }
              options={[
                { value: 'expense', label: 'Расход' },
                { value: 'income', label: 'Доход' },
              ]}
            />

            <div>
              <label className="block text-ios-text-secondary text-sm mb-2">
                Иконка (эмодзи, опционально)
              </label>
              <div className="flex items-center gap-3">
                <IOSInput
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Например: 🍔, 🚗, 💰"
                  className="flex-1"
                />
                {formData.icon && (
                  <div className="w-12 h-12 rounded-full bg-ios-dark-tertiary flex items-center justify-center">
                    <span className="text-2xl" role="img" aria-label="Preview">
                      {formData.icon}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-ios-text-tertiary text-xs mt-1">
                Вставьте эмодзи из клавиатуры или скопируйте из интернета
              </p>
            </div>

            <IOSInput
              label="Цвет (hex, опционально)"
              type="color"
              value={formData.color || '#8E44FD'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-12"
            />

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-ios-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <IOSButton
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Отмена
              </IOSButton>
              <IOSButton type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Создание...' : 'Создать'}
              </IOSButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

