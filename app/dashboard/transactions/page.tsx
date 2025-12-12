'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, ArrowLeftRight, Edit2, Trash2, Calendar, Search, Wallet, CreditCard as CreditCardIcon } from 'lucide-react'
import { IncomeModal } from '@/components/transactions/IncomeModal'
import { ExpenseModal } from '@/components/transactions/ExpenseModal'
import { TransferModal } from '@/components/transactions/TransferModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTransactions } from '@/contexts/TransactionContext'
import { useCategories } from '@/contexts/CategoryContext'
import { useAccounts } from '@/contexts/AccountContext'
import { useFamilyMembers } from '@/contexts/FamilyContext'
import { useCreditCards } from '@/contexts/CreditCardContext'
import { useAuth } from '@/contexts/AuthContext'
import { Transaction } from '@/types'
import * as Icons from 'lucide-react'

type TabType = 'accounts' | 'cards'

export default function TransactionsPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <TransactionsContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function TransactionsContent() {
    const [activeTab, setActiveTab] = useState<TabType>('accounts')
    const { transactions, loading, deleteTransaction, filterMonth, setFilterMonth, filterYear, setFilterYear } = useTransactions()
    const { categories } = useCategories()
    const { accounts } = useAccounts()
    const { members } = useFamilyMembers()
    const { user, userData } = useAuth()
    const { cards } = useCreditCards()

    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)

    // Estados para modal de confirmação
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
    const [confirmMessage, setConfirmMessage] = useState({ title: '', message: '' })

    const handleEdit = (transaction: Transaction) => {
        if (transaction.type === 'income') {
            setTransactionToEdit(transaction)
            setIsIncomeModalOpen(true)
        } else {
            setTransactionToEdit(transaction)
            setIsExpenseModalOpen(true)
        }
    }

    const handleDelete = async (transaction: Transaction) => {
        let title = 'Confirmar Exclusão'
        let message = 'Tem certeza que deseja excluir esta transação?'

        // Se for uma parcela, avisar que TODAS serão excluídas
        if (transaction.installmentId && transaction.installments) {
            const totalValue = (transaction.amount * transaction.installments).toFixed(2)
            title = '⚠️ Excluir Compra Parcelada'
            message = `Esta é uma compra PARCELADA!

Ao excluir, TODAS as ${transaction.installments} parcelas serão removidas.

Valor total: R$ ${totalValue}

Deseja continuar?`
        }

        setConfirmMessage({ title, message })
        setTransactionToDelete(transaction)
        setIsConfirmDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (transactionToDelete) {
            await deleteTransaction(transactionToDelete.id)
            setTransactionToDelete(null)
        }
    }

    const handleCloseModal = () => {
        setIsIncomeModalOpen(false)
        setIsExpenseModalOpen(false)
        setTransactionToEdit(null)
    }

    const getCategory = (id: string) => categories.find(c => c.id === id)
    const getAccount = (id: string) => accounts.find(a => a.id === id)

    // Helper para obter origem (conta ou cartão)
    const getOrigin = (transaction: Transaction) => {
        // Se tem cartão, mostrar cartão
        if (transaction.cardId) {
            const card = cards.find((c: any) => c.id === transaction.cardId)
            return card ? `💳 ${card.nickname || card.cardBrand}` : '💳 Cartão'
        }
        // Se tem conta, mostrar conta
        if (transaction.accountId) {
            const account = getAccount(transaction.accountId)
            return account?.name || '-'
        }
        return '-'
    }

    // Helper para obter nome do atribuído
    const getAssignedName = (id?: string) => {
        if (!id) return '-'
        if (id === 'family') return 'Família'
        if (id === user?.uid) return userData?.name || 'Você'
        const member = members.find(m => m.id === id)
        return member?.name || '-'
    }

    // Filtrar transações baseado na aba ativa
    const filteredTransactions = transactions.filter(tx => {
        if (activeTab === 'accounts') {
            // Aba Contas: transações SEM cardId (afetam saldo imediatamente)
            return !tx.cardId
        } else {
            // Aba Cartões: transações COM cardId (vão para fatura)
            return !!tx.cardId
        }
    })

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

    return (
        <div className="p-8">
            {/* Header com Abas */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Transações
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="lg" onClick={() => setIsIncomeModalOpen(true)}>
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Receita
                        </Button>
                        <Button variant="primary" size="lg" onClick={() => setIsExpenseModalOpen(true)}>
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Despesa
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => setIsTransferModalOpen(true)}>
                            <ArrowLeftRight className="w-5 h-5 mr-2" />
                            Transferir
                        </Button>
                    </div>
                </div>

                {/* Abas */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('accounts')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${activeTab === 'accounts'
                            ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <Wallet className="w-5 h-5" />
                        Contas
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700">
                            {transactions.filter(tx => !tx.cardId).length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${activeTab === 'cards'
                            ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <CreditCardIcon className="w-5 h-5" />
                        Cartões
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700">
                            {transactions.filter(tx => !!tx.cardId).length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <Card className="mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Período:</span>
                    </div>
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(parseInt(e.target.value))}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Lista de Transações */}
            <Card className="overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Carregando transações...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-16">
                        <ArrowLeftRight className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Nenhuma transação encontrada
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Neste período não há registros.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Origem</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Atribuído</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {filteredTransactions.map((t) => {
                                    const category = getCategory(t.categoryId)
                                    const account = getAccount(t.accountId)
                                    // @ts-ignore
                                    const Icon = category ? Icons[category.icon] : Search

                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(t.date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {/* Nome da transação */}
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {t.description}
                                                    </span>

                                                    {/* Badges inline */}
                                                    {t.expenseType === 'installment' && t.currentInstallment && t.installments && (
                                                        <>
                                                            <span className="text-gray-400 dark:text-gray-500">•</span>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                                {t.currentInstallment}/{t.installments}x
                                                            </span>
                                                            {t.purchaseDate && (
                                                                <>
                                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                                        {new Date(t.purchaseDate).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </>
                                                    )}

                                                    {t.isRecurring && (
                                                        <>
                                                            <span className="text-gray-400 dark:text-gray-500">•</span>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                Mensal
                                                            </span>
                                                        </>
                                                    )}

                                                    {t.type === 'transfer' && (
                                                        <>
                                                            <span className="text-gray-400 dark:text-gray-500">•</span>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                ↔️
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div
                                                        className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3"
                                                        style={{ backgroundColor: category?.color ? `${category.color}20` : '#ccc' }}
                                                    >
                                                        <Icon className="h-4 w-4" style={{ color: category?.color }} />
                                                    </div>
                                                    <div className="text-sm text-gray-900 dark:text-white">{category?.name || '-'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {getOrigin(t)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {getAssignedName(t.assignedTo)}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(t)}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <IncomeModal
                isOpen={isIncomeModalOpen}
                onClose={handleCloseModal}
                transactionToEdit={transactionToEdit}
            />

            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={handleCloseModal}
                transactionToEdit={transactionToEdit}
            />

            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
            />

            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={confirmDelete}
                title={confirmMessage.title}
                message={confirmMessage.message}
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    )
}
