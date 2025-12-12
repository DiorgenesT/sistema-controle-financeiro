'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Shield, Lock, Mail } from 'lucide-react'

export default function AdminLoginPage() {
    const router = useRouter()
    const { signIn, isAdmin } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await signIn(email, password)

            // Verificar se é admin após login
            if (!isAdmin) {
                setError('Acesso negado. Você não tem permissão de administrador.')
                return
            }

            router.push('/admin/dashboard')
        } catch (err: any) {
            const errorMessages: Record<string, string> = {
                'auth/user-not-found': 'Usuário não encontrado',
                'auth/wrong-password': 'Senha incorreta',
                'auth/invalid-email': 'Email inválido',
                'auth/user-disabled': 'Usuário desativado',
                'auth/invalid-credential': 'Credenciais inválidas',
            }
            setError(errorMessages[err.code] || 'Erro ao fazer login. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
            <div className="w-full max-w-md">
                {/* Logo/Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-700/50 rounded-2xl mb-4 border border-slate-600">
                        <Shield className="w-10 h-10 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Painel Administrativo</h1>
                    <p className="text-slate-400">Sistema de Controle Financeiro</p>
                </div>

                {/* Form Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email de Administrador
                            </label>
                            <Input
                                type="email"
                                placeholder="admin@sistema.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Senha
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            isLoading={loading}
                        >
                            Acessar Painel
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-center text-sm text-slate-400">
                            Acesso restrito a administradores autorizados
                        </p>
                    </div>
                </div>

                {/* Link para login de usuário */}
                <div className="mt-6 text-center">
                    <a href="/login" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
                        Acessar como usuário →
                    </a>
                </div>
            </div>
        </div>
    )
}
