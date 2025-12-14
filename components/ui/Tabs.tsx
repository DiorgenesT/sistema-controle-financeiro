'use client'

import { ReactNode } from 'react'

interface Tab {
    id: string
    label: string
    count?: number
    color?: 'red' | 'green' | 'blue' | 'gray'
}

interface TabsProps {
    tabs: Tab[]
    activeTab: string
    onChange: (tabId: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
            {tabs.map(tab => {
                const isActive = activeTab === tab.id

                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`px-6 py-3 font-semibold transition-all relative ${isActive
                                ? tab.color === 'red'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-green-600 dark:text-green-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isActive
                                    ? tab.color === 'red'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                        {isActive && (
                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.color === 'red'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600'
                                }`} />
                        )}
                    </button>
                )
            })}
        </div>
    )
}

interface TabPanelProps {
    value: string
    activeTab: string
    children: ReactNode
}

export function TabPanel({ value, activeTab, children }: TabPanelProps) {
    if (value !== activeTab) return null

    return <div>{children}</div>
}
