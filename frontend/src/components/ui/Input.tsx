import React, { forwardRef, useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    const baseClasses = 'w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white backdrop-blur-sm text-gray-900';
    const errorClasses = error 
      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500/20 bg-white' 
      : 'border-gray-200 hover:border-gray-300 focus:border-blue-500';
    
    const focusClasses = isFocused ? 'transform scale-[1.02] shadow-lg' : '';

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-600 transition-colors duration-200">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`${baseClasses} ${errorClasses} ${focusClasses} ${icon ? 'pl-12' : ''} ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-xl border-2 border-transparent group-focus-within:border-gradient-to-r group-focus-within:from-blue-400 group-focus-within:to-purple-400 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
        </div>
        {error && (
          <div className="flex items-center space-x-1 animate-slide-in-up">
            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 flex items-center space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>{helperText}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
