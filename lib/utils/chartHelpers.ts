import { Transaction, Account } from '@/types'

export interface MonthlyData {
    month: string
    receitas: number
    despesas: number
}

export interface ProjectionData {
    period: string
    receitas: number
    despesas: number
    saldo: number
}

export interface CategoryData {
    name: string
    value: number
    color: string
    percentage: number
}

export interface AccountData {
    name: string
    saldo: number
    icon: string
}

// Calcular projeção de receitas e despesas
export function calculateProjection(
    transactions: Transaction[],
    currentMonth: Date,
    nextMonth: Date
): { current: ProjectionData; next: ProjectionData } {
    const currentMonthStr = currentMonth.toISOString().substring(0, 7) // YYYY-MM
    const nextMonthStr = nextMonth.toISOString().substring(0, 7)

    const current = {
        period: 'Mês Atual',
        receitas: 0,
        despesas: 0,
        saldo: 0
    }

    const next = {
        period: 'Próximo Mês',
        receitas: 0,
        despesas: 0,
        saldo: 0
    }

    // Rastrear quais transações recorrentes já têm entrada no próximo mês
    const recurringInNextMonth = new Set<string>()

    transactions.forEach(tx => {
        const txDate = new Date(tx.date)
        const txMonthStr = txDate.toISOString().substring(0, 7)

        if (txMonthStr === currentMonthStr && tx.isPaid) {
            if (tx.type === 'income') {
                current.receitas += tx.amount
            } else if (tx.type === 'expense') {
                current.despesas += tx.amount
            }
        }

        // Identificar transações recorrentes que JÁ estão agendadas no próximo mês
        if (txMonthStr === nextMonthStr && tx.isRecurring) {
            // Usar description+amount como chave para identificar duplicatas
            const key = `${tx.description}_${tx.amount}`
            recurringInNextMonth.add(key)
        }

        // Contar transações já agendadas para o próximo mês
        if (txMonthStr === nextMonthStr) {
            console.log('[Projeção] Transação próximo mês:', {
                desc: tx.description,
                type: tx.type,
                expenseType: tx.expenseType,
                amount: tx.amount,
                date: txDate.toISOString(),
                isPaid: tx.isPaid
            })

            if (tx.type === 'income') {
                next.receitas += tx.amount
            } else if (tx.type === 'expense') {
                next.despesas += tx.amount
            }
        }
    })

    // Segunda passagem: adicionar recorrentes que NÃO estão no próximo mês
    transactions.forEach(tx => {
        const txDate = new Date(tx.date)
        const txMonthStr = txDate.toISOString().substring(0, 7)

        // Apenas adicionar recorrentes que não estão no próximo mês
        if ((tx.isRecurring || (tx.expenseType === 'fixed' && tx.type === 'expense')) && txMonthStr !== nextMonthStr) {
            const key = `${tx.description}_${tx.amount}`

            // Só adicionar se NÃO tiver entrada no próximo mês
            if (!recurringInNextMonth.has(key)) {
                console.log('[Projeção] Adicionando recorrente não agendada:', {
                    desc: tx.description,
                    type: tx.type,
                    amount: tx.amount
                })

                if (tx.type === 'income') {
                    next.receitas += tx.amount
                } else if (tx.type === 'expense') {
                    next.despesas += tx.amount
                }
            }
        }
    })

    console.log('[Projeção] Resultado:', { current, next })

    current.saldo = current.receitas - current.despesas
    next.saldo = next.receitas - next.despesas

    return { current, next }
}

// Agrupar despesas por categoria
export function groupByCategory(
    transactions: Transaction[],
    categories: { id: string; name: string; icon: string; color?: string }[]
): CategoryData[] {
    const categoryMap = new Map<string, number>()
    let total = 0

    transactions
        .filter(tx => tx.type === 'expense' && tx.isPaid)
        .forEach(tx => {
            const current = categoryMap.get(tx.categoryId) || 0
            categoryMap.set(tx.categoryId, current + tx.amount)
            total += tx.amount
        })

    const data: CategoryData[] = []
    categoryMap.forEach((value, categoryId) => {
        const category = categories.find(c => c.id === categoryId)
        if (category) {
            data.push({
                name: category.name, // Apenas o nome, sem ícone
                value,
                color: category.color || '#94a3b8',
                percentage: (value / total) * 100
            })
        }
    })

    return data.sort((a, b) => b.value - a.value)
}

// Obter dados mensais dos últimos N meses
export function getMonthlyData(
    transactions: Transaction[],
    monthsCount: number = 6
): MonthlyData[] {
    const data: MonthlyData[] = []
    const now = new Date()

    for (let i = monthsCount - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = date.toISOString().substring(0, 7)
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })

        const monthData = {
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            receitas: 0,
            despesas: 0
        }

        transactions
            .filter(tx => {
                const txDate = new Date(tx.date)
                const txMonthStr = txDate.toISOString().substring(0, 7)
                return txMonthStr === monthStr && tx.isPaid
            })
            .forEach(tx => {
                if (tx.type === 'income') {
                    monthData.receitas += tx.amount
                } else if (tx.type === 'expense') {
                    monthData.despesas += tx.amount
                }
            })

        data.push(monthData)
    }

    return data
}

// Obter dados de saldo por conta
export function getAccountsData(accounts: Account[]): AccountData[] {
    return accounts
        .filter(acc => acc.isActive)
        .map(acc => ({
            name: acc.name,
            saldo: acc.currentBalance,
            icon: acc.icon
        }))
        .sort((a, b) => b.saldo - a.saldo)
}

// Formatar valores monetários
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

// Formatar valores curtos para gráficos
export function formatShortCurrency(value: number): string {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)}K`
    }
    return `R$ ${value.toFixed(0)}`
}

// Obter evolução de saldo mensal
export function getMonthlyBalanceData(
    transactions: Transaction[],
    monthsCount: number = 6
): Array<{ month: string; saldo: number }> {
    const data: Array<{ month: string; saldo: number }> = []
    const now = new Date()

    let cumulativeBalance = 0

    for (let i = monthsCount - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = date.toISOString().substring(0, 7)
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })

        let monthIncome = 0
        let monthExpense = 0

        transactions
            .filter(tx => {
                const txDate = new Date(tx.date)
                const txMonthStr = txDate.toISOString().substring(0, 7)
                return txMonthStr === monthStr && tx.isPaid
            })
            .forEach(tx => {
                if (tx.type === 'income') {
                    monthIncome += tx.amount
                } else if (tx.type === 'expense') {
                    monthExpense += tx.amount
                }
            })

        cumulativeBalance += (monthIncome - monthExpense)

        data.push({
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            saldo: cumulativeBalance
        })
    }

    return data
}
