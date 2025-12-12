import { ref, push, set, get, update } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { FamilyMember } from '@/types'

export const familyService = {
    // Buscar todos membros da família do usuário
    async getAll(userId: string): Promise<FamilyMember[]> {
        const snapshot = await get(ref(db, `users/${userId}/family`))
        if (!snapshot.exists()) return []

        const data = snapshot.val()
        return Object.keys(data).map(key => ({ id: key, ...data[key] }))
    },

    // Criar membro
    async create(userId: string, member: Omit<FamilyMember, 'id' | 'createdAt' | 'userId'>): Promise<string> {
        const newRef = push(ref(db, `users/${userId}/family`))
        await set(newRef, {
            userId,
            ...member,
            createdAt: Date.now(),
        })
        return newRef.key!
    },

    // Atualizar membro
    async update(userId: string, memberId: string, data: Partial<FamilyMember>): Promise<void> {
        await update(ref(db, `users/${userId}/family/${memberId}`), data)
    },

    // Desativar membro
    async deactivate(userId: string, memberId: string): Promise<void> {
        await update(ref(db, `users/${userId}/family/${memberId}`), {
            isActive: false,
        })
    },

    // Ativar membro
    async activate(userId: string, memberId: string): Promise<void> {
        await update(ref(db, `users/${userId}/family/${memberId}`), {
            isActive: true,
        })
    },
}
