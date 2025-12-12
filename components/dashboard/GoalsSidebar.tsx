'use client'

import { useGoals } from '@/contexts/GoalContext'
import { GoalMiniCard } from '@/components/goals/GoalMiniCard'
import { Target } from 'lucide-react'

export function GoalsSidebar() {
    const { activeGoals, loading } = useGoals()

    if (loading) return null

    const displayGoals = activeGoals.slice(0, 4) // Máximo 4 metas

    if (displayGoals.length === 0) return null

    return (
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Metas Ativas</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activeGoals.length} {activeGoals.length === 1 ? 'meta' : 'metas'}
                    </p>
                </div>
            </div>

            {/* Goals List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {displayGoals.map((goal) => (
                    <GoalMiniCard key={goal.id} goal={goal} />
                ))}
            </div>

            {/* View All Link */}
            {activeGoals.length > 4 && (
                <a
                    href="/dashboard/goals"
                    className="block mt-4 text-center text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                    Ver todas ({activeGoals.length - 4} mais)
                </a>
            )}
        </div>
    )
}
