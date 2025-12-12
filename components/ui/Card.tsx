'use client'

import { ReactNode } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    className?: string
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hover?: boolean
}

export function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
    ...props
}: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
    }

    return (
        <div
            className={`
        bg-white dark:bg-slate-800
        rounded-lg shadow-sm
        border border-gray-200 dark:border-slate-700
        ${hover ? 'transition-shadow hover:shadow-md' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            {action}
        </div>
    )
}
