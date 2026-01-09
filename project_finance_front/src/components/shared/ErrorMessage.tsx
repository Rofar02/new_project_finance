import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="ios-card p-4 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-ios-text-secondary text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-primary-500 text-sm mt-2 font-medium"
          >
            Попробовать снова
          </button>
        )}
      </div>
    </div>
  );
}








