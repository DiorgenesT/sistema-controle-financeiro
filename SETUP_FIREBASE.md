# 🔥 Guia de Setup do Firebase

## Passo 1: Criar Projeto no Firebase

1. Acesse https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Nome do projeto: **sistema-controle-financeiro**
4. Desative o Google Analytics (opcional)
5. Clique em "Criar projeto"

## Passo 2: Ativar Authentication

1. No menu lateral, clique em **Authentication**
2. Clique em "Começar"
3. Em "Provedores de login", clique em **Email/senha**
4. Ative a primeira opção (Email/senha)
5. Clique em "Salvar"

## Passo 3: Ativar Firestore Database

1. No menu lateral, clique em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de **produção**"
4. Escolha a localização (southamerica-east1 - São Paulo)
5. Clique em "Ativar"

## Passo 4: Copiar Credenciais

1. No menu lateral, clique no ícone de engrenagem ⚙️ > **Configurações do projeto**
2. Role até "Seus apps"
3. Clique no ícone </> (Web)
4. Apelido do app: **sistema-web**
5. NÃO marque "Firebase Hosting"
6. Clique em "Registrar app"
7. **COPIE** as credenciais que aparecem

## Passo 5: Criar arquivo .env.local

```bash
cd /home/dg/sistema-controle-financeiro
touch .env.local
```

Cole o seguinte no arquivo `.env.local` (substitua pelos seus valores):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
```

## Passo 6: Criar Security Rules do Firestore

1. No Firestore, vá em **Regras**
2. Cole as seguintes regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin() || isOwner(userId);
      allow delete: if isAdmin();
    }
    
    match /transactions/{transactionId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update, delete: if isOwner(resource.data.userId);
    }
    
    match /categories/{categoryId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update, delete: if isOwner(resource.data.userId);
    }
  }
}
```

3. Clique em "Publicar"

## Passo 6.1: Configurar Regras do Realtime Database

Como estamos usando o Realtime Database para algumas funcionalidades, precisamos configurar os índices para performance e ordenação.

1. No menu lateral, clique em **Realtime Database**
2. Vá na aba **Regras**
3. Cole o seguinte JSON:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        "transactions": {
          ".indexOn": ["date", "isRecurring"]
        }
      }
    },
    "goals": {
      ".indexOn": ["userId"]
    }
  }
}
```

4. Clique em "Publicar"

## Passo 7: Criar Primeiro Admin Manualmente

1. No Firebase Console, vá em **Authentication**
2. Clique em "Adicionar usuário"
3. Email: `admin@sistema.com`
4. Senha: `Admin@123` (use uma senha forte)
5. Clique em "Adicionar usuário"
6. **COPIE O UID** do usuário criado

7. Vá em **Firestore Database**
8. Clique em "Iniciar coleção"
9. ID da coleção: `users`
10. Clique em "Próximo"
11. ID do documento: **COLE O UID COPIADO**
12. Adicione os seguintes campos:

| Campo | Tipo | Valor |
|-------|------|-------|
| uid | string | (o UID copiado) |
| email | string | admin@sistema.com |
| name | string | Administrador |
| role | string | **admin** |
| isActive | boolean | true |
| createdAt | timestamp | (data atual) |

13. Clique em "Salvar"

## Passo 8: Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C)
yarn dev
```

## ✅ Pronto!

Agora você pode acessar:

- **Landing**: http://localhost:3000
- **Login Admin**: http://localhost:3000/admin/login
  - Email: `admin@sistema.com`
  - Senha: `Admin@123`
- **Login Usuário**: http://localhost:3000/login

---

## 🔧 Troubleshooting

### Erro: Firebase API Key invalid
- Verifique se o arquivo `.env.local` está na raiz do projeto
- Verifique se as credenciais estão corretas
- Reinicie o servidor dev

### Erro: Permission denied
- Verifique se as Security Rules foram publicadas corretamente
- Verifique se o usuário tem o campo `role: 'admin'`

### Erro ao fazer login
- Verifique se o Authentication está ativado
- Verifique se Email/senha está habilitado
- Verifique se o usuário foi criado corretamente
