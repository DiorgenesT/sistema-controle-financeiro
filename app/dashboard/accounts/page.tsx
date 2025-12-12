'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAccounts } from '@/contexts/AccountContext'
import { Account } from '@/types'
import { Plus, Wallet, CreditCard, PiggyBank, Landmark, Edit2, Power, Trash2 } from 'lucide-react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import * as Icons from 'lucide-react'

const ACCOUNT_TYPES = [
    { value: 'checking', label: 'Conta Corrente', icon: 'Landmark' },
    { value: 'savings', label: 'Poupança', icon: 'PiggyBank' },
    { value: 'cash', label: 'Dinheiro', icon: 'Wallet' },
    { value: 'investment', label: 'Investimento', icon: 'TrendingUp' },
]

const ACCOUNT_ICONS = [
    'Wallet', 'Landmark', 'PiggyBank', 'CreditCard', 'TrendingUp',
    'DollarSign', 'Coins', 'Banknote', 'CircleDollarSign'
]

const ACCOUNT_COLORS = [
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#6366f1', '#ef4444', '#06b6d4'
]

export default function AccountsPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <AccountsContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function AccountsContent() {
    const { accounts, loading, createAccount, updateAccount, deactivateAccount, activateAccount, deleteAccount } = useAccounts()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [type, setType] = useState<'checking' | 'savings' | 'cash' | 'investment'>('checking')
    const [initialBalance, setInitialBalance] = useState('0')
    const [color, setColor] = useState(ACCOUNT_COLORS[0])
    const [icon, setIcon] = useState('Wallet')
    const [includeInTotal, setIncludeInTotal] = useState(true)

    const openCreateModal = () => {
        setEditingAccount(null)
        setName('')
        setType('checking')
        setInitialBalance('0')
        setColor(ACCOUNT_COLORS[0])
        setIcon('Wallet')
        setIncludeInTotal(true)
        setIsModalOpen(true)
    }

    const openEditModal = (account: Account) => {
        setEditingAccount(account)
        setName(account.name)
        setType(account.type)
        setInitialBalance(account.initialBalance.toString())
        setColor(account.color)
        setIcon(account.icon)
        setIncludeInTotal(account.includeInTotal ?? true) // Fallback para contas antigas
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const accountData = {
                name,
                type,
                initialBalance: parseFloat(initialBalance),
                color,
                icon,
                isActive: true,
                includeInTotal,
            }

            if (editingAccount) {
                await updateAccount(editingAccount.id, accountData)
            } else {
                await createAccount(accountData)
            }

            setIsModalOpen(false)
        } catch (error) {
            console.error('Erro ao salvar conta:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleActive = async (account: Account) => {
        if (account.isActive) {
            if (confirm(`Desativar a conta "${account.name}"?`)) {
                await deactivateAccount(account.id)
            }
        } else {
            await activateAccount(account.id)
        }
    }

    const handleDelete = async (account: Account) => {
        const confirmMessage = `⚠️ ATENÇÃO: Excluir "${account.name}"?\n\nEsta ação é IRREVERSÍVEL e pode afetar transações vinculadas a esta conta.\n\nDeseja continuar?`

        if (confirm(confirmMessage)) {
            try {
                await deleteAccount(account.id)
            } catch (error) {
                console.error('Erro ao excluir conta:', error)
                alert('Erro ao excluir conta. Verifique se não há transações vinculadas.')
            }
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const activeAccounts = accounts.filter(a => a.isActive)
    const inactiveAccounts = accounts.filter(a => !a.isActive)

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Contas & Carteiras
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gerencie suas contas bancárias e carteiras
                    </p>
                </div>
                <Button variant="primary" size="lg" onClick={openCreateModal}>
                    <Plus className="w-5 h-5 mr-2" />
                    Nova Conta
                </Button>
            </div>

            {loading ? (
                <Card>
                    <div className="text-center py-12">
                        <p className="text-gray-500">Carregando contas...</p>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Contas Ativas */}
                    {activeAccounts.length > 0 && (
                        <>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Contas Ativas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {activeAccounts.map(account => {
                                    // @ts-ignore
                                    const IconComponent = Icons[account.icon] || Wallet
                                    const accountType = ACCOUNT_TYPES.find(t => t.value === account.type)

                                    return (
                                        <Card
                                            key={account.id}
                                            className="group hover:shadow-lg transition-all"
                                            style={{
                                                borderLeft: `4px solid ${account.color}`
                                            }}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div
                                                    className="p-3 rounded-xl"
                                                    style={{ backgroundColor: `${account.color}20` }}
                                                >
                                                    <IconComponent className="w-6 h-6" style={{ color: account.color }} />
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(account)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                        title="Editar conta"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(account)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                        title="Desativar conta"
                                                    >
                                                        <Power className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(account)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Excluir conta"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                                {account.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                {accountType?.label || account.type}
                                            </p>

                                            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo Atual</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(account.currentBalance)}
                                                </p>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    {/* Contas Inativas */}
                    {inactiveAccounts.length > 0 && (
                        <>
                            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4 mt-8">
                                Contas Inativas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {inactiveAccounts.map(account => {
                                    // @ts-ignore
                                    const IconComponent = Icons[account.icon] || Wallet
                                    const accountType = ACCOUNT_TYPES.find(t => t.value === account.type)

                                    return (
                                        <Card
                                            key={account.id}
                                            className="opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 bg-gray-200 dark:bg-slate-700 rounded-xl">
                                                    <IconComponent className="w-6 h-6 text-gray-500" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleToggleActive(account)}
                                                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                        title="Reativar conta"
                                                    >
                                                        <Power className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(account)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Excluir conta"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-1">
                                                {account.name}
                                            </h3>
                                            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                                                {accountType?.label || account.type} (Inativa)
                                            </p>

                                            <div className="pt-4 border-t border-gray-300 dark:border-slate-600">
                                                <p className="text-xs text-gray-400 mb-1">Último Saldo</p>
                                                <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                                                    {formatCurrency(account.currentBalance)}
                                                </p>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    {/* Empty State */}
                    {accounts.length === 0 && (
                        <Card>
                            <div className="text-center py-16">
                                <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Nenhuma conta cadastrada
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Comece adicionando sua primeira conta
                                </p>
                                <Button variant="primary" onClick={openCreateModal}>
                                    <Plus className="w-5 h-5 mr-2" />
                                    Criar Primeira Conta
                                </Button>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* Modal de Criar/Editar Conta */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
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
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl transition-all">
                                    <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                        {editingAccount ? 'Editar Conta' : 'Nova Conta'}
                                    </Dialog.Title>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <Input
                                            label="Nome da Conta"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: Conta Corrente Banco X"
                                            required
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tipo de Conta
                                            </label>
                                            <select
                                                value={type}
                                                onChange={(e) => setType(e.target.value as any)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                                            >
                                                {ACCOUNT_TYPES.map(at => (
                                                    <option key={at.value} value={at.value}>{at.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <Input
                                            label="Saldo Inicial (R$)"
                                            type="number"
                                            step="0.01"
                                            value={initialBalance}
                                            onChange={(e) => setInitialBalance(e.target.value)}
                                            required
                                        />

                                        {/* Checkbox para incluir no saldo total */}
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                                            <input
                                                type="checkbox"
                                                id="includeInTotal"
                                                checked={includeInTotal}
                                                onChange={(e) => setIncludeInTotal(e.target.checked)}
                                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
                                            />
                                            <label htmlFor="includeInTotal" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer flex-1">
                                                Incluir no Saldo Total Disponível
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Ícone
                                            </label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {ACCOUNT_ICONS.map(iconName => {
                                                    // @ts-ignore
                                                    const IconComp = Icons[iconName]
                                                    return (
                                                        <button
                                                            key={iconName}
                                                            type="button"
                                                            onClick={() => setIcon(iconName)}
                                                            className={`p-3 rounded-lg border-2 transition-all ${icon === iconName
                                                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                                                : 'border-gray-200 dark:border-slate-600 hover:border-teal-300'
                                                                }`}
                                                        >
                                                            <IconComp className="w-5 h-5 mx-auto" />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Cor
                                            </label>
                                            <div className="grid grid-cols-9 gap-2">
                                                {ACCOUNT_COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setColor(c)}
                                                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                                                            }`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => setIsModalOpen(false)}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                className="flex-1"
                                                isLoading={isSubmitting}
                                            >
                                                {editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
                                            </Button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    )
}
