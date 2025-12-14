'use client'

import { useTransactions } from '@/contexts/TransactionContext'
import { useFamilyMembers } from '@/contexts/FamilyContext'
import { useAuth } from '@/contexts/AuthContext'
import { Users, User, TrendingDown } from 'lucide-react'
import { useMemo } from 'react'

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

export function SpendingByUserCard() {
    const { transactions } = useTransactions()
    const { members } = useFamilyMembers()
    const { user, userData } = useAuth()

    const spendingByUser = useMemo(() => {
        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()

        // Filtrar despesas do mês atual
        const monthExpenses = transactions.filter(t => {
            const tDate = new Date(t.date)
            return t.type === 'expense' &&
                t.isPaid &&
                tDate.getMonth() === thisMonth &&
                tDate.getFullYear() === thisYear
        })

        // Calcular gastos por pessoa
        const spendingMap = new Map<string, { name: string; amount: number; color: string }>()

        // Inicializar com o próprio usuário
        spendingMap.set(user?.uid || 'user', {
            name: userData?.name || 'Você',
            amount: 0,
            color: '#3b82f6' // blue
        })

        // Inicializar membros da família
        members.forEach((member, index) => {
            const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f43f5e']
            spendingMap.set(member.id, {
                name: member.name,
                amount: 0,
                color: colors[index % colors.length]
            })
        })

        // Família
        spendingMap.set('family', {
            name: 'Família',
            amount: 0,
            color: '#6366f1' // indigo
        })

        // Somar gastos
        monthExpenses.forEach(expense => {
            const assignedTo = expense.assignedTo || user?.uid || 'user'
            const current = spendingMap.get(assignedTo)
            if (current) {
                current.amount += expense.amount
            }
        })

        // Converter para array e ordenar por valor
        return Array.from(spendingMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .filter(item => item.amount > 0)
            .sort((a, b) => b.amount - a.amount)
    }, [transactions, members, user, userData])

    const totalSpending = spendingByUser.reduce((sum, item) => sum + item.amount, 0)

    if (spendingByUser.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
                    Gastos por Usuário
                </h3>
                <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        Nenhuma despesa registrada este mês
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
                    Gastos por Usuário
                </h3>
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">
                        {new Date().toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                </div>
            </div>

            {/* Lista de usuários */}
            <div className="space-y-2.5">
                {spendingByUser.map((item, index) => {
                    const percentage = (item.amount / totalSpending) * 100

                    return (
                        <div
                            key={item.id}
                            className="group relative bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:shadow-md transition-all duration-300"
                        >
                            {/* Ranking badge */}
                            {index < 3 && (
                                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-black shadow-lg">
                                    {index + 1}
                                </div>
                            )}

                            <div className="flex items-center gap-2.5">
                                {/* Avatar colorido */}
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                >
                                    {item.name === 'Família' ? (
                                        <Users className="w-4 h-4" />
                                    ) : (
                                        <span className="text-sm">{item.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                            {item.name}
                                        </span>
                                        <span className="text-sm font-black text-red-600 dark:text-red-400 ml-2">
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>

                                    {/* Barra de progresso */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-500 rounded-full"
                                            style={{
                                                width: `${percentage}%`,
                                                background: `linear-gradient(to right, ${item.color}, ${item.color}dd)`
                                            }}
                                        />
                                    </div>

                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                                        {percentage.toFixed(1)}% do total
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Total */}
            <div className="mt-4 pt-3 border-t-2 border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Total
                        </span>
                    </div>
                    <span className="text-lg font-black text-red-600 dark:text-red-400">
                        {formatCurrency(totalSpending)}
                    </span>
                </div>
            </div>
        </div>
    )
}
