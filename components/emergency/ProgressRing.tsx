'use client'

import { Card } from '@/components/ui/Card'

interface ProgressRingProps {
    progress: number // 0-100
    size?: number
    strokeWidth?: number
}

export function ProgressRing({ progress, size = 200, strokeWidth = 12 }: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    // Cor baseada no progresso
    const getColor = () => {
        if (progress >= 100) return '#10b981' // Verde completo
        if (progress >= 75) return '#3b82f6'  // Azul bom
        if (progress >= 50) return '#f59e0b'  // Laranja médio
        return '#ef4444' // Vermelho baixo
    }

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={getColor()}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-in-out"
                    />
                </svg>
                {/* Percentage text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-gray-900 dark:text-white">
                        {Math.round(progress)}%
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        da meta
                    </span>
                </div>
            </div>
        </div>
    )
}
