'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils/chartHelpers'

interface AccountsBarChartProps {
    data: Array<{
        name: string
        saldo: number
        icon: string
    }>
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export function AccountsBarChart({ data }: AccountsBarChartProps) {
    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center h-[400px]">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma conta cadastrada</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full" />
                Saldo por Conta
            </h3>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis
                        type="number"
                        tick={{ fill: '#6b7280' }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#6b7280' }}
                        width={120}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '12px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="saldo" radius={[0, 8, 8, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Resumo total */}
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Total</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.reduce((sum, item) => sum + item.saldo, 0))}
                </p>
            </div>
        </div>
    )
}
