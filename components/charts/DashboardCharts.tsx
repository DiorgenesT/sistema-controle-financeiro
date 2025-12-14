'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/contexts/CategoryContext'
import { transactionService } from '@/lib/services/transaction.service'
import { Transaction } from '@/types'
import { ProjectionChart } from './ProjectionChart'
import { CategoryPieChart } from './CategoryPieChart'
import { MonthlyTrendChart } from './MonthlyTrendChart'
import { BalanceComparisonChart } from './BalanceComparisonChart'
import { calculateProjection, groupByCategory, getMonthlyData, getMonthlyBalanceData } from '@/lib/utils/chartHelpers'

export function DashboardCharts() {
    const { user } = useAuth()
    const { categories } = useCategories()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    // Carregar TODAS as transações para os gráficos
    useEffect(() => {
        const loadAllTransactions = async () => {
            if (!user) {
                setTransactions([])
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                // Buscar TODAS as transações (sem filtro de mês/ano)
                const data = await transactionService.getAll(user.uid)
                setTransactions(data)
            } catch (error) {
                console.error('Erro ao carregar transações para gráficos:', error)
            } finally {
                setLoading(false)
            }
        }

        loadAllTransactions()
    }, [user])

    // Calcular datas
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Preparar dados dos gráficos
    const projection = calculateProjection(transactions, currentMonth, nextMonth)
    const projectionData = [projection.current, projection.next]

    const categoryData = groupByCategory(transactions, categories)
    const monthlyData = getMonthlyData(transactions, 6)
    const balanceData = getMonthlyBalanceData(transactions, 6)

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2].map((i) => (
                    <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 h-96 animate-pulse" />
                        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 h-96 animate-pulse" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Linha 1: Projeção e Categorias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProjectionChart data={projectionData} />
                <CategoryPieChart data={categoryData} />
            </div>

            {/* Linha 2: Evolução e Saldo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MonthlyTrendChart data={monthlyData} />
                <BalanceComparisonChart data={balanceData} />
            </div>
        </div>
    )
}
