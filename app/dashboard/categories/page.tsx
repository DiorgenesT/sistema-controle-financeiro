'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useCategories } from '@/contexts/CategoryContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { IconPicker } from '@/components/ui/IconPicker'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { TrendingUp, TrendingDown, Plus, Edit2, Archive, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import * as Icons from 'lucide-react'
import { Category } from '@/types'

export default function CategoriesPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <CategoriesContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function CategoriesContent() {
    const { categories, loading, createCategory, updateCategory, archiveCategory } = useCategories()
    const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    const filteredCategories = categories.filter(
        cat => cat.type === selectedType && !cat.isArchived
    )

    const handleOpenModal = (category?: Category) => {
        setEditingCategory(category || null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setEditingCategory(null)
        setIsModalOpen(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Carregando categorias...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Gerenciar Categorias
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Organize suas transações com categorias personalizadas
                    </p>
                </div>
                <Button variant="primary" size="lg" onClick={() => handleOpenModal()}>
                    <Plus className="w-5 h-5 mr-2" />
                    Nova Categoria
                </Button>
            </div>

            {/* Tabs */}
            <Card className="mb-6">
                <div className="flex gap-2">
                    <Button
                        variant={selectedType === 'expense' ? 'primary' : 'outline'}
                        onClick={() => setSelectedType('expense')}
                    >
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Despesas ({categories.filter(c => c.type === 'expense' && !c.isArchived).length})
                    </Button>
                    <Button
                        variant={selectedType === 'income' ? 'primary' : 'outline'}
                        onClick={() => setSelectedType('income')}
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Receitas ({categories.filter(c => c.type === 'income' && !c.isArchived).length})
                    </Button>
                </div>
            </Card>

            {/* Grid de Categorias */}
            {filteredCategories.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Nenhuma categoria de {selectedType === 'income' ? 'receita' : 'despesa'} encontrada
                        </p>
                        <Button variant="primary" onClick={() => handleOpenModal()}>
                            <Plus className="w-5 h-5 mr-2" />
                            Criar Primeira Categoria
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredCategories.map((category) => {
                        const IconComponent = (Icons as any)[category.icon] || Icons.Circle
                        return (
                            <Card
                                key={category.id}
                                hover
                                className="group cursor-pointer relative overflow-hidden"
                            >
                                <div className="text-center">
                                    <div
                                        className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                                        style={{ backgroundColor: `${category.color}20` }}
                                    >
                                        <IconComponent className="w-8 h-8" style={{ color: category.color }} />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        {category.name}
                                    </h3>

                                    {/* Botões de ação */}
                                    <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenModal(category)}
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => archiveCategory(category.id)}
                                        >
                                            <Archive className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            <CategoryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                category={editingCategory}
                type={selectedType}
                onCreate={createCategory}
                onUpdate={updateCategory}
            />
        </div>
    )
}

// Modal Component
interface CategoryModalProps {
    isOpen: boolean
    onClose: () => void
    category: Category | null
    type: 'income' | 'expense'
    onCreate: (data: Omit<Category, 'id' | 'createdAt'>) => Promise<void>
    onUpdate: (id: string, data: Partial<Category>) => Promise<void>
}

function CategoryModal({ isOpen, onClose, category, type, onCreate, onUpdate }: CategoryModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: category?.name || '',
        icon: category?.icon || 'Circle',
        color: category?.color || '#10b981',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data = {
                name: formData.name,
                type,
                icon: formData.icon,
                color: formData.color,
                isArchived: false,
            }

            if (category) {
                await onUpdate(category.id, data)
            } else {
                await onCreate(data)
            }

            onClose()
        } catch (error) {
            console.error('Erro ao salvar categoria:', error)
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
                                    {category ? 'Editar Categoria' : 'Nova Categoria'}
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Nome da Categoria"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Ex: Alimentação, Salário..."
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Ícone
                                        </label>
                                        <IconPicker
                                            value={formData.icon}
                                            onChange={(icon) => setFormData({ ...formData, icon })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Cor
                                        </label>
                                        <ColorPicker
                                            value={formData.color}
                                            onChange={(color) => setFormData({ ...formData, color })}
                                        />
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
                                        >
                                            {category ? 'Atualizar' : 'Criar'}
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
