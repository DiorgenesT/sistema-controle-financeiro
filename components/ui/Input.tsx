'use client'

import { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helper?: string
}

export function Input({
    label,
    error,
    helper,
    className = '',
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <input
                className={`
          w-full px-4 py-2 rounded-lg border
          bg-white dark:bg-slate-800
          text-gray-900 dark:text-white
          border-gray-300 dark:border-slate-600
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {helper && !error && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helper}</p>
            )}
        </div>
    )
}
