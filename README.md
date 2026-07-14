# victory-sheet-web

Ficha de personagem para o sistema **3DeT Victory**, mobile-first. Frontend Vue puro, consome a API própria (`victory-sheet-api`) via HTTP — sem lógica de negócio no cliente além de cálculos de exibição.

## Stack

- Vue 3 (`<script setup>` + Composition API), Vite, TypeScript
- PrimeVue 4 com preset customizado (`RpgFichaPreset`, baseado em Lara) — tema dark, tokens próprios (`src/theme.ts`)
- Tailwind CSS v4 + `tailwindcss-primeui`
- Vue Router 4, Axios
- Fontes: Sora (display) + Manrope (corpo)
- Autenticação: Zitadel (self-hosted), via `oidc-client-ts`, PKCE
- `marked` + `dompurify` para renderizar a lore do personagem em Markdown com sanitização
- PWA (`vite-plugin-pwa`) — instalável, `display: standalone`, orientação retrato

## Instalação

```bash
npm install
npm run dev
```

Sobe o Vite em `http://localhost:5173`.

```bash
npm run build    # type-check (vue-tsc) + build de produção em dist/
npm run preview  # serve o build de produção localmente
```

### Variáveis de ambiente

```env
VITE_API_URL=http://localhost:3000/api
```

> A configuração do Zitadel (`authority`, `client_id`, `redirect_uri`) hoje está **hardcoded** em `src/composables/userAuth.ts`, não lida de env var — apesar do `Dockerfile` e do workflow de deploy aceitarem `VITE_ZITADEL_AUTHORITY` / `VITE_ZITADEL_CLIENT_ID` como build args. Trocar de ambiente (dev/prod) exige editar esse arquivo diretamente até isso ser corrigido.

## Autenticação

Login via Zitadel (redirect flow, PKCE). Configuração em `src/composables/userAuth.ts`.

- Token (JWT) fica em `sessionStorage` (padrão do `oidc-client-ts`), com `automaticSilentRenew` ativo
- Todo request pra API sai com `Authorization: Bearer <access_token>` via interceptor do Axios (`useApi.ts`)
- Em 401: tenta renovação silenciosa (`signinSilent`) e reenvia a requisição; se falhar, redireciona pro login. A renovação e o redirect são compartilhados entre requisições concorrentes (evita disparar N renovações/redirects quando várias chamadas falham ao mesmo tempo)
- `id_token` nunca é enviado pra API — só o `access_token`
- Guard de rota em `router/index.ts` (`beforeEach`), checa `meta.requiresAuth`
- `main.ts` só monta a aplicação depois de `router.isReady()`, pra evitar flash de UI antes do guard resolver a rota inicial

## Navegação mobile

`Ficha.vue` e `Editor.vue` usam o mesmo padrão de abas fixas no rodapé (`BottomTabBar.vue`), estilo app nativo, com `safe-area-inset-bottom` pra notch/home indicator. Formulários com muitos campos (combo, item de mochila) abrem como *sheet* fullscreen (`ComboSheet.vue`, `ItemMochilaSheet.vue`) em vez de modal pequeno — mais adequado pra tela de celular.

## Domínio (3DeT Victory)

Cálculos centralizados em `useCalculos.ts` — não duplicar em componentes:

- `pvMax` = Resistência × 5 + bônus PV
- `pmMax` = Habilidade × 5 + bônus PM
- `paMax` = Poder
- `custoTotal` = soma do custo das vantagens ativas (ignora `futura`) + Poder + Habilidade + Resistência + nº de perícias

Entidades por personagem (todas com endpoint próprio na API, ver `useApi.ts`): estado (PV/PM/PA/XP atuais), sessões de jogo, vantagens/desvantagens, imagens, itens de mochila, combos (ações de combate).

## Estrutura

```
src/
├── main.ts                    Bootstrap: monta app só após router.isReady()
├── App.vue                    Layout raiz: Header + RouterView + loading overlay
├── theme.ts                   Preset PrimeVue (RpgFichaPreset)
├── types.ts                   Tipos de domínio (Personagem, Vantagem, Combo, ItemMochila...)
├── assets/
│   └── main.css                Tokens de fonte, base styles
├── locales/
│   ├── pt.json, en.json, es.json   Strings pro locale do PrimeVue (pt em uso)
├── router/
│   └── index.ts                Rotas + guard de auth (beforeEach)
├── composables/
│   ├── userAuth.ts              UserManager (oidc-client-ts), logout
│   ├── useApi.ts                 Chamadas HTTP (axios + interceptors de auth/401)
│   ├── useCalculos.ts            pvMax / pmMax / paMax / custoTotal
│   ├── useMarkdown.ts            Markdown → HTML sanitizado (lore)
│   └── useLoading.ts             Loading global (overlay de tela cheia, singleton)
├── plugins/
│   └── primevue.ts               Registro global de componentes PrimeVue
├── pages/
│   ├── Lista.vue                  Lista de personagens
│   ├── Ficha.vue                  Visualização (abas: Dados, Vantagens, Mochila, Imagens, Lore)
│   ├── Editor.vue                 Criação/edição (abas: Dados, Vantagens, Imagens, Lore)
│   └── Callback.vue               Handler de retorno do Zitadel
└── components/
    ├── AppHeader.vue               Header fixo (topo)
    ├── BottomTabBar.vue            Nav fixa (rodapé), usada em Ficha e Editor
    ├── Secao.vue                   Bloco com header de seção (reusar sempre, não repetir <h2>)
    ├── ResourceBar.vue             Barra de PV/PM/PA com incremento/decremento
    ├── BarraStat.vue                Barra compacta (usada na Lista)
    ├── AtributoCard.vue             Card de atributo (Poder/Habilidade/Resistência)
    ├── VantagemItem.vue             Exibição de uma vantagem/desvantagem
    ├── VantagemForm.vue             Formulário de vantagem/desvantagem (Editor)
    ├── ImagemForm.vue                Formulário de imagem (Editor)
    ├── ComboSheet.vue                Sheet fullscreen: criar/editar combo (Ficha)
    └── ItemMochilaSheet.vue          Sheet fullscreen: criar/editar item de mochila (Ficha)
```

## Deploy

- `Dockerfile`: build multi-stage (Node → Nginx), serve o build estático
- `.github/workflows/deploy.yml`: build + push da imagem Docker em tags `v*.*.*`

## Backend

API separada em `victory-sheet-api` (Node/Fastify + PostgreSQL). Ver README do repositório da API para setup do backend e do banco.
