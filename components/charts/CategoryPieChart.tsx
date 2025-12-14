'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils/chartHelpers'

interface CategoryPieChartProps {
    data: Array<{
        name: string
        value: number
        color: string
        percentage: number
    }>
}

// Paleta de cores vibrantes e saturadas (baseada no estilo Projeção Financeira)
const FALLBACK_COLORS = [
    '#f43f5e', // Rose (vermelho intenso)
    '#f59e0b', // Amber (âmbar)
    '#10b981', // Emerald (verde esmeralda)
    '#3b82f6', // Blue (azul royal)
    '#8b5cf6', // Violet (violeta)
    '#ec4899', // Pink (rosa intenso)
    '#14b8a6', // Teal (azul petróleo)
    '#f97316', // Orange (laranja)
    '#06b6d4', // Cyan (ciano)
    '#a855f7'  // Purple (roxo)
]

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center h-[400px]">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma despesa registrada</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-red-500 to-rose-600 rounded-full" />
                Despesas por Categoria
            </h3>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => `${props.payload.percentage.toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                            color: '#fff'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number, name: string, props: any) => [
                            formatCurrency(value),
                            `${props.payload.percentage.toFixed(1)}%`
                        ]}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Lista de categorias - Design Melhorado */}
            <div className="mt-6 space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="group relative bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/30 dark:to-gray-800/30 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md transition-all duration-200"
                    >
                        {/* Barra de progresso no fundo */}
                        <div
                            className="absolute inset-0 rounded-lg opacity-10 group-hover:opacity-15 transition-opacity"
                            style={{
                                background: `linear-gradient(to right, ${FALLBACK_COLORS[index % FALLBACK_COLORS.length]} ${item.percentage}%, transparent ${item.percentage}%)`
                            }}
                        />

                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Indicador de cor com borda */}
                                <div className="flex-shrink-0">
                                    <div
                                        className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-800 group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: FALLBACK_COLORS[index % FALLBACK_COLORS.length] }}
                                    />
                                </div>

                                {/* Nome da categoria */}
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                    {item.name}
                                </span>
                            </div>

                            {/* Valores */}
                            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(item.value)}
                                    </p>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {item.percentage.toFixed(1)}%
                                    </p>
                                </div>

                                {/* Badge de ranking */}
                                {index < 3 && (
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                                                'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                        }`}>
                                        {index + 1}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
