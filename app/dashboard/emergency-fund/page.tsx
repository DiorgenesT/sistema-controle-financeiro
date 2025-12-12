'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useAccounts } from '@/contexts/AccountContext'
import { emergencyFundService, EmergencyFundStatus } from '@/lib/services/emergency-fund.service'
import { accountService } from '@/lib/services/account.service'
import { goalService } from '@/lib/services/goal.service'
import { ProgressRing } from '@/components/emergency/ProgressRing'
import { MonthsCoverage } from '@/components/emergency/MonthsCoverage'
import { ContributionHistory } from '@/components/emergency/ContributionHistory'
import { AddContributionModal } from '@/components/emergency/AddContributionModal'
import { WithdrawFromReserveModal } from '@/components/emergency/WithdrawFromReserveModal'
import {
    Shield,
    DollarSign,
    TrendingUp,
    Calendar,
    Target,
    Plus,
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    ArrowDownLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EmergencyFundPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <EmergencyFundContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function EmergencyFundContent() {
    const { user } = useAuth()
    const router = useRouter()
    const { activeAccounts } = useAccounts()
    const [status, setStatus] = useState<EmergencyFundStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
    const [goal, setGoal] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [user])

    // Buscar contributions da meta se existir
    useEffect(() => {
        const fetchGoal = async () => {
            if (!user || !status?.goalId) return

            try {
                const goalData = await goalService.getById(status.goalId)
                setGoal(goalData)
            } catch (error) {
                console.error('Erro ao carregar meta:', error)
            }
        }

        fetchGoal()
    }, [user, status?.goalId])

    const loadData = async () => {
        if (!user) return

        try {
            setLoading(true)

            // Carregar status
            const fundStatus = await emergencyFundService.getStatus(user.uid)

            // Se não tem meta, criar automaticamente
            if (!fundStatus.hasGoal) {
                await emergencyFundService.createEmergencyGoal(user.uid)
                // Recarregar após criar
                const newStatus = await emergencyFundService.getStatus(user.uid)
                setStatus(newStatus)
            } else {
                setStatus(fundStatus)
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddContribution = async (accountId: string, amount: number) => {
        if (!user || !status?.goalId) return

        try {
            // Transferir de conta para meta
            await accountService.transferToGoal(user.uid, accountId, status.goalId, amount)

            // Recarregar dados da página
            await loadData()

            // Forçar reload da página para atualizar todos os dados do dashboard
            window.location.reload()
        } catch (error) {
            console.error('Erro ao adicionar contribuição:', error)
            throw error
        }
    }

    const handleWithdraw = async (accountId: string, amount: number) => {
        if (!user || !status?.goalId) return

        try {
            // Sacar da reserva para conta
            await accountService.withdrawFromGoal(user.uid, accountId, status.goalId, amount)

            // Recarregar dados da página
            await loadData()

            // Forçar reload da página para atualizar todos os dados do dashboard
            window.location.reload()
        } catch (error) {
            console.error('Erro ao sacar da reserva:', error)
            throw error
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        )
    }

    if (!status) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600 dark:text-gray-400">Erro ao carregar dados</p>
            </div>
        )
    }

    const progress = status.progress
    const remaining = status.targetAmount - status.currentAmount
    const contributions = goal?.contributions || []

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Header com back button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            Reserva de Emergência
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Sua rede de segurança financeira
                        </p>
                    </div>
                </div>

                {/* Cards de Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Atual */}
                    <Card className="p-6 bg-gradient-to-br from-teal-600 to-cyan-600 text-white border-none">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold opacity-90">Valor Atual</span>
                        </div>
                        <p className="text-3xl font-black">{formatCurrency(status.currentAmount)}</p>
                    </Card>

                    {/* Meta */}
                    <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-none">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Target className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold opacity-90">Meta</span>
                        </div>
                        <p className="text-3xl font-black">{formatCurrency(status.targetAmount)}</p>
                        <p className="text-xs opacity-75 mt-1">6 meses de despesas</p>
                    </Card>

                    {/* Faltam */}
                    <Card className="p-6 bg-gradient-to-br from-orange-600 to-amber-600 text-white border-none">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold opacity-90">Faltam</span>
                        </div>
                        <p className="text-3xl font-black">{formatCurrency(remaining)}</p>
                    </Card>

                    {/* Meses Cobertos */}
                    <Card className="p-6 bg-gradient-to-br from-green-600 to-emerald-600 text-white border-none">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Shield className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold opacity-90">Meses Cobertos</span>
                        </div>
                        <p className="text-3xl font-black">{status.monthsCovered.toFixed(1)}</p>
                        <p className="text-xs opacity-75 mt-1">de 6 meses</p>
                    </Card>
                </div>

                {/* Visualizações */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Progress Ring */}
                    <Card className="p-4">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                            Progresso Geral
                        </h2>
                        <div className="flex justify-center py-2">
                            <ProgressRing progress={progress} size={140} />
                        </div>
                    </Card>

                    {/* Sugestões */}
                    <Card className="p-4">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                            Sugestões Inteligentes
                        </h2>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                                <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                        Contribuição Sugerida
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                        {formatCurrency(status.suggestedContribution)}/mês
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                        Tempo Estimado
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                        {Math.ceil(status.daysToTarget / 30)} meses para atingir meta
                                    </p>
                                </div>
                            </div>

                            {status.monthsCovered >= 6 ? (
                                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
                                            Meta Atingida! 🎉
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                                            Você está protegido!
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                            Continue Contribuindo
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                            Faltam {(6 - status.monthsCovered).toFixed(1)} meses de proteção
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Meses Cobertos */}
                <Card className="p-8">
                    <MonthsCoverage monthsCovered={status.monthsCovered} />
                </Card>

                {/* Histórico */}
                <ContributionHistory contributions={contributions} />

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                    >
                        <Plus className="w-6 h-6" />
                        Adicionar Contribuição
                    </button>

                    {status.currentAmount > 0 && (
                        <button
                            onClick={() => setIsWithdrawModalOpen(true)}
                            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                        >
                            <ArrowDownLeft className="w-6 h-6" />
                            Sacar da Reserva
                        </button>
                    )}
                </div>
            </div>

            {/* Modal de Adicionar */}
            <AddContributionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleAddContribution}
                accounts={activeAccounts}
                currentAmount={status.currentAmount}
                targetAmount={status.targetAmount}
            />

            {/* Modal de Sacar */}
            <WithdrawFromReserveModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                onConfirm={handleWithdraw}
                accounts={activeAccounts}
                currentAmount={status.currentAmount}
                monthsCovered={status.monthsCovered}
            />
        </div>
    )
}
