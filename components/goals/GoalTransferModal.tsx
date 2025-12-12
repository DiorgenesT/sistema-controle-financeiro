'use client'

import { useState } from 'react'
import { Goal } from '@/types'
import { useAccounts } from '@/contexts/AccountContext'
import { useGoals } from '@/contexts/GoalContext'
import { goalService } from '@/lib/services/goal.service'
import { Button } from '@/components/ui/Button'
import { X, ArrowRight, Wallet } from 'lucide-react'

interface GoalTransferModalProps {
    isOpen: boolean
    onClose: () => void
    goal: Goal
    userId: string
}

export function GoalTransferModal({ isOpen, onClose, goal, userId }: GoalTransferModalProps) {
    const { activeAccounts } = useAccounts()
    const { refreshGoals } = useGoals()
    const [selectedAccountId, setSelectedAccountId] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const selectedAccount = activeAccounts.find(a => a.id === selectedAccountId)
    const maxAmount = selectedAccount?.currentBalance || 0
    const amountValue = parseFloat(amount) || 0

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!selectedAccountId) {
            setError('Selecione uma conta')
            return
        }

        if (amountValue <= 0) {
            setError('Valor deve ser maior que zero')
            return
        }

        if (amountValue > maxAmount) {
            setError('Saldo insuficiente na conta')
            return
        }

        setLoading(true)

        try {
            await goalService.addContributionFromAccount(
                goal.id,
                selectedAccountId,
                userId,
                amountValue
            )

            await refreshGoals()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Erro ao transferir')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Transferir para Meta</h2>
                        <p className="text-purple-100 text-sm">{goal.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Conta de Origem */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Conta de Origem *
                        </label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                            required
                        >
                            <option value="">Selecione uma conta</option>
                            {activeAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} - {formatCurrency(acc.currentBalance)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Valor */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Valor da Transferência *
                            </label>
                            {selectedAccount && (
                                <button
                                    type="button"
                                    onClick={() => setAmount(maxAmount.toString())}
                                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    Usar saldo total
                                </button>
                            )}
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={maxAmount}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white text-lg font-bold"
                            placeholder="R$ 0,00"
                            required
                        />
                        {selectedAccount && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Saldo disponível: {formatCurrency(maxAmount)}
                            </p>
                        )}
                    </div>

                    {/* Preview */}
                    {amountValue > 0 && selectedAccount && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-400">
                                    <Wallet className="w-4 h-4 inline mr-1" />
                                    {selectedAccount.name}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    - {formatCurrency(amountValue)}
                                </span>
                            </div>
                            <div className="flex items-center justify-center my-2">
                                <ArrowRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    🎯 {goal.name}
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                    + {formatCurrency(amountValue)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                            disabled={loading || !selectedAccountId || amountValue <= 0}
                        >
                            {loading ? 'Transferindo...' : 'Transferir'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
