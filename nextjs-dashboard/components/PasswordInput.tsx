// nextjs-dashboard/components/PasswordInput.tsx
'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  className?: string;
  disabled?: boolean;
}

export default function PasswordInput({
  id,
  name = 'password',
  value,
  onChange,
  placeholder = 'Enter password',
  label = 'Password',
  required = true,
  minLength = 8,
  autoComplete = 'current-password',
  className = '',
  disabled = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id || name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`
            w-full border rounded-md px-3 py-2 pr-10
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}