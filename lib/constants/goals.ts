import { GoalCategory } from '@/types'

export interface GoalCategoryConfig {
    id: GoalCategory
    label: string
    icon: string // Emoji
    color: string
    description: string
}

export const GOAL_CATEGORIES: GoalCategoryConfig[] = [
    {
        id: 'emergency',
        label: 'Reserva de Emergência',
        icon: '🚨',
        color: '#EF4444', // red-500
        description: 'Fundo para imprevistos e emergências'
    },
    {
        id: 'travel',
        label: 'Viagem',
        icon: '✈️',
        color: '#3B82F6', // blue-500
        description: 'Economizar para viagens e férias'
    },
    {
        id: 'house',
        label: 'Casa/Imóvel',
        icon: '🏠',
        color: '#8B5CF6', // purple-500
        description: 'Compra ou reforma de imóvel'
    },
    {
        id: 'car',
        label: 'Carro/Veículo',
        icon: '🚗',
        color: '#F59E0B', // amber-500
        description: 'Compra de veículo'
    },
    {
        id: 'education',
        label: 'Educação',
        icon: '🎓',
        color: '#10B981', // green-500
        description: 'Cursos, faculdade e desenvolvimento'
    },
    {
        id: 'retirement',
        label: 'Aposentadoria',
        icon: '🏖️',
        color: '#6366F1', // indigo-500
        description: 'Planejamento previdenciário'
    },
    {
        id: 'other',
        label: 'Outros',
        icon: '🎯',
        color: '#64748B', // slate-500
        description: 'Outras metas financeiras'
    }
]

export const getGoalCategory = (id: GoalCategory): GoalCategoryConfig => {
    return GOAL_CATEGORIES.find(cat => cat.id === id) || GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1]
}
