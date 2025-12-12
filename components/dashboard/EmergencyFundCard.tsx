'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { emergencyFundService, EmergencyFundStatus } from '@/lib/services/emergency-fund.service'
import { Shield, Plus, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function EmergencyFundCard() {
    const { user } = useAuth()
    const router = useRouter()
    const [data, setData] = useState<EmergencyFundStatus | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        if (!user) return

        try {
            setLoading(true)
            const result = await emergencyFundService.getStatus(user.uid)
            setData(result)
        } catch (error) {
            console.error('Erro ao carregar reserva de emergência:', error)
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
        </Card>
    )
}
