'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { useAccounts } from '@/contexts/AccountContext'
import { DueSoonAlert } from '@/components/dashboard/DueSoonAlert'
import { AlertsCarousel } from '@/components/dashboard/AlertsCarousel'
import { QuickInsightsWidget } from '@/components/dashboard/QuickInsightsWidget'
import { GoalsCarouselCompact } from '@/components/dashboard/GoalsCarouselCompact'
import { HealthInsightsCarousel } from '@/components/dashboard/HealthInsightsCarousel'
import { IncomeExpenseCarousel } from '@/components/dashboard/IncomeExpenseCarousel'
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <DashboardContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function DashboardContent() {
    const { user } = useAuth()
    const { stats } = useTransactions()
    const { activeAccounts } = useAccounts()

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const totalBalance = activeAccounts
        .filter(account => account.includeInTotal ?? true)
        .reduce((sum, account) => sum + account.currentBalance, 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-700 dark:to-cyan-700 mb-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -ml-48 -mt-48" />
                    <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full -mr-36 -mb-36" />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
                                Visão Geral
                            </h1>
                            <p className="text-teal-100 text-sm font-medium">
                                Bem-vindo de volta, {user?.displayName?.split(' ')[0] || 'Usuário'}
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl">
                            <div className="text-right">
                                <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider">Hoje</p>
                                <p className="text-white text-sm font-bold">
                                    {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                {/* Alertas */}
                <div className="mb-8 space-y-4">
                    <AlertsCarousel />
                    <DueSoonAlert />
                </div>

                {/* Cards Principais - Grid 4 colunas com carousels */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Saldo Total */}
                    <Card className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white border-none p-5 relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/30 hover:-translate-y-1 h-[140px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />

                        <div className="relative h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Wallet className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold opacity-90">Saldo Total</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-2xl font-black tracking-tight mb-1">{formatCurrency(totalBalance)}</p>
                                <p className="text-xs opacity-75">Todas as contas</p>
                            </div>
                        </div>
                    </Card>

                    {/* Receitas/Despesas - Carousel */}
                    <IncomeExpenseCarousel
                        income={stats?.income || 0}
                        expense={stats?.expense || 0}
                    />

                    {/* Saúde Financeira - Carousel */}
                    <HealthInsightsCarousel />

                    {/* Metas - Carousel */}
                    <GoalsCarouselCompact />
                </div>

                {/* Segunda linha - Insights Unificado */}
                <QuickInsightsWidget />
            </div>
        </div>
    )
}
