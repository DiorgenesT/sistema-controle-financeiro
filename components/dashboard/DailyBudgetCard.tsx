'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { dailyBudgetService, DailyBudgetData } from '@/lib/services/daily-budget.service'
import { DollarSign, TrendingUp, TrendingDown, Shield, Info } from 'lucide-react'

export function DailyBudgetCard() {
    const { user } = useAuth()
    const [data, setData] = useState<DailyBudgetData | null>(null)
    const [loading, setLoading] = useState(true)
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        if (!user) return

        try {
            setLoading(true)
            const result = await dailyBudgetService.getDailyBudget(user.uid)
            setData(result)
        } catch (error) {
            console.error('Erro ao carregar orçamento diário:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value)
    }

    if (loading) {
        return (
            <Card className="animate-pulse h-[140px]">
                <div className="h-full bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    if (!data) return null

    const status = dailyBudgetService.getBudgetStatus(data)
    const health = dailyBudgetService.calculateBudgetHealth(data)

    const getColor = () => {
        if (status.type === 'success') return { from: '#10b981', to: '#059669' }
        if (status.type === 'warning') return { from: '#f59e0b', to: '#d97706' }
        return { from: '#ef4444', to: '#dc2626' }
    }

    const colors = getColor()

    return (
        <Card
            className="text-white border-none p-5 relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-[140px]"
            style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`
            }}
            onClick={() => setShowDetails(!showDetails)}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

            <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold opacity-90">Seguro Gastar Hoje</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {data.bufferPercentage > 0 && (
                            <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                <Shield className="w-3 h-3" />
                                <span className="font-bold">{data.bufferPercentage}%</span>
                            </div>
                        )}
                        {data.accumulatedBalance !== 0 && (
                            <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {data.accumulatedBalance > 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                ) : (
                                    <TrendingDown className="w-3 h-3" />
                                )}
                                <span className="font-bold">
                                    {formatCurrency(Math.abs(data.accumulatedBalance))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Valor principal */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-1">
                        <p className="text-2xl font-black tracking-tight">
                            {formatCurrency(data.safeBudgetRemaining)}
                        </p>
                        {showDetails && (
                            <p className="text-xs opacity-75 mt-1">
                                Total: {formatCurrency(data.remainingToday)} • Já gastou: {formatCurrency(data.spentToday)}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs opacity-75">
                        <span>{data.daysRemaining} dias restantes</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Buffer {data.bufferPercentage}%
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    )
}
