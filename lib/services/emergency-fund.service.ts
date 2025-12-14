import { ref, get, set, push } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Goal, Transaction } from '@/types'

export interface EmergencyFundStatus {
    hasGoal: boolean
    currentAmount: number
    targetAmount: number
    progress: number // percentual 0-100
    monthsCovered: number // quantos meses de despesas cobre
    status: 'none' | 'building' | 'adequate' | 'excellent'
    goalInfo?: Goal // Informações completas da meta
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

            let status: 'none' | 'building' | 'adequate' | 'excellent' = 'building'
            if (monthsCovered >= 6) status = 'excellent'
            else if (monthsCovered >= 3) status = 'adequate'
            else if (monthsCovered > 0) status = 'building'
            else status = 'none'

            return {
                hasGoal: true,
                currentAmount: goal.currentAmount,
                targetAmount: goal.targetAmount,
                monthsCovered,
                progress,
                status,
                goalInfo: goal  // Incluir meta completa
            }
        }

        // Sem meta ainda
        return {
            hasGoal: false,
            currentAmount: 0,
            targetAmount,
            monthsCovered: 0,
            progress: 0,
            status: 'none'
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
     * Contribuir para a reserva
     */
    async contribute(userId: string, amount: number, note?: string): Promise<void> {
        const status = await this.getStatus(userId)

        if (!status.hasGoal || !status.goalInfo) {
            throw new Error('Meta de emergência não encontrada')
        }

        const goalRef = ref(db, `users/${userId}/goals/${status.goalInfo.id}`)
        const currentGoal = status.goalInfo

        const newContribution = {
            id: push(ref(db)).key!,
            amount,
            date: Date.now(),
            note
        }

        const updatedContributions = [...currentGoal.contributions, newContribution]
        const newCurrentAmount = currentGoal.currentAmount + amount

        await set(goalRef, {
            ...currentGoal,
            currentAmount: newCurrentAmount,
            contributions: updatedContributions,
            updatedAt: Date.now()
        })
    }

    /**
     * Cria meta de reserva de emergência automaticamente
     */
    async createEmergencyGoal(userId: string): Promise<string> {
        const status = await this.getStatus(userId)

        if (status.hasGoal) {
            return status.goalInfo!.id
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
