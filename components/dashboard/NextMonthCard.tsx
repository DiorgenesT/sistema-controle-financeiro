import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useCreditCards } from '@/contexts/CreditCardContext'
import { analyticsService, NextMonthExpense } from '@/lib/services/analytics.service'
import { Calendar, CreditCard, ShoppingCart, Clock } from 'lucide-react'
import { Transaction } from '@/types'

export function NextMonthCard() {
    const { user } = useAuth()
    const { cards } = useCreditCards()
    const [data, setData] = useState<NextMonthExpense | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        if (!user) return

        try {
            setLoading(true)
            const result = await analyticsService.getNextMonthExpenses(user.uid)
            setData(result)
        } catch (error) {
            console.error('Erro ao carregar despesas do próximo mês:', error)
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

    if (loading) {
        return (
            <Card className="animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    if (!data) return null

    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const monthName = nextMonth.toLocaleDateString('pt-BR', { month: 'long' })

    // Categorizar despesas agrupando por cartão quando aplicável
    const fixedCard = data.fixed.filter(t => t.expenseType === 'fixed' && t.cardId)
    const installments = data.installments

    // Agrupar compras à vista por cartão
    const cashByCard = data.fixed
        .filter(t => t.expenseType === 'cash' && t.cardId)
        .reduce((acc, t) => {
            const cardId = t.cardId!
            if (!acc[cardId]) {
                acc[cardId] = []
            }
            acc[cardId].push(t)
            return acc
        }, {} as Record<string, Transaction[]>)

    // Agrupar custos fixos por cartão
    const fixedByCard = fixedCard.reduce((acc, t) => {
        const cardId = t.cardId!
        if (!acc[cardId]) {
            acc[cardId] = []
        }
        acc[cardId].push(t)
        return acc
    }, {} as Record<string, Transaction[]>)

    // Criar lista de categorias dinâmica
    const categories: Array<{
        id: string
        title: string
        icon: any
        transactions: Transaction[]
        color: 'green' | 'purple' | 'blue'
    }> = []

    // Adicionar compras à vista por cartão
    Object.entries(cashByCard).forEach(([cardId, transactions]) => {
        const card = cards.find(c => c.id === cardId)
        const cardName = card?.nickname || card?.cardBrand || 'Cartão'
        categories.push({
            id: `cash-${cardId}`,
            title: `Compras à Vista (${cardName})`,
            icon: ShoppingCart,
            transactions,
            color: 'green'
        })
    })

    // Adicionar parcelas (não precisa agrupar por cartão, já mostra individualmente)
    if (installments.length > 0) {
        categories.push({
            id: 'installments',
            title: 'Compras Parceladas',
            icon: CreditCard,
            transactions: installments,
            color: 'purple'
        })
    }

    // Adicionar custos fixos por cartão
    Object.entries(fixedByCard).forEach(([cardId, transactions]) => {
        const card = cards.find(c => c.id === cardId)
        const cardName = card?.nickname || card?.cardBrand || 'Cartão'
        categories.push({
            id: `fixed-${cardId}`,
            title: `Custos Fixos (${cardName})`,
            icon: Clock,
            transactions,
            color: 'blue'
        })
    })

    return (
        <Card className="overflow-hidden h-[140px] flex flex-col bg-gradient-to-br from-red-500 to-red-700 text-white border-none relative group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/30 hover:-translate-y-1">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

            <div className="relative z-10 flex-1 flex flex-col justify-between p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold opacity-90">Próximo Mês</p>
                            <p className="text-xs font-bold capitalize">{monthName}</p>
                        </div>
                    </div>
                    {data.total > 0 && (
                        <div className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                            <span className="text-xs font-bold">{data.fixed.length + data.installments.length}</span>
                        </div>
                    )}
                </div>

                {/* Valor principal ou mensagem */}
                <div className="flex-1 flex flex-col justify-center">
                    {data.total > 0 ? (
                        <p className="text-2xl font-black tracking-tight">{formatCurrency(data.total)}</p>
                    ) : (
                        <p className="text-sm font-semibold opacity-90">Nenhuma despesa programada</p>
                    )}
                </div>
            </div>
        </Card>
    )
}
