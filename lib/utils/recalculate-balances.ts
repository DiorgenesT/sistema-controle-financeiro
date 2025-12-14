/**
 * Script utilitário para recalcular todos os saldos das contas
 * Use este script se houver suspeita de dados corrompidos
 */

import { accountService } from '@/lib/services/account.service'

export async function recalculateAllAccountBalances(userId: string) {
    console.log('🔄 Iniciando recálculo de todos os saldos...')

    try {
        await accountService.recalculateAllBalances(userId)
        console.log('✅ Saldos recalculados com sucesso!')
        return true
    } catch (error) {
        console.error('❌ Erro ao recalcular saldos:', error)
        return false
    }
}

// Para usar no console do navegador:
// 1. Abra o console (F12)
// 2. Execute: await recalculateAllAccountBalances('SEU_USER_ID')
