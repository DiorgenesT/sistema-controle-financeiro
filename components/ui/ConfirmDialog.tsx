'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from './Button'
import { AlertOctagon, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info' | 'success'
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning'
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertOctagon className="w-6 h-6 text-red-600" />
            case 'warning':
                return <AlertTriangle className="w-6 h-6 text-amber-600" />
            case 'success':
                return <CheckCircle2 className="w-6 h-6 text-green-600" />
            default:
                return <HelpCircle className="w-6 h-6 text-blue-600" />
        }
    }

    const getIconBgColor = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-100 dark:bg-red-900/30'
            case 'warning':
                return 'bg-amber-100 dark:bg-amber-900/30'
            case 'success':
                return 'bg-green-100 dark:bg-green-900/30'
            default:
                return 'bg-blue-100 dark:bg-blue-900/30'
        }
    }

    const getConfirmButtonClass = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white'
            case 'warning':
                return 'bg-amber-600 hover:bg-amber-700 text-white'
            case 'success':
                return 'bg-green-600 hover:bg-green-700 text-white'
            default:
                return 'bg-blue-600 hover:bg-blue-700 text-white'
        }
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
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
                                <div className="flex items-start gap-4">
                                    {/* Ícone */}
                                    <div className={`flex-shrink-0 ${getIconBgColor()} p-3 rounded-full`}>
                                        {getIcon()}
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex-1 min-w-0">
                                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            {title}
                                        </Dialog.Title>
                                        <Dialog.Description className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                                            {message}
                                        </Dialog.Description>
                                    </div>
                                </div>

                                {/* Botões */}
                                <div className="flex gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={onClose}
                                    >
                                        {cancelText}
                                    </Button>
                                    <Button
                                        type="button"
                                        className={`flex-1 ${getConfirmButtonClass()}`}
                                        onClick={handleConfirm}
                                    >
                                        {confirmText}
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
