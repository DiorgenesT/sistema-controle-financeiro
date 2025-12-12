'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { invoiceService } from '@/lib/services/invoice.service'
import { CreditCardInvoice, CreditCard } from '@/types'
import { ArrowLeft, Calendar, CreditCard as CreditCardIcon, AlertCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { PayInvoiceModal } from '@/components/cards/PayInvoiceModal'
import { InvoiceDetailsModal } from '@/components/cards/InvoiceDetailsModal'

export default function InvoicesPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <InvoicesContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function InvoicesContent() {
    const { user } = useAuth()
    const params = useParams()
    const router = useRouter()
    const cardId = params.id as string

    const [card, setCard] = useState<CreditCard | null>(null)
    const [invoices, setInvoices] = useState<CreditCardInvoice[]>([])
    const [loading, setLoading] = useState(true)
    const [payingInvoice, setPayingInvoice] = useState<CreditCardInvoice | null>(null)
    const [detailsInvoice, setDetailsInvoice] = useState<CreditCardInvoice | null>(null)

    useEffect(() => {
        loadInvoices()
    }, [user, cardId])

    const loadInvoices = async () => {
        if (!user) return

        try {
            setLoading(true)
            const data = await invoiceService.getInvoices(user.uid, cardId)
            setInvoices(data)

            // Buscar dados do cartão
            if (data.length > 0) {
                const details = await invoiceService.getInvoiceDetails(user.uid, data[0].id)
                setCard(details.card)
            } else {
                // Se não tem faturas, buscar dados do cartão direto
                const { get, ref } = await import('firebase/database')
                const { db } = await import('@/lib/firebase/config')
                const cardSnapshot = await get(ref(db, `users/${user.uid}/creditCards/${cardId}`))
                if (cardSnapshot.exists()) {
                    setCard({ id: cardId, ...cardSnapshot.val() })
                }
            }
        } catch (error) {
            console.error('Erro ao carregar faturas:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateInvoice = async () => {
        if (!user || !card) return

        try {
            const today = new Date()
            const month = today.getMonth()
            const year = today.getFullYear()

            await invoiceService.generateInvoice(user.uid, cardId, month, year)
            alert('Fatura gerada com sucesso!')
            loadInvoices() // Recarregar lista
        } catch (error: any) {
            alert(error.message || 'Erro ao gerar fatura')
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR')
    }

    const handlePayInvoice = async (accountId: string, paymentDate: number) => {
        if (!user || !payingInvoice) return

        try {
            await invoiceService.payInvoice(user.uid, payingInvoice.id, accountId, paymentDate)
            setPayingInvoice(null)
            loadInvoices() // Recarregar lista
        } catch (error: any) {
            throw error // PayInvoiceModal vai capturar e mostrar
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard/cards"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Cartões
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Faturas - {card?.nickname || card?.cardBrand || 'Cartão'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Histórico de faturas do cartão
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleGenerateInvoice}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Gerar Fatura Atual
                    </Button>
                </div>
            </div>

            {/* Lista de Faturas */}
            {invoices.length === 0 ? (
                <Card className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Nenhuma fatura encontrada
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        As faturas aparecerão aqui quando você registrar gastos neste cartão.
                    </p>
                    <Link
                        href="/dashboard/cards"
                        className="inline-block px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                    >
                        Voltar para Cartões
                    </Link>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {invoices.map((invoice) => {
                        const monthName = new Date(invoice.year, invoice.month).toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric'
                        })

                        return (
                            <Card key={invoice.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${invoice.isPaid ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                                            <CreditCardIcon className={`w-6 h-6 ${invoice.isPaid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                                                {monthName}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    Vence em {formatDate(invoice.dueDate)}
                                                </span>
                                                {invoice.isPaid && invoice.paidDate && (
                                                    <span className="text-green-600 dark:text-green-400">
                                                        • Pago em {formatDate(invoice.paidDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(invoice.totalAmount)}
                                        </p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${invoice.isPaid
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                            }`}>
                                            {invoice.isPaid ? 'Paga' : 'Em Aberto'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {invoice.transactionIds.length} transação(ões)
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setDetailsInvoice(invoice)}
                                                className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                                            >
                                                Ver detalhes
                                            </button>
                                            {!invoice.isPaid && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => setPayingInvoice(invoice)}
                                                >
                                                    <DollarSign className="w-3 h-3 mr-1" />
                                                    Pagar Fatura
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal de Pagamento */}
            {payingInvoice && card && (
                <PayInvoiceModal
                    invoice={payingInvoice}
                    cardName={card.nickname || card.cardBrand}
                    isOpen={!!payingInvoice}
                    onClose={() => setPayingInvoice(null)}
                    onPay={handlePayInvoice}
                />
            )}

            {/* Modal de Detalhes */}
            {detailsInvoice && (
                <InvoiceDetailsModal
                    invoice={detailsInvoice}
                    isOpen={!!detailsInvoice}
                    onClose={() => setDetailsInvoice(null)}
                />
            )}
        </div>
    )
}
