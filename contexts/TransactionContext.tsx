'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

    const loadTransactions = async () => {
        if (!user) {
            setTransactions([])
            setStats({ income: 0, expense: 0, balance: 0 })
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            // Buscar transações do mês selecionado
            const data = await transactionService.getAll(user.uid, filterMonth, filterYear)
            setTransactions(data)

            // Calcular estatísticas
            const calculatedStats = transactionService.calculateStats(data)
            setStats(calculatedStats)
        } catch (error) {
            console.error('Erro ao carregar transações:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTransactions()
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
        await loadTransactions()
        // NÃO chamar refreshAccounts aqui automaticamente
        // Deixar para o modal chamar manualmente após criar TODAS as transações
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
        await loadTransactions()
        await refreshAccounts() // Atualizar saldo das contas
    }

    const updateTransaction = async (id: string, data: Partial<Transaction>) => {
        if (!user) return
        await transactionService.update(user.uid, id, data)
        await loadTransactions()
        await refreshAccounts() // Atualizar saldo das contas
    }

    const deleteTransaction = async (id: string) => {
        if (!user) return
        await transactionService.delete(user.uid, id)
        await loadTransactions()
        await refreshAccounts() // Atualizar saldo das contas
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
            refresh: loadTransactions,
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
