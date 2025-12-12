'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAccounts } from '@/contexts/AccountContext'
import { CreditCardInvoice } from '@/types'
import { X, AlertCircle, DollarSign, Calendar } from 'lucide-react'

interface PayInvoiceModalProps {
    invoice: CreditCardInvoice
    cardName: string
    isOpen: boolean
    onClose: () => void
    onPay: (accountId: string, paymentDate: number) => Promise<void>
}

export function PayInvoiceModal({ invoice, cardName, isOpen, onClose, onPay }: PayInvoiceModalProps) {
    const { activeAccounts } = useAccounts()
    const [selectedAccountId, setSelectedAccountId] = useState('')
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!selectedAccountId) {
            setError('Selecione uma conta para pagamento')
            return
        }

        const selectedAccount = activeAccounts.find(a => a.id === selectedAccountId)
        if (!selectedAccount) return

        if (selectedAccount.currentBalance < invoice.totalAmount) {
            setError('Saldo insuficiente na conta selecionada')
            return
        }

        try {
            setLoading(true)
            const paymentTimestamp = new Date(paymentDate).getTime()
            await onPay(selectedAccountId, paymentTimestamp)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Erro ao processar pagamento')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Pagar Fatura
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {cardName} - {monthName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Resumo da Fatura */}
                <div className="mb-6 p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Valor Total
                        </span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(invoice.totalAmount)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            Vencimento
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                            {formatDate(invoice.dueDate)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600 dark:text-gray-400">
                            Transações
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                            {invoice.transactionIds.length}
                        </span>
                    </div>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Seleção de Conta */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Pagar com Conta
                        </label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                        >
                            <option value="">Selecione uma conta...</option>
                            {activeAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.name} - {formatCurrency(account.currentBalance)}
                                </option>
                            ))}
                        </select>
                        {selectedAccountId && (() => {
                            const account = activeAccounts.find(a => a.id === selectedAccountId)
                            if (!account) return null
                            const remainingBalance = account.currentBalance - invoice.totalAmount
                            return (
                                <p className={`text-xs mt-2 ${remainingBalance < 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                    Saldo após pagamento: {formatCurrency(remainingBalance)}
                                </p>
                            )
                        })()}
                    </div>

                    {/* Data de Pagamento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data do Pagamento
                        </label>
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                        />
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Botões */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Processando...' : 'Confirmar Pagamento'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
