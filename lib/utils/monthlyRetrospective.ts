import { Transaction } from '@/types'

export interface MonthlyRetrospectiveData {
    monthName: string
    totalIncome: number
    totalExpense: number
    balance: number
    balancePercent: number
    topCategories: Array<{
        name: string
        icon: string
        amount: number
        percent: number
    }>
    highlights: {
        biggestIncome: { description: string; amount: number } | null
        biggestExpense: { description: string; amount: number } | null
        daysWithoutExpenses: number
    }
    comparison: {
        incomeChange: number
        expenseChange: number
        balanceChange: number
    }
}

export function getLastMonthData(transactions: Transaction[]): Transaction[] {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStr = lastMonth.toISOString().substring(0, 7)

    return transactions.filter(tx => {
        const txDate = new Date(tx.date)
        const txMonthStr = txDate.toISOString().substring(0, 7)
        return txMonthStr === lastMonthStr && tx.isPaid
    })
}

export function getTwoMonthsAgoData(transactions: Transaction[]): Transaction[] {
    const now = new Date()
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const twoMonthsAgoStr = twoMonthsAgo.toISOString().substring(0, 7)

    return transactions.filter(tx => {
        const txDate = new Date(tx.date)
        const txMonthStr = txDate.toISOString().substring(0, 7)
        return txMonthStr === twoMonthsAgoStr && tx.isPaid
    })
}

export function calculateMonthlyRetrospective(
    transactions: Transaction[],
    categories: Array<{ id: string; name: string; icon: string }>
): MonthlyRetrospectiveData {
    const lastMonthTxs = getLastMonthData(transactions)
    const twoMonthsAgoTxs = getTwoMonthsAgoData(transactions)

    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthName = lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    // Calcular totais
    let totalIncome = 0
    let totalExpense = 0

    lastMonthTxs.forEach(tx => {
        if (tx.type === 'income') {
            totalIncome += tx.amount
        } else if (tx.type === 'expense') {
            totalExpense += tx.amount
        }
    })

    const balance = totalIncome - totalExpense
    const balancePercent = totalIncome > 0 ? (balance / totalIncome) * 100 : 0

    // Top 3 categorias
    const categoryMap = new Map<string, number>()
    lastMonthTxs
        .filter(tx => tx.type === 'expense')
        .forEach(tx => {
            const current = categoryMap.get(tx.categoryId) || 0
            categoryMap.set(tx.categoryId, current + tx.amount)
        })

    const topCategories = Array.from(categoryMap.entries())
        .map(([catId, amount]) => {
            const category = categories.find(c => c.id === catId)
            return {
                name: category?.name || 'Outros',
                icon: category?.icon || '📦',
                amount,
                percent: (amount / totalExpense) * 100
            }
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)

    // Destaques
    const incomes = lastMonthTxs.filter(tx => tx.type === 'income')
    const expenses = lastMonthTxs.filter(tx => tx.type === 'expense')

    const biggestIncome = incomes.length > 0
        ? incomes.reduce((max, tx) => tx.amount > max.amount ? tx : max)
        : null

    const biggestExpense = expenses.length > 0
        ? expenses.reduce((max, tx) => tx.amount > max.amount ? tx : max)
        : null

    // Dias sem gastos
    const daysSet = new Set<string>()
    expenses.forEach(tx => {
        const date = new Date(tx.date)
        daysSet.add(date.toISOString().substring(0, 10))
    })
    const daysInMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate()
    const daysWithoutExpenses = daysInMonth - daysSet.size

    // Comparação com 2 meses atrás
    let twoMonthsIncome = 0
    let twoMonthsExpense = 0

    twoMonthsAgoTxs.forEach(tx => {
        if (tx.type === 'income') {
            twoMonthsIncome += tx.amount
        } else if (tx.type === 'expense') {
            twoMonthsExpense += tx.amount
        }
    })

    const incomeChange = twoMonthsIncome > 0
        ? ((totalIncome - twoMonthsIncome) / twoMonthsIncome) * 100
        : 0

    const expenseChange = twoMonthsExpense > 0
        ? ((totalExpense - twoMonthsExpense) / twoMonthsExpense) * 100
        : 0

    const twoMonthsBalance = twoMonthsIncome - twoMonthsExpense
    const balanceChange = twoMonthsBalance !== 0
        ? ((balance - twoMonthsBalance) / Math.abs(twoMonthsBalance)) * 100
        : 0

    return {
        monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        totalIncome,
        totalExpense,
        balance,
        balancePercent,
        topCategories,
        highlights: {
            biggestIncome: biggestIncome ? {
                description: biggestIncome.description,
                amount: biggestIncome.amount
            } : null,
            biggestExpense: biggestExpense ? {
                description: biggestExpense.description,
                amount: biggestExpense.amount
            } : null,
            daysWithoutExpenses
        },
        comparison: {
            incomeChange,
            expenseChange,
            balanceChange
        }
    }
}

// Gastos por cartão
export function getExpensesByCard(transactions: Transaction[]): Array<{ cardName: string; amount: number; count: number }> {
    const lastMonthTxs = getLastMonthData(transactions)
    const cardMap = new Map<string, { amount: number; count: number }>()

    lastMonthTxs
        .filter(tx => tx.type === 'expense' && tx.cardId)
        .forEach(tx => {
            const cardId = tx.cardId || 'Sem cartão'
            const current = cardMap.get(cardId) || { amount: 0, count: 0 }
            cardMap.set(cardId, {
                amount: current.amount + tx.amount,
                count: current.count + 1
            })
        })

    return Array.from(cardMap.entries())
        .map(([cardName, data]) => ({
            cardName,
            amount: data.amount,
            count: data.count
        }))
        .sort((a, b) => b.amount - a.amount)
}

// Gastos por membro da família
export function getExpensesByMember(
    transactions: Transaction[],
    members: Array<{ id: string; name: string }>
): Array<{ memberName: string; amount: number; count: number }> {
    const lastMonthTxs = getLastMonthData(transactions)
    const memberMap = new Map<string, { amount: number; count: number }>()

    lastMonthTxs
        .filter(tx => tx.type === 'expense')
        .forEach(tx => {
            const memberId = tx.memberId || 'Não informado'
            const member = members.find(m => m.id === memberId)
            const memberName = member?.name || 'Não informado'
            
            const current = memberMap.get(memberName) || { amount: 0, count: 0 }
            memberMap.set(memberName, {
                amount: current.amount + tx.amount,
                count: current.count + 1
            })
        })

    return Array.from(memberMap.entries())
        .map(([memberName, data]) => ({
            memberName,
            amount: data.amount,
            count: data.count
        }))
        .sort((a, b) => b.amount - a.amount)
}

// Padrões de gastos (dias da semana, horários)
export function getSpendingPatterns(transactions: Transaction[]): {
    byWeekday: Array<{ day: string; amount: number; count: number }>
    byWeek: Array<{ week: string; amount: number }>
    averagePerDay: number
} {
    const lastMonthTxs = getLastMonthData(transactions).filter(tx => tx.type === 'expense')
    
    // Por dia da semana
    const weekdayMap = new Map<number, { amount: number; count: number }>()
    const weekMap = new Map<number, number>()
    
    lastMonthTxs.forEach(tx => {
        const date = new Date(tx.date)
        const weekday = date.getDay()
        const week = Math.floor(date.getDate() / 7)
        
        // Weekday
        const current = weekdayMap.get(weekday) || { amount: 0, count: 0 }
        weekdayMap.set(weekday, {
            amount: current.amount + tx.amount,
            count: current.count + 1
        })
        
        // Week
        const weekAmount = weekMap.get(week) || 0
        weekMap.set(week, weekAmount + tx.amount)
    })
    
    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const byWeekday = Array.from(weekdayMap.entries())
        .map(([day, data]) => ({
            day: weekdayNames[day],
            amount: data.amount,
            count: data.count
        }))
        .sort((a, b) => weekdayNames.indexOf(a.day) - weekdayNames.indexOf(b.day))
    
    const byWeek = Array.from(weekMap.entries())
        .map(([week, amount]) => ({
            week: `Semana ${week + 1}`,
            amount
        }))
        .sort((a, b) => a.week.localeCompare(b.week))
    
    const totalAmount = lastMonthTxs.reduce((sum, tx) => sum + tx.amount, 0)
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate()
    const averagePerDay = totalAmount / daysInMonth
    
    return { byWeekday, byWeek, averagePerDay }
}
