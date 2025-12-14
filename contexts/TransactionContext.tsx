'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { useAuth } from './AuthContext'
import { useAccounts } from './AccountContext'
import { transactionService } from '@/lib/services/transaction.service'
import { invoiceService } from '@/lib/services/invoice.service'
import { Transaction } from '@/types'

interface TransactionStats {
    income: number
    expense: number
    balance: number
}

interface TransactionContextType {
    transactions: Transaction[]
    loading: boolean
    stats: TransactionStats
    filterMonth: number
    filterYear: number
    setFilterMonth: (month: number) => void
    setFilterYear: (year: number) => void
    createTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>
    createTransactionAndRefresh: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>
    updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
    deleteTransaction: (id: string) => Promise<void>
    refresh: () => Promise<void>
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

export function TransactionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const { refresh: refreshAccounts } = useAccounts()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<TransactionStats>({ income: 0, expense: 0, balance: 0 })

    // Filtros iniciais: Mês atual
    const today = new Date()
    const [filterMonth, setFilterMonth] = useState(today.getMonth())
    const [filterYear, setFilterYear] = useState(today.getFullYear())

    useEffect(() => {
        if (!user) {
            setTransactions([])
            setStats({ income: 0, expense: 0, balance: 0 })
            setLoading(false)
            return
        }

        setLoading(true)
        const transactionsRef = ref(db, `users/${user.uid}/transactions`)

        // Listener em tempo real
        const unsubscribe = onValue(transactionsRef, (snapshot) => {
            try {
                if (!snapshot.exists()) {
                    setTransactions([])
                    setStats({ income: 0, expense: 0, balance: 0 })
                    setLoading(false)
                    return
                }

                const data = snapshot.val()
                const allTransactions: Transaction[] = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }))

                // Filtrar por mês/ano
                const startDate = new Date(filterYear, filterMonth, 1).getTime()
                const endDate = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59).getTime()

                const filtered = allTransactions.filter(t =>
                    t.date >= startDate && t.date <= endDate
                ).sort((a, b) => b.date - a.date)

                setTransactions(filtered)

                // Calcular estatísticas
                const calculatedStats = transactionService.calculateStats(filtered)
                setStats(calculatedStats)
            } catch (error) {
                console.error('Erro ao processar transações:', error)
            } finally {
                setLoading(false)
            }
        }, (error) => {
            console.error('Erro no listener de transações:', error)
            setLoading(false)
        })

        // Cleanup: remover listener quando componente desmontar ou user/filtros mudarem
        return () => {
            off(transactionsRef)
            unsubscribe()
        }
    }, [user, filterMonth, filterYear])

    const createTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
        if (!user) return

        // Verificar se está usando reserva de emergência
        if (data.accountId && data.accountId.startsWith('goal-')) {
            const goalId = data.accountId.replace('goal-', '')

            // Importar serviço de goals
            const { ref: dbRef, update, get } = await import('firebase/database')
            const { db } = await import('@/lib/firebase/config')

            // Debitar da meta
            const goalRef = dbRef(db, `users/${user.uid}/goals/${goalId}`)
            const goalSnapshot = await get(goalRef)

            if (goalSnapshot.exists()) {
                const goal = goalSnapshot.val()
                const newAmount = goal.currentAmount - data.amount

                await update(goalRef, {
                    currentAmount: Math.max(0, newAmount),
                    updatedAt: Date.now()
                })
            }

            // Manter accountId como está para referência
        }

        await transactionService.create(user.uid, data)
        // Listener em tempo real atualiza automaticamente - sem necessidade de refresh
    }

    const createTransactionAndRefresh = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
        if (!user) return

        // Verificar se está usando reserva de emergência
        if (data.accountId && data.accountId.startsWith('goal-')) {
            const goalId = data.accountId.replace('goal-', '')

            // Importar serviço de goals
            const { ref: dbRef, update, get } = await import('firebase/database')
            const { db } = await import('@/lib/firebase/config')

            // Debitar da meta
            const goalRef = dbRef(db, `users/${user.uid}/goals/${goalId}`)
            const goalSnapshot = await get(goalRef)

            if (goalSnapshot.exists()) {
                const goal = goalSnapshot.val()
                const newAmount = goal.currentAmount - data.amount

                await update(goalRef, {
                    currentAmount: Math.max(0, newAmount),
                    updatedAt: Date.now()
                })
            }
        }

        await transactionService.create(user.uid, data)
        // Listeners em tempo real atualizam automaticamente
    }

    const updateTransaction = async (id: string, data: Partial<Transaction>) => {
        if (!user) return
        await transactionService.update(user.uid, id, data)
        // Listeners em tempo real atualizam automaticamente
    }

    const deleteTransaction = async (id: string) => {
        if (!user) return
        await transactionService.delete(user.uid, id)
        // Listeners em tempo real atualizam automaticamente
    }

    return (
        <TransactionContext.Provider value={{
            transactions,
            loading,
            stats,
            filterMonth,
            filterYear,
            setFilterMonth,
            setFilterYear,
            createTransaction,
            createTransactionAndRefresh,
            updateTransaction,
            deleteTransaction,
            refresh: async () => { }, // Mantido para compatibilidade, mas listener cuida disso
        }}>
            {children}
        </TransactionContext.Provider>
    )
}

export const useTransactions = () => {
    const context = useContext(TransactionContext)
    if (!context) throw new Error('useTransactions must be used within TransactionProvider')
    return context
}
