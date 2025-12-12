'use client'

import { Card } from '@/components/ui/Card'
import { Calendar, DollarSign, TrendingUp } from 'lucide-react'

interface Contribution {
    id: string
    amount: number
    date: number
    note?: string
}

interface ContributionHistoryProps {
    contributions: Contribution[]
}

export function ContributionHistory({ contributions }: ContributionHistoryProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0)

    if (contributions.length === 0) {
        return (
            <Card className="p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-semibold">Nenhuma contribuição ainda</p>
                    <p className="text-sm mt-1">Faça sua primeira contribuição para começar!</p>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header com total */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Histórico de Contribuições
                </h3>
                <div className="flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                        Total: {formatCurrency(totalContributed)}
                    </span>
                </div>
            </div>

            {/* Lista de contribuições */}
            <Card className="divide-y divide-gray-200 dark:divide-gray-700">
                {contributions.map((contribution) => (
                    <div
                        key={contribution.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(contribution.amount)}
                                    </p>
                                    {contribution.note && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {contribution.note}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(contribution.date)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </Card>
        </div>
    )
}
