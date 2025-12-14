import { useState, useEffect } from 'react'
import { smartInsightsService, SmartInsight } from '@/lib/services/smart-insights.service'
import { useAuth } from '@/contexts/AuthContext'

interface UseSmartInsightsResult {
    insights: SmartInsight[]
    loading: boolean
    error: string | null
    refresh: () => void
    dismissInsight: (id: string) => void
}

export function useSmartInsights(): UseSmartInsightsResult {
    const { user } = useAuth()
    const [insights, setInsights] = useState<SmartInsight[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadInsights = async () => {
        if (!user) return

        try {
            setLoading(true)
            setError(null)
            const data = await smartInsightsService.generateDailyInsights(user.uid)

            // Filtrar insights já dispensados
            const dismissedIds = getDismissedInsights()
            const filtered = data.filter(insight => !dismissedIds.includes(insight.id))

            setInsights(filtered)
        } catch (err) {
            console.error('Erro ao carregar insights:', err)
            setError(err instanceof Error ? err.message : 'Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    const dismissInsight = (id: string) => {
        // Remover do estado
        setInsights(prev => prev.filter(i => i.id !== id))

        // Salvar no localStorage
        const dismissed = getDismissedInsights()
        dismissed.push(id)
        localStorage.setItem('dismissed_insights', JSON.stringify(dismissed))
    }

    const getDismissedInsights = (): string[] => {
        try {
            const stored = localStorage.getItem('dismissed_insights')
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    }

    useEffect(() => {
        loadInsights()

        // Recarregar insights a cada 5 minutos
        const interval = setInterval(loadInsights, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [user])

    return {
        insights,
        loading,
        error,
        refresh: loadInsights,
        dismissInsight
    }
}
