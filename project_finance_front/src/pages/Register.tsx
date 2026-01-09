import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IOSInput } from '../components/ios/IOSInput';
import { IOSButton } from '../components/ios/IOSButton';
import { IOSCard } from '../components/ios/IOSCard';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback, showNotification } from '../utils/telegram';
import { getErrorMessage, isEmailExistsError } from '../utils/errorHandler';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
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
      await register({ 
        email, 
        hashed_password: password, // Бэкенд сам хэширует
        balance: 0 
      });
      hapticFeedback('medium');
      showNotification('success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      showNotification('error');
      
      // Получаем реальное сообщение об ошибке от API
      const errorMessage = getErrorMessage(error);
      
      // Определяем, какое поле нужно подсветить
      const newErrors: typeof errors = {};
      
      if (isEmailExistsError(error)) {
        newErrors.email = 'Email уже используется';
      } else if (errorMessage.toLowerCase().includes('email')) {
        newErrors.email = errorMessage;
      } else if (errorMessage.toLowerCase().includes('password')) {
        newErrors.password = errorMessage;
      } else {
        // Если не можем определить поле, показываем общую ошибку в email
        newErrors.email = errorMessage;
      }
      
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ios-dark">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Wallet className="w-8 h-8 text-primary-500" />
          </motion.div>
          <h1 className="text-3xl font-bold text-ios-text mb-2">Регистрация</h1>
          <p className="text-ios-text-tertiary">Создайте новый аккаунт</p>
        </div>

        <IOSCard>
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

            <IOSButton
              type="submit"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </IOSButton>
          </form>
        </IOSCard>

        <div className="mt-6 text-center">
          <p className="text-ios-text-tertiary text-sm">
            Уже есть аккаунт?{' '}
            <Link
              to="/login"
              className="text-primary-500 font-semibold hover:text-primary-400"
            >
              Войти
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

