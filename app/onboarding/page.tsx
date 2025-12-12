'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyMembers } from '@/contexts/FamilyContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Users, Check } from 'lucide-react'
import { ref, update } from 'firebase/database'
import { db } from '@/lib/firebase/config'

export default function OnboardingPage() {
    const { user, userData } = useAuth()
    const { createMember } = useFamilyMembers()
    const router = useRouter()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState<string[]>([''])

    const handleAddMember = () => {
        setMembers([...members, ''])
    }

    const handleRemoveMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index))
    }

    const handleMemberChange = (index: number, value: string) => {
        const newMembers = [...members]
        newMembers[index] = value
        setMembers(newMembers)
    }

    const handleFinish = async () => {
        if (!user) return

        setLoading(true)
        try {
            // Salvar membros da família
            const validMembers = members.filter(m => m.trim() !== '')
            for (const memberName of validMembers) {
                await createMember({
                    name: memberName.trim(),
                    isActive: true,
                })
            }

            // Marcar perfil como completo
            await update(ref(db, `users/${user.uid}`), {
                profileCompleted: true,
            })

            // Redirecionar para dashboard
            router.push('/dashboard')
        } catch (error) {
            console.error('Erro no onboarding:', error)
        } finally {
            setLoading(false)
        }
    }

    if (step === 1) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-500 to-purple-600 px-4">
                <Card className="w-full max-w-lg" padding="lg">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Bem-vindo, {userData?.name}!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Vamos configurar seu perfil
                        </p>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                                    1
                                </div>
                                <span className="text-sm font-medium text-teal-600">Bem-vindo</span>
                            </div>
                            <div className="w-16 h-0.5 bg-gray-200"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-semibold">
                                    2
                                </div>
                                <span className="text-sm text-gray-500">Família</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg border-2 border-teal-200 dark:border-teal-800">
                            <h3 className="font-semibold text-teal-900 dark:text-teal-300 mb-2">
                                ✓ Perfil Criado
                            </h3>
                            <p className="text-sm text-teal-700 dark:text-teal-400">
                                Seu perfil básico já está configurado com email e nome.
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-lg">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Próximo Passo
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Vamos adicionar os membros da sua família para melhor organização financeira.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={() => setStep(2)}
                    >
                        Continuar
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-500 to-purple-600 px-4 py-8">
            <Card className="w-full max-w-lg" padding="lg">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Membros da Família
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Adicione os membros (opcional)
                    </p>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center">
                                <Check className="w-5 h-5" />
                            </div>
                            <span className="text-sm text-gray-500">Bem-vindo</span>
                        </div>
                        <div className="w-16 h-0.5 bg-teal-600"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                                2
                            </div>
                            <span className="text-sm font-medium text-teal-600">Família</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {members.map((member, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                placeholder="Nome do membro"
                                value={member}
                                onChange={(e) => handleMemberChange(index, e.target.value)}
                            />
                            {members.length > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => handleRemoveMember(index)}
                                >
                                    ✕
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    className="w-full mb-4"
                    onClick={handleAddMember}
                >
                    + Adicionar Membro
                </Button>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1"
                    >
                        Voltar
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleFinish}
                        isLoading={loading}
                    >
                        Finalizar
                    </Button>
                </div>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Você pode adicionar ou editar membros depois no seu perfil
                </p>
            </Card>
        </div>
    )
}
