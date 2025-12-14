'use client'

import { formatCurrency } from '@/lib/utils/chartHelpers'

interface CategoryPieChartProps {
    data: Array<{
        name: string
        value: number
        color: string
        percentage: number
    }>
}

// Paleta de cores vibrantes e saturadas
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

    // Ordenar por valor decrescente
    const sortedData = [...data].sort((a, b) => b.value - a.value)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-red-500 to-rose-600 rounded-full" />
                Despesas por Categoria
            </h3>

            {/* Lista de categorias estilo premium */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 py-3 pl-3 -ml-3 scrollbar-thin scrollbar-thumb-purple-500 hover:scrollbar-thumb-purple-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                {sortedData.map((category, index) => (
                    <div
                        key={category.name}
                        className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 hover:shadow-lg"
                    >
                        {/* Badge de ranking */}
                        <div className="absolute -top-2 -left-2 w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {index + 1}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center flex-1">
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {category.name}
                                </span>
                            </div>
                            <div className="text-right ml-4">
                                <div className="font-bold text-gray-900 dark:text-white text-base">
                                    {formatCurrency(category.value)}
                                </div>
                                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                    {category.percentage.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        {/* Barra de progresso */}
                        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${category.percentage}%`,
                                    background: `linear-gradient(90deg, ${FALLBACK_COLORS[index % FALLBACK_COLORS.length]}, ${FALLBACK_COLORS[index % FALLBACK_COLORS.length]}dd)`
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumo total */}
            <div className="mt-6 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Total de Despesas
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(sortedData.reduce((sum, cat) => sum + cat.value, 0))}
                    </span>
                </div>
            </div>
        </div>
    )
}
