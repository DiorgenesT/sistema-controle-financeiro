'use client'

import { useState } from 'react'
import { useGoals } from '@/contexts/GoalContext'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'

interface ContributionModalProps {
    isOpen: boolean
    onClose: () => void
    goalId: string
    goalName: string
}

export function ContributionModal({ isOpen, onClose, goalId, goalName }: ContributionModalProps) {
    const { addContribution } = useGoals()
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await addContribution(goalId, parseFloat(amount), note || undefined)
            setAmount('')
            setNote('')
            onClose()
        } catch (error) {
            console.error('Erro ao adicionar aporte:', error)
            alert('Erro ao adicionar aporte')
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
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white text-lg font-bold"
                            placeholder="R$ 0,00"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Nota (opcional)
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                            placeholder="Ex: Salário de dezembro"
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
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Adicionar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
