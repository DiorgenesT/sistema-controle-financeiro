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
import { DashboardCharts } from '@/components/charts/DashboardCharts'
import { MonthlyRetrospective } from '@/components/dashboard/MonthlyRetrospective'
import { SmartInsightsPanel } from '@/components/dashboard/SmartInsightsPanel'
import { SpendingByUserCard } from '@/components/dashboard/SpendingByUserCard'
import { WeatherAnimation } from '@/components/weather/WeatherAnimation'
import { useWeather } from '@/hooks/useWeather'
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
    const { user, userData } = useAuth()
    const { weather, loading: weatherLoading } = useWeather()
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
            {/* Hero Header com Clima */}
            <div className="relative overflow-hidden h-32 mb-8">
                {/* Animação de clima como background */}
                <WeatherAnimation
                    condition={weather?.condition || 'clear'}
                    isDay={weather?.isDay ?? true}
                />

                {/* Conteúdo do header */}
                <div className="relative max-w-7xl mx-auto px-6 py-6 z-10 h-full">
                    <div className="flex items-center justify-between h-full">
                        {/* Título e Saudação */}
                        <div>
                            <h1 className="text-3xl font-black text-white mb-1 tracking-tight drop-shadow-lg">
                                Visão Geral
                            </h1>
                            <p className="text-white/90 text-sm font-medium drop-shadow">
                                Bem-vindo de volta, {userData?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'}
                            </p>
                        </div>

                        {/* Direita - Data e Clima lado a lado */}
                        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
                            <div className="text-center">
                                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Hoje</p>
                                <p className="text-white text-sm font-bold">
                                    {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </p>
                            </div>
                            {!weatherLoading && weather && (
                                <div className="text-center border-l border-white/30 pl-3 hidden md:block">
                                    <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                                        Clima
                                    </p>
                                    <p className="text-white text-xl font-bold">
                                        {weather.temp}°C
                                    </p>
                                    <p className="text-white/70 text-xs capitalize">
                                        {weather.description}
                                    </p>
                                </div>
                            )}
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

                {/* Grid de 3 colunas - Retrospectiva, Gastos por Usuário (meio), Insights */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <MonthlyRetrospective />
                    <SpendingByUserCard />
                    <SmartInsightsPanel />
                </div>

                {/* Gráficos */}
                <div className="mt-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
                        Visualizações
                    </h2>
                    <DashboardCharts />
                </div>
            </div>
        </div>
    )
}
