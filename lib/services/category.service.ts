import { ref, push, set, get, update } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Category } from '@/types'
import { DEFAULT_CATEGORIES } from '@/lib/constants/default-categories'

export const categoryService = {
    // Buscar todas categorias do usuário
    async getAll(userId: string): Promise<Category[]> {
        const snapshot = await get(ref(db, `users/${userId}/categories`))
        if (!snapshot.exists()) return []

        const data = snapshot.val()
        return Object.keys(data).map(key => ({ id: key, ...data[key] }))
    },

    // Criar categoria
    async create(userId: string, category: Omit<Category, 'id' | 'createdAt'>): Promise<string> {
        const newRef = push(ref(db, `users/${userId}/categories`))
        await set(newRef, {
            ...category,
            createdAt: Date.now(),
        })
        return newRef.key!
    },

    // Atualizar categoria
    async update(userId: string, categoryId: string, data: Partial<Category>): Promise<void> {
        await update(ref(db, `users/${userId}/categories/${categoryId}`), data)
    },

    // Arquivar (soft delete)
    async archive(userId: string, categoryId: string): Promise<void> {
        await update(ref(db, `users/${userId}/categories/${categoryId}`), {
            isArchived: true,
        })
    },

    // Desarquivar
    async unarchive(userId: string, categoryId: string): Promise<void> {
        await update(ref(db, `users/${userId}/categories/${categoryId}`), {
            isArchived: false,
        })
    },

    // Seed - criar categorias padrão
    async seedDefaultCategories(userId: string): Promise<void> {
        const promises = DEFAULT_CATEGORIES.map(cat =>
            this.create(userId, { ...cat, isArchived: false })
        )
        await Promise.all(promises)
    },
}
