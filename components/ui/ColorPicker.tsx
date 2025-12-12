'use client'

import { useState } from 'react'

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#64748b',
]

interface ColorPickerProps {
    value: string
    onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-slate-600"
                    style={{ backgroundColor: value }}
                />
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                />
            </div>

            <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className={`w-8 h-8 rounded-lg transition-all ${value === color
                                ? 'ring-2 ring-teal-500 ring-offset-2'
                                : 'hover:scale-110'
                            }`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
        </div>
    )
}
