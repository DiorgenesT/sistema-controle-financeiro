# 💰 Sistema de Controle Financeiro

Sistema inteligente de gestão financeira pessoal e familiar com **Inteligência Artificial** desenvolvido com Next.js 14, TypeScript e Firebase.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange)
![AI](https://img.shields.io/badge/AI-Powered-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Destaques

- 🤖 **Insights com IA**: Análises preditivas e recomendações personalizadas
- 🎯 **Dashboard Inteligente**: Métricas em tempo real com visualizações premium
- 🌤️ **Clima Integrado**: Widget de clima com animações realistas
- 💎 **UI/UX Premium**: Design moderno inspirado em Apple, Stripe e Linear
- ⚡ **Tempo Real**: Sincronização instantânea em todos dispositivos

## 🚀 Funcionalidades

### 🤖 Sistema de IA e Insights Automáticos

#### **Insights Inteligentes**
- Análise automática de padrões de gastos
- Recomendações personalizadas baseadas no histórico
- Alertas preditivos de despesas atípicas
- Sugestões de economia inteligente

#### **Dashboard com Dados Mínimos**
- Sistema que aguarda dados suficientes (1 mês) antes de mostrar insights
- Mensagens motivacionais enquanto coleta informações
- EmptyState cards com data de disponibilidade
- Transição suave para dados reais

#### **Cards Inteligentes**
- **Seguro Gastar Hoje**: Cálculo diário de orçamento disponível com margem de segurança
- **Saúde Financeira**: Score de 0-100 baseado em 4 pilares (receitas, despesas, poupança, dívidas)
- **Reserva de Emergência**: Análise de meses de cobertura e recomendações

### 🌤️ Widget de Clima

- **Integração com Open-Meteo API** (100% gratuita, sem API key)
- **Animações Realistas**:
  - Sol com brilho suave (sem raios)
  - Fases da lua calculadas astronomicamente
  - Nuvens animadas em paralaxe
  - Nuvens estáticas quando nublado (na frente do sol/lua)
- **Geolocalização Automática**
- **Cache Inteligente** para reduzir chamadas à API

### 💳 Gestão Financeira Completa

- **Contas Bancárias**: Gerencie múltiplas contas com atualização automática de saldos
- **Receitas e Despesas**: Categorize e acompanhe todas as suas movimentações
- **Transações Recorrentes**: Automatize receitas e despesas fixas mensais
- **Sistema de Alertas**: Notificações 5 dias antes do vencimento de contas

### 🎯 Cartões de Crédito

- Gestão completa de faturas
- Parcelamento automático
- Controle de limites
- Histórico detalhado

### 👨‍👩‍👧‍👦 Gestão Familiar

- Múltiplos membros da família
- Atribuição de transações
- Relatórios individuais e consolidados

### 📊 Análises e Relatórios

- Dashboard interativo com métricas em tempo real
- Gráficos de evolução financeira
- Projeções de fluxo de caixa
- Categorização automática
- **Retrospectiva Mensal** com análise detalhada

### 🎯 Metas e Objetivos

- Defina metas de economia
- Acompanhe o progresso
- Sistema de reserva de emergência
- Sugestão de banco para reserva

### 🔒 Segurança

- Autenticação Firebase
- Dados criptografados
- Controle de acesso por usuário

## 🎨 Design Premium

### Login Page
- **Mesh Gradients** com múltiplas camadas
- **Glassmorphism** avançado com backdrop blur
- **Efeito Parallax** interativo com movimento do mouse
- **Micro-animações** em todos os elementos
- **Layout Responsivo** 2 colunas (desktop) / 1 coluna (mobile)
- Design inspirado em plataformas world-class

### Dashboard
- Carousels de insights com transições suaves
- Cards com gradientes dinâmicos
- Animações de loading skeleton
- Theme escuro/claro
- Responsividade total

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Estilização**: Tailwind CSS com design system personalizado
- **Backend**: Firebase Realtime Database
- **Autenticação**: Firebase Authentication
- **Componentes UI**: Headless UI, Lucide React
- **Gráficos**: Recharts
- **APIs Externas**: Open-Meteo (clima)
- **Deploy**: Vercel

## 📋 Pré-requisitos

- Node.js 18+ 
- Yarn ou npm
- Conta Firebase

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/DiorgenesT/sistema-controle-financeiro.git
cd sistema-controle-financeiro
```

2. **Instale as dependências**
```bash
yarn install
# ou
npm install
```

3. **Configure o Firebase**

Crie um projeto no [Firebase Console](https://console.firebase.google.com/) e configure:
- Realtime Database
- Authentication (Email/Password)

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-auth-domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=sua-database-url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
```

4. **Execute o projeto**
```bash
yarn dev
# ou
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
├── app/                    # App Router do Next.js
│   ├── dashboard/         # Páginas do dashboard
│   ├── login/            # Autenticação
│   └── layout.tsx        # Layout principal
├── components/            # Componentes React
│   ├── dashboard/        # Componentes do dashboard
│   ├── transactions/     # Modais de transações
│   ├── weather/         # Widget de clima
│   └── ui/              # Componentes de interface
├── contexts/             # Context API (Estado global)
├── hooks/               # Custom React Hooks
├── lib/                 # Utilitários e serviços
│   ├── firebase/       # Configuração Firebase
│   ├── services/       # Serviços de dados
│   └── utils/          # Funções auxiliares
└── types/              # Definições TypeScript
```

## 🎨 Funcionalidades Principais

### Sistema de Transações Inteligente
- **Cálculo Probatório**: Sugere valores baseado em histórico de transações
- **Confirmação Manual**: Permite ajustes antes de confirmar receitas/despesas fixas
- **Recorrência Automática**: Gera automaticamente próximas transações mensais

### Dashboard Dinâmico
- Saldo total atualizado em tempo real
- Cards de insights financeiros com IA
- Alertas de contas a vencer
- Projeções de fluxo de caixa
- Widget de clima integrado
- Carousels de metas e insights

### Gestão de Datas Inteligente
- Sistema de timezone consistente
- Prevenção de problemas com datas
- Formatação automática pt-BR

### Sistema de Insights
- Verifica disponibilidade de dados (mínimo 1 mês)
- Mostra EmptyState cards com mensagens motivacionais
- Calcula médias mensais automaticamente
- Análise de padrões de gastos

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Diorgenes Tavares**
- GitHub: [@DiorgenesT](https://github.com/DiorgenesT)

## 🙏 Agradecimentos

- Next.js e React Team
- Firebase Team
- Open-Meteo (API de clima gratuita)
- Comunidade Open Source

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
