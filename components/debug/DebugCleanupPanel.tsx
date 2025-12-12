'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Trash2, AlertTriangle } from 'lucide-react'
import { ref, remove } from 'firebase/database'
import { db } from '@/lib/firebase/config'

export function DebugCleanupPanel() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const cleanupDatabase = async () => {
        if (!user) return

        if (!confirm('⚠️ ATENÇÃO! Isso vai APAGAR TUDO (transações, metas, cartões). Tem certeza?')) {
            return
        }

        try {
            setLoading(true)
            setMessage('Limpando...')

            // Apagar tudo
            await Promise.all([
                remove(ref(db, `users/${user.uid}/transactions`)),
                remove(ref(db, `users/${user.uid}/goals`)),
                remove(ref(db, `users/${user.uid}/creditCards`)),
                remove(ref(db, `users/${user.uid}/invoices`))
            ])

            setMessage('✅ Banco limpo! Recarregue a página.')

            setTimeout(() => {
                window.location.reload()
            }, 2000)
        } catch (error) {
            console.error(error)
            setMessage('❌ Erro ao limpar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="font-bold text-red-900 dark:text-red-100 mb-2">
                        🛠️ Painel de Limpeza (Debug)
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Use apenas se quiser começar do zero. Isso apaga TUDO do banco de dados.
                    </p>
                    <button
                        onClick={cleanupDatabase}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        {loading ? 'Limpando...' : 'Limpar Tudo'}
                    </button>
                    {message && (
                        <p className="mt-3 text-sm font-semibold text-red-900 dark:text-red-100">
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    )
}
