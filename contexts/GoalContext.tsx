'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Goal } from '@/types'
import { goalService } from '@/lib/services/goal.service'
import { accountService } from '@/lib/services/account.service'
import { useAuth } from './AuthContext'

interface GoalContextType {
    goals: Goal[]
    activeGoals: Goal[]
    completedGoals: Goal[]
    loading: boolean
    createGoal: (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'contributions' | 'status'>) => Promise<void>
    updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>
    deleteGoal: (goalId: string) => Promise<void>
    addContribution: (goalId: string, accountId: string, amount: number, note?: string) => Promise<void>
    removeContribution: (goalId: string, contributionId: string) => Promise<void>
    cancelGoal: (goalId: string) => Promise<void>
    reactivateGoal: (goalId: string) => Promise<void>
    refreshGoals: () => Promise<void>
}

const GoalContext = createContext<GoalContextType | undefined>(undefined)

export function GoalProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)

    const loadGoals = async () => {
        if (!user) {
            setGoals([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const userGoals = await goalService.getByUserId(user.uid)
            setGoals(userGoals)
        } catch (error) {
            console.error('Erro ao carregar metas:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadGoals()
    }, [user])

    const createGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'contributions' | 'status'>) => {
        if (!user) throw new Error('Usuário não autenticado')

        await goalService.create(user.uid, goalData)
        await loadGoals()
    }

    const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
        await goalService.update(goalId, updates)
        await loadGoals()
    }

    const deleteGoal = async (goalId: string) => {
        await goalService.delete(goalId)
        await loadGoals()
    }

    const addContribution = async (goalId: string, accountId: string, amount: number, note?: string) => {
        if (!user) throw new Error('Usuário não autenticado')

        // Usar accountService.transferToGoal que já cuida de tudo:
        // - Valida saldo
        // - Cria transação
        // - Debita da conta (via listener)
        // - Credita na meta
        await accountService.transferToGoal(user.uid, accountId, goalId, amount)
        await loadGoals()
    }

    const removeContribution = async (goalId: string, contributionId: string) => {
        await goalService.removeContribution(goalId, contributionId)
        await loadGoals()
    }

    const cancelGoal = async (goalId: string) => {
        await goalService.cancel(goalId)
        await loadGoals()
    }

    const reactivateGoal = async (goalId: string) => {
        await goalService.reactivate(goalId)
        await loadGoals()
    }

    const activeGoals = goals.filter(g => g.status === 'active')
    const completedGoals = goals.filter(g => g.status === 'completed')

    return (
        <GoalContext.Provider
            value={{
                goals,
                activeGoals,
                completedGoals,
                loading,
                createGoal,
                updateGoal,
                deleteGoal,
                addContribution,
                removeContribution,
                cancelGoal,
                reactivateGoal,
                refreshGoals: loadGoals
            }}
        >
            {children}
        </GoalContext.Provider>
    )
}

export function useGoals() {
    const context = useContext(GoalContext)
    if (context === undefined) {
        throw new Error('useGoals must be used within a GoalProvider')
    }
    return context
}
