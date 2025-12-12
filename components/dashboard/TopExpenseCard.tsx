'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { Flame, TrendingUp } from 'lucide-react'
import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction } from '@/types'

interface TopExpense {
    categoryId: string
    categoryName: string
    total: number
    percentage: number
}

export function TopExpenseCard() {
    const { user } = useAuth()
    const [data, setData] = useState<TopExpense | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        if (!user) return

        try {
            setLoading(true)
            const today = new Date()
            const month = today.getMonth()
            const year = today.getFullYear()

            // Buscar transações do mês
            const transactionsRef = ref(db, `users/${user.uid}/transactions`)
            const snapshot = await get(transactionsRef)

            if (!snapshot.exists()) {
                setData(null)
                return
            }

            const transactions: Transaction[] = Object.values(snapshot.val())

            // Filtrar despesas do mês atual
            const monthExpenses = transactions.filter(tx => {
                const txDate = new Date(tx.date)
                return tx.type === 'expense' &&
                    txDate.getMonth() === month &&
                    txDate.getFullYear() === year &&
                    tx.categoryId !== 'reserva-emergencia' // Ignorar reserva
            })

            if (monthExpenses.length === 0) {
                setData(null)
                return
            }

            // Agrupar por categoria
            const byCategory: { [key: string]: { total: number; name: string } } = {}
            let totalExpenses = 0

            monthExpenses.forEach(tx => {
                const catId = tx.categoryId || 'sem-categoria'
                // Usar o ID da categoria como nome temporário
                const catName = catId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

                if (!byCategory[catId]) {
                    byCategory[catId] = { total: 0, name: catName }
                }
                byCategory[catId].total += tx.amount
                totalExpenses += tx.amount
            })

            // Encontrar a maior
            let topCategory: TopExpense | null = null
            Object.entries(byCategory).forEach(([id, data]) => {
                if (!topCategory || data.total > topCategory.total) {
                    topCategory = {
                        categoryId: id,
                        categoryName: data.name,
                        total: data.total,
                        percentage: (data.total / totalExpenses) * 100
                    }
                }
            })

            setData(topCategory)
        } catch (error) {
            console.error('Erro ao carregar maior gasto:', error)
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

    if (loading) {
        return (
            <Card className="animate-pulse h-[140px]">
                <div className="h-full bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    if (!data) {
        return (
            <Card className="overflow-hidden h-[140px] flex flex-col bg-gradient-to-br from-orange-500 to-red-600 text-white border-none relative group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

                <div className="relative z-10 flex-1 flex flex-col justify-center items-center p-5 text-center">
                    <Flame className="w-8 h-8 mb-2 opacity-75" />
                    <p className="text-sm font-semibold opacity-90">
                        Nenhum gasto registrado
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden h-[140px] flex flex-col bg-gradient-to-br from-orange-500 to-red-600 text-white border-none relative group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 hover:-translate-y-1">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

            <div className="relative z-10 flex-1 flex flex-col justify-between p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Flame className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold opacity-90">Maior Gasto</span>
                    </div>
                    <div className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                        <span className="text-xs font-bold">{Math.round(data.percentage)}%</span>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 flex flex-col justify-center">
                    <p className="text-2xl font-black tracking-tight mb-1">
                        {formatCurrency(data.total)}
                    </p>
                    <p className="text-xs opacity-75 truncate">{data.categoryName}</p>
                </div>
            </div>
        </Card>
    )
}
