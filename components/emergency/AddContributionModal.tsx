'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { X, DollarSign, Wallet, AlertCircle, TrendingUp } from 'lucide-react'
import { Account } from '@/types'

interface AddContributionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (accountId: string, amount: number) => Promise<void>
    accounts: Account[]
    currentAmount: number
    targetAmount: number
}

export function AddContributionModal({
    isOpen,
    onClose,
    onConfirm,
    accounts,
    currentAmount,
    targetAmount
}: AddContributionModalProps) {
    const [selectedAccountId, setSelectedAccountId] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const selectedAccount = accounts.find(a => a.id === selectedAccountId)
    const numAmount = parseFloat(amount) || 0
    const newTotal = currentAmount + numAmount
    const newProgress = (newTotal / targetAmount) * 100

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

        if (selectedAccount && numAmount > selectedAccount.currentBalance) {
            setError('Saldo insuficiente na conta')
            return
        }

        try {
            setLoading(true)
            await onConfirm(selectedAccountId, numAmount)
            onClose()
            setAmount('')
            setSelectedAccountId('')
        } catch (err) {
            setError('Erro ao processar contribuição')
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
                        Adicionar Contribuição
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
                    {/* Conta origem */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Conta Origem
                        </label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
                            Valor da Contribuição
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0,00"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {numAmount > 0 && (
                        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                            <div className="flex items-start gap-3">
                                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5" />
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">
                                        Preview do impacto
                                    </p>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-teal-700 dark:text-teal-300">Atual:</span>
                                            <span className="font-bold text-teal-900 dark:text-teal-100">
                                                {formatCurrency(currentAmount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-teal-700 dark:text-teal-300">Novo total:</span>
                                            <span className="font-bold text-teal-900 dark:text-teal-100">
                                                {formatCurrency(newTotal)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-teal-700 dark:text-teal-300">Progresso:</span>
                                            <span className="font-bold text-teal-900 dark:text-teal-100">
                                                {newProgress.toFixed(1)}%
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
                            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Processando...' : 'Confirmar'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
