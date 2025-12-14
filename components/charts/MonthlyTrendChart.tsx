'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { formatCurrency, formatShortCurrency } from '@/lib/utils/chartHelpers'

interface MonthlyTrendChartProps {
    data: Array<{
        month: string
        receitas: number
        despesas: number
    }>
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
                Evolução Mensal (6 meses)
            </h3>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
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
                        tickFormatter={formatShortCurrency}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(value) => value === 'despesas' ? 'Despesas' : 'Receitas'}
                    />
                    <Area
                        type="monotone"
                        dataKey="receitas"
                        stroke="#16a34a"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorReceitas)"
                    />
                    <Area
                        type="monotone"
                        dataKey="despesas"
                        stroke="#dc2626"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorDespesas)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
