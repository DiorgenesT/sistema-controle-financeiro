import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction, Goal } from '@/types'
import { patternAnalysisService } from './pattern-analysis.service'

export interface SmartInsight {
    id: string
    type: 'tip' | 'warning' | 'opportunity' | 'achievement'
    category: 'emergency_fund' | 'spending' | 'goals' | 'savings' | 'patterns'
    priority: 1 | 2 | 3 | 4 | 5  // 5 = mais importante
    title: string
    message: string
    action?: {
        label: string
        value: number
        type: 'transfer' | 'create_goal' | 'adjust_budget'
        data?: any
    }
    learnedFrom: {
        pattern: string
        confidence: number  // 0-100
        basedOn: number     // Número de transações analisadas
    }
    createdAt: Date
    expiresAt?: Date
    icon?: string
}

class SmartInsightsService {
    /**
     * Gera insights diários personalizados
     */
    async generateDailyInsights(userId: string): Promise<SmartInsight[]> {
        const insights: SmartInsight[] = []

        // Executar todas as análises em paralelo
        const [
            emergencyInsights,
            spendingInsights,
            goalsInsights,
            savingsInsights,
            patternInsights
        ] = await Promise.all([
            this.analyzeEmergencyFund(userId),
            this.analyzeSpendingBehavior(userId),
            this.analyzeGoalsProgress(userId),
            this.analyzeSavingsOpportunities(userId),
            this.analyzePatterns(userId)
        ])

        insights.push(
            ...emergencyInsights,
            ...spendingInsights,
            ...goalsInsights,
            ...savingsInsights,
            ...patternInsights
        )

        // Ordenar por prioridade
        return insights.sort((a, b) => b.priority - a.priority).slice(0, 5)
    }

    /**
     * Analisa oportunidades de reserva de emergência
     */
    private async analyzeEmergencyFund(userId: string): Promise<SmartInsight[]> {
        const insights: SmartInsight[] = []

        // Buscar meta de emergência
        const goalsRef = ref(db, `users/${userId}/goals`)
        const goalsSnapshot = await get(goalsRef)

        if (!goalsSnapshot.exists()) {
            // Não tem nenhuma meta - sugerir criar reserva
            insights.push({
                id: 'create-emergency-fund',
                type: 'warning',
                category: 'emergency_fund',
                priority: 5,
                title: 'Crie sua Reserva de Emergência',
                message: 'Você ainda não tem uma reserva de emergência. Especialistas recomendam guardar de 3 a 6 meses de despesas para imprevistos.',
                action: {
                    label: 'Criar Meta de Emergência',
                    value: 0,
                    type: 'create_goal'
                },
                learnedFrom: {
                    pattern: 'no_emergency_fund',
                    confidence: 100,
                    basedOn: 0
                },
                createdAt: new Date(),
                icon: '🚨'
            })
            return insights
        }

        const goals: Goal[] = Object.values(goalsSnapshot.val())
        const emergencyGoal = goals.find(g =>
            g.name.toLowerCase().includes('emergência') ||
            g.name.toLowerCase().includes('emergencia') ||
            g.name.toLowerCase().includes('reserva')
        )

        if (!emergencyGoal) {
            insights.push({
                id: 'create-emergency-fund',
                type: 'warning',
                category: 'emergency_fund',
                priority: 5,
                title: 'Crie sua Reserva de Emergência',
                message: 'Você tem metas, mas nenhuma é de reserva de emergência. Essa é a meta mais importante!',
                action: {
                    label: 'Criar Reserva',
                    value: 0,
                    type: 'create_goal'
                },
                learnedFrom: {
                    pattern: 'no_emergency_goal',
                    confidence: 100,
                    basedOn: goals.length
                },
                createdAt: new Date(),
                icon: '🚨'
            })
            return insights
        }

        // Analisar progresso da reserva
        const progress = (emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100

        if (progress < 30) {
            // Buscar sobra do mês para sugerir transferência
            const surplus = await this.calculateMonthlySurplus(userId)

            if (surplus > 0) {
                const suggestedAmount = Math.min(surplus * 0.6, emergencyGoal.targetAmount - emergencyGoal.currentAmount)

                insights.push({
                    id: 'boost-emergency-fund',
                    type: 'opportunity',
                    category: 'emergency_fund',
                    priority: 4,
                    title: 'Oportunidade de Fortalecer Reserva',
                    message: `Você economizou R$${surplus.toFixed(2)} este mês! Sua reserva de emergência está em ${progress.toFixed(1)}%. Que tal transferir R$${suggestedAmount.toFixed(2)} para se aproximar da meta?`,
                    action: {
                        label: `Transferir R$${suggestedAmount.toFixed(2)}`,
                        value: suggestedAmount,
                        type: 'transfer',
                        data: { goalId: emergencyGoal.id }
                    },
                    learnedFrom: {
                        pattern: 'monthly_surplus_opportunity',
                        confidence: 85,
                        basedOn: 1
                    },
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
                    icon: '💰'
                })
            } else {
                insights.push({
                    id: 'emergency-fund-low',
                    type: 'tip',
                    category: 'emergency_fund',
                    priority: 3,
                    title: 'Aumente sua Reserva de Emergência',
                    message: `Sua reserva está em ${progress.toFixed(1)}% da meta. Que tal guardar R$200/mês? Em 6 meses você terá R$1.200 a mais!`,
                    learnedFrom: {
                        pattern: 'low_emergency_fund',
                        confidence: 90,
                        basedOn: 1
                    },
                    createdAt: new Date(),
                    icon: '📊'
                })
            }
        } else if (progress >= 100) {
            insights.push({
                id: 'emergency-complete',
                type: 'achievement',
                category: 'emergency_fund',
                priority: 2,
                title: 'Parabéns! Reserva Completa',
                message: `Sua reserva de emergência está completa (${formatCurrency(emergencyGoal.currentAmount)})! Que tal redirecionar contribuições para outras metas?`,
                learnedFrom: {
                    pattern: 'emergency_fund_complete',
                    confidence: 100,
                    basedOn: 1
                },
                createdAt: new Date(),
                icon: '🎉'
            })
        }

        return insights
    }

    /**
     * Analisa comportamento de gastos
     */
    private async analyzeSpendingBehavior(userId: string): Promise<SmartInsight[]> {
        const insights: SmartInsight[] = []
        const today = new Date()
        const month = today.getMonth()
        const year = today.getFullYear()

        const transactionsRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(transactionsRef)

        if (!snapshot.exists()) return insights

        const transactions: Transaction[] = Object.values(snapshot.val())

        // Agrupar por categoria
        const categoryExpenses: { [key: string]: { total: number; count: number; name: string } } = {}
        const previousMonthExpenses: { [key: string]: number } = {}

        transactions.forEach(tx => {
            const txDate = new Date(tx.date)
            const txMonth = txDate.getMonth()
            const txYear = txDate.getFullYear()

            if (tx.type === 'expense') {
                const categoryId = tx.categoryId || 'outros'

                if (txYear === year && txMonth === month) {
                    if (!categoryExpenses[categoryId]) {
                        categoryExpenses[categoryId] = {
                            total: 0,
                            count: 0,
                            name: tx.categoryId || 'Outros'
                        }
                    }
                    categoryExpenses[categoryId].total += tx.amount
                    categoryExpenses[categoryId].count++
                }

                // Mês anterior para comparação
                const prevMonth = month === 0 ? 11 : month - 1
                const prevYear = month === 0 ? year - 1 : year
                if (txYear === prevYear && txMonth === prevMonth) {
                    if (!previousMonthExpenses[categoryId]) {
                        previousMonthExpenses[categoryId] = 0
                    }
                    previousMonthExpenses[categoryId] += tx.amount
                }
            }
        })

        // Detectar aumentos significativos
        for (const [categoryId, current] of Object.entries(categoryExpenses)) {
            const previous = previousMonthExpenses[categoryId] || 0

            if (previous > 0) {
                const increase = ((current.total - previous) / previous) * 100

                if (increase > 30) {
                    insights.push({
                        id: `category-spike-${categoryId}`,
                        type: 'warning',
                        category: 'spending',
                        priority: 4,
                        title: 'Alerta de Gastos Elevados',
                        message: `Seus gastos com ${current.name} aumentaram ${increase.toFixed(0)}% este mês!\nMês anterior: R$${previous.toFixed(2)}\nEste mês: R$${current.total.toFixed(2)}`,
                        learnedFrom: {
                            pattern: 'category_spending_spike',
                            confidence: 80,
                            basedOn: current.count
                        },
                        createdAt: new Date(),
                        icon: '⚠️'
                    })
                } else if (increase < -15) {
                    insights.push({
                        id: `category-reduction-${categoryId}`,
                        type: 'achievement',
                        category: 'spending',
                        priority: 2,
                        title: 'Parabéns! Economia Detectada',
                        message: `Você gastou ${Math.abs(increase).toFixed(0)}% menos com ${current.name}! Continue assim e economizará R$${((previous - current.total) * 6).toFixed(2)} em 6 meses.`,
                        learnedFrom: {
                            pattern: 'category_spending_reduction',
                            confidence: 85,
                            basedOn: current.count
                        },
                        createdAt: new Date(),
                        icon: '💚'
                    })
                }
            }
        }

        return insights.slice(0, 2)
    }

    /**
     * Analisa progresso das metas
     */
    private async analyzeGoalsProgress(userId: string): Promise<SmartInsight[]> {
        const insights: SmartInsight[] = []

        const goalsRef = ref(db, `users/${userId}/goals`)
        const snapshot = await get(goalsRef)

        if (!snapshot.exists()) return insights

        const goals: Goal[] = Object.values(snapshot.val())
        const activeGoals = goals.filter(g => g.status === 'active')

        for (const goal of activeGoals) {
            const progress = (goal.currentAmount / goal.targetAmount) * 100
            const remaining = goal.targetAmount - goal.currentAmount

            // Meta próxima de completar
            if (progress >= 85 && progress < 100) {
                insights.push({
                    id: `goal-near-${goal.id}`,
                    type: 'opportunity',
                    category: 'goals',
                    priority: 3,
                    title: 'Meta Quase Completa!',
                    message: `Faltam apenas R$${remaining.toFixed(2)} para sua meta "${goal.name}"! Um esforço final e você alcança!`,
                    learnedFrom: {
                        pattern: 'goal_near_completion',
                        confidence: 95,
                        basedOn: 1
                    },
                    createdAt: new Date(),
                    icon: '🎯'
                })
            }
        }

        return insights
    }

    /**
     * Analisa oportunidades de economia
     */
    private async analyzeSavingsOpportunities(userId: string): Promise<SmartInsight[]> {
        const insights: SmartInsight[] = []
        const surplus = await this.calculateMonthlySurplus(userId)

        if (surplus > 100) {
            insights.push({
                id: 'monthly-surplus',
                type: 'opportunity',
                category: 'savings',
                priority: 3,
                title: 'Sobra Mensal Detectada',
                message: `Você tem R$${surplus.toFixed(2)} de sobra este mês! Que tal investir em uma meta ou aumentar sua reserva?`,
                action: {
                    label: 'Ver Opções',
                    value: surplus,
                    type: 'transfer'
                },
                learnedFrom: {
                    pattern: 'monthly_surplus',
                    confidence: 90,
                    basedOn: 1
                },
                createdAt: new Date(),
                icon: '💰'
            })
        }

        return insights
    }

    /**
     * Analisa padrões de comportamento
     */
    private async analyzePatterns(userId: string): Promise<SmartInsight[]> {
        const insights: SmartInsight[] = []

        const patterns = await patternAnalysisService.analyzePatterns(userId)

        if (patterns.unexpectedExpensesRate > 0.2) {
            insights.push({
                id: 'high-unexpected-expenses',
                type: 'tip',
                category: 'patterns',
                priority: 2,
                title: 'Muitos Gastos Imprevistos',
                message: `${(patterns.unexpectedExpensesRate * 100).toFixed(0)}% dos seus gastos são imprevistos. Que tal planejar melhor o mês?`,
                learnedFrom: {
                    pattern: 'high_unexpected_rate',
                    confidence: 75,
                    basedOn: 30
                },
                createdAt: new Date(),
                icon: '📊'
            })
        }

        return insights
    }

    /**
     * Calcula sobra mensal
     */
    private async calculateMonthlySurplus(userId: string): Promise<number> {
        const today = new Date()
        const month = today.getMonth()
        const year = today.getFullYear()

        const transactionsRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(transactionsRef)

        if (!snapshot.exists()) return 0

        const transactions: Transaction[] = Object.values(snapshot.val())

        let income = 0
        let expenses = 0

        transactions.forEach(tx => {
            const txDate = new Date(tx.date)
            if (txDate.getMonth() === month && txDate.getFullYear() === year) {
                if (tx.type === 'income' && tx.isPaid) {
                    income += tx.amount
                } else if (tx.type === 'expense' && tx.isPaid) {
                    expenses += tx.amount
                }
            }
        })

        return Math.max(0, income - expenses)
    }
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

export const smartInsightsService = new SmartInsightsService()
