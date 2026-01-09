import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface IOSButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function IOSButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
}: IOSButtonProps) {
  const baseClasses = 'font-semibold py-3 px-6 rounded-ios-lg transition-all duration-200';
  
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white',
    secondary: 'bg-ios-dark-tertiary hover:bg-ios-dark-quaternary text-ios-text',
    danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white',
  };

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}








