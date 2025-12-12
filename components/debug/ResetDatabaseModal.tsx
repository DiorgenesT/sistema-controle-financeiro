'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Trash2, AlertTriangle, Lock, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ref, remove } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'

interface ResetDatabaseModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ResetDatabaseModal({ isOpen, onClose }: ResetDatabaseModalProps) {
    const { user } = useAuth()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleReset = async () => {
        if (!user || !password) {
            setError('Digite sua senha')
            return
        }

        try {
            setLoading(true)
            setError('')

            // Validar senha reautenticando
            await signInWithEmailAndPassword(auth, user.email!, password)

            // Senha correta, confirmar novamente
            if (!confirm('⚠️ ÚLTIMA CONFIRMAÇÃO: Isso apagará TODOS os seus dados. Continuar?')) {
                setLoading(false)
                return
            }

            // Apagar tudo
            await Promise.all([
                remove(ref(db, `users/${user.uid}/transactions`)),
                remove(ref(db, `users/${user.uid}/goals`)),
                remove(ref(db, `users/${user.uid}/creditCards`)),
                remove(ref(db, `users/${user.uid}/invoices`)),
                remove(ref(db, `users/${user.uid}/accounts`)),
                remove(ref(db, `users/${user.uid}/categories`))
            ])

            alert('✅ Banco de dados resetado com sucesso!')
            window.location.reload()
        } catch (err: any) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Senha incorreta')
            } else {
                setError('Erro ao resetar banco de dados')
            }
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        <h2 className="text-xl font-bold text-red-900 dark:text-red-100">
                            Resetar Banco de Dados
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Alerta de perigo */}
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg">
                        <p className="text-sm font-bold text-red-900 dark:text-red-100 mb-2">
                            ⚠️ ATENÇÃO - Ação Irreversível!
                        </p>
                        <p className="text-xs text-red-800 dark:text-red-200">
                            Esta ação irá apagar <strong>permanentemente</strong>:
                        </p>
                        <ul className="text-xs text-red-800 dark:text-red-200 mt-2 space-y-1 list-disc list-inside">
                            <li>Todas as transações (receitas e despesas)</li>
                            <li>Todas as contas bancárias</li>
                            <li>Todas as categorias personalizadas</li>
                            <li>Todas as metas e reserva de emergência</li>
                            <li>Todos os cartões de crédito e faturas</li>
                        </ul>
                        <p className="text-xs text-red-800 dark:text-red-200 mt-3 font-bold">
                            💡 Use apenas se quiser começar completamente do zero.
                        </p>
                    </div>

                    {/* Campo de senha */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Digite sua senha para confirmar
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Sua senha"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
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
                            onClick={handleReset}
                            disabled={loading || !password}
                            className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            {loading ? 'Resetando...' : 'Resetar Tudo'}
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
