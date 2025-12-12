'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useGoals } from '@/contexts/GoalContext'
import { goalService } from '@/lib/services/goal.service'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalModal } from '@/components/goals/GoalModal'
import { Button } from '@/components/ui/Button'
import { Plus, Target, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'

export default function GoalsPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <GoalsContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function GoalsContent() {
    const { goals, activeGoals, completedGoals, loading } = useGoals()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    // Estatísticas
    const totalTargetAmount = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0)
    const totalCurrentAmount = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0)
    const totalProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0

    const filteredGoals = filter === 'all' ? goals :
        filter === 'active' ? activeGoals :
            completedGoals

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header Hero */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 mb-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -ml-48 -mt-48" />
                    <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full -mr-36 -mb-36" />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-white mb-1 tracking-tight flex items-center gap-3">
                                <Target className="w-8 h-8" />
                                Metas Financeiras
                            </h1>
                            <p className="text-purple-100 text-sm font-medium">
                                Defina e acompanhe seus objetivos financeiros
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-white text-purple-600 hover:bg-purple-50 font-bold px-6"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Meta
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                {/* Stats */}
                {activeGoals.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-200 dark:border-purple-900">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Metas Ativas</span>
                            </div>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">{activeGoals.length}</p>
                        </div>

                        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-green-200 dark:border-green-900">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Economizado</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(totalCurrentAmount)}</p>
                        </div>

                        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-200 dark:border-blue-900">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Objetivo Total</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(totalTargetAmount)}</p>
                        </div>

                        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-orange-200 dark:border-orange-900">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Progresso Geral</span>
                            </div>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">{totalProgress.toFixed(1)}%</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'active'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        Ativas ({activeGoals.length})
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'completed'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        Concluídas ({completedGoals.length})
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'all'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        Todas ({goals.length})
                    </button>
                </div>

                {/* Goals Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">Carregando metas...</p>
                    </div>
                ) : filteredGoals.length === 0 ? (
                    <div className="text-center py-12">
                        <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Nenhuma meta encontrada
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Comece criando sua primeira meta financeira!
                        </p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Criar Meta
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGoals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                )}
            </div>

            <GoalModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    )
}
