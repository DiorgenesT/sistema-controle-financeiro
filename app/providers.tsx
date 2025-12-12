'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { AccountProvider } from '@/contexts/AccountContext'
import { TransactionProvider } from '@/contexts/TransactionContext'
import { CategoryProvider } from '@/contexts/CategoryContext'
import { CreditCardProvider } from '@/contexts/CreditCardContext'
import { FamilyProvider } from '@/contexts/FamilyContext'
import { GoalProvider } from '@/contexts/GoalContext'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AccountProvider>
                <TransactionProvider>
                    <CategoryProvider>
                        <CreditCardProvider>
                            <FamilyProvider>
                                <GoalProvider>
                                    {children}
                                </GoalProvider>
                            </FamilyProvider>
                        </CreditCardProvider>
                    </CategoryProvider>
                </TransactionProvider>
            </AccountProvider>
        </AuthProvider>
    )
}
