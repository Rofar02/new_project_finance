import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface IOSHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function IOSHeader({ title, showBack = false, rightAction }: IOSHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="ios-blur sticky top-0 z-50 border-b border-ios-dark-quaternary/50">
      <div className="flex items-center justify-between px-4 py-3 h-14">
        <div className="flex items-center gap-3 flex-1">
          {showBack && (
            <motion.button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 active:opacity-50"
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-6 h-6 text-ios-text" />
            </motion.button>
          )}
          <h1 className="text-lg font-semibold text-ios-text">{title}</h1>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </div>
  );
}








