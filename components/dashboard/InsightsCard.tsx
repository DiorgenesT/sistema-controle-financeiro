'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { analyticsService, FinancialInsight } from '@/lib/services/analytics.service'
import { Lightbulb, AlertCircle, CheckCircle, Info } from 'lucide-react'

export function InsightsCard() {
    const { user } = useAuth()
    const [insights, setInsights] = useState<FinancialInsight[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadInsights()
    }, [user])

    const loadInsights = async () => {
        if (!user) return

        try {
            setLoading(true)
            const result = await analyticsService.getFinancialInsights(user.uid)
            setInsights(result)
        } catch (error) {
            console.error('Erro ao carregar insights:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            case 'info':
                return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            default:
                return <Lightbulb className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        }
    }

    const getBackgroundClass = (type: string) => {
        switch (type) {
            case 'warning':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            case 'success':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            case 'info':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            default:
                return 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
        }
    }

    return (
        <Card>
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Insights Inteligentes
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Análises automáticas
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {insights.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            📊 Continue registrando suas transações para receber insights personalizados!
                        </p>
                    </div>
                ) : (
                    insights.map((insight, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border transition-all hover:shadow-sm ${getBackgroundClass(insight.type)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getIcon(insight.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                        {insight.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                        {insight.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {insights.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Atualizado automaticamente a cada nova transação
                    </p>
                </div>
            )}
        </Card>
    )
}
