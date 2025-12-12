'use client'

interface MonthsCoverageProps {
    monthsCovered: number
    targetMonths?: number
}

export function MonthsCoverage({ monthsCovered, targetMonths = 6 }: MonthsCoverageProps) {
    const months = Array.from({ length: targetMonths }, (_, i) => i + 1)
    const fullMonths = Math.floor(monthsCovered)
    const partialMonth = monthsCovered % 1

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Meses Cobertos
                </h3>
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {monthsCovered.toFixed(1)} / {targetMonths}
                </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {months.map((month) => {
                    const isFull = month <= fullMonths
                    const isPartial = month === fullMonths + 1
                    const percentage = isPartial ? partialMonth * 100 : (isFull ? 100 : 0)

                    return (
                        <div key={month} className="flex flex-col items-center gap-2">
                            <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                                <div
                                    className={`absolute bottom-0 w-full transition-all duration-500 ${isFull || isPartial
                                            ? 'bg-gradient-to-t from-teal-600 to-cyan-500'
                                            : 'bg-transparent'
                                        }`}
                                    style={{ height: `${percentage}%` }}
                                />
                                {/* Label do mês */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-sm font-bold ${isFull ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {month}º
                                    </span>
                                </div>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                Mês
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
