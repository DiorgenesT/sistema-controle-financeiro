import { ref, push, set, get, update, remove } from 'firebase/database'
import { db } from '@/lib/firebase/config'
import { Account } from '@/types'
import { DEFAULT_ACCOUNT } from '@/lib/constants/default-accounts'

export const accountService = {
    // Buscar todas contas do usuário
    async getAll(userId: string): Promise<Account[]> {
        const snapshot = await get(ref(db, `users/${userId}/accounts`))
        if (!snapshot.exists()) return []

        const data = snapshot.val()
        return Object.keys(data).map(key => ({ id: key, ...data[key] }))
    },

    // Criar conta
    async create(userId: string, account: Omit<Account, 'id' | 'createdAt' | 'currentBalance'>): Promise<string> {
        const newRef = push(ref(db, `users/${userId}/accounts`))
        await set(newRef, {
            ...account,
            currentBalance: account.initialBalance,
            createdAt: Date.now(),
        })
        return newRef.key!
    },

    // Atualizar conta
    async update(userId: string, accountId: string, data: Partial<Account>): Promise<void> {
        await update(ref(db, `users/${userId}/accounts/${accountId}`), data)
    },

    // Desativar conta
    async deactivate(userId: string, accountId: string): Promise<void> {
        await update(ref(db, `users/${userId}/accounts/${accountId}`), {
            isActive: false,
        })
    },

    // Ativar conta
    async activate(userId: string, accountId: string): Promise<void> {
        await update(ref(db, `users/${userId}/accounts/${accountId}`), {
            isActive: true,
        })
    },

    // Seed - criar conta padrão
    async seedDefaultAccount(userId: string): Promise<void> {
        await this.create(userId, DEFAULT_ACCOUNT)
    },

    // Buscar conta por ID
    async getById(userId: string, accountId: string): Promise<Account | null> {
        const snapshot = await get(ref(db, `users/${userId}/accounts/${accountId}`))
        if (!snapshot.exists()) return null
        return { id: accountId, ...snapshot.val() }
    },

    // Ajustar saldo da conta
    async adjustBalance(userId: string, accountId: string, amount: number, operation: 'add' | 'subtract'): Promise<void> {
        const account = await this.getById(userId, accountId)
        if (!account) throw new Error('Conta não encontrada')

        const newBalance = operation === 'add'
            ? account.currentBalance + amount
            : account.currentBalance - amount

        await update(ref(db, `users/${userId}/accounts/${accountId}`), {
            currentBalance: newBalance
        })
    },

    // Transferir para meta (valida saldo, debita e cria transação)
    async transferToGoal(userId: string, accountId: string, goalId: string, amount: number): Promise<void> {
        const account = await this.getById(userId, accountId)
        if (!account) throw new Error('Conta não encontrada')

        if (account.currentBalance < amount) {
            throw new Error('Saldo insuficiente na conta')
        }

        // Buscar meta para pegar o nome
        const goalRef = ref(db, `users/${userId}/goals/${goalId}`)
        const goalSnapshot = await get(goalRef)
        const goal = goalSnapshot.val()

        if (!goal) throw new Error('Meta não encontrada')

        // 1. Criar transação de DESPESA (isso afeta orçamento diário)
        // A transação com isPaid:true já debita automaticamente via transaction.service
        const transactionRef = push(ref(db, `users/${userId}/transactions`))
        const transaction = {
            id: transactionRef.key,
            type: 'expense',
            amount,
            description: `Transferência para ${goal.name || 'Reserva de Emergência'}`,
            categoryId: 'reserva-emergencia', // Categoria especial
            accountId,
            date: Date.now(),
            isPaid: true, // Débito automático via transaction.service
            notes: 'Contribuição para reserva de emergência',
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        await set(transactionRef, transaction)

        // REMOVIDO: Débito manual da conta (causava dupla contabilização)
        // await this.adjustBalance(userId, accountId, amount, 'subtract')
        // A transação criada acima com isPaid:true já debita automaticamente

        // 2. Adicionar à meta (contribuição)
        const newCurrentAmount = (goal.currentAmount || 0) + amount
        const contribution = {
            id: Date.now().toString(),
            amount,
            date: Date.now(),
            note: `Transferência de ${account.name}`
        }

        await update(goalRef, {
            currentAmount: newCurrentAmount,
            contributions: [...(goal.contributions || []), contribution],
            updatedAt: Date.now()
        })
    },

    // Sacar da reserva de volta para conta
    async withdrawFromGoal(userId: string, accountId: string, goalId: string, amount: number): Promise<void> {
        // Buscar conta
        const account = await this.getById(userId, accountId)
        if (!account) throw new Error('Conta não encontrada')

        // Buscar meta
        const goalRef = ref(db, `users/${userId}/goals/${goalId}`)
        const goalSnapshot = await get(goalRef)
        const goal = goalSnapshot.val()

        if (!goal) throw new Error('Meta não encontrada')
        if ((goal.currentAmount || 0) < amount) {
            throw new Error('Saldo insuficiente na reserva')
        }

        // 1. Criar transação de RECEITA (dinheiro voltando)
        // A transação com isPaid:true já credita automaticamente via transaction.service
        const transactionRef = push(ref(db, `users/${userId}/transactions`))
        const transaction = {
            id: transactionRef.key,
            type: 'income',
            amount,
            description: `Saque de ${goal.name || 'Reserva de Emergência'}`,
            categoryId: 'saque-reserva', // Categoria especial
            accountId,
            date: Date.now(),
            isPaid: true, // Crédito automático via transaction.service
            notes: 'Saque da reserva de emergência',
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        await set(transactionRef, transaction)

        // REMOVIDO: Crédito manual na conta (causava dupla contabilização)
        // await this.adjustBalance(userId, accountId, amount, 'add')
        // A transação criada acima com isPaid:true já credita automaticamente

        // 2. Subtrair da meta
        const newCurrentAmount = (goal.currentAmount || 0) - amount
        const withdrawal = {
            id: Date.now().toString(),
            amount: -amount, // Negativo para indicar retirada
            date: Date.now(),
            note: `Saque para ${account.name}`
        }

        await update(goalRef, {
            currentAmount: newCurrentAmount,
            contributions: [...(goal.contributions || []), withdrawal],
            updatedAt: Date.now()
        })
    },

    // Recalcular saldo da conta baseado nas transações
    async recalculateBalance(userId: string, accountId: string): Promise<void> {
        const account = await this.getById(userId, accountId)
        if (!account) throw new Error('Conta não encontrada')

        // Buscar TODAS as transações dessa conta
        const transactionsRef = ref(db, `users / ${userId} / transactions`)
        const snapshot = await get(transactionsRef)

        if (!snapshot.exists()) {
            // Sem transações = saldo inicial
            await update(ref(db, `users / ${userId} / accounts / ${accountId}`), {
                currentBalance: account.initialBalance
            })
            return
        }

        const data = snapshot.val()
        const transactions = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .filter((t: any) => t.accountId === accountId)

        console.log('[recalculateBalance] Transações da conta:', transactions.length)

        // Calcular saldo baseado apenas em transações PAGAS
        let calculatedBalance = account.initialBalance

        transactions.forEach((t: any) => {
            const isCardTransaction = !!t.cardId

            // Só contar transações PAGAS e que NÃO são de cartão
            if (t.isPaid && !isCardTransaction) {
                if (t.type === 'income') {
                    calculatedBalance += t.amount
                    console.log('[recalculateBalance] +', t.amount, t.description)
                } else {
                    calculatedBalance -= t.amount
                    console.log('[recalculateBalance] -', t.amount, t.description)
                }
            }
        })

        console.log('[recalculateBalance] Saldo calculado:', calculatedBalance)

        // Atualizar no Firebase
        await update(ref(db, `users / ${userId} / accounts / ${accountId}`), {
            currentBalance: calculatedBalance
        })
    },

    // Recalcular saldos de TODAS as contas
    async recalculateAllBalances(userId: string): Promise<void> {
        const accounts = await this.getAll(userId)

        for (const account of accounts) {
            await this.recalculateBalance(userId, account.id)
        }

        console.log('[recalculateAllBalances] Todos os saldos recalculados')
    },

    // Excluir conta
    async delete(userId: string, accountId: string): Promise<void> {
        await remove(ref(db, `users / ${userId} / accounts / ${accountId}`))
    },
}
