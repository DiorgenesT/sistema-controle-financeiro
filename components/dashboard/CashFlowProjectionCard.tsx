'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useAccounts } from '@/contexts/AccountContext'
import { analyticsService, CashFlowProjection } from '@/lib/services/analytics.service'
import { LineChart, TrendingUp, TrendingDown } from 'lucide-react'

export function CashFlowProjectionCard() {
    const { user } = useAuth()
    const { activeAccounts } = useAccounts()
    const [projections, setProjections] = useState<CashFlowProjection[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProjections()
    }, [user, activeAccounts])

    const loadProjections = async () => {
        if (!user) return

        try {
            setLoading(true)
            const currentBalance = activeAccounts
                .filter(acc => acc.includeInTotal ?? true)
                .reduce((sum, acc) => sum + acc.currentBalance, 0)

            const result = await analyticsService.calculateCashFlowProjection(user.uid, currentBalance, 6)
            setProjections(result)
        } catch (error) {
            console.error('Erro ao carregar projeção:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    if (loading) {
        return (
            <Card className="animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    // Calcular tendência geral
    const firstBalance = projections[0]?.projectedBalance || 0
    const lastBalance = projections[projections.length - 1]?.projectedBalance || 0
    const trend = lastBalance > firstBalance ? 'up' : 'down'
    const trendPercentage = firstBalance !== 0
        ? Math.abs(((lastBalance - firstBalance) / firstBalance) * 100)
        : 0

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <LineChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Projeção de Fluxo de Caixa
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Próximos 6 meses
                        </p>
                    </div>
                </div>
                <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {trend === 'up' ? (
                        <TrendingUp className="w-4 h-4" />
                    ) : (
                        <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{trendPercentage.toFixed(0)}%</span>
                </div>
            </div>

            {projections.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        📈 Adicione transações para gerar projeções
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {projections.map((proj, index) => {
                        const isPositive = proj.balance >= 0
                        const barWidth = Math.abs(proj.balance) / Math.max(...projections.map(p => Math.abs(p.balance))) * 100

                        return (
                            <div key={index} className="group">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium capitalize">
                                        {proj.month}
                                    </span>
                                    <span className={`font-semibold ${proj.projectedBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(proj.projectedBalance)}
                                    </span>
                                </div>

                                {/* Barra de projeção */}
                                <div className="relative h-6 bg-gray-100 dark:bg-slate-700 rounded overflow-hidden">
                                    <div
                                        className={`absolute h-full transition-all duration-300 ${isPositive ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'}`}
                                        style={{ width: `${Math.min(barWidth, 100)}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                                        <span className="text-gray-600 dark:text-gray-300 text-[10px] opacity-75">
                                            ↓ {formatCurrency(proj.expenses)}
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-300 text-[10px] opacity-75">
                                            ↑ {formatCurrency(proj.income)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {projections.length > 0 && lastBalance < 0 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                        ⚠️ <strong>Atenção:</strong> Projeção indica saldo negativo. Considere reduzir despesas futuras.
                    </p>
                </div>
            )}
        </Card>
    )
}
