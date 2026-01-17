import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { getCategories } from '../api/categories';
import { calculateBalance, getCategoryStats, getIncomeCategoryStats } from '../api/transactions';
import { getStatistics, type Statistics } from '../api/statistics';
import { IOSHeader } from '../components/ios/IOSHeader';
import { IOSCard } from '../components/ios/IOSCard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { SkeletonBalanceCard, SkeletonCard } from '../components/shared/SkeletonCard';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { Plus, TrendingUp, TrendingDown, LogOut, BarChart3, Receipt, ArrowUpCircle, ArrowDownCircle, Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import type { Category } from '../types';
import { hapticFeedback, showNotification } from '../utils/telegram';

// Улучшенная цветовая палитра с градиентами для графиков
const COLORS = [
  '#8E44FD', // Фиолетовый
  '#10B981', // Зеленый
  '#3B82F6', // Синий
  '#F59E0B', // Оранжевый
  '#EC4899', // Розовый
  '#06B6D4', // Циан
  '#A855F7', // Пурпурный
  '#F97316', // Оранжевый 2
];

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { transactions, isLoading, error, refreshTransactions } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isStatisticsLoading, setIsStatisticsLoading] = useState(false);

  // Calculate balance before useEffect that uses it
  const balance = calculateBalance(transactions || []);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isLoading && transactions) {
      loadStatistics();
    }
  }, [transactions, isLoading, balance]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadStatistics = async () => {
    setIsStatisticsLoading(true);
    try {
      // Вычисляем статистику на основе транзакций
      const totalIncome = (transactions || [])
        .filter((t) => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpense = (transactions || [])
        .filter((t) => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const incomeCount = (transactions || []).filter((t) => t.transaction_type === 'income').length;
      const expenseCount = (transactions || []).filter((t) => t.transaction_type === 'expense').length;
      
      const stats: Statistics = {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: balance,
        transactions_count: (transactions || []).length,
        income_count: incomeCount,
        expense_count: expenseCount,
      };
      
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setIsStatisticsLoading(false);
    }
  };


  const expenseCategoryStats = getCategoryStats(transactions || [], categories);
  const incomeCategoryStats = getIncomeCategoryStats(transactions || [], categories);
  const expenseStats = expenseCategoryStats.slice(0, 6);
  const incomeStats = incomeCategoryStats.slice(0, 6);

  // Подготовка данных для круговой диаграммы расходов
  const expensePieData = expenseStats
    .filter((stat) => stat.total > 0) // Фильтруем только с данными
    .map((stat) => {
      // Пытаемся найти категорию из списка категорий
      const category = stat.category?.id 
        ? categories.find((cat) => cat.id === stat.category?.id)
        : null;
      const categoryName = category?.name || stat.category?.name || 'Без категории';
      return {
        name: categoryName,
        value: stat.total,
        category: category || stat.category, // Сохраняем информацию о категории для доступа к цвету
      };
    });

  // Подготовка данных для круговой диаграммы доходов
  const incomePieData = incomeStats
    .filter((stat) => stat.total > 0) // Фильтруем только с данными
    .map((stat) => {
      // Пытаемся найти категорию из списка категорий
      const category = stat.category?.id 
        ? categories.find((cat) => cat.id === stat.category?.id)
        : null;
      const categoryName = category?.name || stat.category?.name || 'Без категории';
      return {
        name: categoryName,
        value: stat.total,
        category: category || stat.category, // Сохраняем информацию о категории для доступа к цвету
      };
    });

  // Подготовка данных для линейного графика (последние 7 дней)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  });

  const lineData = last7Days.map((date) => {
    const dayTransactions = (transactions || []).filter((t) => {
      const tDate = new Date(t.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
      return tDate === date;
    });
    const income = dayTransactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { date, income, expense };
  });

  const handleLogout = () => {
    hapticFeedback('light');
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ios-dark pb-20">
        <IOSHeader title="Финансы" />
        <div className="p-4 space-y-4">
          <SkeletonBalanceCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ios-dark p-4">
        <IOSHeader title="Финансы" />
        <ErrorMessage message={error} onRetry={refreshTransactions} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-dark pb-20">
      <IOSHeader
        title="Финансы"
        rightAction={
          <button
            onClick={handleLogout}
            className="p-2 active:opacity-50"
            title="Выйти"
          >
            <LogOut className="w-5 h-5 text-ios-text-tertiary" />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Баланс */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative overflow-hidden rounded-ios-lg">
            {/* Градиентный фон */}
            <div 
              className={`absolute inset-0 ${
                balance >= 0 
                  ? 'bg-gradient-to-br from-green-500/20 via-primary-500/20 to-purple-500/20' 
                  : 'bg-gradient-to-br from-red-500/20 via-orange-500/20 to-pink-500/20'
              }`}
            />
            {/* Эффект свечения */}
            <div 
              className={`absolute inset-0 ${
                balance >= 0 
                  ? 'bg-gradient-to-r from-green-500/10 via-transparent to-primary-500/10' 
                  : 'bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10'
              }`}
            />
            <IOSCard className="relative bg-ios-dark-secondary/60 backdrop-blur-xl border-0">
              <div className="text-center relative z-10">
                <p className="text-ios-text-tertiary text-sm mb-2 font-medium">Общий баланс</p>
                <h2 className={`text-5xl font-bold mb-1 ${
                  balance >= 0 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent' 
                    : 'bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent'
                }`}>
                  {balance >= 0 ? '+' : ''}
                  {balance.toLocaleString('ru-RU')} ₽
                </h2>
                <div className="flex items-center justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-semibold text-sm">
                      {(transactions || [])
                        .filter((t) => t.transaction_type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString('ru-RU')}{' '}
                      ₽
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-semibold text-sm">
                      {(transactions || [])
                        .filter((t) => t.transaction_type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString('ru-RU')}{' '}
                      ₽
                    </span>
                  </div>
                </div>
              </div>
            </IOSCard>
          </div>
        </motion.div>

        {/* Статистика с бэкенда */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <IOSCard>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-semibold text-ios-text">Статистика</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <motion.div 
                  onClick={() => {
                    hapticFeedback('light');
                    navigate('/transactions');
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden p-4 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-ios-lg cursor-pointer border border-primary-500/20 active:opacity-80 transition-all"
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-2.5 bg-primary-500/20 rounded-xl">
                        <Receipt className="w-5 h-5 text-primary-400" />
                      </div>
                    </div>
                    <p className="text-ios-text-tertiary text-sm mb-2 font-medium">Всего транзакций</p>
                    <p className="text-ios-text font-bold text-2xl">
                      {statistics.transactions_count || 0}
                    </p>
                  </div>
                </motion.div>
                <motion.div 
                  onClick={() => {
                    hapticFeedback('light');
                    navigate('/transactions?type=income');
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-ios-lg cursor-pointer border border-green-500/20 active:opacity-80 transition-all"
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-2.5 bg-green-500/20 rounded-xl">
                        <ArrowUpCircle className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    <p className="text-ios-text-tertiary text-sm mb-2 font-medium">Доходов</p>
                    <p className="text-green-400 font-bold text-2xl">
                      {statistics.income_count || 0}
                    </p>
                  </div>
                </motion.div>
                <motion.div 
                  onClick={() => {
                    hapticFeedback('light');
                    navigate('/transactions?type=expense');
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-ios-lg cursor-pointer border border-red-500/20 active:opacity-80 transition-all"
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-2.5 bg-red-500/20 rounded-xl">
                        <ArrowDownCircle className="w-5 h-5 text-red-400" />
                      </div>
                    </div>
                    <p className="text-ios-text-tertiary text-sm mb-2 font-medium">Расходов</p>
                    <p className="text-red-400 font-bold text-2xl">
                      {statistics.expense_count || 0}
                    </p>
                  </div>
                </motion.div>
                <motion.div 
                  onClick={() => {
                    hapticFeedback('light');
                    navigate('/categories');
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-ios-lg cursor-pointer border border-blue-500/20 active:opacity-80 transition-all"
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-2.5 bg-blue-500/20 rounded-xl">
                        <Folder className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                    <p className="text-ios-text-tertiary text-sm mb-2 font-medium">Категорий</p>
                    <p className="text-blue-400 font-bold text-2xl">{categories.length}</p>
                  </div>
                </motion.div>
              </div>
            </IOSCard>
          </motion.div>
        )}


        {/* Графики - Доходы и Расходы */}
        {(incomePieData.length > 0 || expensePieData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* График доходов */}
          {incomePieData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <IOSCard>
                <h3 className="text-lg font-semibold text-ios-text mb-4 text-green-400">
                  Доходы по категориям
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <defs>
                      {incomePieData.map((entry, index) => {
                        const categoryColor = entry.category?.color || COLORS[index % COLORS.length];
                        const gradientId = `income-gradient-${index}`;
                        return (
                          <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={categoryColor} stopOpacity={1} />
                            <stop offset="100%" stopColor={categoryColor} stopOpacity={0.7} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <Pie
                      data={incomePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={110}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      paddingAngle={2}
                    >
                      {incomePieData.map((entry, index) => {
                        const categoryColor = entry.category?.color || COLORS[index % COLORS.length];
                        const gradientId = `income-gradient-${index}`;
                        return (
                          <Cell 
                            key={`income-cell-${index}`} 
                            fill={`url(#${gradientId})`}
                            stroke={categoryColor}
                            strokeWidth={2}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(28, 28, 30, 0.95)',
                        border: '1px solid rgba(58, 58, 60, 0.8)',
                        borderRadius: '16px',
                        color: '#EBEBF5',
                        padding: '12px 16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(10px)',
                      }}
                      itemStyle={{ color: '#EBEBF5', padding: '4px 0' }}
                      labelStyle={{ color: '#EBEBF5', fontWeight: '600', marginBottom: '8px' }}
                      formatter={(value: number, name: string, props: any) => {
                        const total = incomePieData.reduce((sum, item) => sum + item.value, 0);
                        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                        return [
                          <span key="value" style={{ fontWeight: 'bold' }}>
                            {value.toLocaleString('ru-RU')} ₽ <span style={{ opacity: 0.7 }}>({percent}%)</span>
                          </span>,
                          props.payload.name || name,
                        ];
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={incomePieData.length > 3 ? 60 : 36}
                      formatter={(value, entry: any) => {
                        const total = incomePieData.reduce((sum, item) => sum + item.value, 0);
                        const percent = total > 0 ? ((entry.payload.value / total) * 100).toFixed(0) : '0';
                        return `${value} (${percent}%)`;
                      }}
                      wrapperStyle={{
                        color: '#EBEBF5',
                        fontSize: '11px',
                        paddingTop: '12px',
                      }}
                      iconType="circle"
                      contentStyle={{ color: '#EBEBF5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </IOSCard>
            </motion.div>
          )}

          {/* График расходов */}
          {expensePieData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <IOSCard>
                <h3 className="text-lg font-semibold text-ios-text mb-4 text-red-400">
                  Расходы по категориям
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <defs>
                      {expensePieData.map((entry, index) => {
                        const categoryColor = entry.category?.color || COLORS[index % COLORS.length];
                        const gradientId = `expense-gradient-${index}`;
                        return (
                          <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={categoryColor} stopOpacity={1} />
                            <stop offset="100%" stopColor={categoryColor} stopOpacity={0.7} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={110}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      paddingAngle={2}
                    >
                      {expensePieData.map((entry, index) => {
                        const categoryColor = entry.category?.color || COLORS[index % COLORS.length];
                        const gradientId = `expense-gradient-${index}`;
                        return (
                          <Cell 
                            key={`expense-cell-${index}`} 
                            fill={`url(#${gradientId})`}
                            stroke={categoryColor}
                            strokeWidth={2}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(28, 28, 30, 0.95)',
                        border: '1px solid rgba(58, 58, 60, 0.8)',
                        borderRadius: '16px',
                        color: '#EBEBF5',
                        padding: '12px 16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(10px)',
                      }}
                      itemStyle={{ color: '#EBEBF5', padding: '4px 0' }}
                      labelStyle={{ color: '#EBEBF5', fontWeight: '600', marginBottom: '8px' }}
                      formatter={(value: number, name: string, props: any) => {
                        const total = expensePieData.reduce((sum, item) => sum + item.value, 0);
                        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                        return [
                          <span key="value" style={{ fontWeight: 'bold' }}>
                            {value.toLocaleString('ru-RU')} ₽ <span style={{ opacity: 0.7 }}>({percent}%)</span>
                          </span>,
                          props.payload.name || name,
                        ];
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={expensePieData.length > 3 ? 60 : 36}
                      formatter={(value, entry: any) => {
                        const total = expensePieData.reduce((sum, item) => sum + item.value, 0);
                        const percent = total > 0 ? ((entry.payload.value / total) * 100).toFixed(0) : '0';
                        return `${value} (${percent}%)`;
                      }}
                      wrapperStyle={{
                        color: '#EBEBF5',
                        fontSize: '11px',
                        paddingTop: '12px',
                      }}
                      iconType="circle"
                      contentStyle={{ color: '#EBEBF5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </IOSCard>
            </motion.div>
          )}
        </div>
        )}

        {/* Линейный график */}
        {lineData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <IOSCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-ios-text">
                  Динамика за неделю
                </h3>
                <button
                  onClick={() => {
                    hapticFeedback('light');
                    navigate('/charts');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white text-sm font-semibold rounded-ios-lg active:opacity-50 transition-opacity"
                >
                  <BarChart3 className="w-4 h-4" />
                  Все графики
                </button>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3C" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#EBEBF599" 
                    fontSize={11}
                    tick={{ fill: '#EBEBF599' }}
                    tickLine={{ stroke: '#EBEBF599', opacity: 0.3 }}
                  />
                  <YAxis 
                    stroke="#EBEBF599" 
                    fontSize={11}
                    tick={{ fill: '#EBEBF599' }}
                    width={50}
                    tickLine={{ stroke: '#EBEBF599', opacity: 0.3 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(28, 28, 30, 0.95)',
                      border: '1px solid rgba(58, 58, 60, 0.8)',
                      borderRadius: '16px',
                      color: '#EBEBF5',
                      padding: '12px 16px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(10px)',
                    }}
                    itemStyle={{ color: '#EBEBF5', padding: '4px 0' }}
                    labelStyle={{ color: '#EBEBF5', fontWeight: '600', marginBottom: '8px' }}
                    formatter={(value: number, name: string) => [
                      <span key="value" style={{ fontWeight: 'bold' }}>
                        {value.toLocaleString('ru-RU')} ₽
                      </span>,
                      name === 'income' ? 'Доходы' : 'Расходы',
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '12px',
                      fontSize: '12px',
                      color: '#EBEBF5',
                    }}
                    contentStyle={{ color: '#EBEBF5' }}
                    iconType="line"
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    strokeWidth={3}
                    fill="url(#incomeGradient)"
                    name="Доходы"
                    dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#EF4444"
                    strokeWidth={3}
                    fill="url(#expenseGradient)"
                    name="Расходы"
                    dot={{ fill: '#EF4444', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </IOSCard>
          </motion.div>
        )}

        {/* Кнопка добавления транзакции */}
        <motion.button
          onClick={() => {
            hapticFeedback('light');
            navigate('/add-transaction');
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40"
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>

      </div>
    </div>
  );
}

