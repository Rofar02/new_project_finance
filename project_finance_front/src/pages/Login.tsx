import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IOSInput } from '../components/ios/IOSInput';
import { IOSButton } from '../components/ios/IOSButton';
import { IOSCard } from '../components/ios/IOSCard';
import { SetPasswordModal } from '../components/shared/SetPasswordModal';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback, showNotification, getTelegramWebApp } from '../utils/telegram';
import { getErrorMessage } from '../utils/errorHandler';
import { loginWithTelegram } from '../api/auth';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramAvailable, setIsTelegramAvailable] = useState(false);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const tgWebApp = getTelegramWebApp();
    setIsTelegramAvailable(!!tgWebApp?.initData);
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
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
      await login({ email, password });
      hapticFeedback('medium');
      showNotification('success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      showNotification('error');
      const errorMessage = getErrorMessage(error);
      setErrors({
        email: errorMessage.includes('email') || errorMessage.includes('password') 
          ? errorMessage 
          : 'Неверный email или пароль',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    const tgWebApp = getTelegramWebApp();
    if (!tgWebApp?.initData) {
      showNotification('error');
      setErrors({ email: 'Telegram данные недоступны' });
      return;
    }

    setIsTelegramLoading(true);
    hapticFeedback('light');
    
    try {
      const result = await loginWithTelegram(tgWebApp.initData);
      // Токен уже сохранен в loginWithTelegram
      hapticFeedback('medium');
      
      // Если нужно связать с существующим аккаунтом, показываем модалку
      if (result.needs_link) {
        setShowPasswordModal(true);
      } else {
        showNotification('success');
        navigate('/dashboard');
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    } catch (error) {
      console.error('Telegram login error:', error);
      showNotification('error');
      const errorMessage = getErrorMessage(error);
      setErrors({
        email: errorMessage.includes('Telegram') ? errorMessage : 'Ошибка входа через Telegram',
      });
    } finally {
      setIsTelegramLoading(false);
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
          <h1 className="text-3xl font-bold text-ios-text mb-2">Finance Tracker</h1>
          <p className="text-ios-text-tertiary">Войдите в свой аккаунт</p>
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
              autoComplete="current-password"
            />

            <IOSButton
              type="submit"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </IOSButton>

            {isTelegramAvailable && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ios-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-ios-secondary text-ios-text-tertiary">или</span>
                  </div>
                </div>

                <IOSButton
                  type="button"
                  fullWidth
                  variant="secondary"
                  onClick={handleTelegramLogin}
                  disabled={isTelegramLoading}
                >
                  {isTelegramLoading ? 'Вход...' : '📱 Войти через Telegram'}
                </IOSButton>
              </>
            )}
          </form>
        </IOSCard>

        <div className="mt-6 text-center">
          <p className="text-ios-text-tertiary text-sm">
            Нет аккаунта?{' '}
            <Link
              to="/register"
              className="text-primary-500 font-semibold hover:text-primary-400"
            >
              Зарегистрироваться
            </Link>
          </p>
        </div>

        {showPasswordModal && (
          <SetPasswordModal
            initData={getTelegramWebApp()?.initData || ''}
            onSuccess={() => {
              setShowPasswordModal(false);
              showNotification('success');
              navigate('/dashboard');
              setTimeout(() => {
                window.location.reload();
              }, 300);
            }}
            onCancel={() => {
              setShowPasswordModal(false);
              // Пользователь может пропустить и использовать только Telegram аккаунт
              navigate('/dashboard');
              setTimeout(() => {
                window.location.reload();
              }, 300);
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

