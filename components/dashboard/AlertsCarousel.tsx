'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useCreditCards } from '@/contexts/CreditCardContext'
import { invoiceService } from '@/lib/services/invoice.service'
import { CreditCardInvoice } from '@/types'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

export function AlertsCarousel() {
    const { user } = useAuth()
    const { cards } = useCreditCards()
    const [alerts, setAlerts] = useState<Array<{
        id: string
        message: string
        dueDate: number
        amount: number
    }>>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAlerts()
    }, [user, cards])

    // Auto-slide a cada 5 segundos
    useEffect(() => {
        if (alerts.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % alerts.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [alerts.length])

    const loadAlerts = async () => {
        if (!user || cards.length === 0) return

        try {
            setLoading(true)

            // Buscar todas as faturas não pagas
            const allInvoices = await invoiceService.getInvoices(user.uid)
            const unpaidInvoices = allInvoices.filter(inv => !inv.isPaid)

            // Criar alertas para faturas próximas do vencimento (7 dias)
            const today = Date.now()
            const sevenDaysFromNow = today + (7 * 24 * 60 * 60 * 1000)

            const dueAlerts = unpaidInvoices
                .filter(inv => inv.dueDate <= sevenDaysFromNow && inv.dueDate >= today)
                .map(inv => {
                    const card = cards.find(c => c.id === inv.cardId)
                    const cardName = card?.nickname || card?.cardBrand || 'Cartão'
                    const daysUntilDue = Math.ceil((inv.dueDate - today) / (24 * 60 * 60 * 1000))

                    return {
                        id: inv.id,
                        message: `Fatura ${cardName} vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}`,
                        dueDate: inv.dueDate,
                        amount: inv.totalAmount
                    }
                })

            setAlerts(dueAlerts)
        } catch (error) {
            console.error('Erro ao carregar alertas:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const nextAlert = () => {
        setCurrentIndex(prev => (prev + 1) % alerts.length)
    }

    const prevAlert = () => {
        setCurrentIndex(prev => (prev - 1 + alerts.length) % alerts.length)
    }

    if (loading || alerts.length === 0) return null

    const currentAlert = alerts[currentIndex]

    return (
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none mb-6">
            <div className="flex items-center gap-4">
                {/* Ícone */}
                <div className="flex-shrink-0">
                    <div className="p-3 bg-white/20 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Conteúdo do alerta */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-100 mb-1">
                        ⚠️ Alerta de Vencimento
                    </p>
                    <p className="text-lg font-bold truncate">
                        {currentAlert.message}
                    </p>
                    <p className="text-sm text-white/90 mt-1">
                        Valor: {formatCurrency(currentAlert.amount)}
                    </p>
                </div>

                {/* Navegação (apenas se tiver mais de 1 alerta) */}
                {alerts.length > 1 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={prevAlert}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium">
                            {currentIndex + 1}/{alerts.length}
                        </span>
                        <button
                            onClick={nextAlert}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </Card>
    )
}
