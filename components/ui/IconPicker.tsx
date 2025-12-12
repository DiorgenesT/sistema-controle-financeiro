'use client'

import * as Icons from 'lucide-react'
import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from './Button'

const POPULAR_ICONS = [
    'Wallet', 'DollarSign', 'CreditCard', 'Briefcase', 'Home', 'Car',
    'UtensilsCrossed', 'Coffee', 'ShoppingBag', 'Heart', 'GraduationCap',
    'Zap', 'Gamepad2', 'Tv', 'Sparkles', 'TrendingUp', 'TrendingDown',
    'Code', 'Gift', 'AlertCircle', 'FileText', 'MoreHorizontal',
]

interface IconPickerProps {
    value: string
    onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false)

    const IconComponent = (Icons as any)[value] || Icons.Circle

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="p-3 rounded-lg border-2 border-gray-300 dark:border-slate-600 hover:border-teal-500 transition-colors"
            >
                <IconComponent className="w-6 h-6" />
            </button>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl transition-all">
                                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        Escolher Ícone
                                    </Dialog.Title>

                                    <div className="grid grid-cols-6 gap-2">
                                        {POPULAR_ICONS.map((iconName) => {
                                            const Icon = (Icons as any)[iconName]
                                            return (
                                                <button
                                                    key={iconName}
                                                    onClick={() => {
                                                        onChange(iconName)
                                                        setIsOpen(false)
                                                    }}
                                                    className={`p-3 rounded-lg border-2 transition-all hover:border-teal-500 ${value === iconName
                                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                                            : 'border-gray-200 dark:border-slate-700'
                                                        }`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <div className="mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsOpen(false)}
                                            className="w-full"
                                        >
                                            Fechar
                                        </Button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}
