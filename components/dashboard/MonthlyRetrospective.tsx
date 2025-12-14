'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { useCategories } from '@/contexts/CategoryContext'
import { useFamilyMembers } from '@/contexts/FamilyContext'
import { checkUserDataStatus, getInsightAvailabilityMessage, UserDataStatus } from '@/lib/utils/insightsHelper'
import { EmptyStateCard } from './EmptyStateCard'
import {
    calculateMonthlyRetrospective,
    getExpensesByCard,
    getExpensesByMember,
    getSpendingPatterns
} from '@/lib/utils/monthlyRetrospective'
import {
    TrendingUp,
    TrendingDown,
    Award,
    Calendar,
    Target,
    DollarSign,
    AlertCircle,
    CreditCard,
    Users,
    BarChart3,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

export function MonthlyRetrospective() {
    const { user } = useAuth()
    const { transactions } = useTransactions()
    const { categories } = useCategories()
    const { members } = useFamilyMembers()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [dataStatus, setDataStatus] = useState<UserDataStatus | null>(null)
    const [checkingData, setCheckingData] = useState(true)

    useEffect(() => {
        const checkData = async () => {
            if (!user) {
                setCheckingData(false)
                return
            }

            try {
                const status = await checkUserDataStatus(user.uid)
                setDataStatus(status)
            } catch (error) {
                console.error('Erro ao verificar dados:', error)
            } finally {
                setCheckingData(false)
            }
        }

        checkData()
    }, [user])

    if (checkingData) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 p-6 shadow-xl animate-pulse">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
        )
    }

    // Mostrar empty state se não tem dados suficientes
    if (!dataStatus?.hasMinimumData) {
        const message = getInsightAvailabilityMessage(dataStatus!, 'retrospective')
        return (
            <EmptyStateCard
                icon={Calendar}
                title="Retrospectiva Mensal"
                message={message}
                availableDate={dataStatus?.availableDate}
                hint="Complete seu primeiro mês para ver análises detalhadas!"
            />
        )
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 p-6 shadow-xl">
                <div className="text-center py-8">
                    <Calendar className="w-16 h-16 mx-auto text-indigo-300 dark:text-indigo-700 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Nenhuma Transação Encontrada</h3>
                    <p className="text-gray-500 dark:text-gray-400">Adicione transações para ver a retrospectiva mensal</p>
                </div>
            </div>
        )
    }

    const data = calculateMonthlyRetrospective(transactions, categories)
    const cardData = getExpensesByCard(transactions)
    const memberData = getExpensesByMember(transactions, members)
    const patterns = getSpendingPatterns(transactions)

    const slides = [
        { id: 'geral', name: 'Resumo Geral', icon: Calendar },
        { id: 'cartoes', name: 'Por Cartão', icon: CreditCard },
        { id: 'membros', name: 'Por Pessoa', icon: Users },
        { id: 'padroes', name: 'Padrões', icon: BarChart3 }
    ]

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

    if (data.totalIncome === 0 && data.totalExpense === 0) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 p-6 shadow-xl">
                <div className="text-center py-8">
                    <Calendar className="w-16 h-16 mx-auto text-indigo-300 dark:text-indigo-700 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Retrospectiva de {data.monthName}</h3>
                    <p className="text-gray-500 dark:text-gray-400">Nenhuma transação registrada neste mês</p>
                </div>
            </div>
        )
    }

    const isPositive = data.balance >= 0

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 shadow-xl overflow-hidden h-full flex flex-col">
            {/* Header com navegação */}
            <div className="flex items-center justify-between p-4 border-b border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Retrospectiva
                        </h2>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{data.monthName}</p>
                    </div>
                </div>

                {/* Saldo Badge */}
                <div className={`px-3 py-1.5 rounded-lg ${isPositive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                    <div className="flex items-center gap-1.5">
                        {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-bold">{formatCurrency(Math.abs(data.balance))}</span>
                    </div>
                </div>
            </div>

            {/* Navegação de Slides */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/50 dark:bg-gray-700/30 border-b border-indigo-100 dark:border-indigo-900">
                <button
                    onClick={prevSlide}
                    className="p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </button>

                <div className="flex gap-2">
                    {slides.map((slide, index) => {
                        const Icon = slide.icon
                        return (
                            <button
                                key={slide.id}
                                onClick={() => setCurrentSlide(index)}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${currentSlide === index
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium hidden sm:inline">{slide.name}</span>
                            </button>
                        )
                    })}
                </div>

                <button
                    onClick={nextSlide}
                    className="p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </button>
            </div>

            {/* Conteúdo dos Slides */}
            <div className="p-6">
                {/* Slide 1: Resumo Geral */}
                {currentSlide === 0 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Resumo Financeiro */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-green-200 dark:border-green-900/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Receitas</span>
                                    {data.comparison.incomeChange !== 0 && (
                                        <div className={`flex items-center gap-1 text-xs ${data.comparison.incomeChange > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {data.comparison.incomeChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs(data.comparison.incomeChange).toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.totalIncome)}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-red-200 dark:border-red-900/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas</span>
                                    {data.comparison.expenseChange !== 0 && (
                                        <div className={`flex items-center gap-1 text-xs ${data.comparison.expenseChange > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                            {data.comparison.expenseChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs(data.comparison.expenseChange).toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.totalExpense)}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-indigo-200 dark:border-indigo-900/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Economia</span>
                                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.balancePercent.toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* Top 3 Categorias e Destaques */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-500" />
                                    Top 3 Categorias
                                </h3>
                                <div className="space-y-2">
                                    {data.topCategories.length > 0 ? (
                                        data.topCategories.map((cat, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{cat.icon}</span>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(cat.amount)}</p>
                                                    <p className="text-xs text-gray-500">{cat.percent.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma despesa registrada</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-purple-500" />
                                    Destaques
                                </h3>
                                <div className="space-y-3">
                                    {data.highlights.biggestIncome && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Maior Receita</p>
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(data.highlights.biggestIncome.amount)}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{data.highlights.biggestIncome.description}</p>
                                        </div>
                                    )}

                                    {data.highlights.biggestExpense && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Maior Despesa</p>
                                            <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(data.highlights.biggestExpense.amount)}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{data.highlights.biggestExpense.description}</p>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Dias sem gastos</span>
                                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{data.highlights.daysWithoutExpenses}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {data.comparison.balanceChange !== 0 && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                                <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>
                                        Seu saldo {data.comparison.balanceChange > 0 ? 'melhorou' : 'piorou'} {Math.abs(data.comparison.balanceChange).toFixed(1)}%
                                        comparado a dois meses atrás
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Slide 2: Por Cartão */}
                {currentSlide === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-indigo-600" />
                            Gastos por Cartão
                        </h3>
                        {cardData.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cardData.map((card, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-5 h-5 text-indigo-600" />
                                                <span className="font-bold text-gray-900 dark:text-white">{card.cardName}</span>
                                            </div>
                                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                                                {card.count} transações
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(card.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <CreditCard className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">Nenhuma despesa com cartão registrada</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Slide 3: Por Membro */}
                {currentSlide === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-600" />
                            Gastos por Pessoa
                        </h3>
                        {memberData.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {memberData.map((member, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                    {member.memberName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-900 dark:text-white">{member.memberName}</span>
                                            </div>
                                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                                                {member.count} transações
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(member.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">Nenhum membro associado às despesas</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Slide 4: Padrões */}
                {currentSlide === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                            Padrões de Gastos
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Por Dia da Semana */}
                            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-3">Por Dia da Semana</h4>
                                <div className="space-y-2">
                                    {patterns.byWeekday.map((day, index) => {
                                        const maxAmount = Math.max(...patterns.byWeekday.map(d => d.amount))
                                        const percentage = (day.amount / maxAmount) * 100
                                        return (
                                            <div key={index}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{day.day}</span>
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(day.amount)}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Por Semana do Mês */}
                            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-3">Por Semana</h4>
                                <div className="space-y-3">
                                    {patterns.byWeek.map((week, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{week.week}</span>
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(week.amount)}</span>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Média por dia</span>
                                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(patterns.averagePerDay)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
