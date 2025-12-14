'use client'

import { useState } from 'react'
import { useGoals } from '@/contexts/GoalContext'
import { useAccounts } from '@/contexts/AccountContext'
import { Button } from '@/components/ui/Button'
import { X, Wallet, AlertCircle } from 'lucide-react'

interface ContributionModalProps {
    isOpen: boolean
    onClose: () => void
    goalId: string
    goalName: string
}

export function ContributionModal({ isOpen, onClose, goalId, goalName }: ContributionModalProps) {
    const { addContribution } = useGoals()
    const { activeAccounts } = useAccounts()
    const [accountId, setAccountId] = useState('')
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const selectedAccount = activeAccounts.find(acc => acc.id === accountId)
    const amountValue = parseFloat(amount) || 0
    const hasInsufficientBalance = selectedAccount && amountValue > selectedAccount.currentBalance

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!accountId) {
            alert('Selecione uma conta de origem')
            return
        }

        if (hasInsufficientBalance) {
            alert('Saldo insuficiente na conta selecionada')
            return
        }

        setLoading(true)

        try {
            await addContribution(goalId, accountId, parseFloat(amount), note || undefined)
            setAccountId('')
            setAmount('')
            setNote('')
            onClose()
        } catch (error: any) {
            console.error('Erro ao adicionar aporte:', error)
            alert(error.message || 'Erro ao adicionar aporte')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center justify-between rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Adicionar Aporte</h2>
                        <p className="text-green-100 text-sm">{goalName}</p>
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
                    {/* Seleção de Conta */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Conta de Origem *
                        </label>
                        <div className="relative">
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white appearance-none cursor-pointer"
                                required
                            >
                                <option value="">Selecione uma conta</option>
                                {activeAccounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} - {formatCurrency(account.currentBalance)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {activeAccounts.length === 0 && (
                            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                                Você precisa ter pelo menos uma conta ativa para fazer aportes
                            </p>
                        )}
                    </div>

                    {/* Valor do Aporte */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Valor do Aporte *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white text-lg font-bold ${hasInsufficientBalance
                                    ? 'border-red-500 dark:border-red-500'
                                    : 'border-gray-200 dark:border-slate-600'
                                }`}
                            placeholder="R$ 0,00"
                            required
                        />
                        {hasInsufficientBalance && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <span>Saldo insuficiente. Disponível: {formatCurrency(selectedAccount.currentBalance)}</span>
                            </div>
                        )}
                    </div>

                    {/* Nota */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Nota (opcional)
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                            placeholder="Ex: Aporte mensal"
                        />
                    </div>

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
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                            disabled={loading || activeAccounts.length === 0 || hasInsufficientBalance}
                        >
                            {loading ? 'Salvando...' : 'Adicionar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
