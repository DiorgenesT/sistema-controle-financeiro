import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction } from '@/types'
import { patternAnalysisService } from './pattern-analysis.service'

interface DailyBudgetData {
    canSpendToday: number
    safeToSpendToday: number      // Com buffer aplicado
    spentToday: number
    remainingToday: number
    safeBudgetRemaining: number    // Com buffer aplicado
    monthlyBudget: number
    averageDailyBudget: number
    daysInMonth: number
    daysRemaining: number
    accumulatedBalance: number
    bufferPercentage: number       // Buffer inteligente
    projectedEndOfMonth: number
}

class DailyBudgetService {
    async getDailyBudget(userId: string): Promise<DailyBudgetData> {
        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth()
        const dayOfMonth = today.getDate()

        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const daysRemaining = daysInMonth - dayOfMonth + 1

        // Buscar análise de padrões para buffer inteligente
        const patterns = await patternAnalysisService.analyzePatterns(userId)
        const bufferPercentage = patterns.bufferPercentage

        const transactionsRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(transactionsRef)

        let monthlyIncome = 0
        let monthlyFixedExpenses = 0
        let spentToday = 0
        const dailyExpenses: { [day: number]: number } = {}

        if (snapshot.exists()) {
            const transactions: Transaction[] = Object.values(snapshot.val())

            transactions.forEach(transaction => {
                const txDate = new Date(transaction.date)
                const txYear = txDate.getFullYear()
                const txMonth = txDate.getMonth()
                const txDay = txDate.getDate()

                if (txYear === year && txMonth === month) {
                    if (transaction.type === 'income') {
                        // Receitas fixas só contam se recebidas (isPaid = true)
                        if (!transaction.isRecurring || transaction.isPaid) {
                            monthlyIncome += transaction.amount
                        }
                    } else if (transaction.type === 'expense') {
                        if (transaction.expenseType === 'fixed') {
                            // Despesas fixas só contam se pagas (isPaid = true)
                            if (transaction.isPaid) {
                                monthlyFixedExpenses += transaction.amount
                            }
                        } else {
                            if (!dailyExpenses[txDay]) {
                                dailyExpenses[txDay] = 0
                            }
                            dailyExpenses[txDay] += transaction.amount

                            if (txDay === dayOfMonth) {
                                spentToday += transaction.amount
                            }
                        }
                    }
                }
            })
        }

        const monthlyBudget = monthlyIncome - monthlyFixedExpenses
        const averageDailyBudget = monthlyBudget / daysInMonth

        // Calcular saldo acumulado
        let accumulatedBalance = 0
        for (let day = 1; day < dayOfMonth; day++) {
            const shouldHaveSpent = averageDailyBudget
            const actuallySpent = dailyExpenses[day] || 0
            accumulatedBalance += shouldHaveSpent - actuallySpent
        }

        // Orçamento total de hoje (com acumulado)
        const canSpendToday = Math.max(0, averageDailyBudget + accumulatedBalance)

        // Aplicar buffer de segurança
        const safeToSpendToday = canSpendToday * (1 - bufferPercentage / 100)

        // Saldos restantes
        const remainingToday = canSpendToday - spentToday
        const safeBudgetRemaining = Math.max(0, safeToSpendToday - spentToday)

        const projectedEndOfMonth = safeBudgetRemaining * daysRemaining

        return {
            canSpendToday: Math.max(0, canSpendToday),
            safeToSpendToday: Math.max(0, safeToSpendToday),
            spentToday,
            remainingToday,
            safeBudgetRemaining,
            monthlyBudget,
            averageDailyBudget,
            daysInMonth,
            daysRemaining,
            accumulatedBalance,
            bufferPercentage,
            projectedEndOfMonth
        }
    }

    calculateBudgetHealth(data: DailyBudgetData): number {
        if (data.safeToSpendToday <= 0) return 0

        const percentRemaining = (data.safeBudgetRemaining / data.safeToSpendToday) * 100
        return Math.min(100, Math.max(0, percentRemaining))
    }

    getBudgetStatus(data: DailyBudgetData): {
        message: string
        type: 'success' | 'warning' | 'danger'
    } {
        const health = this.calculateBudgetHealth(data)

        if (health >= 80) {
            return {
                message: 'Você está no controle! 💪',
                type: 'success'
            }
        } else if (health >= 50) {
            return {
                message: 'Cuidado com os gastos 👀',
                type: 'warning'
            }
        } else if (health > 0) {
            return {
                message: 'Atenção! Orçamento apertado 🚨',
                type: 'danger'
            }
        } else {
            return {
                message: 'Orçamento excedido hoje ⚠️',
                type: 'danger'
            }
        }
    }
}

export const dailyBudgetService = new DailyBudgetService()
export type { DailyBudgetData }
