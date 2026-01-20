import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="ios-card p-4 space-y-4"
    >
      {/* Заголовок */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-ios-dark-tertiary rounded animate-pulse" />
        <div className="h-5 w-32 bg-ios-dark-tertiary rounded animate-pulse" />
      </div>
      
      {/* Контент */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-ios-dark-tertiary rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-ios-dark-tertiary rounded animate-pulse" />
      </div>
    </motion.div>
  );
}

export function SkeletonBalanceCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="ios-card p-6"
    >
      <div className="text-center space-y-4">
        {/* Заголовок */}
        <div className="h-4 w-24 bg-ios-dark-tertiary rounded mx-auto animate-pulse" />
        
        {/* Баланс */}
        <div className="h-12 w-48 bg-ios-dark-tertiary rounded mx-auto animate-pulse" />
        
        {/* Доходы/Расходы */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="h-8 w-24 bg-ios-dark-tertiary rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-ios-dark-tertiary rounded-full animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}


