'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils/chartHelpers'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface BalanceComparisonChartProps {
    data: Array<{
        month: string
        saldo: number
    }>
}

const GRADIENT_COLORS = ['#8b5cf6', '#a855f7', '#c026d3', '#d946ef', '#e879f9', '#f0abfc']

export function BalanceComparisonChart({ data }: BalanceComparisonChartProps) {
    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center h-[400px]">
                <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
            </div>
        )
    }

    // Calcular variação
    const currentBalance = data[data.length - 1]?.saldo || 0
    const previousBalance = data[data.length - 2]?.saldo || 0
    const variation = currentBalance - previousBalance
    const variationPercent = previousBalance !== 0 ? (variation / previousBalance) * 100 : 0

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-fuchsia-600 rounded-full" />
                        Evolução do Saldo
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Últimos 6 meses</p>
                </div>

                {/* Badge de variação */}
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${variation >= 0
                    ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                    }`}>
                    {variation >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                    ) : (
                        <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-bold text-sm">
                        {variation >= 0 ? '+' : ''}{variationPercent.toFixed(1)}%
                    </span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#c026d3" stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis
                        dataKey="month"
                        tick={{ fill: '#6b7280' }}
                        className="text-sm"
                    />
                    <YAxis
                        tick={{ fill: '#6b7280' }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => ['Saldo: ' + formatCurrency(value)]}
                    />
                    <Bar dataKey="saldo" radius={[8, 8, 0, 0]} fill="url(#barGradient)">
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.saldo >= 0 ? 'url(#barGradient)' : '#ef4444'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Card de saldo atual */}
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/20 dark:to-fuchsia-950/20 border-2 border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Atual</p>
                <p className={`text-2xl font-bold ${currentBalance >= 0
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-red-600 dark:text-red-400'
                    }`}>
                    {formatCurrency(currentBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {variation >= 0 ? '+' : ''}{formatCurrency(variation)} vs mês anterior
                </p>
            </div>
        </div>
    )
}
