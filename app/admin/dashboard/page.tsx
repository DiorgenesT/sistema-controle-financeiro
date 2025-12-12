'use client'

import { AdminRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shield, Users, Activity, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
    return (
        <AdminRoute>
            <AdminDashboardContent />
        </AdminRoute>
    )
}

function AdminDashboardContent() {
    const { userData, signOut } = useAuth()
    const router = useRouter()

    const handleLogout = async () => {
        await signOut()
        router.push('/admin/login')
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="bg-slate-800 shadow-lg border-b border-slate-700">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-blue-400" />
                        <h1 className="text-2xl font-bold text-white">
                            Painel Administrativo
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-slate-400">Administrador</p>
                            <p className="font-semibold text-white">{userData?.name}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Visão Geral do Sistema
                    </h2>
                    <p className="text-slate-400">
                        Gerencie usuários e monitore o sistema
                    </p>
                </div>

                {/* Cards de estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-slate-800 border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Total de Usuários</p>
                                <p className="text-3xl font-bold text-white">0</p>
                            </div>
                            <div className="p-3 bg-blue-500 rounded-lg">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-slate-800 border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Usuários Ativos</p>
                                <p className="text-3xl font-bold text-white">0</p>
                            </div>
                            <div className="p-3 bg-green-500 rounded-lg">
                                <Activity className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-slate-800 border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Sistema</p>
                                <p className="text-lg font-bold text-green-400">Operacional</p>
                            </div>
                            <div className="p-3 bg-teal-500 rounded-lg">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Ações rápidas */}
                <Card className="bg-slate-800 border-slate-700">
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Painel Administrativo
                        </h3>
                        <p className="text-slate-400 mb-8">
                            Gerencie os usuários do sistema
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => router.push('/admin/users')}
                            >
                                Gerenciar Usuários
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    )
}
