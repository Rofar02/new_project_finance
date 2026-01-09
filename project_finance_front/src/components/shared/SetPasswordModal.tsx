import { useState } from 'react';
import { IOSCard } from '../ios/IOSCard';
import { IOSInput } from '../ios/IOSInput';
import { IOSButton } from '../ios/IOSButton';
import { linkTelegramAccount } from '../../api/auth';
import { getTelegramWebApp } from '../../utils/telegram';
import { hapticFeedback, showNotification } from '../../utils/telegram';
import { getErrorMessage } from '../../utils/errorHandler';

interface SetPasswordModalProps {
  initData: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function SetPasswordModal({ initData, onSuccess, onCancel }: SetPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!password) {
      newErrors.password = 'Пароль обязателен';
    } else if (password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
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

    setIsLoading(true);
    try {
      await linkTelegramAccount(initData, email, password);
      hapticFeedback('medium');
      showNotification('success');
      onSuccess();
    } catch (error) {
      console.error('Set password error:', error);
      showNotification('error');
      const errorMessage = getErrorMessage(error);
      setErrors({
        email: errorMessage.includes('email') ? errorMessage : undefined,
        password: errorMessage.includes('password') ? errorMessage : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <IOSCard className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-ios-text mb-2">
          Свяжите аккаунт
        </h2>
        <p className="text-ios-text-tertiary mb-6">
          Введите email и пароль от вашего аккаунта, чтобы связать его с Telegram
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <IOSInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            error={errors.email}
            autoComplete="email"
          />

          <IOSInput
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.password}
            autoComplete="new-password"
          />

          <IOSInput
            label="Подтвердите пароль"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <div className="flex gap-3">
            {onCancel && (
              <IOSButton
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Пропустить
              </IOSButton>
            )}
            <IOSButton
              type="submit"
              disabled={isLoading}
              className={onCancel ? 'flex-1' : 'w-full'}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </IOSButton>
          </div>
        </form>
      </IOSCard>
    </div>
  );
}

