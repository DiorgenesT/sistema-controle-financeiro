# 💰 Sistema de Controle Financeiro

Sistema inteligente de gestão financeira pessoal e familiar desenvolvido com Next.js 14, TypeScript e Firebase.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Funcionalidades

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

### 🎯 Metas e Objetivos
- Defina metas de economia
- Acompanhe o progresso
- Sistema de reserva de emergência

### 🔒 Segurança
- Autenticação Firebase
- Dados criptografados
- Controle de acesso por usuário

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Firebase Realtime Database
- **Autenticação**: Firebase Authentication
- **Componentes UI**: Headless UI, Lucide React
- **Gráficos**: Recharts
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
│   └── ui/              # Componentes de interface
├── contexts/             # Context API (Estado global)
├── lib/                  # Utilitários e serviços
│   ├── firebase/        # Configuração Firebase
│   ├── services/        # Serviços de dados
│   └── utils/           # Funções auxiliares
└── types/               # Definições TypeScript
```

## 🎨 Funcionalidades Principais

### Sistema de Transações Inteligente
- **Cálculo Probatório**: Sugere valores baseado em histórico de transações
- **Confirmação Manual**: Permite ajustes antes de confirmar receitas/despesas fixas
- **Recorrência Automática**: Gera automaticamente próximas transações mensais

### Dashboard Dinâmico
- Saldo total atualizado em tempo real
- Cards de insights financeiros
- Alertas de contas a vencer
- Projeções de fluxo de caixa

### Gestão de Datas Inteligente
- Sistema de timezone consistente
- Prevenção de problemas com datas
- Formatação automática pt-BR

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

**Diorgenes Teixeira**
- GitHub: [@DiorgenesT](https://github.com/DiorgenesT)

## 🙏 Agradecimentos

- Next.js e React Team
- Firebase Team
- Comunidade Open Source

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
