'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils/chartHelpers'

interface ProjectionChartProps {
    data: Array<{
        period: string
        receitas: number
        despesas: number
        saldo: number
    }>
}

export function ProjectionChart({ data }: ProjectionChartProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                Projeção Financeira
            </h3>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                            <stop offset="100%" stopColor="#e11d48" stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis
                        dataKey="period"
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
                        labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => {
                            const labels: Record<string, string> = {
                                despesas: 'Despesas Esperadas',
                                receitas: 'Receitas Esperadas'
                            }
                            return labels[value] || value
                        }}
                    />
                    <Bar dataKey="receitas" fill="url(#colorReceitas)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="despesas" fill="url(#colorDespesas)" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>

            {/* Resumo do Saldo */}
            <div className="mt-4 grid grid-cols-2 gap-3">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className={`p-3 rounded-lg border-2 ${item.saldo >= 0
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
                            : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
                            }`}
                    >
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.period}</p>
                        <p className={`text-lg font-bold ${item.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                            {formatCurrency(item.saldo)}
                        </p>
                        <p className="text-xs text-gray-500">Saldo Projetado</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
