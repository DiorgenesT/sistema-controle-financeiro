'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ResetDatabaseModal } from '@/components/debug/ResetDatabaseModal'
import {
    LayoutDashboard,
    Tags,
    Wallet,
    ArrowLeftRight,
    Target,
    Shield,
    CreditCard,
    LogOut,
    User,
    Trash2
} from 'lucide-react'

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Tags, label: 'Categorias', href: '/dashboard/categories' },
    { icon: Wallet, label: 'Contas', href: '/dashboard/accounts' },
    { icon: ArrowLeftRight, label: 'Transações', href: '/dashboard/transactions' },
    { icon: Target, label: 'Metas', href: '/dashboard/goals' },
    { icon: Shield, label: 'Reserva', href: '/dashboard/emergency-fund' },
    { icon: CreditCard, label: 'Cartões', href: '/dashboard/cards' },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { userData, signOut } = useAuth()
    const [isResetModalOpen, setIsResetModalOpen] = useState(false)

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    // Saudação dinâmica baseada no horário
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Bom dia'
        if (hour < 18) return 'Boa tarde'
        return 'Boa noite'
    }

    return (
        <>
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col h-screen sticky top-0">
                {/* Perfil do Usuário no Topo */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <button
                        onClick={() => router.push('/dashboard/profile')}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all group"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                {getGreeting()},
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                                {userData?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {userData?.email}
                            </p>
                        </div>
                    </button>
                </div>

                {/* Menu de navegação */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive
                                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }
              `}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}
                </nav>

                {/* Ações do sistema */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
                    {/* Reset Database */}
                    <button
                        onClick={() => setIsResetModalOpen(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Resetar Dados</span>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sair</span>
                    </button>
                </div>
            </aside>

            {/* Modal de Reset */}
            <ResetDatabaseModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
            />
        </>
    )
}
