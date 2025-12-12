'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyMembers } from '@/contexts/FamilyContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Users, Edit2, Trash2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { FamilyMember } from '@/types'

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <ProfileContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function ProfileContent() {
    const { userData } = useAuth()
    const [activeTab, setActiveTab] = useState<'profile' | 'family'>('profile')

    return (
        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Meu Perfil
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Gerencie suas informações pessoais e família
                </p>
            </div>

            {/* Tabs */}
            <Card className="mb-6">
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'profile' ? 'primary' : 'outline'}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User className="w-4 h-4 mr-2" />
                        Meus Dados
                    </Button>
                    <Button
                        variant={activeTab === 'family' ? 'primary' : 'outline'}
                        onClick={() => setActiveTab('family')}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Família
                    </Button>
                </div>
            </Card>

            {activeTab === 'profile' ? <ProfileTab /> : <FamilyTab />}
        </div>
    )
}

function ProfileTab() {
    const { user, userData } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(userData?.name || '')

    const handleSave = async () => {
        if (!user || !name.trim()) return

        setLoading(true)
        try {
            const { ref, update } = await import('firebase/database')
            const { db } = await import('@/lib/firebase/config')

            await update(ref(db, `users/${user.uid}`), {
                name: name.trim(),
            })

            setIsEditing(false)
        } catch (error) {
            console.error('Erro ao atualizar nome:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setName(userData?.name || '')
        setIsEditing(false)
    }

    return (
        <Card>
            <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Informações Pessoais
                    </h3>
                    {!isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome Completo
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isEditing}
                            placeholder="Digite seu nome completo"
                        />
                    </div>

                    {isEditing && (
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                isLoading={loading}
                                disabled={!name.trim()}
                            >
                                Salvar
                            </Button>
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            💡 <strong>Email:</strong> {userData?.email}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    )
}

function FamilyTab() {
    const { members, loading, createMember, updateMember, deactivateMember } = useFamilyMembers()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)

    const activeMembers = members.filter(m => m.isActive)

    const handleOpenModal = (member?: FamilyMember) => {
        setEditingMember(member || null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setEditingMember(null)
        setIsModalOpen(false)
    }

    if (loading) {
        return (
            <Card>
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
                </div>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Membros da Família
                    </h3>
                    <Button variant="primary" onClick={() => handleOpenModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Membro
                    </Button>
                </div>

                {activeMembers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Nenhum membro adicionado
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Adicione os membros da sua família para melhor organização
                        </p>
                        <Button variant="primary" onClick={() => handleOpenModal()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Primeiro Membro
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeMembers.map((member) => (
                            <Card key={member.id} hover className="group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {member.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Membro
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleOpenModal(member)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deactivateMember(member.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>

            {/* Modal */}
            <MemberModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                member={editingMember}
                onCreate={createMember}
                onUpdate={updateMember}
            />
        </>
    )
}

// Modal Component
interface MemberModalProps {
    isOpen: boolean
    onClose: () => void
    member: FamilyMember | null
    onCreate: (data: Omit<FamilyMember, 'id' | 'createdAt' | 'userId'>) => Promise<void>
    onUpdate: (id: string, data: Partial<FamilyMember>) => Promise<void>
}

function MemberModal({ isOpen, onClose, member, onCreate, onUpdate }: MemberModalProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(member?.name || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (member) {
                await onUpdate(member.id, { name })
            } else {
                await onCreate({ name, isActive: true })
            }
            onClose()
            setName('')
        } catch (error) {
            console.error('Erro ao salvar membro:', error)
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
                                    {member ? 'Editar Membro' : 'Novo Membro'}
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Nome"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="Ex: Maria Silva"
                                    />

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
                                            {member ? 'Atualizar' : 'Adicionar'}
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
