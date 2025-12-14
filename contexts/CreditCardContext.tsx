'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase/config'
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

    useEffect(() => {
        if (!user) {
            setCards([])
            setLoading(false)
            return
        }

        setLoading(true)
        const cardsRef = ref(db, `users/${user.uid}/creditCards`)

        // Listener em tempo real
        const unsubscribe = onValue(cardsRef, (snapshot) => {
            try {
                if (!snapshot.exists()) {
                    setCards([])
                    setLoading(false)
                    return
                }

                const data = snapshot.val()
                const cardsList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }))

                setCards(cardsList)
            } catch (error) {
                console.error('Erro ao processar cartões:', error)
            } finally {
                setLoading(false)
            }
        }, (error) => {
            console.error('Erro no listener de cartões:', error)
            setLoading(false)
        })

        // Cleanup: remover listener quando componente desmontar ou user mudar
        return () => {
            off(cardsRef)
            unsubscribe()
        }
    }, [user])

    const createCard = async (data: Omit<CreditCard, 'id' | 'createdAt' | 'userId'>) => {
        if (!user) return
        await creditCardService.create(user.uid, data)
        // Listener em tempo real atualiza automaticamente
    }

    const updateCard = async (id: string, data: Partial<CreditCard>) => {
        if (!user) return
        await creditCardService.update(user.uid, id, data)
        // Listener em tempo real atualiza automaticamente
    }

    const deactivateCard = async (id: string) => {
        if (!user) return
        await creditCardService.deactivate(user.uid, id)
        // Listener em tempo real atualiza automaticamente
    }

    const activateCard = async (id: string) => {
        if (!user) return
        await creditCardService.activate(user.uid, id)
        // Listener em tempo real atualiza automaticamente
    }

    const refresh = async () => {
        // Mantido para compatibilidade, mas listener cuida disso
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
            refresh,
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
