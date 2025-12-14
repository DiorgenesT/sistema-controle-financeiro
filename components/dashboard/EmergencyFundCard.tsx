'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserDataStatus, getInsightAvailabilityMessage, UserDataStatus } from '@/lib/utils/insightsHelper'
import { EmptyStateCard } from './EmptyStateCard'
import { emergencyFundService, EmergencyFundStatus } from '@/lib/services/emergency-fund.service'
import { Shield, Plus, TrendingUp, Building2, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BankSetupModal } from '@/components/goals/BankSetupModal'
import { ref, update } from 'firebase/database'
import { db } from '@/lib/firebase/config'

export function EmergencyFundCard() {
    const { user } = useAuth()
    const router = useRouter()
    const [data, setData] = useState<EmergencyFundStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [showBankSetup, setShowBankSetup] = useState(false)
    const [goalId, setGoalId] = useState<string | null>(null)
    const [dataStatus, setDataStatus] = useState<UserDataStatus | null>(null)
    const [checkingData, setCheckingData] = useState(true)

    useEffect(() => {
        checkMinimumData()
    }, [user])

    useEffect(() => {
        if (dataStatus?.hasMinimumData) {
            loadData()
        }
    }, [user, dataStatus])

    const checkMinimumData = async () => {
        if (!user) {
            setCheckingData(false)
            setLoading(false)
            return
        }

        try {
            const status = await checkUserDataStatus(user.uid)
            setDataStatus(status)

            // Se não tem dados mínimos, não precisa carregar
            if (!status.hasMinimumData) {
                setLoading(false)
            }
        } catch (error) {
            console.error('Erro ao verificar dados:', error)
            setLoading(false)
        } finally {
            setCheckingData(false)
        }
    }

    const loadData = async () => {
        if (!user) return

        try {
            setLoading(true)
            const result = await emergencyFundService.getStatus(user.uid)
            setData(result)

            // Se tem meta mas não tem banco configurado, mostrar modal
            if (result.hasGoal && result.goalInfo) {
                setGoalId(result.goalInfo.id)
                if (!result.goalInfo.bankName) {
                    // Pequeno delay para não aparecer muito rápido
                    setTimeout(() => setShowBankSetup(true), 500)
                }
            }
        } catch (error) {
            console.error('Erro ao carregar reserva de emergência:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveBank = async (bankName: string) => {
        if (!user || !goalId) return

        try {
            await update(ref(db, `users/${user.uid}/goals/${goalId}`), {
                bankName,
                isEmergencyFund: true
            })

            // Recarregar dados
            loadData()
        } catch (error) {
            console.error('Erro ao salvar banco:', error)
        }
    }

    if (checkingData || loading) {
        return (
            <Card className="animate-pulse h-[140px]">
                <div className="h-full bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    // Mostrar empty state se não tem dados suficientes
    if (!dataStatus?.hasMinimumData) {
        const message = getInsightAvailabilityMessage(dataStatus!, 'emergency')
        return (
            <EmptyStateCard
                icon={Shield}
                title="Reserva de Emergência"
                message={message}
                availableDate={dataStatus?.availableDate}
                hint="Vou calcular o valor ideal baseado nas suas despesas fixas!"
                className="h-auto"
            />
        )
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value)
    }

    const handleCreateGoal = async () => {
        if (!user) return

        try {
            await emergencyFundService.createEmergencyGoal(user.uid)
            router.push('/dashboard/goals')
        } catch (error) {
            console.error('Erro ao criar meta:', error)
        }
    }

    if (loading) {
        return (
            <Card className="animate-pulse h-[140px]">
                <div className="h-full bg-gray-200 dark:bg-slate-700 rounded" />
            </Card>
        )
    }

    if (!data) return null

    // Cor baseada em quantos meses cobre
    const getColor = () => {
        if (data.monthsCovered >= 6) return { from: '#10b981', to: '#059669' } // Verde
        if (data.monthsCovered >= 3) return { from: '#3b82f6', to: '#2563eb' } // Azul
        if (data.monthsCovered >= 1) return { from: '#f59e0b', to: '#d97706' } // Laranja
        return { from: '#ef4444', to: '#dc2626' } // Vermelho
    }

    const colors = getColor()

    return (
        <Card
            className="text-white border-none p-5 relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-[140px]"
            style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`
            }}
            onClick={() => data.hasGoal && router.push('/dashboard/goals')}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500" />

            <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Shield className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold opacity-90">Reserva Emergência</span>
                    </div>
                    {data.hasGoal && (
                        <div className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                            <span className="text-xs font-bold">{Math.floor(data.monthsCovered)} meses</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                {data.hasGoal ? (
                    <div className="flex-1 flex flex-col justify-center">
                        <p className="text-2xl font-black tracking-tight mb-1">
                            {formatCurrency(data.currentAmount)}
                        </p>
                        <div className="flex items-center gap-2 text-xs opacity-75">
                            <span>Meta: {formatCurrency(data.targetAmount)}</span>
                            <span>•</span>
                            <span>{Math.round(data.progress)}%</span>
                        </div>

                        {/* Banco */}
                        {data.goalInfo?.bankName ? (
                            <div className="flex items-center gap-1.5 mt-2 bg-white/15 rounded-lg px-2 py-1 w-fit">
                                <Building2 className="w-3 h-3" />
                                <span className="text-xs font-medium">
                                    {data.goalInfo.bankName}
                                    {data.goalInfo.accountInfo && ` • ${data.goalInfo.accountInfo}`}
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowBankSetup(true)
                                }}
                                className="flex items-center gap-1 mt-2 text-xs font-medium opacity-75 hover:opacity-100 transition-opacity"
                            >
                                <Settings className="w-3 h-3" />
                                Configurar banco
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-center">
                        <p className="text-sm font-semibold mb-2 opacity-90">
                            Crie sua reserva de segurança
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleCreateGoal()
                            }}
                            className="flex items-center gap-1 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors w-fit"
                        >
                            <Plus className="w-3 h-3" />
                            Criar Meta Automática
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Configuração de Banco */}
            <BankSetupModal
                isOpen={showBankSetup}
                onClose={() => setShowBankSetup(false)}
                onSave={handleSaveBank}
            />
        </Card>
    )
}
