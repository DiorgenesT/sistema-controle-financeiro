'use client'

import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAccounts } from '@/contexts/AccountContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { ArrowRight } from 'lucide-react'

interface TransferModalProps {
    isOpen: boolean
    onClose: () => void
}

export function TransferModal({ isOpen, onClose }: TransferModalProps) {
    const { user } = useAuth()
    const { activeAccounts } = useAccounts()
    const { createTransaction } = useTransactions()

    const [loading, setLoading] = useState(false)
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [fromAccountId, setFromAccountId] = useState('')
    const [toAccountId, setToAccountId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        if (isOpen) {
            resetForm()
        }
    }, [isOpen])

    const resetForm = () => {
        setAmount('')
        setDescription('Transferência entre contas')
        setFromAccountId('')
        setToAccountId('')
        setDate(new Date().toISOString().split('T')[0])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !amount || !fromAccountId || !toAccountId) return

        if (fromAccountId === toAccountId) {
            alert('As contas de origem e destino devem ser diferentes!')
            return
        }

        setLoading(true)
        try {
            // Criar transação de transferência
            await createTransaction({
                type: 'transfer',
                amount: parseFloat(amount),
                description,
                categoryId: 'transfer', // Categoria especial para transferências
                accountId: fromAccountId,
                toAccountId: toAccountId,
                date: new Date(date).getTime(),
                isPaid: true, // Transferências são sempre "pagas"
                assignedTo: user.uid,
                createdAt: Date.now()
            })

            onClose()
        } catch (error) {
            console.error('Erro ao criar transferência:', error)
            alert('Erro ao criar transferência. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const fromAccount = activeAccounts.find(a => a.id === fromAccountId)
    const toAccount = activeAccounts.find(a => a.id === toAccountId)

    return (
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl transition-all">
                                <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    Transferência entre Contas
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
                                                className="text-lg font-semibold text-blue-600"
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
                                        placeholder="Ex: Transferência para poupança"
                                        required
                                    />

                                    {/* Conta de Origem */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            De (Conta de Origem)
                                        </label>
                                        <select
                                            value={fromAccountId}
                                            onChange={(e) => setFromAccountId(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                            required
                                        >
                                            <option value="">Selecione a conta...</option>
                                            {activeAccounts.map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.currentBalance)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Ícone de Seta */}
                                    <div className="flex justify-center">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                            <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>

                                    {/* Conta de Destino */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Para (Conta de Destino)
                                        </label>
                                        <select
                                            value={toAccountId}
                                            onChange={(e) => setToAccountId(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                                            required
                                        >
                                            <option value="">Selecione a conta...</option>
                                            {activeAccounts.map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.currentBalance)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Preview da Transferência */}
                                    {fromAccount && toAccount && amount && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                                                Preview da Transferência:
                                            </p>
                                            <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                                                <p>• {fromAccount.name}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fromAccount.currentBalance)} → {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fromAccount.currentBalance - parseFloat(amount))}</p>
                                                <p>• {toAccount.name}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toAccount.currentBalance)} → {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toAccount.currentBalance + parseFloat(amount))}</p>
                                            </div>
                                        </div>
                                    )}

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
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                            isLoading={loading}
                                        >
                                            Transferir
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
