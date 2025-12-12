'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface IncomeExpenseCarouselProps {
    income: number
    expense: number
}

export function IncomeExpenseCarousel({ income, expense }: IncomeExpenseCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)

    const cards = [
        { id: 'income', type: 'income', value: income },
        { id: 'expense', type: 'expense', value: expense }
    ]

    // Auto-play sequencial: move primeiro (0s), depois a cada 15s
    useEffect(() => {
        if (cards.length <= 1) return

        const interval = setInterval(() => {
            handleTransition((prev) => (prev + 1) % cards.length)
        }, 15000) // Ciclo completo: 15 segundos

        return () => clearInterval(interval)
    }, [cards.length])

    const handleTransition = (indexOrCallback: number | ((prev: number) => number)) => {
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrentIndex(indexOrCallback)
            setIsTransitioning(false)
        }, 150)
    }

    const currentCard = cards[currentIndex]

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(value)
    }

    const isIncome = currentCard.type === 'income'

    return (
        <Card
            className={`overflow-hidden p-5 border-none text-white h-[140px] relative group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isIncome
                ? 'bg-gradient-to-br from-green-600 to-emerald-600 hover:shadow-green-500/30'
                : 'bg-gradient-to-br from-red-600 to-rose-600 hover:shadow-red-500/30'
                }`}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

            <div
                className={`relative z-10 h-full flex flex-col transition-all duration-500 ease-in-out ${isTransitioning
                    ? 'opacity-0 scale-95'
                    : 'opacity-100 scale-100'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            {isIncome ? (
                                <TrendingUp className="w-5 h-5" />
                            ) : (
                                <TrendingDown className="w-5 h-5" />
                            )}
                        </div>
                        <span className="text-sm font-semibold opacity-90">
                            {isIncome ? 'Receitas do Mês' : 'Despesas do Mês'}
                        </span>
                    </div>
                    <div className="p-1.5 bg-white/20 rounded-full">
                        {isIncome ? (
                            <ArrowUpRight className="w-4 h-4" />
                        ) : (
                            <ArrowDownRight className="w-4 h-4" />
                        )}
                    </div>
                </div>

                {/* Value */}
                <div className="flex-1 flex items-center">
                    <p className="text-3xl font-black tracking-tight">
                        {formatCurrency(currentCard.value)}
                    </p>
                </div>
            </div>
        </Card>
    )
}
