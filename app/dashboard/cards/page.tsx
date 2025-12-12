'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useCreditCards } from '@/contexts/CreditCardContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CreditCard as CreditCardIcon, Plus, Edit2, Trash2, Loader2, Calendar } from 'lucide-react'
import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { CreditCard } from '@/types'
import { BRAZILIAN_CARDS } from '@/lib/constants/credit-cards'
import { creditCardService } from '@/lib/services/credit-card.service'

export default function CardsPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <CardsContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function CardsContent() {
    const { cards, loading, createCard, updateCard, deactivateCard } = useCreditCards()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null)

    const activeCards = cards.filter(c => c.isActive)

    const handleOpenModal = (card?: CreditCard) => {
        setEditingCard(card || null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setEditingCard(null)
        setIsModalOpen(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Carregando cartões...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Cartões de Crédito
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gerencie seus cartões e acompanhe as faturas
                    </p>
                </div>
                <Button variant="primary" size="lg" onClick={() => handleOpenModal()}>
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Cartão
                </Button>
            </div>

            {activeCards.length === 0 ? (
                <Card>
                    <div className="text-center py-16">
                        <CreditCardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Nenhum cartão cadastrado
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Adicione seus cartões para acompanhar as faturas
                        </p>
                        <Button variant="primary" size="lg" onClick={() => handleOpenModal()}>
                            <Plus className="w-5 h-5 mr-2" />
                            Adicionar Primeiro Cartão
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeCards.map((card) => {
                        const nextDue = creditCardService.getNextDueDate(card)

                        return (
                            <Card
                                key={card.id}
                                hover
                                className="group overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
                                    borderColor: `${card.color}40`,
                                }}
                            >
                                {/* Header com cor do banco */}
                                <div
                                    className="h-2 w-full mb-4 rounded-t-lg"
                                    style={{ backgroundColor: card.color }}
                                />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${card.color}20` }}
                                        >
                                            <CreditCardIcon className="w-6 h-6" style={{ color: card.color }} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">
                                                {card.cardBrand}
                                            </h3>
                                            {card.nickname && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {card.nickname}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Fecha dia {card.closingDay}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Vence dia {card.dueDay}
                                        </span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Limite: </span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            R$ {card.creditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        Próximo vencimento: {nextDue.toLocaleDateString('pt-BR')}
                                    </p>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.location.href = `/dashboard/cards/${card.id}/invoices`}
                                            className="flex-1"
                                        >
                                            <CreditCardIcon className="w-3 h-3 mr-1" />
                                            Ver Faturas
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenModal(card)}
                                            className="flex-1"
                                        >
                                            <Edit2 className="w-3 h-3 mr-1" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deactivateCard(card.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            <CardModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                card={editingCard}
                onCreate={createCard}
                onUpdate={updateCard}
            />
        </div>
    )
}

// Modal Component
interface CardModalProps {
    isOpen: boolean
    onClose: () => void
    card: CreditCard | null
    onCreate: (data: Omit<CreditCard, 'id' | 'createdAt' | 'userId'>) => Promise<void>
    onUpdate: (id: string, data: Partial<CreditCard>) => Promise<void>
}

function CardModal({ isOpen, onClose, card, onCreate, onUpdate }: CardModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        cardBrand: card?.cardBrand || 'Nubank',
        nickname: card?.nickname || '',
        closingDay: card?.closingDay?.toString() || '10',
        dueDay: card?.dueDay?.toString() || '20',
        creditLimit: card?.creditLimit?.toString() || '',
    })

    const selectedBrand = BRAZILIAN_CARDS.find(b => b.name === formData.cardBrand) || BRAZILIAN_CARDS[0]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data: any = {
                cardBrand: formData.cardBrand,
                closingDay: parseInt(formData.closingDay),
                dueDay: parseInt(formData.dueDay),
                creditLimit: parseFloat(formData.creditLimit),
                color: selectedBrand.color,
                icon: selectedBrand.icon,
                isActive: true,
            }

            // Adicionar nickname apenas se não estiver vazio
            if (formData.nickname.trim()) {
                data.nickname = formData.nickname.trim()
            }

            if (card) {
                await onUpdate(card.id, data)
            } else {
                await onCreate(data)
            }

            onClose()
        } catch (error) {
            console.error('Erro ao salvar cartão:', error)
        } finally {
            setLoading(false)
        }
    }

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
                                    {card ? 'Editar Cartão' : 'Novo Cartão'}
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Select de Banco com Preview */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Banco/Cartão
                                        </label>
                                        <select
                                            value={formData.cardBrand}
                                            onChange={(e) => setFormData({ ...formData, cardBrand: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                                            required
                                        >
                                            {BRAZILIAN_CARDS.map((brand) => (
                                                <option key={brand.name} value={brand.name}>
                                                    {brand.name}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Preview da cor */}
                                        <div className="mt-2 flex items-center gap-2">
                                            <div
                                                className="w-8 h-8 rounded-lg"
                                                style={{ backgroundColor: selectedBrand.color }}
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Cor do cartão
                                            </span>
                                        </div>
                                    </div>

                                    <Input
                                        label="Apelido (Opcional)"
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        placeholder="Ex: Cartão Principal"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Dia de Fechamento"
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={formData.closingDay}
                                            onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                                            required
                                            placeholder="10"
                                        />
                                        <Input
                                            label="Dia de Vencimento"
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={formData.dueDay}
                                            onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                                            required
                                            placeholder="20"
                                        />
                                    </div>

                                    <Input
                                        label="Limite do Cartão"
                                        type="number"
                                        step="0.01"
                                        value={formData.creditLimit}
                                        onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                                        required
                                        placeholder="5000.00"
                                    />

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                        <p className="text-xs text-blue-700 dark:text-blue-400">
                                            💡 <strong>Dica:</strong> O dia de fechamento determina quando as compras entram na fatura. Compras após o fechamento vão para o mês seguinte.
                                        </p>
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
                                            className="flex-1"
                                            isLoading={loading}
                                            disabled={!formData.creditLimit || !formData.closingDay || !formData.dueDay}
                                        >
                                            {card ? 'Atualizar' : 'Adicionar'}
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
