# Projeto: 3DeT Ficha (victory-sheet-web) — Frontend

Sistema de fichas de personagem pro RPG **3DeT Victory**. Frontend Vue, consome API própria (`victory-sheet-api`) via HTTP.

## Stack

- Vue 3 + `<script setup>` + TypeScript, Vite
- PrimeVue 4 com **preset customizado** (`RpgFichaPreset`, baseado em Lara, em `src/theme.ts`) — não usar classes de cor hardcoded (`bg-zinc-900`, `text-white` etc), sempre tokens do preset (`bg-surface-800`, `text-surface-0`, `text-primary-400`)
- Tailwind v4 + `tailwindcss-primeui`
- Vue Router, Axios — **sem Pinia**: é dependência do projeto mas não há nenhum `defineStore`/store criado; estado é local por página/composable (`ref`), não assuma um store global existindo
- `marked` + `dompurify` pra renderizar a lore do personagem em Markdown sanitizado (`useMarkdown.ts`)
- PWA (`vite-plugin-pwa`) — instalável, `display: standalone`, orientação retrato
- Fontes: **Sora** (display — títulos, nome do personagem) via `var(--font-display)`, **Manrope** (corpo) via `var(--font-body)`
- Auth: Zitadel (self-hosted), `oidc-client-ts`, PKCE, redirect flow

## Design system

- Paleta dark, 3 camadas de superfície: `surface-900` (fundo/header) → `surface-800` (cards) → `surface-700` (hover)
- Accent primário: dourado/âmbar (`primary-500`, `#c9a15c`)
- Bordas sutis (`border-white/6`), preferir sombra/mudança de bg a borda visível pra dar profundidade
- PV = tons de vermelho/rose, PM = azul/sky, PA = âmbar — sempre dessaturados (`/60`, `/70`), nunca cor pura (`red-500` sólido)
- Títulos usam `font-medium`/`font-light`, não `font-bold` — direção é "leve, não corporativo"
- Componente `Secao.vue` pra qualquer bloco com header de seção — não repetir `<h2 class="...">` solto
- Navegação mobile: `Ficha.vue` e `Editor.vue` usam abas fixas no rodapé (`BottomTabBar.vue`), estilo app nativo, com `env(safe-area-inset-bottom)`. Formulário com muitos campos (combo, item de mochila) abre como **sheet fullscreen** (`fixed inset-0`, ex: `ComboSheet.vue`, `ItemMochilaSheet.vue`), não `Dialog` pequeno — modal centralizado de 90vw fica apertado em tela de celular. Segue esse padrão pra qualquer form novo com mais de ~3 campos

## Auth (Zitadel)

- `UserManager` configurado em `src/composables/userAuth.ts`
- **`authority`, `client_id`, `redirect_uri` estão hardcoded** em `userAuth.ts` (não lê `import.meta.env`), embora `Dockerfile`/CI passem `VITE_ZITADEL_AUTHORITY`/`VITE_ZITADEL_CLIENT_ID` como build args — esses build args hoje não têm efeito nenhum. `redirect_uri` aponta pra `localhost:5173`, então build de produção via Docker provavelmente tem o login quebrado. Sabido, ainda não corrigido.
- Token em `sessionStorage` (padrão do lib), `automaticSilentRenew: true`
- Access token é **JWT** (não opaco — client configurado com Auth Token Type = JWT no Zitadel)
- Todo request pra API sai com `Authorization: Bearer <token>` via interceptor do Axios em `useApi.ts`
- Em 401: tenta `signinSilent()` e reenvia a requisição original (retry único, flag `_retry` no config evita loop); se falhar, `signinRedirect()`. Ambos — renovação e redirect — são compartilhados entre requisições concorrentes (uma promise em andamento / uma flag), pra não disparar N renovações e N redirects quando várias chamadas em paralelo (`Promise.all`) tomam 401 ao mesmo tempo
- Guard de rota em `router/index.ts` (`beforeEach`), checa `meta.requiresAuth`
- `main.ts` só chama `app.mount()` depois de `router.isReady()` — montar antes disso deixa `route.name` undefined por um instante e quebra o `v-if="route.name !== 'callback'"` do Header
- `id_token` nunca é enviado pra API — só o `access_token`

## Domínio (RPG)

- **PV** = Pontos de Vida, **PM** = Pontos de Mana, **PA** = Pontos de Ação, **XP** = experiência
- Personagem tem atributos: `poder`, `habilidade`, `resistencia`
- Fórmulas reais (`useCalculos.ts` — fonte da verdade, não confiar em memória/README antigo sem checar o arquivo):
  - `pvMax` = Resistência × 5 + `pv_bonus` (sem base fixa)
  - `pmMax` = Habilidade × 5 + `pm_bonus` (sem base fixa)
  - `paMax` = Poder
  - `custoTotal` = soma do custo das vantagens ativas (ignora as com `futura: true`) + Poder + Habilidade + Resistência + nº de perícias
- `vantagens` tem custo em pontos (negativo = desvantagem), pode ser `futura` (planejada, não ativa)
- Cálculos centralizados em `useCalculos.ts` — não duplicar lógica de cálculo em componentes
- `avatar_url`: link direto de imagem (ex: Pinterest), sem upload/storage próprio
- Entidades por personagem, cada uma com endpoint próprio (bulk save — POST substitui a lista inteira, ver `useApi.ts`):
  - `Sessao`: histórico de sessões de jogo (pv/pm início e fim, notas)
  - `Combo`: ações de combate (`nome`, `dados`, `dano`, `custo`, `critico`, `acoes_turno`, etc.) — editável na própria `Ficha.vue`, sem passar pelo `Editor.vue`
  - `ItemMochila`: itens (`nome`, `descricao`, `quantidade`) — mesmo padrão de edição inline do Combo
  - `ImagemPersonagem`: galeria de imagens do personagem (`url`, `titulo`, `subtitulo`)
  - `lore`: texto livre em Markdown, renderizado via `useMarkdown.ts`

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