'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { categoryService } from '@/lib/services/category.service'
import { Category } from '@/types'

interface CategoryContextType {
    categories: Category[]
    loading: boolean
    createCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Promise<void>
    updateCategory: (id: string, data: Partial<Category>) => Promise<void>
    archiveCategory: (id: string) => Promise<void>
    unarchiveCategory: (id: string) => Promise<void>
    refresh: () => Promise<void>
    getByType: (type: 'income' | 'expense') => Category[]
    activeCategories: Category[]
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

export function CategoryProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    const loadCategories = async () => {
        if (!user) {
            setCategories([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const data = await categoryService.getAll(user.uid)

            // Auto-seed se não tiver categorias
            if (data.length === 0) {
                console.log('Criando categorias padrão para novo usuário...')
                await categoryService.seedDefaultCategories(user.uid)
                const newData = await categoryService.getAll(user.uid)
                setCategories(newData)
            } else {
                setCategories(data)
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCategories()
    }, [user])

    const createCategory = async (data: Omit<Category, 'id' | 'createdAt'>) => {
        if (!user) return
        await categoryService.create(user.uid, data)
        await loadCategories()
    }

    const updateCategory = async (id: string, data: Partial<Category>) => {
        if (!user) return
        await categoryService.update(user.uid, id, data)
        await loadCategories()
    }

    const archiveCategory = async (id: string) => {
        if (!user) return
        await categoryService.archive(user.uid, id)
        await loadCategories()
    }

    const unarchiveCategory = async (id: string) => {
        if (!user) return
        await categoryService.unarchive(user.uid, id)
        await loadCategories()
    }

    const getByType = (type: 'income' | 'expense') => {
        return categories.filter(cat => cat.type === type && !cat.isArchived)
    }

    const activeCategories = categories.filter(cat => !cat.isArchived)

    return (
        <CategoryContext.Provider value={{
            categories,
            loading,
            createCategory,
            updateCategory,
            archiveCategory,
            unarchiveCategory,
            refresh: loadCategories,
            getByType,
            activeCategories,
        }}>
            {children}
        </CategoryContext.Provider>
    )
}

export const useCategories = () => {
    const context = useContext(CategoryContext)
    if (!context) throw new Error('useCategories must be used within CategoryProvider')
    return context
}
