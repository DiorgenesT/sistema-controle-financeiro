// Helper para converter data do input (YYYY-MM-DD) para timestamp sem problemas de timezone
export function dateToTimestamp(dateString: string): number {
    const [year, month, day] = dateString.split('-').map(Number)
    // Criar data no horário local (meio-dia para evitar problemas de timezone)
    const date = new Date(year, month - 1, day, 12, 0, 0, 0)
    return date.getTime()
}

// Helper para converter timestamp para string de data (YYYY-MM-DD)
export function timestampToDateString(timestamp: number): string {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
