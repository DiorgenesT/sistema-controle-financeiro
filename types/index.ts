export type CategoryType = 'income' | 'expense'
export type AccountType = 'cash' | 'bank' | 'credit' | 'investment'
export type TransactionType = 'income' | 'expense' | 'transfer'

export interface User {
    uid: string
    email: string
    name: string
    role: 'admin' | 'user'
    profileCompleted: boolean
    createdAt: Date
    isActive: boolean
    createdBy?: string
}

export interface FamilyMember {
    id: string
    userId: string
    name: string
    isActive: boolean
    createdAt: number
}

export interface Category {
    id: string
    name: string
    type: CategoryType
    icon: string // Nome do ícone Lucide
    color: string // Hex color
    monthlyBudget?: number
    isArchived: boolean
    createdAt: number
}

export interface Account {
    id: string
    name: string
    type: AccountType
    initialBalance: number
    currentBalance: number
    color: string
    icon: string
    isActive: boolean
    includeInTotal: boolean // Se deve incluir no cálculo de saldo total
    createdAt: number
}

export interface CreditCard {
    id: string
    userId: string
    nickname: string
    cardBrand: string
    lastFourDigits: string
    closingDay: number
    dueDay: number
    limit: number
    color: string
    isActive: boolean
    createdAt: number
}

export interface CreditCardInvoice {
    id: string
    cardId: string
    userId: string
    month: number // 0-11 (Janeiro = 0, Dezembro = 11)
    year: number // 2024, 2025, etc
    closingDate: number // timestamp da data de fechamento
    dueDate: number // timestamp da data de vencimento
    totalAmount: number
    isPaid: boolean
    paymentDate?: number
    paidFromAccountId?: string
    paymentTransactionId?: string // ID da transação de pagamento criada
    transactionIds: string[] // IDs das transações incluídas nesta fatura
    createdAt: number
}

export interface Transaction {
    id: string
    type: TransactionType
    amount: number
    description: string
    categoryId: string
    accountId: string
    date: number
    isPaid: boolean
    notes?: string
    assignedTo?: string // ID do usuário, ID do membro ou 'family'
    isRecurring?: boolean // Se é uma receita/despesa fixa
    recurrenceDay?: number // Dia da recorrência (1-31)
    recurrenceType?: 'monthly' | 'yearly'

    // Campos de Despesa
    expenseType?: 'fixed' | 'cash' | 'installment'
    cardId?: string
    installments?: number
    currentInstallment?: number
    installmentId?: string
    dueDate?: number
    purchaseDate?: number // Data original da compra (para parcelas)
    valueHistory?: number[] // Histórico dos últimos valores confirmados (para cálculo probatório)

    // Campos para parcelamento sem cartão
    firstDueDate?: number // Data do primeiro vencimento (quando sem cartão)
    downPaymentAmount?: number // Valor da entrada (quando sem cartão)

    // Campos de Transferência
    toAccountId?: string // Conta de destino (para transfers)

    createdAt: number
}

// Metas Financeiras
export type GoalCategory =
    | 'emergency' // Emergência
    | 'travel' // Viagem
    | 'house' // Casa/Imóvel
    | 'car' // Carro
    | 'education' // Educação
    | 'retirement' // Aposentadoria
    | 'other' // Outros

export type GoalStatus = 'active' | 'completed' | 'cancelled'

export interface Contribution {
    id: string
    amount: number
    date: number // Timestamp
    note?: string
}

export interface Goal {
    id: string
    userId: string
    name: string // Nome da meta
    description?: string
    category: GoalCategory
    targetAmount: number // Valor alvo
    currentAmount: number // Valor atual acumulado
    deadline: number // Timestamp da data limite
    icon?: string // Emoji
    color?: string
    contributions: Contribution[]
    createdAt: number
    updatedAt: number
    completedAt?: number
    status: GoalStatus
    isEmergencyFund?: boolean  // Flag para identificar reserva de emergência
    bankName?: string          // Nome do banco onde guarda a reserva
    accountInfo?: string       // Info da conta (opcional)
}
