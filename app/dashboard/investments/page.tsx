'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'

export default function InvestmentsPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Investimentos
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Acompanhe seus investimentos e rentabilidade
                        </p>
                    </div>

                    <Card>
                        <div className="text-center py-16">
                            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Em Desenvolvimento
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Página de investimentos em breve
                            </p>
                        </div>
                    </Card>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}
