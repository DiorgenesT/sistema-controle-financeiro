'use client'

import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface EmptyStateCardProps {
    icon: LucideIcon
    title: string
    message: string
    availableDate?: Date | null
    hint?: string
    className?: string
}

export function EmptyStateCard({ 
    icon: Icon, 
    title, 
    message, 
    availableDate,
    hint,
    className = ''
}: EmptyStateCardProps) {
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { 
            day: 'numeric', 
            month: 'long' 
        })
    }

    return (
        <Card className={className}>
            <div className="flex flex-col items-center justify-center text-center py-8 px-6">
                {/* Ícone */}
                <div className="mb-4 p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full">
                    <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                {/* Título */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    {title}
                </h3>

                {/* Mensagem */}
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line max-w-md">
                    {message}
                </p>

                {/* Data de disponibilidade */}
                {availableDate && (
                    <div className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                            📅 Disponível em: {formatDate(availableDate)}
                        </p>
                    </div>
                )}

                {/* Hint opcional */}
                {hint && (
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
                        💡 {hint}
                    </p>
                )}
            </div>
        </Card>
    )
}
