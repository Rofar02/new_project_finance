import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { getCategoryStats, getIncomeCategoryStats } from '../api/transactions';
import { IOSHeader } from '../components/ios/IOSHeader';
import { IOSCard } from '../components/ios/IOSCard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from 'recharts';

const COLORS = ['#8E44FD', '#9C4DFF', '#B880FF', '#D4B3FF', '#E8D5FF', '#F5EDFF'];

export function Charts() {
  const { user } = useAuth();
  const { transactions, isLoading, error, refreshTransactions } = useTransactions();
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    import('../api/categories').then(({ getCategories }) => {
      getCategories().then((cats) => {
        setCategories(cats);
      }).catch(console.error);
    });
  }, []);

  const expenseCategoryStats = useMemo(() => getCategoryStats(transactions || [], categories), [transactions, categories]);
  const incomeCategoryStats = useMemo(() => getIncomeCategoryStats(transactions || [], categories), [transactions, categories]);

  // Данные для столбчатого графика по категориям расходов
  const expenseBarData = useMemo(() => 
    expenseCategoryStats.slice(0, 8).map((stat) => ({
      name: stat.category?.name || 'Без категории',
      Сумма: stat.total,
    })),
    [expenseCategoryStats]
  );

  // Данные для столбчатого графика по категориям доходов
  const incomeBarData = useMemo(() =>
    incomeCategoryStats.slice(0, 8).map((stat) => ({
      name: stat.category?.name || 'Без категории',
      Сумма: stat.total,
    })),
    [incomeCategoryStats]
  );

  // Данные для комбинированного графика (доходы и расходы по месяцам)
  const monthlyData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const months: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach((transaction) => {
      const date = new Date(transaction.created_at);
      const monthKey = date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
      
      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expense: 0 };
      }
      
      if (transaction.transaction_type === 'income') {
        months[monthKey].income += transaction.amount;
      } else if (transaction.transaction_type === 'expense') {
        months[monthKey].expense += transaction.amount;
      }
    });

    return Object.entries(months)
      .map(([month, data]) => ({
        month,
        Доходы: data.income,
        Расходы: data.expense,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [transactions]);

  // Данные для графика по дням недели
  const weeklyData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      return dayNames.map((day) => ({
        day,
        Доходы: 0,
        Расходы: 0,
      }));
    }
    
    const days: Record<string, { income: number; expense: number }> = {};
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    transactions.forEach((transaction) => {
      const date = new Date(transaction.created_at);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

      if (!days[dayName]) {
        days[dayName] = { income: 0, expense: 0 };
      }

      if (transaction.transaction_type === 'income') {
        days[dayName].income += transaction.amount;
      } else if (transaction.transaction_type === 'expense') {
        days[dayName].expense += transaction.amount;
      }
    });

    return dayNames.map((day) => ({
      day,
      Доходы: days[day]?.income || 0,
      Расходы: days[day]?.expense || 0,
    }));
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ios-dark">
        <IOSHeader title="Графики" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ios-dark p-4">
        <IOSHeader title="Графики" showBack />
        <ErrorMessage message={error} onRetry={refreshTransactions} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-dark pb-20">
      <IOSHeader
        title="Графики"
        showBack
      />

      <div className="p-4 space-y-4">
        {/* Столбчатый график расходов */}
        {expenseBarData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <IOSCard>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-ios-text">Расходы по категориям</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3C" />
                  <XAxis
                    dataKey="name"
                    stroke="#EBEBF599"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis stroke="#EBEBF599" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1E',
                      border: '1px solid #3A3A3C',
                      borderRadius: '14px',
                      color: '#EBEBF5',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Сумма']}
                  />
                  <Bar dataKey="Сумма" fill="#EF4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </IOSCard>
          </motion.div>
        )}

        {/* Столбчатый график доходов */}
        {incomeBarData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <IOSCard>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-ios-text">Доходы по категориям</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3C" />
                  <XAxis
                    dataKey="name"
                    stroke="#EBEBF599"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis stroke="#EBEBF599" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1E',
                      border: '1px solid #3A3A3C',
                      borderRadius: '14px',
                      color: '#EBEBF5',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Сумма']}
                  />
                  <Bar dataKey="Сумма" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </IOSCard>
          </motion.div>
        )}

        {/* Комбинированный график по месяцам */}
        {monthlyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <IOSCard>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-semibold text-ios-text">Динамика по месяцам</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3C" />
                  <XAxis dataKey="month" stroke="#EBEBF599" />
                  <YAxis stroke="#EBEBF599" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1E',
                      border: '1px solid #3A3A3C',
                      borderRadius: '14px',
                      color: '#EBEBF5',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, '']}
                  />
                  <Legend />
                  <Bar dataKey="Доходы" fill="#10B981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Расходы" fill="#EF4444" radius={[8, 8, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="Доходы"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Расходы"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </IOSCard>
          </motion.div>
        )}

        {/* График области по дням недели */}
        {weeklyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <IOSCard>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-semibold text-ios-text">По дням недели</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3C" />
                  <XAxis dataKey="day" stroke="#EBEBF599" />
                  <YAxis stroke="#EBEBF599" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1E',
                      border: '1px solid #3A3A3C',
                      borderRadius: '14px',
                      color: '#EBEBF5',
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, '']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Доходы"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Расходы"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </IOSCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}

