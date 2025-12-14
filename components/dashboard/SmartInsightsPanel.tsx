'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSmartInsights } from '@/hooks/useSmartInsights'
import { SmartInsight } from '@/lib/services/smart-insights.service'
import { checkUserDataStatus, getInsightAvailabilityMessage, UserDataStatus } from '@/lib/utils/insightsHelper'
import { EmptyStateCard } from './EmptyStateCard'
import { X, TrendingUp, AlertTriangle, Target, Award, Lightbulb } from 'lucide-react'

export function SmartInsightsPanel() {
    const { user } = useAuth()
    const { insights, loading, dismissInsight } = useSmartInsights()
    const [dataStatus, setDataStatus] = useState<UserDataStatus | null>(null)
    const [checkingData, setCheckingData] = useState(true)

    useEffect(() => {
        const checkData = async () => {
            if (!user) {
                setCheckingData(false)
                return
            }

            try {
                const status = await checkUserDataStatus(user.uid)
                setDataStatus(status)
            } catch (error) {
                console.error('Erro ao verificar dados:', error)
            } finally {
                setCheckingData(false)
            }
        }

        checkData()
    }, [user])

    if (loading || checkingData) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
                <div className="space-y-3">
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </div>
        )
    }

    // Mostrar empty state se não tem dados suficientes
    if (!dataStatus?.hasMinimumData) {
        const message = getInsightAvailabilityMessage(dataStatus!, 'insights')
        return (
            <EmptyStateCard
                icon={Lightbulb}
                title="Insights Personalizados"
                message={message}
                availableDate={dataStatus?.availableDate}
                hint="Quanto mais dados você registrar, mais precisos serão os insights!"
            />
        )
    }

    if (insights.length === 0) {
        return null
    }

    const getTypeConfig = (type: SmartInsight['type']) => {
        switch (type) {
            case 'warning':
                return {
                    icon: AlertTriangle,
                    bgColor: 'bg-red-50 dark:bg-red-950/30',
                    borderColor: 'border-red-200 dark:border-red-900',
                    iconColor: 'text-red-600 dark:text-red-400'
                }
            case 'opportunity':
                return {
                    icon: TrendingUp,
                    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
                    borderColor: 'border-blue-200 dark:border-blue-900',
                    iconColor: 'text-blue-600 dark:text-blue-400'
                }
            case 'achievement':
                return {
                    icon: Award,
                    bgColor: 'bg-green-50 dark:bg-green-950/30',
                    borderColor: 'border-green-200 dark:border-green-900',
                    iconColor: 'text-green-600 dark:text-green-400'
                }
            default: // tip
                return {
                    icon: Target,
                    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
                    borderColor: 'border-purple-200 dark:border-purple-900',
                    iconColor: 'text-purple-600 dark:text-purple-400'
                }
        }
    }

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 p-5 shadow-xl h-full">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Insights Personalizados
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {insights.length} {insights.length === 1 ? 'dica inteligente' : 'dicas inteligentes'}
                    </p>
                </div>
            </div>

            {/* Insights */}
            <div className="space-y-3">
                {insights.map((insight) => {
                    const config = getTypeConfig(insight.type)
                    const Icon = config.icon

                    return (
                        <div
                            key={insight.id}
                            className={`relative ${config.bgColor} ${config.borderColor} border-2 rounded-xl p-4 transition-all hover:shadow-md`}
                        >
                            {/* Botão de dismiss */}
                            <button
                                onClick={() => dismissInsight(insight.id)}
                                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                aria-label="Dispensar"
                            >
                                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>

                            <div className="flex items-start gap-3 pr-8">
                                {/* Ícone - sempre usar Lucide */}
                                <div className={`flex-shrink-0 p-2 rounded-lg bg-white/50 dark:bg-black/20`}>
                                    <Icon className={`w-6 h-6 ${config.iconColor}`} />
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1">
                                    {/* Prioridade */}
                                    {insight.priority >= 4 && (
                                        <span className="inline-block px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-full mb-2">
                                            Alta Prioridade
                                        </span>
                                    )}

                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                        {insight.title}
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {insight.message}
                                    </p>

                                    {/* Ação */}
                                    {insight.action && (
                                        <button
                                            className="mt-3 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                                        >
                                            {insight.action.label}
                                        </button>
                                    )}

                                    {/* Metadados de aprendizado */}
                                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <span>
                                            Confiança: {insight.learnedFrom.confidence}%
                                        </span>
                                        {insight.learnedFrom.basedOn > 0 && (
                                            <span>
                                                Baseado em {insight.learnedFrom.basedOn} {insight.learnedFrom.basedOn === 1 ? 'análise' : 'análises'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
