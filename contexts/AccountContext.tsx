'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase/config'
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

    useEffect(() => {
        if (!user) {
            setAccounts([])
            setLoading(false)
            return
        }

        setLoading(true)
        const accountsRef = ref(db, `users/${user.uid}/accounts`)

        // Listener em tempo real
        const unsubscribe = onValue(accountsRef, async (snapshot) => {
            try {
                if (!snapshot.exists()) {
                    // Auto-seed se não tiver contas
                    console.log('Criando conta padrão para novo usuário...')
                    await accountService.seedDefaultAccount(user.uid)
                    // O listener vai capturar a nova conta automaticamente
                    return
                }

                const data = snapshot.val()
                const accountsList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }))

                setAccounts(accountsList)
            } catch (error) {
                console.error('Erro ao processar contas:', error)
            } finally {
                setLoading(false)
            }
        }, (error) => {
            console.error('Erro no listener de contas:', error)
            setLoading(false)
        })

        // Cleanup: remover listener quando componente desmontar ou user mudar
        return () => {
            off(accountsRef)
            unsubscribe()
        }
    }, [user])

    const createAccount = async (data: Omit<Account, 'id' | 'createdAt' | 'currentBalance'>) => {
        if (!user) return
        await accountService.create(user.uid, data)
        // Listener em tempo real atualiza automaticamente
    }

    const updateAccount = async (id: string, data: Partial<Account>) => {
        if (!user) return
        await accountService.update(user.uid, id, data)
        // Listener em tempo real atualiza automaticamente
    }

    const deactivateAccount = async (id: string) => {
        if (!user) return
        await accountService.deactivate(user.uid, id)
        // Listener em tempo real atualiza automaticamente
    }

    const activateAccount = async (id: string) => {
        if (!user) return
        await accountService.activate(user.uid, id)
        // Listener em tempo real atualiza automaticamente
    }

    const deleteAccount = async (id: string) => {
        if (!user) return
        await accountService.delete(user.uid, id)
        // Listener em tempo real atualiza automaticamente
    }

    const refresh = async () => {
        // Mantido para compatibilidade, mas o listener já atualiza automaticamente
        // Não faz nada pois o listener em tempo real cuida disso
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
            refresh,
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
