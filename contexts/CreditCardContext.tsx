'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { creditCardService } from '@/lib/services/credit-card.service'
import { CreditCard } from '@/types'

interface CreditCardContextType {
    cards: CreditCard[]
    loading: boolean
    createCard: (data: Omit<CreditCard, 'id' | 'createdAt' | 'userId'>) => Promise<void>
    updateCard: (id: string, data: Partial<CreditCard>) => Promise<void>
    deactivateCard: (id: string) => Promise<void>
    activateCard: (id: string) => Promise<void>
    refresh: () => Promise<void>
    activeCards: CreditCard[]
}

const CreditCardContext = createContext<CreditCardContextType | undefined>(undefined)

export function CreditCardProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [cards, setCards] = useState<CreditCard[]>([])
    const [loading, setLoading] = useState(true)

    const loadCards = async () => {
        if (!user) {
            setCards([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const data = await creditCardService.getAll(user.uid)
            setCards(data)
        } catch (error) {
            console.error('Erro ao carregar cartões:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCards()
    }, [user])

    const createCard = async (data: Omit<CreditCard, 'id' | 'createdAt' | 'userId'>) => {
        if (!user) return
        await creditCardService.create(user.uid, data)
        await loadCards()
    }

    const updateCard = async (id: string, data: Partial<CreditCard>) => {
        if (!user) return
        await creditCardService.update(user.uid, id, data)
        await loadCards()
    }

    const deactivateCard = async (id: string) => {
        if (!user) return
        await creditCardService.deactivate(user.uid, id)
        await loadCards()
    }

    const activateCard = async (id: string) => {
        if (!user) return
        await creditCardService.activate(user.uid, id)
        await loadCards()
    }

    const activeCards = cards.filter(c => c.isActive)

    return (
        <CreditCardContext.Provider value={{
            cards,
            loading,
            createCard,
            updateCard,
            deactivateCard,
            activateCard,
            refresh: loadCards,
            activeCards,
        }}>
            {children}
        </CreditCardContext.Provider>
    )
}

export const useCreditCards = () => {
    const context = useContext(CreditCardContext)
    if (!context) throw new Error('useCreditCards must be used within CreditCardProvider')
    return context
}
