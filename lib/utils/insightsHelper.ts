import { Transaction } from '@/types'
import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase/config'

export interface UserDataStatus {
    hasMinimumData: boolean
    firstTransactionDate: Date | null
    daysOfData: number
    availableDate: Date | null
    monthsOfData: number
}

export interface MonthlyAverages {
    avgIncome: number
    avgExpense: number
    avgFixedExpenses: number
    avgByCategory: Record<string, number>
    avgDailyExpense: number
}

/**
 * Verifica se o usuário tem dados suficientes (>= 1 mês) para insights
 */
export async function checkUserDataStatus(userId: string): Promise<UserDataStatus> {
    try {
        const snapshot = await get(ref(db, `users/${userId}/transactions`))
        
        if (!snapshot.exists()) {
            return {
                hasMinimumData: false,
                firstTransactionDate: null,
                daysOfData: 0,
                availableDate: getNextMonthStart(),
                monthsOfData: 0
            }
        }

        const data = snapshot.val()
        const transactions: Transaction[] = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }))

        if (transactions.length === 0) {
            return {
                hasMinimumData: false,
                firstTransactionDate: null,
                daysOfData: 0,
                availableDate: getNextMonthStart(),
                monthsOfData: 0
            }
        }

        // Encontrar primeira transação
        const sortedTransactions = transactions.sort((a, b) => a.date - b.date)
        const firstTransaction = sortedTransactions[0]
        const firstDate = new Date(firstTransaction.date)

        // Calcular dias de dados
        const today = new Date()
        const diffTime = today.getTime() - firstDate.getTime()
        const daysOfData = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        // Calcular meses completos de dados
        const monthsOfData = calculateCompleteMonths(firstDate, today)
        
        console.log('🔍 [insightsHelper] Verificação de dados:', {
            primeiraTransacao: firstDate.toLocaleDateString('pt-BR'),
            hoje: today.toLocaleDateString('pt-BR'),
            diasDeDados: daysOfData,
            mesesCompletos: monthsOfData,
            temDadosMinimos: monthsOfData >= 1
        })

        // Verificar se tem pelo menos 1 mês completo
        const hasMinimumData = monthsOfData >= 1

        // Data de disponibilidade (1º do próximo mês se ainda não tem dados)
        let availableDate: Date | null = null
        if (!hasMinimumData) {
            availableDate = getNextMonthStart()
        }

        return {
            hasMinimumData,
            firstTransactionDate: firstDate,
            daysOfData,
            availableDate,
            monthsOfData
        }
    } catch (error) {
        console.error('Erro ao verificar status de dados:', error)
        return {
            hasMinimumData: false,
            firstTransactionDate: null,
            daysOfData: 0,
            availableDate: getNextMonthStart(),
            monthsOfData: 0
        }
    }
}

/**
 * Calcula médias mensais baseadas em transações
 */
export function calculateMonthlyAverages(transactions: Transaction[]): MonthlyAverages {
    if (transactions.length === 0) {
        return {
            avgIncome: 0,
            avgExpense: 0,
            avgFixedExpenses: 0,
            avgByCategory: {},
            avgDailyExpense: 0
        }
    }

    // Calcular número de meses de dados
    const sortedTransactions = transactions.sort((a, b) => a.date - b.date)
    const firstDate = new Date(sortedTransactions[0].date)
    const lastDate = new Date(sortedTransactions[sortedTransactions.length - 1].date)
    const monthsOfData = Math.max(1, calculateCompleteMonths(firstDate, lastDate))

    // Filtrar apenas transações pagas
    const paidTransactions = transactions.filter(t => t.isPaid)

    // Receitas totais
    const totalIncome = paidTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    // Despesas totais
    const totalExpense = paidTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

    // Despesas fixas totais
    const totalFixedExpenses = paidTransactions
        .filter(t => t.type === 'expense' && t.expenseType === 'fixed')
        .reduce((sum, t) => sum + t.amount, 0)

    // Média por categoria
    const categoryTotals: Record<string, number> = {}
    paidTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount
        })

    const avgByCategory: Record<string, number> = {}
    Object.entries(categoryTotals).forEach(([categoryId, total]) => {
        avgByCategory[categoryId] = total / monthsOfData
    })

    return {
        avgIncome: totalIncome / monthsOfData,
        avgExpense: totalExpense / monthsOfData,
        avgFixedExpenses: totalFixedExpenses / monthsOfData,
        avgByCategory,
        avgDailyExpense: totalExpense / Math.max(1, sortedTransactions.length > 0 ? 
            Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) : 30)
    }
}

/**
 * Retorna mensagem motivacional baseada no status
 */
export function getInsightAvailabilityMessage(status: UserDataStatus, cardType: string): string {
    if (status.hasMinimumData) {
        return ''
    }

    const dateStr = status.availableDate 
        ? status.availableDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
        : '1º do próximo mês'

    const messages: Record<string, string> = {
        insights: `Continue registrando suas transações!\n\nSeus insights personalizados estarão disponíveis em ${dateStr}, após coletarmos um mês completo de dados.`,
        retrospective: `Complete seu primeiro mês!\n\nSua retrospectiva detalhada estará disponível em ${dateStr} com análises completas.`,
        dailyBudget: `Analisando seu padrão de gastos...\n\nEste card mostrará quanto você pode gastar hoje com segurança em ${dateStr}.`,
        health: `Construindo seu perfil financeiro...\n\nSeu score de saúde será calculado após identificarmos seu padrão de receitas e despesas.`,
        emergency: `Calculando recomendação personalizada...\n\nVamos analisar suas despesas fixas para recomendar o valor ideal de reserva.`
    }

    return messages[cardType] || `Continue usando o sistema! Dados disponíveis em ${dateStr}.`
}

/**
 * Calcula número de meses completos entre duas datas
 */
function calculateCompleteMonths(startDate: Date, endDate: Date): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const yearsDiff = end.getFullYear() - start.getFullYear()
    const monthsDiff = end.getMonth() - start.getMonth()
    
    let totalMonths = yearsDiff * 12 + monthsDiff
    
    // Se não chegou ao mesmo dia do mês, não conta como mês completo
    if (end.getDate() < start.getDate()) {
        totalMonths--
    }
    
    return Math.max(0, totalMonths)
}

/**
 * Retorna 1º dia do próximo mês
 */
function getNextMonthStart(): Date {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth() + 1, 1)
}

/**
 * Formata data de disponibilidade para exibição
 */
export function formatAvailabilityDate(date: Date | null): string {
    if (!date) return 'em breve'
    
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 'agora'
    if (diffDays === 1) return 'amanhã'
    if (diffDays <= 7) return `em ${diffDays} dias`
    
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}
