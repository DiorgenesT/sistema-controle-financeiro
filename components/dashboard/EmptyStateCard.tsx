'use client'

import { LucideIcon, Calendar, Lightbulb } from 'lucide-react'

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
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className={`relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
            {/* Conteúdo */}
            <div className="flex flex-col items-center text-center py-12 px-8">

                {/* Ícone - elemento visual principal */}
                <div className="relative mb-8">
                    {/* Circle background com gradiente vibrante */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/20">
                        <Icon className="w-10 h-10 text-white" strokeWidth={2} />
                    </div>
                </div>

                {/* Título */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 max-w-md">
                    {title}
                </h2>

                {/* Mensagem */}
                <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mb-8">
                    {message}
                </p>

                {/* Card de data - se houver */}
                {availableDate && (
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" strokeWidth={2} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                                    Disponível em
                                </p>
                                <p className="text-base font-bold text-slate-900 dark:text-white">
                                    {formatDate(availableDate)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hint - se houver */}
                {hint && (
                    <div className="max-w-md">
                        <div className="inline-flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/50 text-left">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Lightbulb className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {hint}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
