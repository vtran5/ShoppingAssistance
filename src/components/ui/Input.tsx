'use client';

interface InputProps {
  label?: string;
  type?: 'text' | 'number' | 'url' | 'email';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  min,
  max,
  step,
  className = '',
}: InputProps) {
  const inputId = label ? label.toLowerCase().replace(/\s+/g, '-') : undefined;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={step}
        className={`
          px-3 py-2 min-h-[44px] rounded-lg border transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
