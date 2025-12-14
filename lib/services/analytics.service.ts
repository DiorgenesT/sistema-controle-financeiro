import { ref, get, query, orderByChild, startAt, endAt } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction } from '@/types'

export interface NextMonthExpense {
    fixed: Transaction[]
    installments: Transaction[]
    totalFixed: number
    totalInstallments: number
    total: number
}

export interface CashFlowProjection {
    month: string
    income: number
    expenses: number
    balance: number
    projectedBalance: number
}

export interface FinancialInsight {
    type: 'warning' | 'success' | 'info' | 'tip'
    title: string
    description: string
    icon: string
}

export const analyticsService = {
    // Buscar despesas do próximo mês
    async getNextMonthExpenses(userId: string): Promise<NextMonthExpense> {
        const today = new Date()
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0, 23, 59, 59)

        const startTimestamp = nextMonth.getTime()
        const endTimestamp = endOfNextMonth.getTime()

        // Buscar todas as transações
        const dbRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(dbRef)

        if (!snapshot.exists()) {
            return {
                fixed: [],
                installments: [],
                totalFixed: 0,
                totalInstallments: 0,
                total: 0
            }
        }

        // Buscar cartões ativos para validar
        const cardsRef = ref(db, `users/${userId}/creditCards`)
        const cardsSnapshot = await get(cardsRef)
        const activeCardIds = new Set<string>()

        if (cardsSnapshot.exists()) {
            const cards = cardsSnapshot.val()
            Object.entries(cards).forEach(([id, card]: [string, any]) => {
                if (card.isActive !== false) { // Incluir se não tem flag ou se está ativo
                    activeCardIds.add(id)
                }
            })
        }

        const data = snapshot.val()
        const transactions: Transaction[] = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }))

        // Filtrar despesas fixas recorrentes não pagas
        const fixedExpenses = transactions.filter(t =>
            t.type === 'expense' &&
            t.expenseType === 'fixed' &&
            t.isRecurring &&
            !t.isPaid &&
            t.categoryId !== 'reserva-emergencia' && // Ignorar transferências para reserva
            (!t.cardId || activeCardIds.has(t.cardId)) && // Ignorar se cartão foi excluído
            t.dueDate &&
            t.dueDate >= startTimestamp &&
            t.dueDate <= endTimestamp
        )

        // Filtrar parcelas futuras
        const installmentExpenses = transactions.filter(t =>
            t.type === 'expense' &&
            t.expenseType === 'installment' &&
            !t.isPaid &&
            t.categoryId !== 'reserva-emergencia' &&
            (!t.cardId || activeCardIds.has(t.cardId)) &&
            t.date >= startTimestamp &&
            t.date <= endTimestamp
        )

        // Filtrar compras à vista no cartão (vão para fatura do mês)
        const cashCardExpenses = transactions.filter(t =>
            t.type === 'expense' &&
            t.expenseType === 'cash' &&
            t.cardId && // Só compras no cartão
            activeCardIds.has(t.cardId) && // Cartão deve existir e estar ativo
            !t.isPaid &&
            t.categoryId !== 'reserva-emergencia' &&
            t.date >= startTimestamp &&
            t.date <= endTimestamp
        )

        // Combinar fixas com cash no cartão (ambas são "despesas fixas do mês")
        const allFixedExpenses = [...fixedExpenses, ...cashCardExpenses]

        const totalFixed = allFixedExpenses.reduce((sum, t) => sum + t.amount, 0)
        const totalInstallments = installmentExpenses.reduce((sum, t) => sum + t.amount, 0)

        return {
            fixed: allFixedExpenses,
            installments: installmentExpenses,
            totalFixed,
            totalInstallments,
            total: totalFixed + totalInstallments
        }
    },

    // Calcular projeção de fluxo de caixa para os próximos N meses
    async calculateCashFlowProjection(userId: string, currentBalance: number, monthsAhead: number = 6): Promise<CashFlowProjection[]> {
        const today = new Date()
        const projections: CashFlowProjection[] = []

        // Buscar todas as transações
        const dbRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(dbRef)

        const transactions: Transaction[] = snapshot.exists()
            ? Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }))
            : []

        let runningBalance = currentBalance

        for (let i = 1; i <= monthsAhead; i++) {
            const projectionDate = new Date(today.getFullYear(), today.getMonth() + i, 1)
            const monthStart = projectionDate.getTime()
            const monthEnd = new Date(projectionDate.getFullYear(), projectionDate.getMonth() + 1, 0, 23, 59, 59).getTime()

            // Despesas fixas recorrentes
            const fixedExpenses = transactions.filter(t =>
                t.type === 'expense' &&
                t.expenseType === 'fixed' &&
                t.isRecurring &&
                t.dueDate &&
                t.dueDate <= monthEnd
            ).reduce((sum, t) => sum + t.amount, 0)

            // Parcelas futuras
            const installmentExpenses = transactions.filter(t =>
                t.type === 'expense' &&
                t.expenseType === 'installment' &&
                t.date >= monthStart &&
                t.date <= monthEnd
            ).reduce((sum, t) => sum + t.amount, 0)

            // Calcular média de receitas dos últimos 3 meses como estimativa
            const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1).getTime()
            const avgIncome = transactions
                .filter(t => t.type === 'income' && t.date >= threeMonthsAgo && t.date < today.getTime())
                .reduce((sum, t) => sum + t.amount, 0) / 3

            const totalExpenses = fixedExpenses + installmentExpenses
            runningBalance = runningBalance + avgIncome - totalExpenses

            projections.push({
                month: projectionDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                income: avgIncome,
                expenses: totalExpenses,
                balance: avgIncome - totalExpenses,
                projectedBalance: runningBalance
            })
        }

        return projections
    },

    // Gerar insights financeiros inteligentes
    async getFinancialInsights(userId: string): Promise<FinancialInsight[]> {
        const insights: FinancialInsight[] = []
        const today = new Date()

        // Buscar transações dos últimos 2 meses
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime()
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime()
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59).getTime()

        const dbRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(dbRef)

        if (!snapshot.exists()) return insights

        const data = snapshot.val()
        const transactions: Transaction[] = Object.keys(data).map(key => ({ id: key, ...data[key] }))

        // Gastos do mês atual (somente transações pagas)
        const currentMonthExpenses = transactions
            .filter(t => t.type === 'expense' && t.date >= currentMonthStart && t.isPaid)
            .reduce((sum, t) => sum + t.amount, 0)

        // Gastos do mês passado (somente transações pagas)
        const lastMonthExpenses = transactions
            .filter(t => t.type === 'expense' && t.date >= lastMonthStart && t.date <= lastMonthEnd && t.isPaid)
            .reduce((sum, t) => sum + t.amount, 0)

        // Insight 1: Comparação com mês anterior
        if (lastMonthExpenses > 0) {
            const diff = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100

            if (diff < -10) {
                insights.push({
                    type: 'success',
                    title: '🎉 Economia detectada!',
                    description: `Você está gastando ${Math.abs(diff).toFixed(0)}% menos que o mês passado`,
                    icon: 'TrendingDown'
                })
            } else if (diff > 20) {
                insights.push({
                    type: 'warning',
                    title: '⚠️ Gastos aumentaram',
                    description: `Seus gastos subiram ${diff.toFixed(0)}% em relação ao mês passado`,
                    icon: 'TrendingUp'
                })
            }
        }

        // Insight 2: Categoria com maior gasto (somente pagas)
        const categoryExpenses = new Map<string, number>()
        transactions
            .filter(t => t.type === 'expense' && t.date >= currentMonthStart && t.isPaid)
            .forEach(t => {
                const current = categoryExpenses.get(t.categoryId) || 0
                categoryExpenses.set(t.categoryId, current + t.amount)
            })

        if (categoryExpenses.size > 0) {
            const topCategory = Array.from(categoryExpenses.entries())
                .sort((a, b) => b[1] - a[1])[0]

            const percentage = (topCategory[1] / currentMonthExpenses) * 100

            if (percentage > 40) {
                insights.push({
                    type: 'info',
                    title: '📊 Categoria dominante',
                    description: `${percentage.toFixed(0)}% dos gastos estão concentrados em uma categoria`,
                    icon: 'PieChart'
                })
            }
        }

        // Insight 3: Despesas fixas não pagas próximas do vencimento
        const upcomingFixed = transactions.filter(t =>
            t.type === 'expense' &&
            t.expenseType === 'fixed' &&
            !t.isPaid &&
            t.dueDate &&
            t.dueDate <= today.getTime() + (7 * 24 * 60 * 60 * 1000) // próximos 7 dias
        )

        if (upcomingFixed.length > 0) {
            insights.push({
                type: 'warning',
                title: '📅 Contas próximas do vencimento',
                description: `Você tem ${upcomingFixed.length} conta(s) fixa(s) vencendo nos próximos 7 dias`,
                icon: 'Bell'
            })
        }

        // Insight 4: Meta de economia (se gastos < 80% do mês anterior)
        if (lastMonthExpenses > 0 && currentMonthExpenses < lastMonthExpenses * 0.8) {
            insights.push({
                type: 'success',
                title: '🎯 Meta alcançada!',
                description: 'Você está no caminho certo para economizar este mês',
                icon: 'Target'
            })
        }

        return insights
    }
}
