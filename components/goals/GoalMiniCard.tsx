'use client'

import { useState } from 'react'
import { Goal } from '@/types'
import { goalService } from '@/lib/services/goal.service'
import { getGoalCategory } from '@/lib/constants/goals'
import { useGoals } from '@/contexts/GoalContext'
import { useAuth } from '@/contexts/AuthContext'
import { TrendingUp } from 'lucide-react'
import { GoalTransferModal } from './GoalTransferModal'

interface GoalMiniCardProps {
    goal: Goal
}

export function GoalMiniCard({ goal }: GoalMiniCardProps) {
    const { user } = useAuth()
    const [showTransferModal, setShowTransferModal] = useState(false)

    const category = getGoalCategory(goal.category)
    const progress = goalService.calculateProgress(goal)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value)
    }

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: `${category.color}20` }}
                    >
                        {goal.icon || category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {goal.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                        </p>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Progresso</span>
                        <span className="text-xs font-bold" style={{ color: category.color }}>
                            {progress.toFixed(0)}%
                        </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${Math.min(100, progress)}%`,
                                backgroundColor: category.color
                            }}
                        />
                    </div>
                </div>

                {/* CTA */}
                <button
                    onClick={() => setShowTransferModal(true)}
                    className="w-full py-2 px-3 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-1.5"
                >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Transferir
                </button>
            </div>

            {user && (
                <GoalTransferModal
                    isOpen={showTransferModal}
                    onClose={() => setShowTransferModal(false)}
                    goal={goal}
                    userId={user.uid}
                />
            )}
        </>
    )
}
