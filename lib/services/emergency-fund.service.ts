import { ref, get, set, push } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction, Goal } from '@/types'

interface EmergencyFundStatus {
    hasGoal: boolean
    goalId?: string
    currentAmount: number
    targetAmount: number        // 6 meses de despesas
    monthsCovered: number        // Quantos meses cobre atualmente
    monthlyExpenses: number      // Despesa mensal média
    suggestedContribution: number // Quanto contribuir por mês
    progress: number             // % (0-100)
    daysToTarget: number         // Dias para atingir meta
}

class EmergencyFundService {
    /**
     * Calcula status da reserva de emergência
     */
    async getStatus(userId: string): Promise<EmergencyFundStatus> {
        // Calcular despesa mensal média
        const monthlyExpenses = await this.calculateMonthlyExpenses(userId)

        // Meta: 6 meses de despesas
        const targetAmount = monthlyExpenses * 6

        // Buscar meta existente
        const goal = await this.findEmergencyGoal(userId)

        if (goal) {
            // Atualizar meta se o cálculo mudou significativamente (mais de 10% de diferença)
            const difference = Math.abs(goal.targetAmount - targetAmount)
            const percentDiff = (difference / goal.targetAmount) * 100

            if (percentDiff > 10 && targetAmount > 0) {
                // Atualizar meta no Firebase
                const { update, ref } = await import('firebase/database')
                const goalRef = ref(db, `users/${userId}/goals/${goal.id}`)
                await update(goalRef, {
                    targetAmount,
                    updatedAt: Date.now()
                })
                goal.targetAmount = targetAmount
            }

            const monthsCovered = monthlyExpenses > 0
                ? goal.currentAmount / monthlyExpenses
                : 0

            const progress = goal.targetAmount > 0
                ? (goal.currentAmount / goal.targetAmount) * 100
                : 0

            const remaining = goal.targetAmount - goal.currentAmount
            const suggestedContribution = remaining > 0 ? Math.ceil(remaining / 12) : 0 // 12 meses para completar

            const daysToTarget = goal.deadline
                ? Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24))
                : 365

            return {
                hasGoal: true,
                goalId: goal.id,
                currentAmount: goal.currentAmount,
                targetAmount: goal.targetAmount,
                monthsCovered,
                monthlyExpenses,
                suggestedContribution,
                progress,
                daysToTarget
            }
        }

        // Sem meta ainda
        return {
            hasGoal: false,
            currentAmount: 0,
            targetAmount,
            monthsCovered: 0,
            monthlyExpenses,
            suggestedContribution: targetAmount > 0 ? Math.ceil(targetAmount / 12) : 0,
            progress: 0,
            daysToTarget: 365
        }
    }

    /**
     * Calcula despesa mensal média dos últimos 3 meses
     */
    private async calculateMonthlyExpenses(userId: string): Promise<number> {
        const today = new Date()
        const threeMonthsAgo = new Date(today)
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

        const transactionsRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(transactionsRef)

        if (!snapshot.exists()) return 0 // Sem transações = sem despesas ainda

        const transactions: Transaction[] = Object.values(snapshot.val())
        const monthlyTotals: { [month: string]: number } = {}

        transactions.forEach(tx => {
            const txDate = new Date(tx.date)

            if (txDate >= threeMonthsAgo && tx.type === 'expense') {
                const monthKey = `${txDate.getFullYear()}-${txDate.getMonth()}`

                if (!monthlyTotals[monthKey]) {
                    monthlyTotals[monthKey] = 0
                }
                monthlyTotals[monthKey] += tx.amount
            }
        })

        const values = Object.values(monthlyTotals)
        if (values.length === 0) return 0 // Sem despesas nos últimos 3 meses

        return values.reduce((a, b) => a + b, 0) / values.length
    }

    /**
     * Busca meta de reserva de emergência existente
     */
    private async findEmergencyGoal(userId: string): Promise<Goal | null> {
        const goalsRef = ref(db, `users/${userId}/goals`)
        const snapshot = await get(goalsRef)

        if (!snapshot.exists()) return null

        const goals: Goal[] = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
            ...data,
            id
        }))

        return goals.find(g =>
            g.status === 'active' &&
            (g.name.toLowerCase().includes('emergência') ||
                g.name.toLowerCase().includes('reserva') ||
                g.category === 'emergency')
        ) || null
    }

    /**
     * Cria meta de reserva de emergência automaticamente
     */
    async createEmergencyGoal(userId: string): Promise<string> {
        const status = await this.getStatus(userId)

        if (status.hasGoal) {
            return status.goalId!
        }

        const goalsRef = ref(db, `users/${userId}/goals`)
        const newGoalRef = push(goalsRef)

        const goal: Omit<Goal, 'id'> = {
            userId,
            name: 'Reserva de Emergência',
            description: '6 meses de despesas para imprevistos',
            category: 'emergency',
            targetAmount: status.targetAmount,
            currentAmount: 0,
            deadline: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 ano
            status: 'active',
            icon: '🛡️',
            contributions: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        await set(newGoalRef, goal)

        return newGoalRef.key!
    }
}

export const emergencyFundService = new EmergencyFundService()
export type { EmergencyFundStatus }
