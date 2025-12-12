'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { X, DollarSign, AlertCircle, TrendingDown, ArrowDownLeft } from 'lucide-react'
import { Account } from '@/types'

interface WithdrawFromReserveModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (accountId: string, amount: number) => Promise<void>
    accounts: Account[]
    currentAmount: number
    monthsCovered: number
}

export function WithdrawFromReserveModal({
    isOpen,
    onClose,
    onConfirm,
    accounts,
    currentAmount,
    monthsCovered
}: WithdrawFromReserveModalProps) {
    const [selectedAccountId, setSelectedAccountId] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const numAmount = parseFloat(amount) || 0
    const newTotal = currentAmount - numAmount
    const newMonthsCovered = monthsCovered * (newTotal / currentAmount)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!selectedAccountId) {
            setError('Selecione uma conta')
            return
        }

        if (numAmount <= 0) {
            setError('Digite um valor válido')
            return
        }

        if (numAmount > currentAmount) {
            setError('Saldo insuficiente na reserva')
            return
        }

        try {
            setLoading(true)
            await onConfirm(selectedAccountId, numAmount)
            onClose()
            setAmount('')
            setSelectedAccountId('')
        } catch (err) {
            setError('Erro ao processar saque')
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

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Sacar da Reserva
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Alerta */}
                    <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                                Atenção!
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                Use a reserva apenas em emergências reais. Isso reduzirá sua proteção financeira.
                            </p>
                        </div>
                    </div>

                    {/* Conta destino */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Conta Destino
                        </label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        >
                            <option value="">Selecione uma conta</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} - {formatCurrency(account.currentBalance)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Valor */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Valor do Saque
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0,00"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Disponível: {formatCurrency(currentAmount)}
                        </p>
                    </div>

                    {/* Preview */}
                    {numAmount > 0 && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-3">
                                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                                        Impacto do saque
                                    </p>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-red-700 dark:text-red-300">Atual:</span>
                                            <span className="font-bold text-red-900 dark:text-red-100">
                                                {formatCurrency(currentAmount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-red-700 dark:text-red-300">Após saque:</span>
                                            <span className="font-bold text-red-900 dark:text-red-100">
                                                {formatCurrency(newTotal)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-red-700 dark:text-red-300">Meses cobertos:</span>
                                            <span className="font-bold text-red-900 dark:text-red-100">
                                                {newMonthsCovered.toFixed(1)} meses
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedAccountId || numAmount <= 0}
                            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowDownLeft className="w-4 h-4" />
                            {loading ? 'Processando...' : 'Sacar'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
