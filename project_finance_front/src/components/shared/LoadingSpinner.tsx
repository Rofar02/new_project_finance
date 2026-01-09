import { motion } from 'framer-motion';

export function LoadingSpinner() {
  return (
    <div 
      className="flex items-center justify-center p-8"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        minHeight: '200px'
      }}
    >
      <motion.div
        className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"
        style={{
          width: '32px',
          height: '32px',
          border: '4px solid #8E44FD',
          borderTopColor: 'transparent',
          borderRadius: '50%'
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

