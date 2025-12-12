'use client'

import { useState } from 'react'
import { Goal } from '@/types'
import { goalService } from '@/lib/services/goal.service'
import { getGoalCategory } from '@/lib/constants/goals'
import { useGoals } from '@/contexts/GoalContext'
import { Card } from '@/components/ui/Card'
import { ContributionModal } from './ContributionModal'
import { GoalModal } from './GoalModal'
import { Plus, Edit2, Trash2, Check, Calendar, TrendingUp } from 'lucide-react'

interface GoalCardProps {
    goal: Goal
}

export function GoalCard({ goal }: GoalCardProps) {
    const { deleteGoal } = useGoals()
    const [showContributionModal, setShowContributionModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)

    const category = getGoalCategory(goal.category)
    const progress = goalService.calculateProgress(goal)
    const remaining = goalService.calculateRemaining(goal)
    const daysRemaining = goalService.calculateDaysRemaining(goal)
    const monthlyNeeded = goalService.calculateMonthlyContribution(goal)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR')
    }

    const handleDelete = async () => {
        if (confirm(`Tem certeza que deseja excluir a meta "${goal.name}"?`)) {
            try {
                await deleteGoal(goal.id)
            } catch (error) {
                console.error('Erro ao excluir meta:', error)
                alert('Erro ao excluir meta')
            }
        }
    }

    const isCompleted = goal.status === 'completed'
    const isOverdue = !isCompleted && daysRemaining < 0

    return (
        <>
            <Card className={`p-5 hover:shadow-lg transition-all duration-300 border-2 ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                    isOverdue ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
                        'border-gray-200 dark:border-slate-700'
                }`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${category.color}20` }}
                        >
                            {goal.icon || category.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                                {isCompleted && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Concluída
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{category.label}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    {!isCompleted && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Editar"
                            >
                                <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Excluir"
                            >
                                <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            Progresso
                        </span>
                        <span className="text-xs font-bold" style={{ color: category.color }}>
                            {progress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${Math.min(100, progress)}%`,
                                backgroundColor: category.color
                            }}
                        />
                    </div>
                </div>

                {/* Values */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Atual</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(goal.currentAmount)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meta</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(goal.targetAmount)}
                        </p>
                    </div>
                </div>

                {/* Info */}
                {!isCompleted && (
                    <div className="space-y-2 mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Prazo
                            </span>
                            <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                {isOverdue ? 'Vencida' : `${daysRemaining} dias`}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Faltam
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(remaining)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Aporte mensal ideal</span>
                            <span className="font-bold" style={{ color: category.color }}>
                                {formatCurrency(monthlyNeeded)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                {!isCompleted && (
                    <button
                        onClick={() => setShowContributionModal(true)}
                        className="w-full py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                        style={{ backgroundColor: category.color }}
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Aporte
                    </button>
                )}
            </Card>

            <ContributionModal
                isOpen={showContributionModal}
                onClose={() => setShowContributionModal(false)}
                goalId={goal.id}
                goalName={goal.name}
            />

            <GoalModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                goalToEdit={goal}
            />
        </>
    )
}
