'use client'

import { useState, useEffect } from 'react'
import { useGoals } from '@/contexts/GoalContext'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { GoalMiniCard } from '@/components/goals/GoalMiniCard'
import { ChevronLeft, ChevronRight, Target } from 'lucide-react'
import { getGoalCategory } from '@/lib/constants/goals'

export function GoalsCarouselCompact() {
    const { activeGoals, loading } = useGoals()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)

    // Auto-play sequencial: primeira transição em 10s, depois a cada 15s
    // IMPORTANTE: useEffect deve vir ANTES do early return
    useEffect(() => {
        if (activeGoals.length <= 1) return

        let interval: NodeJS.Timeout

        // Primeira transição após 10 segundos
        const firstTimeout = setTimeout(() => {
            handleTransition((prev) => (prev + 1) % activeGoals.length)

            // Depois continua a cada 15 segundos
            interval = setInterval(() => {
                handleTransition((prev) => (prev + 1) % activeGoals.length)
            }, 15000)
        }, 10000)

        return () => {
            clearTimeout(firstTimeout)
            if (interval) clearInterval(interval)
        }
    }, [activeGoals.length])

    // Remover early return para sempre mostrar o card
    // if (loading || activeGoals.length === 0) return null

    if (loading) {
        return (
            <Card className="animate-pulse h-[140px]">
                <div className="h-full bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    // Estado vazio - mostrar mensagem
    if (activeGoals.length === 0) {
        return (
            <Card className="overflow-hidden h-[140px] flex flex-col bg-gradient-to-br from-purple-500 to-pink-600 text-white border-none relative group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-1">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

                <div className="relative z-10 flex-1 flex flex-col justify-center items-center p-5 text-center">
                    <Target className="w-8 h-8 mb-2 opacity-75" />
                    <p className="text-sm font-semibold opacity-90">
                        Suas metas aparecerão aqui
                    </p>
                </div>
            </Card>
        )
    }

    const handleTransition = (indexOrCallback: number | ((prev: number) => number)) => {
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrentIndex(indexOrCallback)
            setIsTransitioning(false)
        }, 150) // Duração da animação de saída
    }

    const nextSlide = () => {
        handleTransition((prev) => (prev + 1) % activeGoals.length)
    }

    const prevSlide = () => {
        handleTransition((prev) => (prev - 1 + activeGoals.length) % activeGoals.length)
    }

    const currentGoal = activeGoals[currentIndex]
    const category = getGoalCategory(currentGoal.category)
    const progress = (currentGoal.currentAmount / currentGoal.targetAmount) * 100

    return (
        <div
            className="h-[140px] rounded-xl relative overflow-hidden transition-all duration-500"
            style={{
                background: `linear-gradient(135deg, ${category.color}dd, ${category.color})`
            }}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
            </div>

            {/* Content com animação suave */}
            <div
                className={`relative h-full p-5 flex flex-col transition-all duration-500 ease-in-out ${isTransitioning
                    ? 'opacity-0 scale-95'
                    : 'opacity-100 scale-100'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Target className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-white opacity-90">
                            Metas Financeiras
                        </span>
                    </div>
                    <span className="text-xs text-white/80 font-semibold">
                        {currentIndex + 1}/{activeGoals.length}
                    </span>
                </div>

                {/* Meta Info */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-2">
                        <h4 className="text-white font-bold text-lg mb-1">
                            {currentGoal.name}
                        </h4>
                        <div className="flex items-center gap-3 text-white/90 text-xs">
                            <span>
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    minimumFractionDigits: 0
                                }).format(currentGoal.currentAmount)}
                                {' de '}
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    minimumFractionDigits: 0
                                }).format(currentGoal.targetAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, progress)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
