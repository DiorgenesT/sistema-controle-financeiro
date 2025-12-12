'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function OnboardingCheck({ children }: { children: ReactNode }) {
    const { userData, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Não verificar se estiver carregando, já na página de onboarding, ou em páginas públicas
        if (loading) return
        if (pathname === '/onboarding') return
        if (pathname === '/login' || pathname === '/register' || pathname === '/') return

        // Se usuário logado e perfil incompleto, redirecionar
        if (userData && !userData.profileCompleted) {
            router.push('/onboarding')
        }
    }, [userData, loading, pathname, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    // Se perfil incompleto e não está na página de onboarding, não renderizar
    if (userData && !userData.profileCompleted && pathname !== '/onboarding') {
        return null
    }

    return <>{children}</>
}
