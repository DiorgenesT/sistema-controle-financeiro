import { useEffect, useState, Fragment } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAccounts } from '@/contexts/AccountContext'
import { transactionService } from '@/lib/services/transaction.service'
import { Transaction } from '@/types'
import { AlertTriangle, Calendar, CheckCircle, Clock, TrendingUp, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTransactions } from '@/contexts/TransactionContext'
import { Dialog, Transition } from '@headlessui/react'

export function DueSoonAlert() {
    const { user } = useAuth()
    const { refresh } = useTransactions()
    const { refresh: refreshAccounts } = useAccounts()
    const [pendingExpenses, setPendingExpenses] = useState<Transaction[]>([])
    const [pendingIncomes, setPendingIncomes] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    // Estado para o modal
    const [confirmingTransaction, setConfirmingTransaction] = useState<Transaction | null>(null)
    const [confirmedAmount, setConfirmedAmount] = useState('')
    const [updateFutureValues, setUpdateFutureValues] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const loadPending = async () => {
        if (!user) return
        try {
            console.log('[DueSoonAlert] Carregando confirmações pendentes...')
            const data = await transactionService.getPendingConfirmations(user.uid)
            console.log('[DueSoonAlert] Confirmações carregadas:', {
                expenses: data.expenses.length,
                incomes: data.incomes.length,
                expensesData: data.expenses.map(e => ({ id: e.id, desc: e.description, isPaid: e.isPaid })),
                incomesData: data.incomes.map(i => ({ id: i.id, desc: i.description, isPaid: i.isPaid }))
            })
            setPendingExpenses(data.expenses)
            setPendingIncomes(data.incomes)
        } catch (error) {
            console.error('Erro ao carregar confirmações pendentes:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPending()
    }, [user])

    const getSuggestedValue = (transaction: Transaction) => {
        const probableValue = transactionService.calculateProbableValue(transaction.valueHistory)
        return probableValue || transaction.amount
    }

    const getVariationBadge = (transaction: Transaction) => {
        const suggestedValue = getSuggestedValue(transaction)
        const originalValue = transaction.amount

        if (suggestedValue === originalValue) return null

        const variation = ((suggestedValue - originalValue) / originalValue) * 100
        const isIncrease = variation > 0

        return {
            text: `${isIncrease ? '+' : ''}${variation.toFixed(1)}% `,
            color: isIncrease ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' : 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
        }
    }

    const handleOpenModal = (transaction: Transaction) => {
        setConfirmingTransaction(transaction)
        const suggestedValue = getSuggestedValue(transaction)
        setConfirmedAmount(suggestedValue.toString())
        setUpdateFutureValues(false)
    }

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !confirmingTransaction) return

        setIsProcessing(true)
        try {
            console.log('[DueSoonAlert] Confirmando transação:', {
                id: confirmingTransaction.id,
                type: confirmingTransaction.type,
                description: confirmingTransaction.description,
                amount: parseFloat(confirmedAmount),
                updateFutureValues
            })

            await transactionService.confirmTransaction(
                user.uid,
                confirmingTransaction.id,
                parseFloat(confirmedAmount),
                updateFutureValues
            )

            console.log('[DueSoonAlert] Transação confirmada com sucesso')

            // Remover da lista apropriada
            if (confirmingTransaction.type === 'expense') {
                setPendingExpenses(prev => prev.filter(t => t.id !== confirmingTransaction.id))
            } else {
                setPendingIncomes(prev => prev.filter(t => t.id !== confirmingTransaction.id))
            }

            console.log('[DueSoonAlert] Removido da lista local')

            await refresh()
            console.log('[DueSoonAlert] Contexto de transações atualizado')

            await refreshAccounts()
            console.log('[DueSoonAlert] Saldos das contas atualizados')

            setConfirmingTransaction(null)

            // Recarregar alertas para garantir atualização
            console.log('[DueSoonAlert] Recarregando alertas pendentes...')
            await loadPending()
            console.log('[DueSoonAlert] Alertas recarregados')
        } catch (error) {
            console.error('Erro ao confirmar transação:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    if (loading || (pendingExpenses.length === 0 && pendingIncomes.length === 0)) return null

    return (
        <>
            <div className="mb-6">

                {/* Header Premium do Alerta */}
                <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-[2px]">
                    <div className="relative rounded-2xl bg-white dark:bg-slate-900 p-4">
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        </div>

                        <div className="relative flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 animate-ping"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
                                <AlertTriangle className="w-6 h-6 text-red-600 relative z-10" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                                    Confirmações Pendentes
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {pendingExpenses.length > 0 && `${pendingExpenses.length} despesa${pendingExpenses.length !== 1 ? 's' : ''} `}
                                    {pendingExpenses.length > 0 && pendingIncomes.length > 0 && ' e '}
                                    {pendingIncomes.length > 0 && `${pendingIncomes.length} receita${pendingIncomes.length !== 1 ? 's' : ''} `}
                                </p>
                            </div>

                            {/* Badges */}
                            <div className="flex gap-2">
                                {pendingExpenses.length > 0 && (
                                    <div className="px-3 py-1.5 bg-red-500 rounded-lg shadow-lg">
                                        <span className="text-xs font-black text-white">{pendingExpenses.length}</span>
                                    </div>
                                )}
                                {pendingIncomes.length > 0 && (
                                    <div className="px-3 py-1.5 bg-green-500 rounded-lg shadow-lg">
                                        <span className="text-xs font-black text-white">{pendingIncomes.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid de Cards - Despesas */}
                {pendingExpenses.length > 0 && (
                    <>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-red-500 rounded-full" />
                            Despesas Pendentes
                        </h4>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6">
                            {pendingExpenses.map(expense => {
                                const dueDate = new Date(expense.dueDate!)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)

                                const isLate = dueDate < today
                                const isToday = dueDate.getTime() === today.getTime()
                                const diffTime = dueDate.getTime() - today.getTime()
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                                const suggestedValue = getSuggestedValue(expense)
                                const variationBadge = getVariationBadge(expense)

                                const cardTheme = isLate
                                    ? {
                                        gradient: 'from-red-500 via-rose-600 to-pink-600',
                                        bgGradient: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
                                        badge: 'from-red-500 to-rose-600',
                                        badgeText: 'text-white',
                                        border: 'border-red-400 dark:border-red-600',
                                        iconBg: 'from-red-500 to-rose-600',
                                        glow: 'bg-red-500',
                                        ring: 'ring-red-500/20',
                                        icon: AlertTriangle
                                    }
                                    : isToday
                                        ? {
                                            gradient: 'from-amber-500 via-orange-600 to-red-600',
                                            bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
                                            badge: 'from-amber-500 to-orange-600',
                                            badgeText: 'text-white',
                                            border: 'border-amber-400 dark:border-amber-600',
                                            iconBg: 'from-amber-500 to-orange-600',
                                            glow: 'bg-amber-500',
                                            ring: 'ring-amber-500/20',
                                            icon: Clock
                                        }
                                        : {
                                            gradient: 'from-blue-500 via-indigo-600 to-purple-600',
                                            bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
                                            badge: 'from-blue-500 to-indigo-600',
                                            badgeText: 'text-white',
                                            border: 'border-blue-400 dark:border-blue-600',
                                            iconBg: 'from-blue-500 to-indigo-600',
                                            glow: 'bg-blue-500',
                                            ring: 'ring-blue-500/20',
                                            icon: Calendar
                                        }

                                const StatusIcon = cardTheme.icon

                                return (
                                    <div
                                        key={expense.id}
                                        className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${cardTheme.bgGradient} border-2 ${cardTheme.border} backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-500 ${cardTheme.ring} ring-4 h-[140px]`}
                                    >
                                        <div className={`absolute top-0 right-0 w-24 h-24 ${cardTheme.glow} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
                                        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-purple-500 rounded-full blur-2xl opacity-10 group-hover:scale-150 transition-transform duration-700" />
                                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cardTheme.gradient} `} />

                                        <div className="relative p-4 h-full flex flex-col">
                                            <div className="absolute top-2 right-2">
                                                <div className={`px-2.5 py-1 bg-gradient-to-r ${cardTheme.badge} rounded-lg shadow-lg ${cardTheme.badgeText} backdrop-blur-md`}>
                                                    <span className="text-xs font-black tracking-wide flex items-center gap-1">
                                                        <StatusIcon className="w-3 h-3" />
                                                        {isLate ? 'Atrasado' : isToday ? 'Hoje' : `${diffDays} d`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pr-16 mb-auto">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight line-clamp-1">
                                                    {expense.description}
                                                </h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                                    Ref: {dueDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                                </p>

                                                {/* Valor com variação */}
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">R$</span>
                                                    <span className="text-2xl font-black bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                                        {suggestedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>

                                                {/* Badge de variação sugerida */}
                                                {variationBadge && (
                                                    <div className="mt-0.5">
                                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${variationBadge.color} `}>
                                                            {variationBadge.text}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 bg-gradient-to-br ${cardTheme.iconBg} rounded-lg shadow-md`}>
                                                        <Calendar className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-900 dark:text-white font-bold">
                                                            {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white border-none shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold px-3 py-2 rounded-lg text-xs"
                                                    onClick={() => handleOpenModal(expense)}
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                    <span>Pagar</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Grid de Cards - Receitas */}
                {pendingIncomes.length > 0 && (
                    <>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-green-500 rounded-full" />
                            Receitas Pendentes
                        </h4>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                            {pendingIncomes.map(income => {
                                const dueDate = new Date(income.dueDate!)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)

                                const isLate = dueDate < today
                                const isToday = dueDate.getTime() === today.getTime()
                                const diffTime = dueDate.getTime() - today.getTime()
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                                const suggestedValue = getSuggestedValue(income)
                                const variationBadge = getVariationBadge(income)

                                const cardTheme = {
                                    gradient: 'from-green-500 via-emerald-600 to-teal-600',
                                    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
                                    badge: 'from-green-500 to-emerald-600',
                                    badgeText: 'text-white',
                                    border: 'border-green-400 dark:border-green-600',
                                    iconBg: 'from-green-500 to-emerald-600',
                                    glow: 'bg-green-500',
                                    ring: 'ring-green-500/20',
                                    icon: TrendingUp
                                }

                                const StatusIcon = cardTheme.icon

                                return (
                                    <div
                                        key={income.id}
                                        className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${cardTheme.bgGradient} border-2 ${cardTheme.border} backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-500 ${cardTheme.ring} ring-4 h-[140px]`}
                                    >
                                        <div className={`absolute top-0 right-0 w-24 h-24 ${cardTheme.glow} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
                                        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-blue-500 rounded-full blur-2xl opacity-10 group-hover:scale-150 transition-transform duration-700" />
                                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cardTheme.gradient} `} />

                                        <div className="relative p-4 h-full flex flex-col">
                                            <div className="absolute top-2 right-2">
                                                <div className={`px-2.5 py-1 bg-gradient-to-r ${cardTheme.badge} rounded-lg shadow-lg ${cardTheme.badgeText} backdrop-blur-md`}>
                                                    <span className="text-xs font-black tracking-wide flex items-center gap-1">
                                                        <StatusIcon className="w-3 h-3" />
                                                        {isLate ? 'Atrasado' : isToday ? 'Hoje' : `${diffDays} d`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pr-16 mb-auto">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight line-clamp-1">
                                                    {income.description}
                                                </h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                                    Ref: {dueDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                                </p>

                                                {/* Valor com variação */}
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">R$</span>
                                                    <span className="text-2xl font-black bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                                                        {suggestedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>

                                                {/* Badge de variação sugerida */}
                                                {variationBadge && (
                                                    <div className="mt-0.5">
                                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${variationBadge.color} `}>
                                                            {variationBadge.text}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 bg-gradient-to-br ${cardTheme.iconBg} rounded-lg shadow-md`}>
                                                        <Calendar className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-900 dark:text-white font-bold">
                                                            {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white border-none shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold px-3 py-2 rounded-lg text-xs"
                                                    onClick={() => handleOpenModal(income)}
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                    <span>Receber</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Confirmação */}
            <Transition appear show={!!confirmingTransaction} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setConfirmingTransaction(null)}>
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
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                            {confirmingTransaction?.type === 'expense' ? 'Confirmar Pagamento' : 'Confirmar Recebimento'}
                                        </Dialog.Title>
                                        <button onClick={() => setConfirmingTransaction(null)} className="text-gray-400 hover:text-gray-500">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleConfirm}>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                Você está {confirmingTransaction?.type === 'expense' ? 'pagando' : 'recebendo'} <strong>{confirmingTransaction?.description}</strong>.
                                                {confirmingTransaction && getVariationBadge(confirmingTransaction) && (
                                                    <span className="ml-1">
                                                        O sistema sugere ajustar o valor em{' '}
                                                        <strong className={getVariationBadge(confirmingTransaction)?.color}>
                                                            {getVariationBadge(confirmingTransaction)?.text}
                                                        </strong>.
                                                    </span>
                                                )}
                                            </p>

                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Valor {confirmingTransaction?.type === 'expense' ? 'Pago' : 'Recebido'} (R$)
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={confirmedAmount}
                                                onChange={(e) => setConfirmedAmount(e.target.value)}
                                                className="text-lg font-bold text-green-600"
                                                autoFocus
                                                required
                                            />

                                            <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    id="updateFuture"
                                                    checked={updateFutureValues}
                                                    onChange={(e) => setUpdateFutureValues(e.target.checked)}
                                                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
                                                />
                                                <label htmlFor="updateFuture" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                                                    Fixar este valor para os próximos meses?
                                                </label>
                                            </div>

                                            <p className="text-xs text-gray-400 mt-2">
                                                * Se <strong>desmarcado</strong>, o sistema usará cálculo probatório baseado no histórico para sugerir o próximo valor.
                                                {' '}Se <strong>marcado</strong>, usará sempre R$ {confirmedAmount}.
                                            </p>
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => setConfirmingTransaction(null)}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                isLoading={isProcessing}
                                            >
                                                Confirmar {confirmingTransaction?.type === 'expense' ? 'Pagamento' : 'Recebimento'}
                                            </Button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}
