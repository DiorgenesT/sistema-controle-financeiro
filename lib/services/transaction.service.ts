import { ref, push, set, get, update, remove, query, orderByChild, startAt, endAt } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Transaction } from '@/types'
import { accountService } from './account.service'

export const transactionService = {
    // Criar transação (ou múltiplas se parcelado)
    async create(userId: string, transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<void> {
        const dbRef = ref(db, `users/${userId}/transactions`)

        // Aplicar lógica de fechamento de cartão para transações COM cartão
        if (transaction.cardId) {
            try {
                const cardSnapshot = await get(ref(db, `users/${userId}/creditCards/${transaction.cardId}`))
                if (cardSnapshot.exists()) {
                    const card = cardSnapshot.val()
                    const baseDate = new Date(transaction.date)
                    const purchaseDay = baseDate.getDate()
                    const closingDay = card.closingDay

                    // Se a compra foi DEPOIS do fechamento, vai para a fatura do próximo mês
                    if (purchaseDay > closingDay) {
                        const adjustedDate = new Date(baseDate)
                        adjustedDate.setMonth(baseDate.getMonth() + 1)

                        // Para despesas fixas, ajustar o dueDate (não o date)
                        if (transaction.expenseType === 'fixed' && transaction.dueDate) {
                            const adjustedDueDate = new Date(transaction.dueDate)
                            adjustedDueDate.setMonth(adjustedDueDate.getMonth() + 1)
                            transaction = { ...transaction, dueDate: adjustedDueDate.getTime() }
                        } else {
                            transaction = { ...transaction, date: adjustedDate.getTime() }
                        }
                    }
                }
            } catch (error) {
                console.warn('Erro ao buscar cartão para ajuste de data:', error)
            }
        }

        // Despesas parceladas: criar múltiplas transações
        if (transaction.expenseType === 'installment' && transaction.installments && transaction.installments > 1) {
            const baseAmount = transaction.amount / transaction.installments
            const installmentId = `${Date.now()}_${Math.random()}`
            const baseDate = new Date(transaction.date)
            const updates: Record<string, any> = {}

            // Configurar início das parcelas
            let startMonth = 0 // Meses a adicionar antes da primeira parcela
            let firstPaymentDate = baseDate

            if (transaction.cardId) {
                // COM CARTÃO: usa lógica de closingDay
                try {
                    const cardSnapshot = await get(ref(db, `users/${userId}/creditCards/${transaction.cardId}`))
                    if (cardSnapshot.exists()) {
                        const card = cardSnapshot.val()
                        const purchaseDay = baseDate.getDate()
                        const closingDay = card.closingDay

                        // Se a compra foi DEPOIS do fechamento, primeira parcela vai para próximo mês
                        if (purchaseDay > closingDay) {
                            startMonth = 1
                        }
                    }
                } catch (error) {
                    console.warn('Erro ao buscar cartão:', error)
                }
                firstPaymentDate = new Date(baseDate)
                firstPaymentDate.setMonth(baseDate.getMonth() + startMonth)
            } else {
                // SEM CARTÃO: usa firstDueDate manual
                if (transaction.firstDueDate) {
                    firstPaymentDate = new Date(transaction.firstDueDate)
                }
            }

            // Calcular valor das parcelas considerando a entrada
            const downPayment = transaction.downPaymentAmount || 0
            const remainingAmount = transaction.amount - downPayment
            const installmentAmount = remainingAmount / transaction.installments

            // Se houver entrada, criar transação separada PAGA
            if (downPayment > 0) {
                const downPaymentRef = push(dbRef)
                const cleanDownPaymentData = Object.fromEntries(
                    Object.entries(transaction).filter(([_, value]) => value !== undefined)
                )

                updates[downPaymentRef.key!] = {
                    ...cleanDownPaymentData,
                    amount: downPayment,
                    description: `${transaction.description} - Entrada`,
                    date: new Date().getTime(), // Entrada paga hoje
                    isPaid: true,
                    expenseType: 'cash', // Entrada como despesa à vista
                    createdAt: Date.now(),
                }
            }

            // Criar parcelas do valor restante
            for (let i = 0; i < transaction.installments; i++) {
                const newRef = push(dbRef)
                const installmentDate = new Date(firstPaymentDate)
                installmentDate.setMonth(firstPaymentDate.getMonth() + i)

                const cleanData = Object.fromEntries(
                    Object.entries(transaction).filter(([_, value]) => value !== undefined)
                )

                updates[newRef.key!] = {
                    ...cleanData,
                    amount: installmentAmount,
                    currentInstallment: i + 1,
                    installmentId,
                    date: installmentDate.getTime(), // Data de vencimento da parcela
                    purchaseDate: baseDate.getTime(), // Data original da compra
                    description: transaction.description, // Sem (X/Y) - fica só no badge
                    isPaid: false,
                    createdAt: Date.now(),
                }
            }

            await update(ref(db, `users/${userId}/transactions`), updates)
            // Despesas parceladas não mexem no saldo da conta imediatamente (ficam na fatura do cartão)
            return
        }

        // Transação normal
        const newRef = push(dbRef)
        const cleanData = Object.fromEntries(
            Object.entries(transaction).filter(([_, value]) => value !== undefined)
        )

        await set(newRef, {
            ...cleanData,
            createdAt: Date.now(),
        })



        // Atualizar saldo da conta (apenas para transações não-parceladas)
        // Receitas: adicionar ao saldo
        // Despesas à vista ou fixas: subtrair do saldo
        // Transferências: subtrair da origem e adicionar no destino
        try {
            if (transaction.type === 'transfer' && transaction.toAccountId) {
                // Transferência: debita da conta origem e credita na conta destino
                await accountService.adjustBalance(userId, transaction.accountId, transaction.amount, 'subtract')
                await accountService.adjustBalance(userId, transaction.toAccountId, transaction.amount, 'add')
            } else if (transaction.accountId && transaction.type === 'income') {
                await accountService.adjustBalance(userId, transaction.accountId, transaction.amount, 'add')
            } else if (transaction.accountId && transaction.type === 'expense' && transaction.expenseType !== 'installment') {
                // Despesas fixas e à vista mexem no saldo quando marcadas como pagas
                if (transaction.isPaid) {
                    await accountService.adjustBalance(userId, transaction.accountId, transaction.amount, 'subtract')
                }
            }
        } catch (error) {
            // Conta pode ter sido deletada, loga warning
            console.warn('Não foi possível ajustar saldo da conta:', error)
        }
    },

    // Buscar transações (opcionalmente filtradas por mês/ano)
    async getAll(userId: string, month?: number, year?: number): Promise<Transaction[]> {
        let q = query(ref(db, `users/${userId}/transactions`))

        // Se mês e ano forem fornecidos, filtrar por data
        if (month !== undefined && year !== undefined) {
            const startDate = new Date(year, month, 1).getTime()
            const endDate = new Date(year, month + 1, 0, 23, 59, 59).getTime()

            q = query(
                ref(db, `users/${userId}/transactions`),
                orderByChild('date'),
                startAt(startDate),
                endAt(endDate)
            )
        }

        const snapshot = await get(q)
        if (!snapshot.exists()) return []

        const data = snapshot.val()
        return Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).sort((a, b) => b.date - a.date) // Ordenar por data decrescente
    },

    // Atualizar transação
    async update(userId: string, transactionId: string, data: Partial<Transaction>): Promise<void> {
        // Buscar transação original para comparar
        const originalSnapshot = await get(ref(db, `users/${userId}/transactions/${transactionId}`))
        if (!originalSnapshot.exists()) throw new Error('Transação não encontrada')

        const originalTransaction: Transaction = { id: transactionId, ...originalSnapshot.val() }

        // Remover campos undefined
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
        )

        await update(ref(db, `users/${userId}/transactions/${transactionId}`), cleanData)

        // Ajustar saldo se necessário
        // Casos que afetam o saldo:
        // 1. Mudança no valor da transação
        // 2. Mudança no status isPaid de despesa fixa
        // 3. Mudança de conta (accountId)

        const amountChanged = data.amount !== undefined && data.amount !== originalTransaction.amount
        const paidStatusChanged = data.isPaid !== undefined && data.isPaid !== originalTransaction.isPaid
        const accountChanged = data.accountId !== undefined && data.accountId !== originalTransaction.accountId

        // PARCELAS SEM CARTÃO: debitar quando marcar como paga
        // Verifica se não tem cartão (undefined OU string vazia)
        const hasNoCard = !originalTransaction.cardId || originalTransaction.cardId === ''

        if (originalTransaction.expenseType === 'installment' && hasNoCard && paidStatusChanged && originalTransaction.accountId) {
            try {
                if (data.isPaid) {
                    // Marcou como pago: debitar da conta
                    console.log('[Transaction Service] Debitando parcela da conta:', {
                        accountId: originalTransaction.accountId,
                        amount: originalTransaction.amount
                    })
                    await accountService.adjustBalance(userId, originalTransaction.accountId, originalTransaction.amount, 'subtract')
                } else {
                    // Desmarcou como pago: devolver para conta
                    console.log('[Transaction Service] Devolvendo parcela para conta')
                    await accountService.adjustBalance(userId, originalTransaction.accountId, originalTransaction.amount, 'add')
                }
            } catch (error) {
                console.warn('Não foi possível ajustar saldo da conta:', error)
            }
        }

        // Para receitas e despesas à vista/fixas pagas
        if (originalTransaction.expenseType !== 'installment') {
            try {
                // Se mudou a conta, reverter na conta antiga e aplicar na nova
                if (accountChanged && originalTransaction.accountId) {
                    // Reverter na conta antiga
                    if (originalTransaction.type === 'income') {
                        await accountService.adjustBalance(userId, originalTransaction.accountId, originalTransaction.amount, 'subtract')
                    } else if (originalTransaction.isPaid) {
                        await accountService.adjustBalance(userId, originalTransaction.accountId, originalTransaction.amount, 'add')
                    }

                    // Aplicar na conta nova
                    const newAccountId = data.accountId!
                    const newAmount = data.amount ?? originalTransaction.amount
                    if (originalTransaction.type === 'income') {
                        await accountService.adjustBalance(userId, newAccountId, newAmount, 'add')
                    } else if (data.isPaid ?? originalTransaction.isPaid) {
                        await accountService.adjustBalance(userId, newAccountId, newAmount, 'subtract')
                    }
                }
                // Se mudou o valor (e a conta é a mesma)
                else if (amountChanged && originalTransaction.accountId) {
                    const diff = data.amount! - originalTransaction.amount
                    if (originalTransaction.type === 'income') {
                        await accountService.adjustBalance(userId, originalTransaction.accountId, Math.abs(diff), diff > 0 ? 'add' : 'subtract')
                    } else if (originalTransaction.isPaid) {
                        await accountService.adjustBalance(userId, originalTransaction.accountId, Math.abs(diff), diff > 0 ? 'subtract' : 'add')
                    }
                }
                // Se mudou o status de pago (para despesas)
                else if (paidStatusChanged && originalTransaction.type === 'expense' && originalTransaction.accountId) {
                    if (data.isPaid) {
                        // Ficou pago: subtrair do saldo
                        await accountService.adjustBalance(userId, originalTransaction.accountId, originalTransaction.amount, 'subtract')
                    } else {
                        // Ficou não pago: adicionar de volta
                        await accountService.adjustBalance(userId, originalTransaction.accountId, originalTransaction.amount, 'add')
                    }
                }
            } catch (error) {
                // Conta pode ter sido deletada, loga warning e continua
                console.warn('Não foi possível ajustar saldo da conta (pode ter sido deletada):', error)
            }
        }
    },

    // Excluir transação (ou todas as parcelas se for uma compra parcelada)
    async delete(userId: string, transactionId: string): Promise<void> {
        // Buscar transação antes de deletar
        const snapshot = await get(ref(db, `users/${userId}/transactions/${transactionId}`))
        if (!snapshot.exists()) throw new Error('Transação não encontrada')

        const transaction: Transaction = { id: transactionId, ...snapshot.val() }

        // Se for uma parcela, buscar TODAS as parcelas desta compra
        if (transaction.installmentId) {
            const allTransactionsSnapshot = await get(ref(db, `users/${userId}/transactions`))

            if (allTransactionsSnapshot.exists()) {
                const allTransactions = allTransactionsSnapshot.val()
                const installmentIds: string[] = []

                // Encontrar todas as transações com o mesmo installmentId
                Object.keys(allTransactions).forEach(key => {
                    if (allTransactions[key].installmentId === transaction.installmentId) {
                        installmentIds.push(key)
                    }
                })

                // Excluir todas as parcelas
                const updates: Record<string, null> = {}
                installmentIds.forEach(id => {
                    updates[id] = null
                })

                await update(ref(db, `users/${userId}/transactions`), updates)
                console.log(`${installmentIds.length} parcelas excluídas`)
                return
            }
        }

        // Transação normal (não parcelada)
        // Reverter impacto no saldo (se a conta ainda existir)
        if (transaction.accountId && transaction.expenseType !== 'installment') {
            try {
                if (transaction.type === 'income') {
                    await accountService.adjustBalance(userId, transaction.accountId, transaction.amount, 'subtract')
                } else if (transaction.isPaid) {
                    await accountService.adjustBalance(userId, transaction.accountId, transaction.amount, 'add')
                }
            } catch (error) {
                // Conta pode ter sido deletada, apenas loga o erro e continua
                console.warn('Não foi possível ajustar saldo da conta (pode ter sido deletada):', error)
            }
        }

        await remove(ref(db, `users/${userId}/transactions/${transactionId}`))
    },

    // Buscar despesas fixas pendentes próximas do vencimento
    async getPendingExpenses(userId: string): Promise<Transaction[]> {
        // Busca todas as transações (idealmente seria uma query composta, mas o Firebase tem limitações)
        // Para otimizar, vamos buscar apenas as que tem isRecurring = true se possível, 
        // mas como indexOn é limitado, vamos buscar e filtrar no cliente por enquanto.
        // Uma estratégia melhor seria ter uma coleção separada ou índice composto.
        // Dado o volume esperado para um usuário pessoal, buscar tudo e filtrar não é crítico agora.

        const q = query(
            ref(db, `users/${userId}/transactions`),
            orderByChild('isRecurring'),
            startAt(true),
            endAt(true)
        )

        const snapshot = await get(q)
        if (!snapshot.exists()) return []

        const data = snapshot.val()
        const transactions: Transaction[] = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }))

        // Filtrar apenas despesas fixas não pagas e próximas do vencimento (ou atrasadas)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const fiveDaysFromNow = new Date(today)
        fiveDaysFromNow.setDate(today.getDate() + 5)

        return transactions.filter(t => {
            if (t.type !== 'expense' || t.expenseType !== 'fixed' || t.isPaid) return false
            if (!t.dueDate) return false

            const dueDate = new Date(t.dueDate)
            return dueDate <= fiveDaysFromNow
        }).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))
    },

    // Buscar transações fixas (receitas E despesas) + parcelas sem cartão pendentes de confirmação
    async getPendingConfirmations(userId: string): Promise<{ expenses: Transaction[], incomes: Transaction[] }> {
        // Buscar todas as transações
        const allSnapshot = await get(ref(db, `users/${userId}/transactions`))
        if (!allSnapshot.exists()) return { expenses: [], incomes: [] }

        const data = allSnapshot.val()
        const transactions: Transaction[] = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }))

        console.log('[getPendingConfirmations] Total de transações:', transactions.length)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const fiveDaysFromNow = new Date(today)
        fiveDaysFromNow.setDate(today.getDate() + 5)

        console.log('[getPendingConfirmations] Hoje:', today.toISOString())
        console.log('[getPendingConfirmations] 5 dias no futuro:', fiveDaysFromNow.toISOString())

        // Filtrar despesas fixas não pagas OU parcelas sem cartão não pagas
        const expenses = transactions.filter(t => {
            // Despesas fixas recorrentes
            if (t.type === 'expense' && t.expenseType === 'fixed' && !t.isPaid && t.dueDate) {
                const dueDate = new Date(t.dueDate)
                return dueDate <= fiveDaysFromNow
            }

            // Parcelas SEM cartão não pagas
            const hasNoCard = !t.cardId || t.cardId === ''
            if (t.type === 'expense' && t.expenseType === 'installment' && hasNoCard && !t.isPaid && t.date) {
                const dueDate = new Date(t.date) // Para parcelas, a data É o vencimento
                const shouldShow = dueDate <= fiveDaysFromNow

                console.log('[getPendingConfirmations] Parcela:', {
                    desc: t.description,
                    installment: `${t.currentInstallment}/${t.installments}`,
                    dueDate: dueDate.toISOString(),
                    isPaid: t.isPaid,
                    shouldShow
                })

                return shouldShow
            }

            return false
        }).sort((a, b) => {
            const dateA = a.dueDate || a.date || 0
            const dateB = b.dueDate || b.date || 0
            return dateA - dateB
        })

        // Filtrar receitas fixas não recebidas
        const incomes = transactions.filter(t => {
            if (t.type !== 'income' || !t.isRecurring || t.isPaid) return false
            if (!t.dueDate) return false

            const dueDate = new Date(t.dueDate)
            const shouldShow = dueDate <= fiveDaysFromNow

            console.log('[getPendingConfirmations] Receita:', {
                desc: t.description,
                dueDate: dueDate.toISOString(),
                isPaid: t.isPaid,
                shouldShow
            })

            return shouldShow
        }).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))

        console.log('[getPendingConfirmations] Resultado final:', { expenses: expenses.length, incomes: incomes.length })

        return { expenses, incomes }
    }
    ,

    // Confirmar transação fixa (receita ou despesa)
    async confirmTransaction(
        userId: string,
        transactionId: string,
        confirmedAmount: number,
        updateFutureValues: boolean
    ): Promise<void> {
        const transactionRef = ref(db, `users/${userId}/transactions/${transactionId}`)
        const snapshot = await get(transactionRef)

        if (!snapshot.exists()) throw new Error('Transação não encontrada')

        const transaction: Transaction = { id: transactionId, ...snapshot.val() }

        // 1. Atualizar valueHistory com novo valor confirmado
        const currentHistory = transaction.valueHistory || []
        const updatedHistory = [...currentHistory, confirmedAmount].slice(-5) // Últimos 5 valores

        // 2. Marcar como pago/recebido, atualizar valor e histórico
        await update(transactionRef, {
            isPaid: true,
            amount: confirmedAmount,
            valueHistory: updatedHistory
        })

        // 3. Atualizar saldo da conta
        if (transaction.accountId) {
            const accountRef = ref(db, `users/${userId}/accounts/${transaction.accountId}`)
            const accountSnapshot = await get(accountRef)

            if (accountSnapshot.exists()) {
                const account = accountSnapshot.val()
                const newBalance = transaction.type === 'income'
                    ? account.currentBalance + confirmedAmount
                    : account.currentBalance - confirmedAmount

                await update(accountRef, {
                    currentBalance: newBalance
                })
            }
        }

        // 4. Gerar próxima recorrência com valor probatório
        if (transaction.isRecurring || transaction.expenseType === 'fixed') {
            const currentDueDate = new Date(transaction.dueDate!)
            const nextDueDate = new Date(currentDueDate)
            nextDueDate.setMonth(currentDueDate.getMonth() + 1)

            const nextDate = new Date(transaction.date)
            nextDate.setMonth(nextDate.getMonth() + 1)

            // Calcular próximo valor baseado em histórico
            let nextAmount: number

            if (updateFutureValues) {
                // Usuário escolheu atualizar valor base
                nextAmount = confirmedAmount
            } else {
                // Usar cálculo probatório baseado em histórico
                const probableValue = this.calculateProbableValue(updatedHistory)
                nextAmount = probableValue !== null ? probableValue : confirmedAmount
            }

            const nextTransactionData = {
                ...transaction,
                date: nextDate.getTime(),
                dueDate: nextDueDate.getTime(),
                isPaid: false,
                amount: nextAmount,
                valueHistory: updatedHistory
            }

            // Remove campos que não devem ser copiados
            // @ts-ignore
            delete nextTransactionData.id

            const newRef = push(ref(db, `users/${userId}/transactions`))
            await set(newRef, {
                ...nextTransactionData,
                createdAt: Date.now(),
            })
        }
    },

    /**
     * Calcula o próximo valor probatório baseado em histórico de variações
     * Analisa variações percentuais entre valores consecutivos e aplica média
     * Funciona tanto para aumentos quanto reduções
     */
    calculateProbableValue(valueHistory?: number[]): number | null {
        if (!valueHistory || valueHistory.length < 2) {
            return null // Sem histórico suficiente
        }

        // Calcular variações percentuais entre valores consecutivos
        const variations: number[] = []
        for (let i = 1; i < valueHistory.length; i++) {
            const previous = valueHistory[i - 1]
            const current = valueHistory[i]
            const variation = ((current - previous) / previous) * 100
            variations.push(variation)
        }

        // Calcular média das variações
        const avgVariation = variations.reduce((sum, v) => sum + v, 0) / variations.length

        // Aplicar média no último valor
        const lastValue = valueHistory[valueHistory.length - 1]
        const nextValue = lastValue * (1 + avgVariation / 100)

        // Retornar com 2 casas decimais
        return Math.round(nextValue * 100) / 100
    },

    calculateStats(transactions: Transaction[]) {
        console.log('[calculateStats] Total de transações:', transactions.length)

        return transactions.reduce(
            (acc, curr) => {
                // Transações de cartão não contam no saldo (vão para fatura)
                // Só contamos receitas e despesas pagas em contas
                const isCardTransaction = !!curr.cardId

                if (curr.type === 'income') {
                    // Só conta se foi recebida (isPaid = true)
                    // Nova lógica: TODAS as receitas (fixas ou não) só contam se isPaid = true
                    if (curr.isPaid) {
                        console.log('[calculateStats] Contando receita:', {
                            desc: curr.description,
                            amount: curr.amount,
                            isPaid: curr.isPaid,
                            isRecurring: curr.isRecurring
                        })
                        acc.income += curr.amount
                        if (!isCardTransaction) {
                            acc.balance += curr.amount
                        }
                    } else {
                        console.log('[calculateStats] NÃO contando receita (isPaid=false):', {
                            desc: curr.description,
                            amount: curr.amount,
                            isPaid: curr.isPaid
                        })
                    }
                } else {
                    // Para despesas, só contar se foi paga (isPaid = true)
                    // Despesas fixas e variáveis só contam se isPaid = true
                    if (curr.isPaid) {
                        acc.expense += curr.amount
                        if (!isCardTransaction) {
                            acc.balance -= curr.amount
                        }
                    }
                }
                return acc
            },
            { income: 0, expense: 0, balance: 0 }
        )
    }
}
