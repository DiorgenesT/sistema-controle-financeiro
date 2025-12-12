'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { familyService } from '@/lib/services/family.service'
import { FamilyMember } from '@/types'

interface FamilyContextType {
    members: FamilyMember[]
    loading: boolean
    createMember: (data: Omit<FamilyMember, 'id' | 'createdAt' | 'userId'>) => Promise<void>
    updateMember: (id: string, data: Partial<FamilyMember>) => Promise<void>
    deactivateMember: (id: string) => Promise<void>
    activateMember: (id: string) => Promise<void>
    refresh: () => Promise<void>
    activeMembers: FamilyMember[]
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

export function FamilyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [members, setMembers] = useState<FamilyMember[]>([])
    const [loading, setLoading] = useState(true)

    const loadMembers = async () => {
        if (!user) {
            setMembers([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const data = await familyService.getAll(user.uid)
            setMembers(data)
        } catch (error) {
            console.error('Erro ao carregar membros:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMembers()
    }, [user])

    const createMember = async (data: Omit<FamilyMember, 'id' | 'createdAt' | 'userId'>) => {
        if (!user) return
        await familyService.create(user.uid, data)
        await loadMembers()
    }

    const updateMember = async (id: string, data: Partial<FamilyMember>) => {
        if (!user) return
        await familyService.update(user.uid, id, data)
        await loadMembers()
    }

    const deactivateMember = async (id: string) => {
        if (!user) return
        await familyService.deactivate(user.uid, id)
        await loadMembers()
    }

    const activateMember = async (id: string) => {
        if (!user) return
        await familyService.activate(user.uid, id)
        await loadMembers()
    }

    const activeMembers = members.filter(m => m.isActive)

    return (
        <FamilyContext.Provider value={{
            members,
            loading,
            createMember,
            updateMember,
            deactivateMember,
            activateMember,
            refresh: loadMembers,
            activeMembers,
        }}>
            {children}
        </FamilyContext.Provider>
    )
}

export const useFamilyMembers = () => {
    const context = useContext(FamilyContext)
    if (!context) throw new Error('useFamilyMembers must be used within FamilyProvider')
    return context
}
