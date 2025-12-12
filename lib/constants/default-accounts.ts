import { Account } from '@/types'

export const DEFAULT_ACCOUNT: Omit<Account, 'id' | 'createdAt' | 'currentBalance'> = {
    name: 'Carteira Principal',
    type: 'cash',
    initialBalance: 0,
    color: '#14b8a6',
    icon: 'Wallet',
    isActive: true,
    includeInTotal: true,
}
