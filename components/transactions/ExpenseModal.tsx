'use client'

import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CategoryPicker } from '@/components/ui/CategoryPicker'
import { AccountPicker } from '@/components/ui/AccountPicker'
import { CreditCardPicker } from '@/components/ui/CreditCardPicker'
import { AssignmentPicker } from '@/components/ui/AssignmentPicker'
import { useCategories } from '@/contexts/CategoryContext'
import { useAccounts } from '@/contexts/AccountContext'
import { useFamilyMembers } from '@/contexts/FamilyContext'
import { useCreditCards } from '@/contexts/CreditCardContext'
import { emergencyFundService } from '@/lib/services/emergency-fund.service'
import { useAuth } from '@/contexts/AuthContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { CreateCategoryModal } from '@/components/categories/CreateCategoryModal'
import { Transaction } from '@/types'
import { dateToTimestamp } from '@/lib/utils/date'
import { X, AlertTriangle, TrendingDown, CreditCard as CreditCardIcon, Calendar, DollarSign, Tag, User, FileText, Receipt, Zap, Clock } from 'lucide-react'

interface ExpenseModalProps {
    isOpen: boolean
    onClose: () => void
    initialType?: 'fixed' | 'cash' | 'installment'
    transactionToEdit?: Transaction | null
}

export function ExpenseModal({ isOpen, onClose, initialType = 'cash', transactionToEdit }: ExpenseModalProps) {
    const { user, userData } = useAuth()
    const { categories } = useCategories()
    const { accounts } = useAccounts()
    const { members } = useFamilyMembers()
    const { cards } = useCreditCards()
    const { createTransaction, updateTransaction } = useTransactions()

    const [loading, setLoading] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [emergencyGoal, setEmergencyGoal] = useState<any>(null)

    // Form States
    const [expenseType, setExpenseType] = useState<'fixed' | 'cash' | 'installment'>(initialType)
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [accountId, setAccountId] = useState('')
    const [cardId, setCardId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
    const [installments, setInstallments] = useState('1')
    const [assignedTo, setAssignedTo] = useState('')
    const [isPaid, setIsPaid] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Novos campos para parcelamento sem cartão
    const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split('T')[0])
    const [downPaymentAmount, setDownPaymentAmount] = useState('0')

    useEffect(() => {
        if (isOpen) {
            if (transactionToEdit) {
                setExpenseType(transactionToEdit.expenseType || 'cash')
                setAmount(transactionToEdit.amount.toString())
                setDescription(transactionToEdit.description)
                setCategoryId(transactionToEdit.categoryId)
                setAccountId(transactionToEdit.accountId || '')
                setCardId(transactionToEdit.cardId || '')
                setDate(new Date(transactionToEdit.date).toISOString().split('T')[0])
                setDueDate(transactionToEdit.dueDate ? new Date(transactionToEdit.dueDate).toISOString().split('T')[0] : '')
                setInstallments(transactionToEdit.installments?.toString() || '1')
                setAssignedTo(transactionToEdit.assignedTo || '')
                setIsPaid(transactionToEdit.isPaid)
            } else {
                resetForm()
                setExpenseType(initialType)
                if (user) setAssignedTo(user.uid)
                // Se for fixa, padrão não pago. Se for a vista, padrão pago.
                setIsPaid(initialType === 'cash')
            }
        }
    }, [isOpen, transactionToEdit, initialType, user])

    // Carregar meta de emergência
    useEffect(() => {
        const loadEmergencyGoal = async () => {
            if (!user) return
            try {
                const status = await emergencyFundService.getStatus(user.uid)
                if (status.hasGoal && status.goalInfo) {
                    setEmergencyGoal(status.goalInfo)
                }
            } catch (error) {
                console.error('Erro ao carregar meta de emergência:', error)
            }
        }
        loadEmergencyGoal()
    }, [user])

    const expenseCategories = categories.filter(c => c.type === 'expense' && !c.isArchived)
    const activeAccounts = accounts.filter(a => a.isActive)
    const activeMembers = members.filter(m => m.isActive)
    const activeCards = cards.filter(c => c.isActive)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !amount || !categoryId) return

        // Validações específicas
        if (expenseType === 'cash' && !accountId && !cardId) {
            alert('Selecione uma conta de débito OU um cartão de crédito')
            return
        }
        if (expenseType === 'fixed' && !accountId && !cardId) {
            alert('Selecione uma conta de débito OU um cartão de crédito')
            return
        }
        if (expenseType === 'installment' && !cardId && !accountId) {
            alert('Selecione uma conta para parcelamento sem cartão')
            return
        }

        setLoading(true)
        try {
            const baseData = {
                type: 'expense' as const,
                amount: parseFloat(amount),
                description,
                categoryId,
                accountId,
                date: dateToTimestamp(date),
                assignedTo,
                paymentMethod: 'cash',
                expenseType: 'variable',
                tags: [],
            }

            if (expenseType === 'cash') {
                // Despesa à vista
                const data = {
                    ...baseData,
                    accountId: accountId || '', // Conta (se for débito/dinheiro)
                    cardId: cardId || undefined, // Cartão (se for crédito à vista)
                    date: new Date(date).getTime(),
                    isPaid: !cardId // Se for cartão, não está pago (vai pra fatura)
                }
                if (transactionToEdit) await updateTransaction(transactionToEdit.id, data)
                else await createTransaction(data)

            } else if (expenseType === 'fixed') {
                // Despesa Fixa
                const data = {
                    ...baseData,
                    expenseType: 'fixed', // IMPORTANTE: sobrescrever o 'variable' do baseData
                    accountId: accountId || '', // Conta (se for débito)
                    cardId: cardId || undefined, // Cartão (se for crédito)
                    date: new Date(date).getTime(), // Data de competência
                    dueDate: new Date(dueDate + 'T12:00:00').getTime(), // Meio-dia local para evitar problemas de timezone
                    isPaid: true, // Despesas criadas manualmente são consideradas pagas
                    isRecurring: true,
                    recurrenceType: 'monthly' as const,
                    recurrenceDay: new Date(dueDate).getDate(),
                    valueHistory: [parseFloat(amount)] // Iniciar histórico
                }

                if (transactionToEdit) {
                    await updateTransaction(transactionToEdit.id, data)
                } else {
                    console.log('[ExpenseModal] Criando despesa principal:', data)
                    await createTransaction(data)

                    // Criar próxima recorrência automaticamente
                    // Calcular próximo mês a partir do dueDate
                    const currentDueDate = new Date(dueDate + 'T12:00:00')
                    const nextMonth = currentDueDate.getMonth() + 1
                    const nextYear = currentDueDate.getFullYear() + (nextMonth > 11 ? 1 : 0)
                    const adjustedNextMonth = nextMonth > 11 ? 0 : nextMonth
                    const nextDay = currentDueDate.getDate()

                    // Criar string de data no formato YYYY-MM-DD para o próximo vencimento
                    const nextDueDateString = `${nextYear}-${String(adjustedNextMonth + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`

                    // Para a data de competência, usar o mesmo mês
                    const currentDate = new Date(date)
                    const nextCompMonth = currentDate.getMonth() + 1
                    const nextCompYear = currentDate.getFullYear() + (nextCompMonth > 11 ? 1 : 0)
                    const adjustedNextCompMonth = nextCompMonth > 11 ? 0 : nextCompMonth
                    const nextCompDay = currentDate.getDate()

                    const nextDateString = `${nextCompYear}-${String(adjustedNextCompMonth + 1).padStart(2, '0')}-${String(nextCompDay).padStart(2, '0')}`

                    const nextTransactionData = {
                        ...data,
                        date: dateToTimestamp(nextDateString),
                        dueDate: dateToTimestamp(nextDueDateString),
                        isPaid: false, // Próxima recorrência começa como não paga
                    }

                    console.log('[ExpenseModal] Criando próxima recorrência:', nextTransactionData)
                    await createTransaction(nextTransactionData)
                }

            } else if (expenseType === 'installment') {
                // Despesa Parcelada
                const data = {
                    ...baseData,
                    expenseType: 'installment', // IMPORTANTE: sobrescrever o 'variable' do baseData
                    accountId: accountId || '', // Conta para débito futuro
                    cardId: cardId || undefined, // Opcional agora
                    date: new Date(date).getTime(),
                    installments: parseInt(installments),
                    isPaid: false,
                    // Campos para entrada (com ou sem cartão)
                    firstDueDate: !cardId && firstDueDate ? new Date(firstDueDate).getTime() : undefined,
                    downPaymentAmount: downPaymentAmount ? parseFloat(downPaymentAmount) : 0
                }
                await createTransaction(data)
            }

            onClose()
        } catch (error) {
            console.error('Erro ao salvar despesa:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setAmount('')
        setDescription('')
        setCategoryId('')
        setAccountId('')
        setCardId('')
        setDate(new Date().toISOString().split('T')[0])
        setDueDate(new Date().toISOString().split('T')[0])
        setInstallments('1')
        setAssignedTo(user?.uid || '')
        setIsPaid(true)
    }

    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl transition-all">
                                    <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                        {transactionToEdit ? 'Editar Despesa' : 'Nova Despesa'}
                                    </Dialog.Title>

                                    {/* Seletor de Tipo (Apenas na criação) */}
                                    {!transactionToEdit && (
                                        <div className="grid grid-cols-3 gap-2 mb-6">
                                            <button
                                                type="button"
                                                onClick={() => setExpenseType('cash')}
                                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${expenseType === 'cash'
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                                                    : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                <DollarSign className="w-6 h-6 mb-1" />
                                                <span className="text-xs font-medium">À Vista</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setExpenseType('installment')}
                                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${expenseType === 'installment'
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-lg shadow-red-500/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    }`}
                                            >
                                                <CreditCardIcon className="w-6 h-6 mb-1" />
                                                <span className="text-xs font-medium">Parcelado</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setExpenseType('fixed')}
                                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${expenseType === 'fixed'
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-lg shadow-red-500/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    }`}
                                            >
                                                <Clock className="w-6 h-6 mb-1" />
                                                <span className="text-xs font-medium">Fixa</span>
                                            </button>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Valor e Data */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Valor Total (R$)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0,00"
                                                    required
                                                    className="text-lg font-semibold text-red-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {expenseType === 'fixed' ? 'Data de Vencimento' : 'Data da Compra'}
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={expenseType === 'fixed' ? dueDate : date}
                                                    onChange={(e) => {
                                                        if (expenseType === 'fixed') setDueDate(e.target.value)
                                                        else setDate(e.target.value)
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Descrição */}
                                        <Input
                                            label="Descrição"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Ex: Supermercado, Aluguel..."
                                            required
                                        />

                                        {/* Categoria */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Categoria
                                            </label>
                                            <select
                                                value={categoryId}
                                                onChange={(e) => {
                                                    if (e.target.value === 'new') {
                                                        setIsCategoryModalOpen(true)
                                                    } else {
                                                        setCategoryId(e.target.value)
                                                    }
                                                }}
                                                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 select-expense bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 font-medium rounded-xl outline-none transition-all"
                                                required
                                            >
                                                <option value="">Selecione...</option>
                                                {expenseCategories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                                <option value="new" className="font-bold text-teal-600">+ Criar Nova...</option>
                                            </select>
                                        </div>

                                        {/* Campos Específicos por Tipo */}

                                        {/* À Vista: Conta OU Cartão */}
                                        {expenseType === 'cash' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Conta de Débito
                                                    </label>
                                                    <select
                                                        value={accountId}
                                                        onChange={(e) => {
                                                            const value = e.target.value
                                                            setAccountId(value)
                                                            if (value) setCardId('') // Limpa cartão se selecionar conta

                                                            // Alerta ao selecionar reserva
                                                            if (value.startsWith('goal-')) {
                                                                if (!confirm('⚠️ Atenção! Você está usando sua Reserva de Emergência.\n\nEste dinheiro deve ser usado apenas em situações de emergência real.\n\nDeseja continuar?')) {
                                                                    setAccountId('') // Cancela seleção
                                                                }
                                                            }
                                                        }}
                                                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 select-expense bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 font-medium rounded-xl outline-none transition-all"
                                                    >
                                                        <option value="">Nenhuma</option>
                                                        {activeAccounts.map(account => (
                                                            <option key={account.id} value={account.id}>{account.name}</option>
                                                        ))}
                                                        {emergencyGoal && emergencyGoal.currentAmount > 0 && (
                                                            <option
                                                                value={`goal-${emergencyGoal.id}`}
                                                                style={{ color: '#f97316', fontWeight: 'bold' }}
                                                            >
                                                                🛡️ Reserva de Emergência - R$ {emergencyGoal.currentAmount.toFixed(2)}
                                                            </option>
                                                        )}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Cartão de Crédito
                                                    </label>
                                                    <select
                                                        value={cardId}
                                                        onChange={(e) => {
                                                            setCardId(e.target.value)
                                                            if (e.target.value) setAccountId('') // Limpa conta se selecionar cartão
                                                        }}
                                                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 select-expense bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 font-medium rounded-xl outline-none transition-all"
                                                    >
                                                        <option value="">Nenhum</option>
                                                        {activeCards.map(card => (
                                                            <option key={card.id} value={card.id}>{card.nickname || card.cardBrand}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {!accountId && !cardId && (
                                                    <p className="col-span-2 text-xs text-amber-600 dark:text-amber-400">
                                                        ⚠️ Selecione uma conta OU um cartão
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Parcelado: Cartão e Parcelas */}
                                        {expenseType === 'installment' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Cartão de Crédito <span className="text-gray-400">(opcional)</span>
                                                        </label>
                                                        <select
                                                            value={cardId}
                                                            onChange={(e) => setCardId(e.target.value)}
                                                            className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 select-expense bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 font-medium rounded-xl outline-none transition-all"
                                                        >
                                                            <option value="">Sem cartão</option>
                                                            {activeCards.map(card => (
                                                                <option key={card.id} value={card.id}>{card.nickname || card.cardBrand}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Nº Parcelas
                                                        </label>
                                                        <select
                                                            value={installments}
                                                            onChange={(e) => setInstallments(e.target.value)}
                                                            className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 select-expense bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 font-medium rounded-xl outline-none transition-all"
                                                            disabled={!!transactionToEdit}
                                                        >
                                                            {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                                                                <option key={num} value={num}>{num}x</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Campo de CONTA obrigatório quando SEM cartão */}
                                                {!cardId && (
                                                    <div className="mt-4">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Conta de Débito <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={accountId}
                                                            onChange={(e) => setAccountId(e.target.value)}
                                                            className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 select-expense bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 font-medium rounded-xl outline-none transition-all"
                                                            required
                                                        >
                                                            <option value="">Selecione a conta...</option>
                                                            {activeAccounts.map(account => (
                                                                <option key={account.id} value={account.id}>{account.name}</option>
                                                            ))}
                                                        </select>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Conta de onde sairão os pagamentos das parcelas
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Campo de entrada - SEMPRE disponível */}
                                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                                        {cardId ? '💳 Entrada + Parcelamento no Cartão' : '💳 Parcelamento sem cartão (boleto/carnê/direto)'}
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        {!cardId && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                    1º Vencimento
                                                                </label>
                                                                <Input
                                                                    type="date"
                                                                    value={firstDueDate}
                                                                    onChange={(e) => setFirstDueDate(e.target.value)}
                                                                    required
                                                                />
                                                            </div>
                                                        )}
                                                        <div className={!cardId ? '' : 'col-span-2'}>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                Valor de Entrada (R$)
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={downPaymentAmount}
                                                                onChange={(e) => setDownPaymentAmount(e.target.value)}
                                                                placeholder="0,00"
                                                            />
                                                        </div>
                                                    </div>
                                                    {/* Preview do cálculo */}
                                                    {amount && parseFloat(downPaymentAmount) > 0 && (
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 p-2 rounded">
                                                            <p>💡 <strong>Entrada:</strong> R$ {parseFloat(downPaymentAmount).toFixed(2)} (paga hoje)</p>
                                                            <p>📦 <strong>{installments} parcelas de:</strong> R$ {((parseFloat(amount) - parseFloat(downPaymentAmount)) / parseInt(installments)).toFixed(2)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {/* Fixa: Conta OU Cartão */}
                                        {expenseType === 'fixed' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Conta de Débito
                                                    </label>
                                                    <select
                                                        value={accountId}
                                                        onChange={(e) => {
                                                            const value = e.target.value
                                                            setAccountId(value)
                                                            if (value) setCardId('') // Limpa cartão se selecionar conta

                                                            // Alerta ao selecionar reserva
                                                            if (value.startsWith('goal-')) {
                                                                if (!confirm('⚠️ Atenção! Você está usando sua Reserva de Emergência.\n\nEste dinheiro deve ser usado apenas em situações de emergência real.\n\nDeseja continuar?')) {
                                                                    setAccountId('') // Cancela seleção
                                                                }
                                                            }
                                                        }}
                                                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 select-expense bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 font-medium rounded-xl outline-none transition-all"
                                                    >
                                                        <option value="">Nenhuma</option>
                                                        {activeAccounts.map(acc => (
                                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                        ))}
                                                        {emergencyGoal && emergencyGoal.currentAmount > 0 && (
                                                            <option
                                                                value={`goal-${emergencyGoal.id}`}
                                                                style={{ color: '#f97316', fontWeight: 'bold' }}
                                                            >
                                                                🛡️ Reserva de Emergência - R$ {emergencyGoal.currentAmount.toFixed(2)}
                                                            </option>
                                                        )}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Cartão de Crédito
                                                    </label>
                                                    <select
                                                        value={cardId}
                                                        onChange={(e) => {
                                                            setCardId(e.target.value)
                                                            if (e.target.value) setAccountId('') // Limpa conta se selecionar cartão
                                                        }}
                                                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 select-expense bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 font-medium rounded-xl outline-none transition-all"
                                                    >
                                                        <option value="">Nenhum</option>
                                                        {activeCards.map(card => (
                                                            <option key={card.id} value={card.id}>{card.nickname || card.cardBrand}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {!accountId && !cardId && (
                                                    <p className="col-span-2 text-xs text-amber-600 dark:text-amber-400">
                                                        ⚠️ Selecione uma conta OU um cartão
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Atribuição */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Atribuído a
                                            </label>
                                            <select
                                                value={assignedTo}
                                                onChange={(e) => setAssignedTo(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 select-expense bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 font-medium rounded-xl outline-none transition-all"
                                            >
                                                <option value={user?.uid}>{userData?.name || 'Você'}</option>
                                                <option value="family">Família (Todos)</option>
                                                {activeMembers.length > 0 && (
                                                    <optgroup label="Membros da Família">
                                                        {activeMembers.map(member => (
                                                            <option key={member.id} value={member.id}>{member.name}</option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                            </select>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={onClose}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                isLoading={loading}
                                            >
                                                {transactionToEdit ? 'Salvar Alterações' : 'Salvar Despesa'}
                                            </Button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition >

            <CreateCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                type="expense"
                onSuccess={(newCategoryId) => {
                    setCategoryId(newCategoryId)
                    setIsCategoryModalOpen(false)
                }}
            />
        </>
    )
}
