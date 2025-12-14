import { Category } from '@/types'

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'isArchived'>[] = [
    // RECEITAS
    { name: 'Salário', type: 'income', icon: 'Briefcase', color: '#10b981' },
    { name: 'Freelance', type: 'income', icon: 'Code', color: '#14b8a6' },
    { name: 'Investimentos', type: 'income', icon: 'TrendingUp', color: '#06b6d4' },
    { name: 'Presentes', type: 'income', icon: 'Gift', color: '#8b5cf6' },
    { name: 'Bônus', type: 'income', icon: 'Award', color: '#f59e0b' },
    { name: 'Comissões', type: 'income', icon: 'Percent', color: '#22c55e' },
    { name: 'Aluguel Recebido', type: 'income', icon: 'Building2', color: '#0ea5e9' },
    { name: 'Dividendos', type: 'income', icon: 'PieChart', color: '#6366f1' },
    { name: 'Outros Ganhos', type: 'income', icon: 'DollarSign', color: '#22c55e' },

    // DESPESAS - Moradia
    { name: 'Aluguel', type: 'expense', icon: 'Home', color: '#8b5cf6' },
    { name: 'Condomínio', type: 'expense', icon: 'Building', color: '#7c3aed' },
    { name: 'IPTU', type: 'expense', icon: 'FileText', color: '#6d28d9' },
    { name: 'Móveis', type: 'expense', icon: 'Sofa', color: '#a855f7' },
    { name: 'Reformas', type: 'expense', icon: 'Hammer', color: '#9333ea' },

    // DESPESAS - Alimentação
    { name: 'Supermercado', type: 'expense', icon: 'ShoppingCart', color: '#ef4444' },
    { name: 'Restaurantes', type: 'expense', icon: 'UtensilsCrossed', color: '#dc2626' },
    { name: 'Padaria', type: 'expense', icon: 'Cookie', color: '#f97316' },
    { name: 'Lanchonete', type: 'expense', icon: 'Coffee', color: '#fb923c' },
    { name: 'Delivery', type: 'expense', icon: 'Bike', color: '#f59e0b' },

    // DESPESAS - Contas
    { name: 'Energia Elétrica', type: 'expense', icon: 'Zap', color: '#eab308' },
    { name: 'Água', type: 'expense', icon: 'Droplet', color: '#06b6d4' },
    { name: 'Gás', type: 'expense', icon: 'Flame', color: '#f97316' },
    { name: 'Internet', type: 'expense', icon: 'Wifi', color: '#0ea5e9' },
    { name: 'Telefone', type: 'expense', icon: 'Phone', color: '#3b82f6' },

    // DESPESAS - Saúde
    { name: 'Plano de Saúde', type: 'expense', icon: 'Heart', color: '#ec4899' },
    { name: 'Medicamentos', type: 'expense', icon: 'Pill', color: '#f43f5e' },
    { name: 'Consultas', type: 'expense', icon: 'Stethoscope', color: '#fb7185' },
    { name: 'Exames', type: 'expense', icon: 'Activity', color: '#e11d48' },
    { name: 'Academia', type: 'expense', icon: 'Dumbbell', color: '#db2777' },

    // DESPESAS - Transporte
    { name: 'Combustível', type: 'expense', icon: 'Fuel', color: '#6366f1' },
    { name: 'Transporte Público', type: 'expense', icon: 'Bus', color: '#8b5cf6' },
    { name: 'Uber/Taxi', type: 'expense', icon: 'Car', color: '#a855f7' },
    { name: 'Manutenção Veículo', type: 'expense', icon: 'Wrench', color: '#7c3aed' },
    { name: 'Estacionamento', type: 'expense', icon: 'ParkingCircle', color: '#6d28d9' },
    { name: 'Pedágio', type: 'expense', icon: 'Ticket', color: '#9333ea' },

    // DESPESAS - Educação
    { name: 'Mensalidade Escolar', type: 'expense', icon: 'GraduationCap', color: '#3b82f6' },
    { name: 'Cursos', type: 'expense', icon: 'BookOpen', color: '#2563eb' },
    { name: 'Livros', type: 'expense', icon: 'Book', color: '#1d4ed8' },
    { name: 'Material Escolar', type: 'expense', icon: 'Pencil', color: '#60a5fa' },
    {
        name: 'Desenvolvimento Pessoal',
        icon: 'BookOpen',
        color: '#9333ea',
        type: 'expense'
    },

    // DESPESAS - Lazer e Entretenimento
    { name: 'Cinema', type: 'expense', icon: 'Film', color: '#a855f7' },
    { name: 'Shows/Eventos', type: 'expense', icon: 'Music', color: '#c026d3' },
    { name: 'Streaming', type: 'expense', icon: 'Tv', color: '#d946ef' },
    { name: 'Games', type: 'expense', icon: 'Gamepad2', color: '#e879f9' },
    { name: 'Hobbies', type: 'expense', icon: 'Paintbrush', color: '#f0abfc' },
    { name: 'Viagens', type: 'expense', icon: 'Plane', color: '#14b8a6' },
    { name: 'Parques/Passeios', type: 'expense', icon: 'Trees', color: '#22c55e' },

    // DESPESAS - Vestuário
    { name: 'Roupas', type: 'expense', icon: 'Shirt', color: '#f97316' },
    { name: 'Calçados', type: 'expense', icon: 'FootprintsIcon', color: '#fb923c' },
    { name: 'Acessórios', type: 'expense', icon: 'Watch', color: '#fdba74' },

    // DESPESAS - Beleza e Cuidados Pessoais
    { name: 'Salão/Barbearia', type: 'expense', icon: 'Scissors', color: '#ec4899' },
    { name: 'Cosméticos', type: 'expense', icon: 'Sparkles', color: '#f472b6' },
    { name: 'Perfumes', type: 'expense', icon: 'Sprout', color: '#fb7185' },
    { name: 'Produtos de Higiene', type: 'expense', icon: 'Droplets', color: '#06b6d4' },

    // DESPESAS - Pets
    { name: 'Veterinário', type: 'expense', icon: 'HeartPulse', color: '#22c55e' },
    { name: 'Ração', type: 'expense', icon: 'Dog', color: '#16a34a' },
    { name: 'Pet Shop', type: 'expense', icon: 'PawPrint', color: '#15803d' },

    // DESPESAS - Tecnologia
    { name: 'Celular/Eletrônicos', type: 'expense', icon: 'Smartphone', color: '#0ea5e9' },
    { name: 'Softwares', type: 'expense', icon: 'Laptop', color: '#0284c7' },
    { name: 'Apps/Assinaturas Digitais', type: 'expense', icon: 'Cloud', color: '#0369a1' },

    // DESPESAS - Seguros
    { name: 'Seguro Auto', type: 'expense', icon: 'Shield', color: '#64748b' },
    { name: 'Seguro Residência', type: 'expense', icon: 'ShieldCheck', color: '#475569' },
    { name: 'Seguro de Vida', type: 'expense', icon: 'ShieldAlert', color: '#334155' },

    // DESPESAS - Financeiro
    { name: 'Taxas Bancárias', type: 'expense', icon: 'CreditCard', color: '#64748b' },
    { name: 'Juros de Empréstimo', type: 'expense', icon: 'AlertCircle', color: '#dc2626' },
    { name: 'Impostos', type: 'expense', icon: 'Receipt', color: '#475569' },
    { name: 'Doações', type: 'expense', icon: 'HandHeart', color: '#10b981' },

    // DESPESAS - Outros
    { name: 'Presentes/Festas', type: 'expense', icon: 'PartyPopper', color: '#f59e0b' },
    { name: 'Despesas Jurídicas', type: 'expense', icon: 'Scale', color: '#78716c' },
    { name: 'Correios/Encomendas', type: 'expense', icon: 'Package', color: '#a3a3a3' },
    { name: 'Outros Gastos', type: 'expense', icon: 'MoreHorizontal', color: '#94a3b8' },
]
