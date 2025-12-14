'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Wallet, Mail, Lock, TrendingUp, Shield, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const { signIn, isAdmin } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    // Efeito parallax sutil
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX - window.innerWidth / 2) / 50,
                y: (e.clientY - window.innerHeight / 2) / 50
            })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await signIn(email, password)
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
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
            {/* Background premium com mesh gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950" />

            {/* Mesh gradient overlay */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `
                        radial-gradient(at 0% 0%, hsla(253,100%,50%,0.3) 0px, transparent 50%),
                        radial-gradient(at 100% 0%, hsla(280,100%,50%,0.2) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, hsla(200,100%,50%,0.2) 0px, transparent 50%),
                        radial-gradient(at 0% 100%, hsla(300,100%,50%,0.3) 0px, transparent 50%)
                    `
                }}
            />

            {/* Grid pattern sutil */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Elementos flutuantes com parallax */}
            <div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse"
                style={{
                    transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
                    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            />
            <div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse"
                style={{
                    transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
                    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    animationDelay: '1s'
                }}
            />

            {/* Container principal */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-8 items-center min-h-screen">

                {/* Lado esquerdo - Brand & Features */}
                <div className="hidden lg:flex flex-col justify-center space-y-6">
                    {/* Logo & Título */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                <Wallet className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-white/90">
                                Sistema Financeiro Inteligente
                            </span>
                        </div>

                        <h1 className="text-5xl font-black leading-tight tracking-tight">
                            <span className="block text-white">Domine suas</span>
                            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                                Finanças
                            </span>
                        </h1>

                        <p className="text-base text-slate-400 leading-relaxed max-w-md">
                            Análises inteligentes e controle total do seu dinheiro.
                        </p>
                    </div>

                    {/* Features premium - reduzido para 2 */}
                    <div className="space-y-3">
                        {[
                            {
                                icon: TrendingUp,
                                title: 'Insights IA',
                                desc: 'Análises preditivas personalizadas',
                                color: 'from-purple-500 to-pink-500'
                            },
                            {
                                icon: Zap,
                                title: 'Tempo Real',
                                desc: 'Sincronização instantânea',
                                color: 'from-amber-500 to-orange-500'
                            }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                            >
                                <div className={`p-2 bg-gradient-to-br ${feature.color} rounded-lg shadow-lg group-hover:scale-110 transition-all`}>
                                    <feature.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lado direito - Form sublime */}
                <div className="w-full max-w-md mx-auto lg:mx-0">
                    {/* Header mobile */}
                    <div className="lg:hidden text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-3 shadow-2xl">
                            <Wallet className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-1">Controle Financeiro</h1>
                        <p className="text-slate-400 text-xs">Sistema Inteligente</p>
                    </div>

                    {/* Card de login premium */}
                    <div className="relative group">
                        {/* Brilho animado de fundo */}
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-20 blur-lg group-hover:opacity-30 transition-all duration-1000 animate-pulse" />

                        {/* Card principal com glassmorphism premium */}
                        <div className="relative bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-white mb-1">
                                    Bem-vindo de volta
                                </h2>
                                <p className="text-slate-400 text-xs">
                                    Entre com suas credenciais
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="relative p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-xl animate-shake">
                                        <p className="text-sm text-red-400 font-medium text-center">{error}</p>
                                    </div>
                                )}

                                {/* Email field */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-300">
                                        Email
                                    </label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="w-4 h-4 text-slate-500 group-focus-within/input:text-purple-400 transition-colors duration-200" />
                                        </div>
                                        <Input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-3 h-11 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl text-sm focus:bg-slate-800 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password field */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-300">
                                        Senha
                                    </label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="w-4 h-4 text-slate-500 group-focus-within/input:text-purple-400 transition-colors duration-200" />
                                        </div>
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 h-11 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl text-sm focus:bg-slate-800 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-purple-400 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Login button premium */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="relative w-full h-11 mt-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group/btn"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Entrar
                                                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-700/50" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-3 bg-slate-900/90 text-slate-500 text-[11px]">
                                        Novo por aqui?
                                    </span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center">
                                <p className="text-xs text-slate-400">
                                    Entre em contato com{' '}
                                    <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        o administrador
                                    </span>
                                    {' '}para criar sua conta
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Link admin */}
                    <div className="mt-4 text-center">
                        <a
                            href="/admin/login"
                            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-medium group"
                        >
                            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                            Acesso administrativo
                        </a>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                .animate-shake {
                    animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
                }
            `}</style>
        </div>
    )
}
