'use client'

import { useState } from 'react'
import { Goal } from '@/types'
import { goalService } from '@/lib/services/goal.service'
import { getGoalCategory } from '@/lib/constants/goals'
import { useGoals } from '@/contexts/GoalContext'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronLeft, ChevronRight, TrendingUp, Target } from 'lucide-react'
import { GoalTransferModal } from '../goals/GoalTransferModal'

export function GoalsCarousel() {
    const { activeGoals, loading } = useGoals()
    const { user } = useAuth()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedGoalForTransfer, setSelectedGoalForTransfer] = useState<Goal | null>(null)

    if (loading || activeGoals.length === 0) return null

    const currentGoal = activeGoals[currentIndex]
    const category = getGoalCategory(currentGoal.category)
    const progress = goalService.calculateProgress(currentGoal)
    const remaining = goalService.calculateRemaining(currentGoal)
    const monthlyNeeded = goalService.calculateMonthlyContribution(currentGoal)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value)
    }

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % activeGoals.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + activeGoals.length) % activeGoals.length)
    }

    return (
        <>
            <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-2xl overflow-hidden shadow-2xl">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24" />
                </div>

                {/* Content */}
                <div className="relative p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                style={{ backgroundColor: `${category.color}30` }}
                            >
                                {currentGoal.icon || category.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{currentGoal.name}</h3>
                                <p className="text-purple-100 text-sm">{category.label}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-bold">
                                {currentIndex + 1}/{activeGoals.length}
                            </span>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-6">
                        <div className="flex items-baseline justify-between mb-2">
                            <span className="text-purple-100 text-sm font-semibold">Progresso</span>
                            <span className="text-white text-2xl font-black">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-white to-purple-100 rounded-full transition-all duration-700 relative overflow-hidden"
                                style={{ width: `${Math.min(100, progress)}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 2s infinite'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-purple-100 text-xs mb-1">Atual</p>
                            <p className="text-white font-black text-sm">{formatCurrency(currentGoal.currentAmount)}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-purple-100 text-xs mb-1">Meta</p>
                            <p className="text-white font-black text-sm">{formatCurrency(currentGoal.targetAmount)}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-purple-100 text-xs mb-1">Falta</p>
                            <p className="text-white font-black text-sm">{formatCurrency(remaining)}</p>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={() => setSelectedGoalForTransfer(currentGoal)}
                        className="w-full py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                        <TrendingUp className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                        Transferir da Conta
                    </button>

                    {/* Navigation */}
                    {activeGoals.length > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={prevSlide}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                            <div className="flex gap-1">
                                {activeGoals.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                                            }`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={nextSlide}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedGoalForTransfer && user && (
                <GoalTransferModal
                    isOpen={true}
                    onClose={() => setSelectedGoalForTransfer(null)}
                    goal={selectedGoalForTransfer}
                    userId={user.uid}
                />
            )}

            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </>
    )
}
