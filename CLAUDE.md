# Projeto: 3DeT Ficha (victory-sheet-web) — Frontend

Sistema de fichas de personagem pro RPG **3DeT Victory**. Frontend Vue, consome API própria (`victory-sheet-api`) via HTTP.

## Stack

- Vue 3 + `<script setup>` + TypeScript
- PrimeVue 4 com **preset customizado** (`RpgFichaPreset`, baseado em Lara) — não usar classes de cor hardcoded (`bg-zinc-900`, `text-white` etc), sempre tokens do preset (`bg-surface-800`, `text-surface-0`, `text-primary-400`)
- Tailwind v4 + `tailwindcss-primeui`
- Pinia (state), Vue Router, Axios
- Fontes: **Sora** (display — títulos, nome do personagem) via `var(--font-display)`, **Manrope** (corpo) via `var(--font-body)`
- Auth: Zitadel (self-hosted), `oidc-client-ts`, PKCE, redirect flow

## Design system

- Paleta dark, 3 camadas de superfície: `surface-900` (fundo/header) → `surface-800` (cards) → `surface-700` (hover)
- Accent primário: dourado/âmbar (`primary-500`, `#c9a15c`)
- Bordas sutis (`border-white/6`), preferir sombra/mudança de bg a borda visível pra dar profundidade
- PV = tons de vermelho/rose, PM = azul/sky, PA = âmbar — sempre dessaturados (`/60`, `/70`), nunca cor pura (`red-500` sólido)
- Títulos usam `font-medium`/`font-light`, não `font-bold` — direção é "leve, não corporativo"
- Componente `Secao.vue` pra qualquer bloco com header de seção — não repetir `<h2 class="...">` solto

## Auth (Zitadel)

- `UserManager` configurado em `src/composables/userAuth.ts`
- Token em `sessionStorage` (padrão do lib), `automaticSilentRenew: true`
- Access token é **JWT** (não opaco — client configurado com Auth Token Type = JWT no Zitadel)
- Todo request pra API sai com `Authorization: Bearer <token>` via interceptor do Axios em `useApi.ts`
- Guard de rota em `router/index.ts` (`beforeEach`), checa `meta.requiresAuth`
- `id_token` nunca é enviado pra API — só o `access_token`

## Domínio (RPG)

- **PV** = Pontos de Vida, **PM** = Pontos de Mana, **PA** = Pontos de Ação, **XP** = experiência
- Personagem tem atributos: `poder`, `habilidade`, `resistencia`
- PV máximo = 10 + (Resistência × 5) + bônus PV
- PM máximo = 10 + (Habilidade × 5) + bônus PM
- `vantagens` tem custo em pontos (negativo = desvantagem), pode ser `futura` (planejada, não ativa)
- Cálculos centralizados em `useCalculos.ts` (`pvMax`, `pmMax`, `paMax`, `custoTotal`) — não duplicar lógica de cálculo em componentes
- `avatar_url`: link direto de imagem (ex: Pinterest), sem upload/storage próprio

## Como trabalhar comigo

- Sou dev full-stack: **Java/Spring Boot**, **Node/Nuxt**, **Oracle**. Sem explicação de conceito básico.
- Aponte bugs reais no código que eu colar, não só o que pedi.
- Sem intro, sem repetir o que eu disse, direto ao ponto.
- Frases curtas. Cada linha traz informação nova.
- Português brasileiro, informal, sem gírias forçadas.
- Se algo no meu código contradiz o que pedi antes, aponta o motivo.
- Não pergunta por perguntar — só se travar o progresso.
- Prefiro "não sei" a resposta inventada.

## Convenções do projeto

- Nomes de campo em português (`nome`, `custo`, `atualizado_em`) — domínio é PT-BR, espelha os campos da API
- Loading: `useLoading()` (composable global, singleton) só pra overlay de tela cheia; loading local por tela usa `ref` próprio, sem reusar o global
- Sem `!important` do Tailwind v3 (`!bg-x`) — sintaxe v4 é sufixo (`bg-x!`)
- Toast (`useToast`) pra erros de API — nunca deixar `catch` vazio ou promise sem tratamento