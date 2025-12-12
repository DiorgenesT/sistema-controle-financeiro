'use client'

import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCategories } from '@/contexts/CategoryContext'
import { CategoryType } from '@/types'
import * as Icons from 'lucide-react'

interface CreateCategoryModalProps {
    isOpen: boolean
    onClose: () => void
    type: CategoryType
    onSuccess: (categoryId: string) => void
}

const AVAILABLE_ICONS = [
    // Financeiro
    'Wallet', 'DollarSign', 'CreditCard', 'Banknote', 'Coins', 'PiggyBank', 'TrendingUp', 'TrendingDown',
    'PieChart', 'Percent', 'Receipt', 'Landmark',

    // Trabalho & Educação
    'Briefcase', 'Building', 'Building2', 'Code', 'GraduationCap', 'BookOpen', 'Book', 'Pencil',

    // Casa & Moradia
    'Home', 'Sofa', 'Hammer', 'Wrench', 'Drill',

    // Alimentação
    'UtensilsCrossed', 'Coffee', 'Cookie', 'ShoppingCart', 'Bike', 'Apple', 'Pizza',

    // Contas & Utilidades
    'Zap', 'Droplet', 'Droplets', 'Flame', 'Wifi', 'Phone', 'Smartphone',

    // Saúde & Bem-estar
    'Heart', 'HeartPulse', 'Pill', 'Stethoscope', 'Activity', 'Dumbbell', 'Siren',

    // Transporte
    'Car', 'Bus', 'Bike', 'Plane', 'Fuel', 'MapPin', 'Ticket',

    // Lazer & Entretenimento
    'Gamepad2', 'Film', 'Music', 'Tv', 'Paintbrush', 'TreePine', 'PartyPopper',

    // Compras & Vestuário
    'ShoppingBag', 'Shirt', 'Watch', 'Tag',

    // Beleza & Cuidados
    'Sparkles', 'Scissors', 'Sprout', 'Flower',

    // Pets
    'Dog', 'Cat', 'Rabbit',

    // Tecnologia
    'Laptop', 'Cloud', 'Monitor', 'Usb',

    // Seguros & Proteção
    'Shield', 'ShieldCheck', 'ShieldAlert', 'Lock',

    // Presentes & Outros
    'Gift', 'Package', 'Scale', 'Heart', 'Award', 'MoreHorizontal', 'Star', 'Flag'
]

const COLORS = [
    // Verdes
    '#10B981', '#22c55e', '#16a34a', '#15803d', '#14b8a6',

    // Azuis
    '#06b6d4', '#0ea5e9', '#3b82f6', '#2563eb', '#1d4ed8', '#0284c7', '#0369a1',

    // Roxos & Violetas
    '#6366f1', '#8b5cf6', '#a855f7', '#c026d3', '#d946ef', '#7c3aed', '#9333ea', '#6d28d9',

    // Rosas
    '#ec4899', '#f472b6', '#fb7185', '#f43f5e', '#e11d48', '#db2777',

    // Vermelhos & Laranjas
    '#ef4444', '#dc2626', '#f97316', '#fb923c', '#f59e0b', '#fdba74', '#eab308',

    // Cinzas
    '#64748b', '#475569', '#334155', '#78716c', '#a3a3a3', '#94a3b8'
]

export function CreateCategoryModal({ isOpen, onClose, type, onSuccess }: CreateCategoryModalProps) {
    const { createCategory } = useCategories()
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [selectedIcon, setSelectedIcon] = useState('Wallet')
    const [selectedColor, setSelectedColor] = useState(COLORS[0])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            const categoryId = await createCategory({
                name: name.trim(),
                type,
                icon: selectedIcon,
                color: selectedColor,
                isArchived: false
            })
            onSuccess(categoryId)
            onClose()
            setName('')
            setSelectedIcon('Wallet')
            setSelectedColor(COLORS[0])
        } catch (error) {
            console.error('Erro ao criar categoria:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
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
                                <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                    Nova Categoria de {type === 'income' ? 'Receita' : 'Despesa'}
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Nome da Categoria"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: Freelance, Vendas..."
                                        required
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Ícone
                                        </label>
                                        <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1 border border-gray-200 dark:border-slate-700 rounded-lg">
                                            {AVAILABLE_ICONS.map((iconName) => {
                                                // @ts-ignore
                                                const Icon = Icons[iconName]
                                                return (
                                                    <button
                                                        key={iconName}
                                                        type="button"
                                                        onClick={() => setSelectedIcon(iconName)}
                                                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${selectedIcon === iconName
                                                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 ring-2 ring-teal-500'
                                                            : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500'
                                                            }`}
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Cor
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`w-8 h-8 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
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
                                            disabled={!name.trim()}
                                        >
                                            Criar Categoria
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
