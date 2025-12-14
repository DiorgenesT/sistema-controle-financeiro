'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { checkUserDataStatus, getInsightAvailabilityMessage, UserDataStatus } from '@/lib/utils/insightsHelper'
import { EmptyStateCard } from './EmptyStateCard'
import { financialHealthService, FinancialHealthScore } from '@/lib/services/financial-health.service'
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, Heart } from 'lucide-react'

export function FinancialHealthCard() {
    const { user } = useAuth()
    const { transactions, stats } = useTransactions()
    const [data, setData] = useState<FinancialHealthScore | null>(null)
    const [loading, setLoading] = useState(true)
    const [dataStatus, setDataStatus] = useState<UserDataStatus | null>(null)
    const [checkingData, setCheckingData] = useState(true)

    useEffect(() => {
        checkMinimumData()
    }, [user])

    useEffect(() => {
        if (dataStatus?.hasMinimumData) {
            loadData()
        }
    }, [user, transactions, stats, dataStatus])

    const checkMinimumData = async () => {
        if (!user) {
            setCheckingData(false)
            setLoading(false)
            return
        }

        try {
            const status = await checkUserDataStatus(user.uid)
            setDataStatus(status)
            
            // Se não tem dados mínimos, não precisa carregar
            if (!status.hasMinimumData) {
                setLoading(false)
            }
        } catch (error) {
            console.error('Erro ao verificar dados:', error)
            setLoading(false)
        } finally {
            setCheckingData(false)
        }
    }

    const loadData = async () => {
        if (!user) return

        try {
            setLoading(true)
            const result = await financialHealthService.calculateScore(user.uid)
            setData(result)
        } catch (error) {
            console.error('Erro ao carregar saúde financeira:', error)
        } finally {
            setLoading(false)
        }
    }

    if (checkingData || loading) {
        return (
            <Card className="animate-pulse h-[140px]">
                <div className="h-full bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    // Mostrar empty state se não tem dados suficientes
    if (!dataStatus?.hasMinimumData) {
        const message = getInsightAvailabilityMessage(dataStatus!, 'health')
        return (
            <EmptyStateCard
                icon={Heart}
                title="Saúde Financeira"
                message={message}
                availableDate={dataStatus?.availableDate}
                hint="Vou analisar seu padrão de receitas e despesas!"
                className="h-auto"
            />
        )
    }

    if (!data) return null

    // Cores baseadas na classificação
    const getColor = () => {
        switch (data.classification) {
            case 'excellent': return { from: '#10b981', to: '#059669', text: 'Excelente' }
            case 'good': return { from: '#3b82f6', to: '#2563eb', text: 'Bom' }
            case 'regular': return { from: '#f59e0b', to: '#d97706', text: 'Regular' }
            case 'critical': return { from: '#ef4444', to: '#dc2626', text: 'Crítico' }
        }
    }

    const colors = getColor()

    return (
        <Card
            className="text-white border-none p-5 relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-[140px]"
            style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`
            }}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

            <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Activity className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold opacity-90">Saúde Financeira</span>
                    </div>
                    <div className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                        <span className="text-xs  font-bold">{colors.text}</span>
                    </div>
                </div>

                {/* Score */}
                <div className="flex-1 flex items-center justify-between">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black">{data.overall}</span>
                            <span className="text-xl font-bold opacity-75">/100</span>
                        </div>
                    </div>

                    {/* Mini insights */}
                    <div className="text-right">
                        {data.recommendations.length > 0 && (
                            <div className="flex items-center gap-1 text-xs opacity-90">
                                <TrendingUp className="w-3 h-3" />
                                <span>{data.recommendations.length} dicas</span>
                            </div>
                        )}
                        {data.alerts.length > 0 && (
                            <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{data.alerts.length} alertas</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
