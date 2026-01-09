import { SelectHTMLAttributes } from 'react';

interface IOSSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
}

export function IOSSelect({ label, error, options, className = '', ...props }: IOSSelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-ios-text-secondary text-sm mb-2">
          {label}
        </label>
      )}
      <select
        className={`ios-input w-full ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}








