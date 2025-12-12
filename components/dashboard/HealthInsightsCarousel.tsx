'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, TrendingDown, Shield, Info, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { financialHealthService, FinancialHealthScore } from '@/lib/services/financial-health.service'
import { dailyBudgetService, DailyBudgetData } from '@/lib/services/daily-budget.service'
import { emergencyFundService, EmergencyFundStatus } from '@/lib/services/emergency-fund.service'
import { useRouter } from 'next/navigation'

export function HealthInsightsCarousel() {
    const { user } = useAuth()
    const router = useRouter()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)

    // Estados para cada card
    const [healthData, setHealthData] = useState<FinancialHealthScore | null>(null)
    const [budgetData, setBudgetData] = useState<DailyBudgetData | null>(null)
    const [emergencyData, setEmergencyData] = useState<EmergencyFundStatus | null>(null)
    const [loading, setLoading] = useState(true)

    const insights = [
        { id: 'health', name: 'Saúde Financeira' },
        { id: 'daily', name: 'Seguro Gastar Hoje' },
        { id: 'emergency', name: 'Reserva Emergência' }
    ]

    // Auto-play sequencial: primeira transição em 5s, depois a cada 15s
    useEffect(() => {
        if (insights.length <= 1) return

        let interval: NodeJS.Timeout

        // Primeira transição após 5 segundos
        const firstTimeout = setTimeout(() => {
            handleTransition((prev) => (prev + 1) % insights.length)

            // Depois continua a cada 15 segundos
            interval = setInterval(() => {
                handleTransition((prev) => (prev + 1) % insights.length)
            }, 15000)
        }, 5000)

        return () => {
            clearTimeout(firstTimeout)
            if (interval) clearInterval(interval)
        }
    }, [insights.length])

    // Carregar dados
    useEffect(() => {
        loadAllData()
    }, [user])

    const loadAllData = async () => {
        if (!user) return

        try {
            setLoading(true)
            const [health, budget, emergency] = await Promise.all([
                financialHealthService.calculateScore(user.uid),
                dailyBudgetService.getDailyBudget(user.uid),
                emergencyFundService.getStatus(user.uid)
            ])
            setHealthData(health)
            setBudgetData(budget)
            setEmergencyData(emergency)
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleTransition = (indexOrCallback: number | ((prev: number) => number)) => {
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrentIndex(indexOrCallback)
            setIsTransitioning(false)
        }, 150)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value)
    }

    const currentInsight = insights[currentIndex]

    if (loading) {
        return (
            <Card className="animate-pulse h-[140px]">
                <div className="h-full bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    // Renderizar conteúdo baseado no slide atual
    const renderContent = () => {
        switch (currentInsight.id) {
            case 'health':
                if (!healthData) return null
                const healthColors = () => {
                    switch (healthData.classification) {
                        case 'excellent': return { from: '#10b981', to: '#059669' }
                        case 'good': return { from: '#3b82f6', to: '#2563eb' }
                        case 'regular': return { from: '#f59e0b', to: '#d97706' }
                        case 'critical': return { from: '#ef4444', to: '#dc2626' }
                    }
                }
                const colors = healthColors()

                return (
                    <>
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
                        </div>
                        <div className="relative h-full flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold opacity-90">Saúde Financeira</span>
                                </div>
                                <div className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                                    <span className="text-xs font-bold">
                                        {healthData.classification === 'excellent' ? 'Excelente' :
                                            healthData.classification === 'good' ? 'Bom' :
                                                healthData.classification === 'regular' ? 'Regular' : 'Crítico'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">
                                            {isNaN(healthData.overall) ? 0 : Math.round(healthData.overall)}
                                        </span>
                                        <span className="text-xl font-bold opacity-75">/100</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )

            case 'daily':
                if (!budgetData) return null
                const budgetStatus = dailyBudgetService.getBudgetStatus(budgetData)
                const budgetColors = () => {
                    if (budgetStatus.type === 'success') return { from: '#10b981', to: '#059669' }
                    if (budgetStatus.type === 'warning') return { from: '#f59e0b', to: '#d97706' }
                    return { from: '#ef4444', to: '#dc2626' }
                }
                const bColors = budgetColors()

                return (
                    <>
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
                        </div>
                        <div className="relative h-full flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold opacity-90">Seguro Gastar Hoje</span>
                                </div>
                                {budgetData.bufferPercentage > 0 && (
                                    <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                        <Shield className="w-3 h-3" />
                                        <span className="font-bold">{budgetData.bufferPercentage}%</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <p className="text-2xl font-black tracking-tight mb-1">
                                    {formatCurrency(budgetData.safeBudgetRemaining)}
                                </p>
                                <div className="flex items-center gap-2 text-xs opacity-75">
                                    <span>{budgetData.daysRemaining} dias restantes</span>
                                </div>
                            </div>
                        </div>
                    </>
                )

            case 'emergency':
                if (!emergencyData) return null
                const emergencyColors = () => {
                    if (emergencyData.monthsCovered >= 6) return { from: '#10b981', to: '#059669' }
                    if (emergencyData.monthsCovered >= 3) return { from: '#3b82f6', to: '#2563eb' }
                    if (emergencyData.monthsCovered >= 1) return { from: '#f59e0b', to: '#d97706' }
                    return { from: '#ef4444', to: '#dc2626' }
                }
                const eColors = emergencyColors()

                return (
                    <>
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
                        </div>
                        <div className="relative h-full flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold opacity-90">Reserva Emergência</span>
                                </div>
                                {emergencyData.hasGoal && (
                                    <div className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                                        <span className="text-xs font-bold">{Math.floor(emergencyData.monthsCovered)} meses</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                {emergencyData.hasGoal ? (
                                    <>
                                        <p className="text-2xl font-black tracking-tight mb-1">
                                            {formatCurrency(emergencyData.currentAmount)}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs opacity-75">
                                            <span>Meta: {formatCurrency(emergencyData.targetAmount)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm font-semibold opacity-90">
                                        Crie sua reserva de segurança
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )

            default:
                return null
        }
    }

    // Determinar cores do gradiente baseado no slide
    const getGradient = () => {
        switch (currentInsight.id) {
            case 'health':
                if (!healthData) return 'from-gray-500 to-gray-600'
                const score = healthData.overall
                if (score >= 90) return 'from-emerald-500 to-green-600'
                if (score >= 70) return 'from-blue-500 to-cyan-600'
                if (score >= 50) return 'from-orange-500 to-amber-600'
                return 'from-red-500 to-rose-600'
            case 'daily':
                return 'from-purple-500 to-purple-700'
            case 'emergency':
                return 'from-teal-600 to-cyan-600'
            default:
                return 'from-gray-500 to-gray-600'
        }
    }

    const getHoverShadow = () => {
        switch (currentInsight.id) {
            case 'health':
                if (!healthData) return 'hover:shadow-gray-500/30'
                const score = healthData.overall
                if (score >= 90) return 'hover:shadow-green-500/30'
                if (score >= 70) return 'hover:shadow-blue-500/30'
                if (score >= 50) return 'hover:shadow-orange-500/30'
                return 'hover:shadow-red-500/30'
            case 'daily':
                return 'hover:shadow-purple-500/30'
            case 'emergency':
                return 'hover:shadow-teal-500/30'
            default:
                return 'hover:shadow-gray-500/30'
        }
    }

    return (
        <Card
            className={`overflow-hidden text-white border-none p-5 h-[140px] relative group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br ${getGradient()} ${getHoverShadow()}`}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

            {/* Content com animação - MESMA estrutura que GoalsCarouselCompact */}
            <div
                className={`relative z-10 h-full flex flex-col transition-all duration-500 ease-in-out ${isTransitioning
                    ? 'opacity-0 scale-95'
                    : 'opacity-100 scale-100'
                    }`}
            >
                {renderContent()}
            </div>
        </Card>
    )
}
