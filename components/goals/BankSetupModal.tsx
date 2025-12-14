'use client'

import { useState } from 'react'
import { Building2, X } from 'lucide-react'

interface BankSetupModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (bankName: string) => void
}

export function BankSetupModal({ isOpen, onClose, onSave }: BankSetupModalProps) {
    const [bankName, setBankName] = useState('')

    const handleSave = () => {
        if (!bankName.trim()) return
        onSave(bankName.trim())
        setBankName('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Configurar Reserva
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Para melhor controle, informe onde você guarda sua reserva de emergência.
                    </p>

                    {/* Banco */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Banco ou Instituição Financeira *
                        </label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="Ex: Nubank, Banco Inter, Caixa..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900/30 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-900 rounded-xl p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            💡 <strong>Dica:</strong> Guarde sua reserva em uma conta separada, de fácil acesso mas longe das tentações do dia a dia!
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!bankName.trim()}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    )
}
