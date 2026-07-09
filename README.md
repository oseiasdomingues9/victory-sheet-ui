# victory-sheet-web

Gerenciador de personagens para o sistema 3DeT Victory. Frontend Vue,
consome a API própria (`victory-sheet-api`) via HTTP.

## Stack

- Vue 3 (`<script setup>` + Composition API), Vite, TypeScript
- PrimeVue 4 (preset customizado `RpgFichaPreset`, baseado em Lara)
- Tailwind CSS v4 + `tailwindcss-primeui`
- Pinia (state), Vue Router 4, Axios
- Fontes: Sora (display) + Manrope (corpo)
- Autenticação: Zitadel (self-hosted), via `oidc-client-ts`, PKCE

## Instalação

```
npm install
npm run dev
```

Sobe o Vite em `http://localhost:5173`.

Cria um `.env` com a URL da API:

```env
VITE_API_URL=http://localhost:3000/api
```

## Autenticação

Login via Zitadel (redirect flow, PKCE). Configuração em
`src/composables/userAuth.ts`:

- `authority`: URL da instância Zitadel
- `client_id`: client público (SPA) cadastrado no projeto Zitadel
- `redirect_uri`: `http://localhost:5173/callback`

Token fica em `sessionStorage` (padrão do `oidc-client-ts`), com
`automaticSilentRenew` ativo. Todo request pra API sai com
`Authorization: Bearer <access_token>` via interceptor do Axios.

## Cálculos (3DeT Victory)

- PV máximo = 10 + (Resistência x 5) + bônus PV
- PM máximo = 10 + (Habilidade x 5) + bônus PM

## Estrutura

```
src/
├── main.ts
├── App.vue
├── main.css                  Tokens de fonte, base styles
├── theme/
│   └── rpg-ficha-preset.ts   Preset PrimeVue (cores, superfícies dark)
├── router/
│   └── index.ts               Guard de auth (beforeEach)
├── composables/
│   ├── userAuth.ts            UserManager (oidc-client-ts), logout
│   ├── useApi.ts               Chamadas HTTP (axios + interceptors)
│   ├── useCalculos.ts          pvMax / pmMax / paMax / custoTotal
│   └── useLoading.ts           Loading global (overlay de tela cheia)
├── pages/
│   ├── Lista.vue
│   ├── Ficha.vue
│   ├── Editor.vue
│   └── Callback.vue            Handler de retorno do Zitadel
└── components/
    ├── Header.vue
    ├── Secao.vue
    ├── ResourceBar.vue
    ├── AtributoCard.vue
    ├── VantagemItem.vue
    └── VantagemForm.vue
```

## Backend

API separada em `victory-sheet-api` (Node/Fastify + PostgreSQL). Ver README
do repositório da API para setup do backend e do banco.