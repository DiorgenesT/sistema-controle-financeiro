import { db } from '@/lib/firebase/config'
import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database'
import { Goal, Contribution, GoalStatus } from '@/types'

export class GoalService {
    private basePath = 'goals'

    /**
     * Criar nova meta
     */
    async create(userId: string, goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'contributions' | 'status'>): Promise<Goal> {
        const goalsRef = ref(db, this.basePath)
        const newGoalRef = push(goalsRef)

        const now = Date.now()
        const goal: Goal = {
            ...goalData,
            id: newGoalRef.key!,
            userId,
            currentAmount: 0,
            contributions: [],
            status: 'active',
            createdAt: now,
            updatedAt: now
        }

        await set(newGoalRef, goal)
        return goal
    }

    /**
     * Buscar todas as metas de um usuário
     */
    async getByUserId(userId: string): Promise<Goal[]> {
        const goalsRef = ref(db, this.basePath)
        const goalsQuery = query(goalsRef, orderByChild('userId'), equalTo(userId))

        const snapshot = await get(goalsQuery)
        if (!snapshot.exists()) return []

        const goals: Goal[] = []
        snapshot.forEach((child) => {
            goals.push(child.val())
        })

        // Ordenar por data de criação (mais recente primeiro)
        return goals.sort((a, b) => b.createdAt - a.createdAt)
    }

    /**
     * Buscar metas ativas
     */
    async getActiveGoals(userId: string): Promise<Goal[]> {
        const allGoals = await this.getByUserId(userId)
        return allGoals.filter(goal => goal.status === 'active')
    }

    /**
     * Buscar meta por ID
     */
    async getById(goalId: string): Promise<Goal | null> {
        const goalRef = ref(db, `${this.basePath}/${goalId}`)
        const snapshot = await get(goalRef)

        if (!snapshot.exists()) return null
        return snapshot.val()
    }

    /**
     * Atualizar meta
     */
    async update(goalId: string, updates: Partial<Goal>): Promise<void> {
        const goalRef = ref(db, `${this.basePath}/${goalId}`)

        await update(goalRef, {
            ...updates,
            updatedAt: Date.now()
        })
    }

    /**
     * Adicionar aporte a uma meta
     */
    async addContribution(goalId: string, amount: number, note?: string): Promise<void> {
        const goal = await this.getById(goalId)
        if (!goal) throw new Error('Meta não encontrada')

        const contribution: Contribution = {
            id: `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            date: Date.now(),
            note
        }

        const newCurrentAmount = goal.currentAmount + amount
        const contributions = [...goal.contributions, contribution]

        // Verificar se atingiu a meta
        const newStatus: GoalStatus = newCurrentAmount >= goal.targetAmount ? 'completed' : goal.status
        const updates: Partial<Goal> = {
            currentAmount: newCurrentAmount,
            contributions,
            status: newStatus,
            updatedAt: Date.now()
        }

        // Se completou a meta, adicionar data de conclusão
        if (newStatus === 'completed' && !goal.completedAt) {
            updates.completedAt = Date.now()
        }

        await this.update(goalId, updates)
    }

    /**
     * Adicionar aporte transferindo de uma conta
     */
    async addContributionFromAccount(goalId: string, accountId: string, userId: string, amount: number, note?: string): Promise<void> {
        // Importar accountService dinamicamente para evitar dependência circular
        const { accountService } = await import('./account.service')

        // Validar saldo da conta
        await accountService.transferToGoal(userId, accountId, amount)

        // Adicionar aporte na meta
        const noteWithAccount = note ? `${note} (Conta)` : 'Transferência de conta'
        await this.addContribution(goalId, amount, noteWithAccount)
    }

    /**
     * Remover aporte
     */
    async removeContribution(goalId: string, contributionId: string): Promise<void> {
        const goal = await this.getById(goalId)
        if (!goal) throw new Error('Meta não encontrada')

        const contributionToRemove = goal.contributions.find(c => c.id === contributionId)
        if (!contributionToRemove) throw new Error('Aporte não encontrada')

        const newContributions = goal.contributions.filter(c => c.id !== contributionId)
        const newCurrentAmount = goal.currentAmount - contributionToRemove.amount

        const updates: Partial<Goal> = {
            currentAmount: Math.max(0, newCurrentAmount),
            contributions: newContributions,
            status: newCurrentAmount >= goal.targetAmount ? 'completed' : 'active',
            updatedAt: Date.now()
        }

        // Se não está mais completa, remover data de conclusão
        if (newCurrentAmount < goal.targetAmount) {
            updates.completedAt = undefined
        }

        await this.update(goalId, updates)
    }

    /**
     * Excluir meta
     */
    async delete(goalId: string): Promise<void> {
        const goalRef = ref(db, `${this.basePath}/${goalId}`)
        await remove(goalRef)
    }

    /**
     * Calcular progresso da meta (%)
     */
    calculateProgress(goal: Goal): number {
        if (goal.targetAmount === 0) return 0
        return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    }

    /**
     * Calcular valor faltante
     */
    calculateRemaining(goal: Goal): number {
        return Math.max(0, goal.targetAmount - goal.currentAmount)
    }

    /**
     * Calcular dias restantes até o deadline
     */
    calculateDaysRemaining(goal: Goal): number {
        const now = Date.now()
        const deadline = goal.deadline
        const diff = deadline - now
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    /**
     * Calcular aporte mensal necessário para atingir a meta
     */
    calculateMonthlyContribution(goal: Goal): number {
        const remaining = this.calculateRemaining(goal)
        const daysRemaining = this.calculateDaysRemaining(goal)

        if (daysRemaining <= 0) return remaining

        const monthsRemaining = Math.max(1, daysRemaining / 30)
        return remaining / monthsRemaining
    }

    /**
     * Estimar data de conclusão baseada na média de aportes
     */
    estimateCompletionDate(goal: Goal): number | null {
        if (goal.contributions.length === 0) return null
        if (goal.currentAmount >= goal.targetAmount) return goal.completedAt || Date.now()

        // Calcular média de aportes por mês
        const firstContribution = goal.contributions[0]
        const lastContribution = goal.contributions[goal.contributions.length - 1]
        const timeSpan = lastContribution.date - firstContribution.date
        const monthsSpan = Math.max(1, timeSpan / (1000 * 60 * 60 * 24 * 30))

        const totalContributed = goal.currentAmount
        const avgMonthlyContribution = totalContributed / monthsSpan

        if (avgMonthlyContribution === 0) return null

        const remaining = this.calculateRemaining(goal)
        const monthsToComplete = remaining / avgMonthlyContribution

        return Date.now() + (monthsToComplete * 30 * 24 * 60 * 60 * 1000)
    }

    /**
     * Marcar meta como cancelada
     */
    async cancel(goalId: string): Promise<void> {
        await this.update(goalId, { status: 'cancelled' })
    }

    /**
     * Reativar meta cancelada
     */
    async reactivate(goalId: string): Promise<void> {
        const goal = await this.getById(goalId)
        if (!goal) throw new Error('Meta não encontrada')

        const newStatus: GoalStatus = goal.currentAmount >= goal.targetAmount ? 'completed' : 'active'

        await this.update(goalId, {
            status: newStatus,
            completedAt: newStatus === 'completed' ? goal.completedAt || Date.now() : undefined
        })
    }
}

export const goalService = new GoalService()
