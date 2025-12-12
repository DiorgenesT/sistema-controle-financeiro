'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react'
import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction } from '@/types'

interface SavingsData {
    income: number
    expenses: number
    savingsAmount: number
    savingsRate: number // %
}

export function SavingsRateCard() {
    const { user } = useAuth()
    const [data, setData] = useState<SavingsData | null>(null)
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

            let income = 0
            let expenses = 0

            transactions.forEach(tx => {
                const txDate = new Date(tx.date)
                if (txDate.getMonth() === month && txDate.getFullYear() === year) {
                    if (tx.type === 'income') {
                        income += tx.amount
                    } else if (tx.type === 'expense') {
                        expenses += tx.amount
                    }
                }
            })

            const savingsAmount = income - expenses
            const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0

            setData({
                income,
                expenses,
                savingsAmount,
                savingsRate
            })
        } catch (error) {
            console.error('Erro ao carregar taxa de poupança:', error)
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

    const getColor = () => {
        if (!data) return { from: 'from-gray-500', to: 'to-gray-600', shadow: 'hover:shadow-gray-500/30' }
        if (data.savingsRate >= 20) return { from: 'from-green-500', to: 'to-emerald-600', shadow: 'hover:shadow-green-500/30' }
        if (data.savingsRate >= 10) return { from: 'from-blue-500', to: 'to-blue-600', shadow: 'hover:shadow-blue-500/30' }
        if (data.savingsRate >= 0) return { from: 'from-orange-500', to: 'to-orange-600', shadow: 'hover:shadow-orange-500/30' }
        return { from: 'from-red-500', to: 'to-red-600', shadow: 'hover:shadow-red-500/30' }
    }

    if (loading) {
        return (
            <Card className="animate-pulse h-[140px]">
                <div className="h-full bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    const colors = getColor()

    return (
        <Card className={`overflow-hidden h-[140px] flex flex-col bg-gradient-to-br ${colors.from} ${colors.to} text-white border-none relative group cursor-pointer transition-all duration-300 hover:shadow-2xl ${colors.shadow} hover:-translate-y-1`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

            <div className="relative z-10 flex-1 flex flex-col justify-between p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <PiggyBank className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold opacity-90">Taxa de Poupança</span>
                    </div>
                    <div className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-1">
                        {data && data.savingsRate >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 flex flex-col justify-center">
                    {data && data.income > 0 ? (
                        <>
                            <p className="text-2xl font-black tracking-tight mb-1">
                                {Math.abs(data.savingsRate).toFixed(1)}%
                            </p>
                            <p className="text-xs opacity-75">
                                {data.savingsRate >= 0 ? 'Economizou ' : 'Excedeu em '}{formatCurrency(Math.abs(data.savingsAmount))}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm font-semibold opacity-90">
                            Nenhuma receita registrada
                        </p>
                    )}
                </div>
            </div>
        </Card>
    )
}
