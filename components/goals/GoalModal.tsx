'use client'

import { useState } from 'react'
import { useGoals } from '@/contexts/GoalContext'
import { GoalCategory } from '@/types'
import { GOAL_CATEGORIES } from '@/lib/constants/goals'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'

interface GoalModalProps {
    isOpen: boolean
    onClose: () => void
    goalToEdit?: any // Meta existente para edição
}

export function GoalModal({ isOpen, onClose, goalToEdit }: GoalModalProps) {
    const { createGoal, updateGoal } = useGoals()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: goalToEdit?.name || '',
        description: goalToEdit?.description || '',
        category: (goalToEdit?.category || 'other') as GoalCategory,
        targetAmount: goalToEdit?.targetAmount || '',
        deadline: goalToEdit?.deadline ? new Date(goalToEdit.deadline).toISOString().split('T')[0] : '',
        icon: goalToEdit?.icon || '🎯',
        color: goalToEdit?.color || '#64748B'
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                targetAmount: parseFloat(formData.targetAmount as string),
                deadline: new Date(formData.deadline).getTime(),
                icon: formData.icon,
                color: formData.color
            }

            if (goalToEdit) {
                await updateGoal(goalToEdit.id, data)
            } else {
                await createGoal(data)
            }

            onClose()
        } catch (error) {
            console.error('Erro ao salvar meta:', error)
            alert('Erro ao salvar meta')
        } finally {
            setLoading(false)
        }
    }

    const selectedCategory = GOAL_CATEGORIES.find(c => c.id === formData.category)

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-700 dark:to-cyan-700 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        {goalToEdit ? 'Editar Meta' : 'Nova Meta'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Nome da Meta *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                            placeholder="Ex: Viagem para Europa"
                            required
                        />
                    </div>

                    {/* Categoria */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Categoria *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {GOAL_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.id, icon: cat.icon, color: cat.color })}
                                    className={`p-4 rounded-xl border-2 transition-all ${formData.category === cat.id
                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                            : 'border-gray-200 dark:border-slate-600 hover:border-teal-300'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">{cat.icon}</div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cat.label}</p>
                                </button>
                            ))}
                        </div>
                        {selectedCategory && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {selectedCategory.description}
                            </p>
                        )}
                    </div>

                    {/* Valor e Data */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Valor Alvo *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.targetAmount}
                                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                                placeholder="R$ 0,00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Data Limite *
                            </label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Descrição (opcional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 dark:bg-slate-700 dark:text-white resize-none"
                            rows={3}
                            placeholder="Detalhes sobre sua meta..."
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
                            className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : goalToEdit ? 'Atualizar' : 'Criar Meta'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
