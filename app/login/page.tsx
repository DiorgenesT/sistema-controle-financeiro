'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Wallet, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
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

            // Redirecionar baseado no role
            if (isAdmin) {
                router.push('/admin/dashboard')
            } else {
                router.push('/dashboard')
            }
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-500 to-purple-600 px-4">
            <div className="w-full max-w-md">
                {/* Logo/Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 border-2 border-white/30">
                        <Wallet className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Controle suas Finanças</h1>
                    <p className="text-white/80 text-lg">Sistema Inteligente de Gestão Financeira</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Bem-vindo de volta!
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email
                            </label>
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Senha
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                            isLoading={loading}
                        >
                            Entrar
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-600">
                            Entre em contato com o administrador para criar sua conta
                        </p>
                    </div>
                </div>

                {/* Link para login admin */}
                <div className="mt-6 text-center">
                    <a href="/admin/login" className="text-sm text-white/80 hover:text-white transition-colors">
                        ← Acesso administrativo
                    </a>
                </div>
            </div>
        </div>
    )
}
