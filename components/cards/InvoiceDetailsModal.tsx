'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCardInvoice, Transaction } from '@/types'
import { X, Calendar, DollarSign } from 'lucide-react'
import { invoiceService } from '@/lib/services/invoice.service'
import { useAuth } from '@/contexts/AuthContext'

interface InvoiceDetailsModalProps {
    invoice: CreditCardInvoice
    isOpen: boolean
    onClose: () => void
}

export function InvoiceDetailsModal({ invoice, isOpen, onClose }: InvoiceDetailsModalProps) {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDetails()
    }, [invoice.id])

    const loadDetails = async () => {
        if (!user) return

        try {
            setLoading(true)
            const details = await invoiceService.getInvoiceDetails(user.uid, invoice.id)
            setTransactions(details.transactions)
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR')
    }

    const monthName = new Date(invoice.year, invoice.month).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
    })

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                            Fatura {monthName}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Vencimento: {formatDate(invoice.dueDate)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Resumo */}
                <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total da Fatura</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(invoice.totalAmount)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${invoice.isPaid
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                }`}>
                                {invoice.isPaid ? 'Paga' : 'Em Aberto'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lista de Transações */}
                <div className="flex-1 overflow-auto p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Transações ({transactions.length})
                    </h3>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Carregando...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Nenhuma transação encontrada</div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {tx.description}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(tx.date)}
                                            </span>
                                            {tx.expenseType === 'installment' && tx.currentInstallment && tx.installments && (
                                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                                                    {tx.currentInstallment}/{tx.installments}
                                                </span>
                                            )}
                                            {tx.expenseType === 'fixed' && (
                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                                    Fixa
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(tx.amount)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-slate-700">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full"
                    >
                        Fechar
                    </Button>
                </div>
            </Card>
        </div>
    )
}
