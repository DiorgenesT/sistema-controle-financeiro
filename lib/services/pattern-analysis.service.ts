import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction } from '@/types'

interface PatternAnalysis {
    averageMonthlyExpenses: number
    unexpectedExpensesRate: number
    volatility: number
    trend: 'increasing' | 'decreasing' | 'stable'
    bufferPercentage: number
}

class PatternAnalysisService {
    /**
     * Analisa padrões de gastos dos últimos 3 meses
     */
    async analyzePatterns(userId: string): Promise<PatternAnalysis> {
        const today = new Date()
        const threeMonthsAgo = new Date(today)
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

        // Buscar transações
        const transactionsRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(transactionsRef)

        const monthlyExpenses: { [monthKey: string]: number } = {}
        const dailyExpenses: number[] = []

        if (snapshot.exists()) {
            const transactions: Transaction[] = Object.values(snapshot.val())

            transactions.forEach(transaction => {
                const txDate = new Date(transaction.date)

                // Apenas últimos 3 meses
                if (txDate >= threeMonthsAgo && transaction.type === 'expense') {
                    const monthKey = `${txDate.getFullYear()}-${txDate.getMonth()}`

                    // Apenas despesas variáveis (não fixas)
                    if (transaction.expenseType !== 'fixed') {
                        if (!monthlyExpenses[monthKey]) {
                            monthlyExpenses[monthKey] = 0
                        }
                        monthlyExpenses[monthKey] += transaction.amount
                        dailyExpenses.push(transaction.amount)
                    }
                }
            })
        }

        // Calcular média mensal
        const monthlyValues = Object.values(monthlyExpenses)
        const averageMonthlyExpenses = monthlyValues.length > 0
            ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
            : 0

        // Calcular volatilidade (desvio padrão)
        const volatility = this.calculateStdDev(monthlyValues, averageMonthlyExpenses)

        // Calcular taxa de gastos inesperados
        // Gastos > 2x a média diária são considerados inesperados
        const avgDaily = dailyExpenses.length > 0
            ? dailyExpenses.reduce((a, b) => a + b, 0) / dailyExpenses.length
            : 0

        const unexpectedCount = dailyExpenses.filter(exp => exp > avgDaily * 2).length
        const unexpectedExpensesRate = dailyExpenses.length > 0
            ? unexpectedCount / dailyExpenses.length
            : 0

        // Calcular tendência
        const trend = this.calculateTrend(monthlyValues)

        // Calcular buffer recomendado
        const bufferPercentage = this.calculateRecommendedBuffer(
            unexpectedExpensesRate,
            volatility,
            monthlyValues.length
        )

        return {
            averageMonthlyExpenses,
            unexpectedExpensesRate,
            volatility,
            trend,
            bufferPercentage
        }
    }

    private calculateStdDev(values: number[], mean: number): number {
        if (values.length === 0) return 0

        const squareDiffs = values.map(value => Math.pow(value - mean, 2))
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length
        return Math.sqrt(avgSquareDiff)
    }

    private calculateTrend(monthlyValues: number[]): 'increasing' | 'decreasing' | 'stable' {
        if (monthlyValues.length < 2) return 'stable'

        const first = monthlyValues[0]
        const last = monthlyValues[monthlyValues.length - 1]
        const change = ((last - first) / first) * 100

        if (change > 10) return 'increasing'
        if (change < -10) return 'decreasing'
        return 'stable'
    }

    private calculateRecommendedBuffer(
        unexpectedRate: number,
        volatility: number,
        dataPoints: number
    ): number {
        // Buffer base
        let buffer = 10

        // Aumentar se há muitos imprevistos
        if (unexpectedRate > 0.3) buffer += 5
        if (unexpectedRate > 0.5) buffer += 5

        // Aumentar se há alta volatilidade
        if (volatility > 500) buffer += 3
        if (volatility > 1000) buffer += 2

        // Reduzir se há poucos dados (ser conservador)
        if (dataPoints < 3) buffer += 5

        // Limites
        return Math.min(20, Math.max(10, buffer))
    }
}

export const patternAnalysisService = new PatternAnalysisService()
export type { PatternAnalysis }
