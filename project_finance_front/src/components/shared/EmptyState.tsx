import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="relative mb-6">
        {/* Градиентный фон для иконки */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full blur-xl" />
        <div className="relative p-6 bg-ios-dark-tertiary/50 rounded-full border border-primary-500/20">
          <Icon className="w-12 h-12 text-primary-400" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-ios-text mb-2 text-center">
        {title}
      </h3>
      
      {description && (
        <p className="text-ios-text-tertiary text-sm text-center max-w-xs mb-6">
          {description}
        </p>
      )}
      
      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-ios-lg active:opacity-80 transition-opacity"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}


