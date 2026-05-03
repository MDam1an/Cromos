# ⚽ Cromos · Copa do Mundo 2026

Controle completo do álbum Panini da Copa 2026 — com sistema de amigos, trocas inteligentes e progresso em tempo real.

---

## Funcionalidades

| Feature | Detalhe |
|---|---|
| 📖 Álbum | 980 figurinhas — marcar Tenho / Repetida / Falta |
| 📊 Stats | Progresso geral + por grupo, com gráfico circular |
| 👥 Amigos | Busca por @username, pedidos em tempo real |
| 🔄 Trocas | Calcula automaticamente o que cada amigo pode te dar |
| 🔐 Auth | E-mail/senha com Firebase Authentication |
| 📱 Responsivo | Mobile-first + sidebar no desktop |

---

## Configurar Firebase

As credenciais já estão configuradas no arquivo `js/services/firebase.js`.

Se quiser usar seu próprio projeto Firebase:

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto → ative **Authentication** (e-mail/senha) e **Firestore**
3. Substitua o objeto `firebaseConfig` em `js/services/firebase.js`

### Regras do Firestore

Cole no console Firebase → Firestore → Regras:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read:  if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /usernames/{username} {
      allow read:   if request.auth != null;
      allow create: if request.auth != null;
    }
    match /stickers/{uid} {
      allow read:  if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
  }
}
```

---

## Como rodar

```bash
# Abrir direto no navegador
open index.html

# Ou via servidor local (evita problemas de CORS)
npx serve .
# → http://localhost:3000

python3 -m http.server 3000
# → http://localhost:3000
```

---

## Estrutura

```
cromos/
├── index.html
├── css/
│   ├── base.css         # Tokens, reset, animações
│   ├── layout.css       # Shell, header, nav, views, responsivo
│   └── components.css   # Todos os componentes visuais
├── js/
│   ├── data.js          # 980 figurinhas mapeadas
│   ├── app.js           # Controller, EventBus, Toast, UI helpers
│   ├── views.js         # Auth, Álbum, Stats, Amigos, Trocas, Perfil
│   └── services/
│       └── firebase.js  # Auth, Stickers, Friends services
└── README.md
```

---

## Stack

- **HTML/CSS/JS puro** — zero dependências externas
- **Firebase 9 (compat)** — Auth + Firestore em tempo real
- **Fontes:** Bebas Neue (display) + Plus Jakarta Sans (corpo)

---

Feito com ⚽ para a maior Copa do Mundo da história — 48 seleções, 980 figurinhas.
