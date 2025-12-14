import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { CreditCardInvoice, Transaction, CreditCard } from '@/types'

export const invoiceService = {
    /**
     * Gera uma fatura para um cartão em um mês/ano específico
     * Agrupa todas as transações não pagas do cartão naquele período
     */
    async generateInvoice(userId: string, cardId: string, month: number, year: number): Promise<string> {
        // Buscar dados do cartão
        const cardSnapshot = await get(ref(db, `users/${userId}/creditCards/${cardId}`))
        if (!cardSnapshot.exists()) {
            throw new Error('Cartão não encontrado')
        }

        const card: CreditCard = { id: cardId, ...cardSnapshot.val() }

        // Calcular datas de fechamento e vencimento
        const closingDate = new Date(year, month, card.closingDay, 23, 59, 59)
        const dueDate = new Date(year, month, card.dueDay, 23, 59, 59)

        // Se dueDay < closingDay, vencimento é no mês seguinte
        if (card.dueDay < card.closingDay) {
            dueDate.setMonth(dueDate.getMonth() + 1)
        }

        // Buscar todas as transações do cartão neste período
        const transactionsRef = ref(db, `users/${userId}/transactions`)
        const snapshot = await get(transactionsRef)

        if (!snapshot.exists()) {
            throw new Error('Nenhuma transação encontrada')
        }

        const allTransactions = snapshot.val()
        const invoiceTransactions: Transaction[] = []
        let totalAmount = 0

        // Filtrar TODAS as transações do cartão que ainda não foram pagas
        // (Independente da data - a fatura agrupa tudo que está pendente)
        Object.keys(allTransactions).forEach(txId => {
            const tx: Transaction = { id: txId, ...allTransactions[txId] }

            // Deve ser do cartão e não estar paga
            if (tx.cardId === cardId && !tx.isPaid) {
                invoiceTransactions.push(tx)
                totalAmount += tx.amount
            }
        })

        if (invoiceTransactions.length === 0) {
            throw new Error('Nenhuma transação para esta fatura')
        }

        // Criar fatura
        const invoiceRef = push(ref(db, `users/${userId}/invoices`))
        const invoice: Omit<CreditCardInvoice, 'id'> = {
            cardId,
            userId,
            month,
            year,
            closingDate: closingDate.getTime(),
            dueDate: dueDate.getTime(),
            totalAmount,
            isPaid: false,
            transactionIds: invoiceTransactions.map(t => t.id),
            createdAt: Date.now()
        }

        await set(invoiceRef, invoice)

        return invoiceRef.key!
    },

    /**
     * Busca todas as faturas de um cartão
     */
    async getInvoices(userId: string, cardId?: string): Promise<CreditCardInvoice[]> {
        const invoicesRef = ref(db, `users/${userId}/invoices`)
        const snapshot = await get(invoicesRef)

        if (!snapshot.exists()) return []

        const data = snapshot.val()
        const invoices: CreditCardInvoice[] = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }))

        // Filtrar por cartão se especificado
        if (cardId) {
            return invoices.filter(inv => inv.cardId === cardId)
        }

        return invoices.sort((a, b) => b.dueDate - a.dueDate) // Mais recente primeiro
    },

    /**
     * Busca detalhes de uma fatura específica + suas transações
     */
    async getInvoiceDetails(userId: string, invoiceId: string): Promise<{
        invoice: CreditCardInvoice
        transactions: Transaction[]
        card: CreditCard
    }> {
        // Buscar fatura
        const invoiceSnapshot = await get(ref(db, `users/${userId}/invoices/${invoiceId}`))
        if (!invoiceSnapshot.exists()) {
            throw new Error('Fatura não encontrada')
        }

        const invoice: CreditCardInvoice = { id: invoiceId, ...invoiceSnapshot.val() }

        // Buscar cartão
        const cardSnapshot = await get(ref(db, `users/${userId}/creditCards/${invoice.cardId}`))
        if (!cardSnapshot.exists()) {
            throw new Error('Cartão não encontrado')
        }

        const card: CreditCard = { id: invoice.cardId, ...cardSnapshot.val() }

        // Buscar transações
        const transactionsSnapshot = await get(ref(db, `users/${userId}/transactions`))
        const allTransactions = transactionsSnapshot.val() || {}

        const transactions: Transaction[] = invoice.transactionIds
            .filter(txId => allTransactions[txId]) // Verificar se existe
            .map(txId => ({ id: txId, ...allTransactions[txId] }))

        return { invoice, transactions, card }
    },

    /**
     * Paga uma fatura
     * - Cria transação de pagamento
     * - Marca todas as transações da fatura como pagas
     * - Atualiza a fatura como paga
     */
    async payInvoice(
        userId: string,
        invoiceId: string,
        accountId: string,
        paymentDate: number = Date.now()
    ): Promise<void> {
        // Buscar detalhes da fatura
        const { invoice, transactions, card } = await this.getInvoiceDetails(userId, invoiceId)

        if (invoice.isPaid) {
            throw new Error('Esta fatura já foi paga')
        }

        // 1. Criar transação de pagamento (já debita automaticamente da conta via transaction.service)
        const paymentRef = push(ref(db, `users/${userId}/transactions`))
        const monthName = new Date(invoice.year, invoice.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

        await set(paymentRef, {
            type: 'expense',
            expenseType: 'cash',
            description: `Pagamento Fatura ${card.nickname || card.cardBrand} - ${monthName}`,
            amount: invoice.totalAmount,
            categoryId: 'default-expense', // Categoria padrão
            accountId,
            date: paymentDate,
            isPaid: true, // Isso já causa débito automático via transaction.service
            assignedTo: userId,
            createdAt: Date.now()
        })

        // 2. Marcar todas as transações da fatura como pagas
        const updates: Record<string, any> = {}

        transactions.forEach(tx => {
            updates[`users/${userId}/transactions/${tx.id}/isPaid`] = true
        })

        // 3. Atualizar a fatura
        updates[`users/${userId}/invoices/${invoiceId}/isPaid`] = true
        updates[`users/${userId}/invoices/${invoiceId}/paidDate`] = paymentDate
        updates[`users/${userId}/invoices/${invoiceId}/paidFromAccountId`] = accountId
        updates[`users/${userId}/invoices/${invoiceId}/paymentTransactionId`] = paymentRef.key

        // REMOVIDO: Débito direto da conta (causava dupla contabilização)
        // A transação criada acima com isPaid:true já debita automaticamente

        // Aplicar todas as atualizações atomicamente
        await update(ref(db), updates)
    },

    /**
     * Busca a fatura do mês atual de um cartão
     */
    async getCurrentInvoice(userId: string, cardId: string): Promise<CreditCardInvoice | null> {
        const today = new Date()
        const invoices = await this.getInvoices(userId, cardId)

        return invoices.find(inv =>
            inv.month === today.getMonth() &&
            inv.year === today.getFullYear()
        ) || null
    },

    /**
     * Busca a próxima fatura (ainda não fechada) de um cartão
     */
    async getUpcomingInvoice(userId: string, cardId: string): Promise<CreditCardInvoice | null> {
        const today = new Date()
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

        const invoices = await this.getInvoices(userId, cardId)

        return invoices.find(inv =>
            inv.month === nextMonth.getMonth() &&
            inv.year === nextMonth.getFullYear()
        ) || null
    },

    /**
     * Deleta uma fatura (apenas se não estiver paga)
     */
    async deleteInvoice(userId: string, invoiceId: string): Promise<void> {
        const invoiceSnapshot = await get(ref(db, `users/${userId}/invoices/${invoiceId}`))
        if (!invoiceSnapshot.exists()) {
            throw new Error('Fatura não encontrada')
        }

        const invoice: CreditCardInvoice = { id: invoiceId, ...invoiceSnapshot.val() }

        if (invoice.isPaid) {
            throw new Error('Não é possível deletar uma fatura que já foi paga')
        }

        await remove(ref(db, `users/${userId}/invoices/${invoiceId}`))
    },

    /**
     * Gera faturas automaticamente para todos os cartões quando necessário
     * Deve ser chamado ao carregar o dashboard ou transações
     */
    async autoGenerateInvoices(userId: string): Promise<void> {
        try {
            // Buscar cartões ativos
            const cardsSnapshot = await get(ref(db, `users/${userId}/creditCards`))
            if (!cardsSnapshot.exists()) return

            const cards = Object.keys(cardsSnapshot.val()).map(key => ({
                id: key,
                ...cardsSnapshot.val()[key]
            })) as CreditCard[]

            const today = new Date()
            const currentMonth = today.getMonth()
            const currentYear = today.getFullYear()

            // Para cada cartão ativo
            for (const card of cards.filter(c => c.isActive)) {
                // Verificar se já existe fatura do mês atual
                const invoices = await this.getInvoices(userId, card.id)
                const existingInvoice = invoices.find(inv =>
                    inv.month === currentMonth &&
                    inv.year === currentYear
                )

                // Se não existe E já passou do dia de fechamento, gerar
                if (!existingInvoice && today.getDate() > card.closingDay) {
                    try {
                        await this.generateInvoice(userId, card.id, currentMonth, currentYear)
                        console.log(`Fatura gerada automaticamente para ${card.nickname || card.cardBrand}`)
                    } catch (error: any) {
                        // Ignorar erro de "nenhuma transação" - é normal
                        if (!error.message?.includes('Nenhuma transação')) {
                            console.error(`Erro ao gerar fatura para ${card.nickname}:`, error)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erro na geração automática de faturas:', error)
        }
    }
}
