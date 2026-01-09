import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface IOSCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function IOSCard({ children, className = '', onClick }: IOSCardProps) {
  return (
    <motion.div
      className={`ios-card p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}








