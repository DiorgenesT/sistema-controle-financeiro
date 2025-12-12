'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { accountService } from '@/lib/services/account.service'
import { Account } from '@/types'

interface AccountContextType {
    accounts: Account[]
    loading: boolean
    createAccount: (data: Omit<Account, 'id' | 'createdAt' | 'currentBalance'>) => Promise<void>
    updateAccount: (id: string, data: Partial<Account>) => Promise<void>
    deactivateAccount: (id: string) => Promise<void>
    activateAccount: (id: string) => Promise<void>
    deleteAccount: (id: string) => Promise<void>
    refresh: () => Promise<void>
    activeAccounts: Account[]
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

export function AccountProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)

    const loadAccounts = async () => {
        if (!user) {
            setAccounts([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const data = await accountService.getAll(user.uid)

            // Auto-seed se não tiver contas
            if (data.length === 0) {
                console.log('Criando conta padrão para novo usuário...')
                await accountService.seedDefaultAccount(user.uid)
                const newData = await accountService.getAll(user.uid)
                setAccounts(newData)
            } else {
                setAccounts(data)
            }
        } catch (error) {
            console.error('Erro ao carregar contas:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAccounts()
    }, [user])

    const createAccount = async (data: Omit<Account, 'id' | 'createdAt' | 'currentBalance'>) => {
        if (!user) return
        await accountService.create(user.uid, data)
        await loadAccounts()
    }

    const updateAccount = async (id: string, data: Partial<Account>) => {
        if (!user) return
        await accountService.update(user.uid, id, data)
        await loadAccounts()
    }

    const deactivateAccount = async (id: string) => {
        if (!user) return
        await accountService.deactivate(user.uid, id)
        await loadAccounts()
    }

    const activateAccount = async (id: string) => {
        if (!user) return
        await accountService.activate(user.uid, id)
        await loadAccounts()
    }

    const deleteAccount = async (id: string) => {
        if (!user) return
        await accountService.delete(user.uid, id)
        await loadAccounts()
    }

    const activeAccounts = accounts.filter(acc => acc.isActive)

    return (
        <AccountContext.Provider value={{
            accounts,
            loading,
            createAccount,
            updateAccount,
            deactivateAccount,
            activateAccount,
            deleteAccount,
            refresh: loadAccounts,
            activeAccounts,
        }}>
            {children}
        </AccountContext.Provider>
    )
}

export const useAccounts = () => {
    const context = useContext(AccountContext)
    if (!context) throw new Error('useAccounts must be used within AccountProvider')
    return context
}
