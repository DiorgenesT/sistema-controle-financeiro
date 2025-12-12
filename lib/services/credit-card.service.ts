import { ref, push, set, get, update } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { CreditCard } from '@/types'

export const creditCardService = {
    // Buscar todos cartões do usuário
    async getAll(userId: string): Promise<CreditCard[]> {
        const snapshot = await get(ref(db, `users/${userId}/creditCards`))
        if (!snapshot.exists()) return []

        const data = snapshot.val()
        return Object.keys(data).map(key => ({ id: key, ...data[key] }))
    },

    // Criar cartão
    async create(userId: string, card: Omit<CreditCard, 'id' | 'createdAt' | 'userId'>): Promise<string> {
        const newRef = push(ref(db, `users/${userId}/creditCards`))
        await set(newRef, {
            userId,
            ...card,
            createdAt: Date.now(),
        })
        return newRef.key!
    },

    // Atualizar cartão
    async update(userId: string, cardId: string, data: Partial<CreditCard>): Promise<void> {
        // Remover campos undefined (Firebase não aceita)
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
        )
        await update(ref(db, `users/${userId}/creditCards/${cardId}`), cleanData)
    },

    // Desativar cartão
    async deactivate(userId: string, cardId: string): Promise<void> {
        await update(ref(db, `users/${userId}/creditCards/${cardId}`), {
            isActive: false,
        })
    },

    // Ativar cartão
    async activate(userId: string, cardId: string): Promise<void> {
        await update(ref(db, `users/${userId}/creditCards/${cardId}`), {
            isActive: true,
        })
    },

    // Calcular mês da fatura baseado na data da compra e dia de fechamento
    calculateInvoiceMonth(purchaseDate: Date, closingDay: number): Date {
        const purchaseDay = purchaseDate.getDate()
        const purchaseMonth = purchaseDate.getMonth()
        const purchaseYear = purchaseDate.getFullYear()

        // Se compra após fechamento → próxima fatura
        if (purchaseDay > closingDay) {
            return new Date(purchaseYear, purchaseMonth + 1, 1)
        }

        // Se compra antes/igual ao fechamento → fatura atual
        return new Date(purchaseYear, purchaseMonth, 1)
    },

    // Calcular data de vencimento da fatura
    calculateDueDate(invoiceMonth: Date, dueDay: number): Date {
        return new Date(
            invoiceMonth.getFullYear(),
            invoiceMonth.getMonth(),
            dueDay
        )
    },

    // Helper: Próximo vencimento do cartão
    getNextDueDate(card: CreditCard): Date {
        const today = new Date()
        const invoiceMonth = this.calculateInvoiceMonth(today, card.closingDay)
        return this.calculateDueDate(invoiceMonth, card.dueDay)
    },
}
