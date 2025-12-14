'use client'

import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCategories } from '@/contexts/CategoryContext'
import { useAccounts } from '@/contexts/AccountContext'
import { useFamilyMembers } from '@/contexts/FamilyContext'
import { useAuth } from '@/contexts/AuthContext'
import { CreateCategoryModal } from '@/components/categories/CreateCategoryModal'
import { Plus, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Transaction } from '@/types'
import { useTransactions } from '@/contexts/TransactionContext'
import { useEffect } from 'react'
import { dateToTimestamp } from '@/lib/utils/date'


interface IncomeModalProps {
    isOpen: boolean
    onClose: () => void
    transactionToEdit?: Transaction | null
}

export function IncomeModal({ isOpen, onClose, transactionToEdit }: IncomeModalProps) {
    const { user, userData } = useAuth()
    const { createTransaction, updateTransaction } = useTransactions()
    const { categories } = useCategories()
    const { accounts, refresh: refreshAccounts } = useAccounts()
    const { members } = useFamilyMembers()

    const [loading, setLoading] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

    // Form States
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [accountId, setAccountId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [assignedTo, setAssignedTo] = useState('')
    const [isRecurring, setIsRecurring] = useState(false)

    useEffect(() => {
        if (transactionToEdit) {
            setAmount(transactionToEdit.amount.toString())
            setDescription(transactionToEdit.description)
            setCategoryId(transactionToEdit.categoryId)
            setAccountId(transactionToEdit.accountId)
            setDate(new Date(transactionToEdit.date).toISOString().split('T')[0])
            setAssignedTo(transactionToEdit.assignedTo || '')
            setIsRecurring(transactionToEdit.isRecurring || false)
        } else {
            resetForm()
        }
    }, [transactionToEdit, isOpen])

    useEffect(() => {
        if (isOpen && !transactionToEdit && user) {
            setAssignedTo(user.uid)
        }
    }, [isOpen, user, transactionToEdit])

    const incomeCategories = categories.filter(c => c.type === 'income' && !c.isArchived)
    const activeAccounts = accounts.filter(a => a.isActive)
    const activeMembers = members.filter(m => m.isActive)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !amount || !categoryId || !accountId) return

        setLoading(true)
        try {
            const transactionData = {
                type: 'income' as const,
                amount: parseFloat(amount),
                description,
                categoryId,
                accountId,
                date: dateToTimestamp(date),
                dueDate: isRecurring ? dateToTimestamp(date) : undefined,
                assignedTo,
                isRecurring,
                recurrenceDay: isRecurring ? new Date(date).getDate() : undefined,
                recurrenceType: isRecurring ? 'monthly' as const : undefined,
                isPaid: true, // Transações criadas manualmente são sempre consideradas pagas/recebidas
                valueHistory: isRecurring ? [parseFloat(amount)] : undefined // Iniciar histórico para receitas fixas
            }

            if (transactionToEdit) {
                await updateTransaction(transactionToEdit.id, transactionData)
            } else {
                console.log('[IncomeModal] Criando receita principal:', transactionData)
                await createTransaction(transactionData)

                // Se for receita fixa, criar próxima recorrência automaticamente
                if (isRecurring) {
                    // Calcular próximo mês corretamente
                    const currentDate = new Date(date)
                    const nextMonth = currentDate.getMonth() + 1
                    const nextYear = currentDate.getFullYear() + (nextMonth > 11 ? 1 : 0)
                    const adjustedNextMonth = nextMonth > 11 ? 0 : nextMonth
                    const nextDay = currentDate.getDate()

                    // Criar string de data no formato YYYY-MM-DD
                    const nextDateString = `${nextYear}-${String(adjustedNextMonth + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`

                    const nextTransactionData = {
                        ...transactionData,
                        date: dateToTimestamp(nextDateString),
                        dueDate: dateToTimestamp(nextDateString),
                        isPaid: false, // Próxima recorrência começa como não recebida
                    }

                    console.log('[IncomeModal] Criando próxima recorrência:', nextTransactionData)
                    await createTransaction(nextTransactionData)
                }

                // Recalcular saldos de TODAS as contas baseado nas transações
                if (user) {
                    const { accountService } = await import('@/lib/services/account.service')
                    await accountService.recalculateAllBalances(user.uid)
                    await refreshAccounts() // Recarregar contas após recalcular
                    console.log('[IncomeModal] Saldos recalculados e atualizados')
                }
            }

            onClose()
            resetForm()
        } catch (error) {
            console.error('Erro ao salvar receita:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setAmount('')
        setDescription('')
        setCategoryId('')
        setAccountId('')
        setDate(new Date().toISOString().split('T')[0])
        setAssignedTo(user?.uid || '')
        setIsRecurring(false)
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
                                        {transactionToEdit ? 'Editar Receita' : 'Nova Receita'}
                                    </Dialog.Title>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Valor e Data */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Valor (R$)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0,00"
                                                    required
                                                    className="text-lg font-semibold text-green-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Data
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Descrição */}
                                        <Input
                                            label="Descrição"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Ex: Salário, Freelance..."
                                            required
                                        />

                                        {/* Categoria e Conta */}
                                        <div className="grid grid-cols-2 gap-4">
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
                                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:ring-4 focus:ring-green-500/20 select-income bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 font-medium rounded-xl outline-none transition-all"
                                                    required
                                                >
                                                    <option value="">Selecione...</option>
                                                    {incomeCategories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                    <option value="new" className="font-bold text-teal-600">+ Criar Nova...</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Conta de Entrada
                                                </label>
                                                <select
                                                    value={accountId}
                                                    onChange={(e) => setAccountId(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:ring-4 focus:ring-green-500/20 select-income bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 font-medium rounded-xl outline-none transition-all"
                                                    required
                                                >
                                                    <option value="">Selecione...</option>
                                                    {activeAccounts.map(acc => (
                                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Atribuição */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Atribuído a
                                            </label>
                                            <select
                                                value={assignedTo}
                                                onChange={(e) => setAssignedTo(e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:ring-4 focus:ring-green-500/20 select-income bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 font-medium rounded-xl outline-none transition-all"
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

                                        {/* Recorrência */}
                                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                                            <input
                                                type="checkbox"
                                                id="isRecurring"
                                                checked={isRecurring}
                                                onChange={(e) => setIsRecurring(e.target.checked)}
                                                className="w-5 h-5 rounded checkbox-income border-gray-300 cursor-pointer"
                                            />
                                            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                Receita Fixa (Mensal)
                                            </label>
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
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                isLoading={loading}
                                            >
                                                {transactionToEdit ? 'Salvar Alterações' : 'Salvar Receita'}
                                            </Button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <CreateCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                type="income"
                onSuccess={(newCategoryId) => {
                    setCategoryId(newCategoryId)
                    setIsCategoryModalOpen(false)
                }}
            />
        </>
    )
}
