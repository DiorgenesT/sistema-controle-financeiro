'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, Flame, PiggyBank, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction } from '@/types'

interface InsightData {
    nextMonth: { total: number; count: number }
    topExpense: { name: string; amount: number; percentage: number }
    savings: { rate: number; amount: number }
    comparison: { change: number; trend: 'up' | 'down' | 'stable' }
}

export function QuickInsightsWidget() {
    const { user } = useAuth()
    const [data, setData] = useState<InsightData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        if (!user) return

        try {
            setLoading(true)
            const today = new Date()
            const currentMonth = today.getMonth()
            const currentYear = today.getFullYear()

            const transactionsRef = ref(db, `users/${user.uid}/transactions`)
            const snapshot = await get(transactionsRef)

            if (!snapshot.exists()) {
                setData({
                    nextMonth: { total: 0, count: 0 },
                    topExpense: { name: 'Nenhum gasto', amount: 0, percentage: 0 },
                    savings: { rate: 0, amount: 0 },
                    comparison: { change: 0, trend: 'stable' }
                })
                return
            }

            const transactions: Transaction[] = Object.values(snapshot.val())

            // Buscar categorias para obter nomes reais
            const categoriesRef = ref(db, `users/${user.uid}/categories`)
            const categoriesSnap = await get(categoriesRef)
            const categoriesMap = new Map<string, string>()
            
            if (categoriesSnap.exists()) {
                Object.entries(categoriesSnap.val()).forEach(([id, cat]: [string, any]) => {
                    categoriesMap.set(id, cat.name || 'Sem categoria')
                })
            }

            // 1. Próximo Mês
            const nextMonth = new Date(currentYear, currentMonth + 1, 1)
            const endOfNextMonth = new Date(currentYear, currentMonth + 2, 0, 23, 59, 59)
            const nextMonthExpenses = transactions.filter(tx =>
                tx.type === 'expense' &&
                !tx.isPaid &&
                tx.categoryId !== 'reserva-emergencia' &&
                tx.date >= nextMonth.getTime() &&
                tx.date <= endOfNextMonth.getTime()
            )
            const nextMonthTotal = nextMonthExpenses.reduce((sum, tx) => sum + tx.amount, 0)

            // 2. Maior Gasto
            const currentExpenses = transactions.filter(tx => {
                const txDate = new Date(tx.date)
                return tx.type === 'expense' &&
                    txDate.getMonth() === currentMonth &&
                    txDate.getFullYear() === currentYear &&
                    tx.categoryId !== 'reserva-emergencia'
            })

            const byCategory: { [key: string]: { total: number; name: string } } = {}
            let totalExpenses = 0
            currentExpenses.forEach(tx => {
                const catId = tx.categoryId || 'sem-categoria'
                const catName = categoriesMap.get(catId) || 'Sem categoria'
                if (!byCategory[catId]) byCategory[catId] = { total: 0, name: catName }
                byCategory[catId].total += tx.amount
                totalExpenses += tx.amount
            })

            let topExpense = { name: 'Nenhum gasto', amount: 0, percentage: 0 }
            Object.values(byCategory).forEach(cat => {
                if (cat.total > topExpense.amount) {
                    topExpense = {
                        name: cat.name,
                        amount: cat.total,
                        percentage: (cat.total / totalExpenses) * 100
                    }
                }
            })

            // 3. Taxa de Poupança
            const income = transactions
                .filter(tx => {
                    const txDate = new Date(tx.date)
                    return tx.type === 'income' && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
                })
                .reduce((sum, tx) => sum + tx.amount, 0)

            const savingsAmount = income - totalExpenses
            const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0

            // 4. Comparação Mensal
            const prevDate = new Date(currentYear, currentMonth - 1, 1)
            const prevMonth = prevDate.getMonth()
            const prevYear = prevDate.getFullYear()

            const prevExpenses = transactions
                .filter(tx => {
                    const txDate = new Date(tx.date)
                    return tx.type === 'expense' && txDate.getMonth() === prevMonth && txDate.getFullYear() === prevYear
                })
                .reduce((sum, tx) => sum + tx.amount, 0)

            const difference = totalExpenses - prevExpenses
            const percentageChange = prevExpenses > 0 ? (difference / prevExpenses) * 100 : 0
            const trend: 'up' | 'down' | 'stable' = Math.abs(percentageChange) > 5
                ? (difference > 0 ? 'up' : 'down')
                : 'stable'

            setData({
                nextMonth: { total: nextMonthTotal, count: nextMonthExpenses.length },
                topExpense,
                savings: { rate: savingsRate, amount: savingsAmount },
                comparison: { change: percentageChange, trend }
            })
        } catch (error) {
            console.error('Erro ao carregar insights:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value)
    }

    if (loading) {
        return (
            <Card className="animate-pulse h-[200px]">
                <div className="h-full bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    if (!data) return null

    return (
        <Card className="overflow-hidden bg-gradient-to-br from-white via-gray-50 to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border-2 border-gray-200 dark:border-slate-700 shadow-xl">
            {/* Header com gradiente */}
            <div className="relative px-6 py-5 border-b border-gray-200 dark:border-slate-700 overflow-hidden">
                {/* Background decorativo */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 dark:from-purple-500/5 dark:via-blue-500/5 dark:to-teal-500/5" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -mr-16 -mt-16" />

                <div className="relative flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
                            Insights Rápidos
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Visão geral do mês
                        </p>
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">4 métricas</span>
                    </div>
                </div>
            </div>

            {/* Lista de Insights com melhor visual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {/* Próximo Mês */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5 dark:from-red-500/10 dark:to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative px-4 py-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 group-hover:border-red-300 dark:group-hover:border-red-700 group-hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500/20 blur-lg rounded-full group-hover:blur-xl transition-all" />
                                    <div className="relative p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-base font-bold text-gray-900 dark:text-white">
                                            Próximo Mês
                                        </p>
                                        {data.nextMonth.count > 0 && (
                                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-full">
                                                {data.nextMonth.count}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {data.nextMonth.count === 0 ? 'Nenhuma despesa programada' : `${data.nextMonth.count} despesa(s) agendada(s)`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">
                                    {formatCurrency(data.nextMonth.total)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Maior Gasto */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 dark:from-orange-500/10 dark:to-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative px-4 py-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 group-hover:border-orange-300 dark:group-hover:border-orange-700 group-hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full group-hover:blur-xl transition-all" />
                                    <div className="relative p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                                        <Flame className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                        Maior Gasto
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[250px]">
                                        {data.topExpense.name}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">
                                    {formatCurrency(data.topExpense.amount)}
                                </p>
                                {data.topExpense.percentage > 0 && (
                                    <p className="text-sm text-orange-600 dark:text-orange-400 font-bold mt-0.5">
                                        {Math.round(data.topExpense.percentage)}% do total
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Taxa de Poupança */}
                <div className="relative group">
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${data.savings.rate >= 20 ? 'bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10' :
                        data.savings.rate >= 10 ? 'bg-gradient-to-r from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10' :
                            data.savings.rate >= 0 ? 'bg-gradient-to-r from-orange-500/5 to-amber-500/5 dark:from-orange-500/10 dark:to-amber-500/10' :
                                'bg-gradient-to-r from-red-500/5 to-rose-500/5 dark:from-red-500/10 dark:to-rose-500/10'
                        }`} />
                    <div className={`relative px-4 py-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 group-hover:shadow-lg transition-all duration-300 ${data.savings.rate >= 20 ? 'group-hover:border-green-300 dark:group-hover:border-green-700' :
                        data.savings.rate >= 10 ? 'group-hover:border-blue-300 dark:group-hover:border-blue-700' :
                            data.savings.rate >= 0 ? 'group-hover:border-orange-300 dark:group-hover:border-orange-700' :
                                'group-hover:border-red-300 dark:group-hover:border-red-700'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                    <div className={`absolute inset-0 blur-lg rounded-full group-hover:blur-xl transition-all ${data.savings.rate >= 20 ? 'bg-green-500/20' :
                                        data.savings.rate >= 10 ? 'bg-blue-500/20' :
                                            data.savings.rate >= 0 ? 'bg-orange-500/20' :
                                                'bg-red-500/20'
                                        }`} />
                                    <div className={`relative p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform ${data.savings.rate >= 20 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                        data.savings.rate >= 10 ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                                            data.savings.rate >= 0 ? 'bg-gradient-to-br from-orange-500 to-amber-600' :
                                                'bg-gradient-to-br from-red-500 to-rose-600'
                                        }`}>
                                        <PiggyBank className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                        Taxa de Poupança
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {data.savings.rate >= 0 ? 'Economizou' : 'Excedeu'} {formatCurrency(Math.abs(data.savings.amount))}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">
                                    {Math.abs(data.savings.rate).toFixed(1)}%
                                </p>
                                <p className={`text-sm font-bold mt-0.5 ${data.savings.rate >= 20 ? 'text-green-600 dark:text-green-400' :
                                    data.savings.rate >= 10 ? 'text-blue-600 dark:text-blue-400' :
                                        data.savings.rate >= 0 ? 'text-orange-600 dark:text-orange-400' :
                                            'text-red-600 dark:text-red-400'
                                    }`}>
                                    {data.savings.rate >= 20 ? 'Excelente!' : data.savings.rate >= 10 ? 'Bom!' : data.savings.rate >= 0 ? 'Regular' : 'Atenção!'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comparação Mensal */}
                <div className="relative group">
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${data.comparison.trend === 'down' ? 'bg-gradient-to-r from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10' :
                        data.comparison.trend === 'stable' ? 'bg-gradient-to-r from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10' :
                            'bg-gradient-to-r from-red-500/5 to-rose-500/5 dark:from-red-500/10 dark:to-rose-500/10'
                        }`} />
                    <div className={`relative px-4 py-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 group-hover:shadow-lg transition-all duration-300 ${data.comparison.trend === 'down' ? 'group-hover:border-green-300 dark:group-hover:border-green-700' :
                        data.comparison.trend === 'stable' ? 'group-hover:border-blue-300 dark:group-hover:border-blue-700' :
                            'group-hover:border-red-300 dark:group-hover:border-red-700'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                    <div className={`absolute inset-0 blur-lg rounded-full group-hover:blur-xl transition-all ${data.comparison.trend === 'down' ? 'bg-green-500/20' :
                                        data.comparison.trend === 'stable' ? 'bg-blue-500/20' :
                                            'bg-red-500/20'
                                        }`} />
                                    <div className={`relative p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform ${data.comparison.trend === 'down' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                        data.comparison.trend === 'stable' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                                            'bg-gradient-to-br from-red-500 to-rose-600'
                                        }`}>
                                        <BarChart3 className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                        vs Mês Anterior
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {data.comparison.trend === 'down' && 'Gastou menos 🎉'}
                                        {data.comparison.trend === 'up' && 'Gastou mais ⚠️'}
                                        {data.comparison.trend === 'stable' && 'Manteve estável'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${data.comparison.trend === 'down' ? 'bg-green-100 dark:bg-green-900/30' :
                                    data.comparison.trend === 'stable' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                        'bg-red-100 dark:bg-red-900/30'
                                    }`}>
                                    {data.comparison.trend === 'up' && <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />}
                                    {data.comparison.trend === 'down' && <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />}
                                    {data.comparison.trend === 'stable' && <Minus className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                </div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">
                                    {data.comparison.trend === 'up' ? '+' : data.comparison.trend === 'down' ? '-' : ''}
                                    {Math.abs(data.comparison.change).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}
