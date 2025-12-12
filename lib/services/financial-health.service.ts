import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction, Goal } from '@/types'
import { patternAnalysisService } from './pattern-analysis.service'

interface FinancialHealthScore {
    overall: number // 0-100
    breakdown: {
        emergencyFund: number    // 30%
        spendingControl: number  // 25%
        consistency: number      // 20%
        goalsProgress: number    // 15%
        debtRatio: number       // 10%
    }
    classification: 'excellent' | 'good' | 'regular' | 'critical'
    recommendations: Recommendation[]
    alerts: Alert[]
}

interface Recommendation {
    id: string
    type: 'emergency' | 'spending' | 'goals' | 'debt'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    action?: string
}

interface Alert {
    id: string
    type: 'warning' | 'danger' | 'info'
    title: string
    message: string
}

class FinancialHealthService {
    /**
     * Calcula score completo de saúde financeira
     */
    async calculateScore(userId: string): Promise<FinancialHealthScore> {
        // Buscar todos os dados necessários
        const [
            emergencyScore,
            spendingScore,
            consistencyScore,
            goalsScore,
            debtScore
        ] = await Promise.all([
            this.calculateEmergencyFundScore(userId),
            this.calculateSpendingControlScore(userId),
            this.calculateConsistencyScore(userId),
            this.calculateGoalsProgressScore(userId),
            this.calculateDebtRatioScore(userId)
        ])

        // Pesos de cada fator
        const weights = {
            emergencyFund: 0.30,
            spendingControl: 0.25,
            consistency: 0.20,
            goalsProgress: 0.15,
            debtRatio: 0.10
        }

        // Score geral ponderado
        const overall = Math.max(0,
            emergencyScore * weights.emergencyFund +
            spendingScore * weights.spendingControl +
            consistencyScore * weights.consistency +
            goalsScore * weights.goalsProgress +
            debtScore * weights.debtRatio
        )

        // Classificação
        const classification = this.getClassification(overall)

        // Gerar recomendações e alertas
        const recommendations = await this.generateRecommendations(userId, {
            emergencyFund: emergencyScore,
            spendingControl: spendingScore,
            consistency: consistencyScore,
            goalsProgress: goalsScore,
            debtRatio: debtScore
        })

        const alerts = await this.generateAlerts(userId, overall)

        return {
            overall: isNaN(overall) ? 0 : Math.round(overall),
            breakdown: {
                emergencyFund: Math.round(emergencyScore),
                spendingControl: Math.round(spendingScore),
                consistency: Math.round(consistencyScore),
                goalsProgress: Math.round(goalsScore),
                debtRatio: Math.round(debtScore)
            },
            classification,
            recommendations,
            alerts
        }
    }

    private async calculateEmergencyFundScore(userId: string): Promise<number> {
        // Buscar meta de reserva de emergência
        const goalsRef = ref(db, `users/${userId}/goals`)
        const snapshot = await get(goalsRef)

        if (!snapshot.exists()) return 0

        const goals: Goal[] = Object.values(snapshot.val())
        const emergencyGoal = goals.find(g =>
            g.name.toLowerCase().includes('emergência') ||
            g.name.toLowerCase().includes('reserva')
        )

        if (!emergencyGoal) return 0

        // Calcular % alcançado (meta ideal: 6 meses de despesas)
        const progress = (emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100
        return Math.min(100, progress)
    }

    private async calculateSpendingControlScore(userId: string): Promise<number> {
        const today = new Date()
        const month = today.getMonth()
        const year = today.getFullYear()

        const transactionsRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(transactionsRef)

        if (!snapshot.exists()) return 100 // Sem dados = perfeito

        const transactions: Transaction[] = Object.values(snapshot.val())

        let income = 0
        let expenses = 0

        transactions.forEach(tx => {
            const txDate = new Date(tx.date)
            if (txDate.getMonth() === month && txDate.getFullYear() === year) {
                if (tx.type === 'income') income += tx.amount
                if (tx.type === 'expense') expenses += tx.amount
            }
        })

        if (income === 0) return 50 // Sem receitas

        const ratio = expenses / income

        // Score baseado em quanto % da receita foi gasto
        if (ratio <= 0.7) return 100  // Ótimo: 70% ou menos
        if (ratio <= 0.85) return 80  // Bom: 71-85%
        if (ratio <= 0.95) return 60  // Regular: 86-95%
        if (ratio <= 1.0) return 40   // Justo: 96-100%
        return Math.max(0, 40 - (ratio - 1) * 100) // Excedeu
    }

    private async calculateConsistencyScore(userId: string): Promise<number> {
        const patterns = await patternAnalysisService.analyzePatterns(userId)

        // Quanto menor a volatilidade, melhor
        const volatilityScore = Math.max(0, 100 - (patterns.volatility / 20))

        // Quanto menor a taxa de imprevistos, melhor
        const unexpectedScore = Math.max(0, 100 - (patterns.unexpectedExpensesRate * 100))

        return (volatilityScore + unexpectedScore) / 2
    }

    private async calculateGoalsProgressScore(userId: string): Promise<number> {
        const goalsRef = ref(db, `users/${userId}/goals`)
        const snapshot = await get(goalsRef)

        if (!snapshot.exists()) return 50 // Sem metas = neutro

        const goals: Goal[] = Object.values(snapshot.val())
        const activeGoals = goals.filter(g => g.status === 'active')

        if (activeGoals.length === 0) return 50

        // Calcular progresso médio
        const avgProgress = activeGoals.reduce((sum, goal) => {
            return sum + (goal.currentAmount / goal.targetAmount) * 100
        }, 0) / activeGoals.length

        return Math.min(100, avgProgress)
    }

    private async calculateDebtRatioScore(userId: string): Promise<number> {
        // Por enquanto, assumir 100 (sem dívidas)
        // TODO: Implementar quando houver sistema de dívidas
        return 100
    }

    private getClassification(score: number): 'excellent' | 'good' | 'regular' | 'critical' {
        if (score >= 90) return 'excellent'
        if (score >= 70) return 'good'
        if (score >= 50) return 'regular'
        return 'critical'
    }

    private async generateRecommendations(
        userId: string,
        scores: FinancialHealthScore['breakdown']
    ): Promise<Recommendation[]> {
        const recommendations: Recommendation[] = []

        // Reserva de emergência
        if (scores.emergencyFund < 50) {
            recommendations.push({
                id: 'emergency-fund',
                type: 'emergency',
                priority: 'high',
                title: 'Construa sua reserva de emergência',
                description: 'Especialistas recomendam 6 meses de despesas guardados.',
                action: 'Criar meta de emergência'
            })
        }

        // Controle de gastos
        if (scores.spendingControl < 60) {
            recommendations.push({
                id: 'spending-control',
                type: 'spending',
                priority: 'high',
                title: 'Reduza seus gastos mensais',
                description: 'Você está gastando mais de 85% da sua receita.',
                action: 'Ver categorias com mais gastos'
            })
        }

        // Metas
        if (scores.goalsProgress < 50) {
            recommendations.push({
                id: 'goals-progress',
                type: 'goals',
                priority: 'medium',
                title: 'Aumente contribuições para metas',
                description: 'Suas metas estão progredindo lentamente.',
                action: 'Ajustar contribuições'
            })
        }

        return recommendations.slice(0, 3) // Máximo 3
    }

    private async generateAlerts(userId: string, score: number): Promise<Alert[]> {
        const alerts: Alert[] = []

        if (score < 50) {
            alerts.push({
                id: 'critical-health',
                type: 'danger',
                title: 'Saúde financeira crítica',
                message: 'Atenção! Sua situação financeira precisa de ajustes urgentes.'
            })
        } else if (score < 70) {
            alerts.push({
                id: 'regular-health',
                type: 'warning',
                title: 'Atenção aos gastos',
                message: 'Alguns indicadores precisam de atenção.'
            })
        }

        return alerts
    }
}

export const financialHealthService = new FinancialHealthService()
export type { FinancialHealthScore, Recommendation, Alert }
