'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useCreditCards } from '@/contexts/CreditCardContext'
import { invoiceService } from '@/lib/services/invoice.service'
import { CreditCardInvoice } from '@/types'
import { CreditCard, AlertCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function CurrentInvoiceCard() {
    const { user } = useAuth()
    const { cards } = useCreditCards()
    const [invoices, setInvoices] = useState<CreditCardInvoice[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCurrentInvoices()
    }, [user, cards])

    const loadCurrentInvoices = async () => {
        if (!user || cards.length === 0) return

        try {
            setLoading(true)
            const today = new Date()
            const currentMonth = today.getMonth()
            const currentYear = today.getFullYear()

            // Buscar faturas de todos os cartões
            const allInvoices = await invoiceService.getInvoices(user.uid)

            // Filtrar apenas faturas do mês atual não pagas
            const current = allInvoices.filter(inv =>
                inv.month === currentMonth &&
                inv.year === currentYear &&
                !inv.isPaid
            )

            setInvoices(current)
        } catch (error) {
            console.error('Erro ao carregar faturas:', error)
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

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    }

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

    if (loading) {
        return (
            <Card className="animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    if (invoices.length === 0) {
        return (
            <Card className="border-2 border-dashed border-gray-300 dark:border-slate-700">
                <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Nenhuma fatura ativa
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none h-[140px] flex flex-col overflow-hidden relative group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-1">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/10 rounded-full -ml-10 -mb-10 group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10 flex-1 flex flex-col p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold opacity-90">Faturas</p>
                            <p className="text-xs font-bold">{invoices.length} ativa{invoices.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>

                {/* Total */}
                <div className="flex-1 flex flex-col justify-center">
                    <p className="text-2xl font-black tracking-tight">{formatCurrency(totalAmount)}</p>
                </div>
            </div>
        </Card>
    )
}
