import { forwardRef, InputHTMLAttributes } from 'react';

interface IOSInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const IOSInput = forwardRef<HTMLInputElement, IOSInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-ios-text-secondary text-sm mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`ios-input w-full ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>
    );
  }
);

IOSInput.displayName = 'IOSInput';








