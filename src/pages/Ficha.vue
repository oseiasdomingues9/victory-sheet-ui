<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Chip from 'primevue/chip'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import ResourceBar from '@/components/ResourceBar.vue'
import VantagemItem from '@/components/VantagemItem.vue'
import { api } from '@/composables/useApi'
import { pvMax, pmMax, paMax, calcularCustoTotal } from '@/composables/useCalculos'
import type { Personagem, Vantagem, Estado, Sessao, ImagemPersonagem, Combo, ItemMochila } from '@/types'
import Secao from '@/components/Secao.vue'
import AtributoCard from '@/components/AtributoCard.vue'
import { useLoading } from '@/composables/useLoading'
import { useMarkdown } from '@/composables/useMarkdown'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loreHtml = computed(() => useMarkdown(personagem.value?.lore ?? '').value)

const { withLoading } = useLoading()

const id = computed(() => route.params.id as string)

const personagem = ref<Personagem | null>(null)
const estado = ref<Estado | null>(null)
const vantagens = ref<Vantagem[]>([])
const sessoes = ref<Sessao[]>([])
const sessaoAtiva = ref<Sessao | null>(null)
const imagens = ref<ImagemPersonagem[]>([])
const mochila = ref<ItemMochila[]>([])
const combos = ref<Combo[]>([])

const dialogEncerrar = ref(false)
const notasSessao = ref('')

const dialogNovoItem = ref(false)
const dialogNovoCombo = ref(false)

const itemVazio = (): ItemMochila => ({ nome: '', descricao: '', quantidade: 1, ordem: mochila.value.length })
const comboVazio = (): Combo => ({
  nome: '',
  dados: '',
  poder_base: '',
  vantagens_ativas: '',
  custo: '',
  dano: '',
  mecanica_extra: '',
  acoes_turno: '',
  observacao: '',
  critico: '',
  ordem: combos.value.length,
})

const novoItem = ref<ItemMochila>(itemVazio())
const novoCombo = ref<Combo>(comboVazio())

type Aba = 'dados' | 'vantagens' | 'mochila' | 'imagens' | 'lore'
const abaAtiva = ref<Aba>('dados')
const abas: { key: Aba; label: string; icon: string }[] = [
  { key: 'dados', label: 'Dados', icon: 'pi pi-user' },
  { key: 'vantagens', label: 'Vantagens', icon: 'pi pi-star' },
  { key: 'mochila', label: 'Mochila', icon: 'pi pi-briefcase' },
  { key: 'imagens', label: 'Imagens', icon: 'pi pi-image' },
  { key: 'lore', label: 'Lore', icon: 'pi pi-book' },
]

let debounceTimer: ReturnType<typeof setTimeout> | undefined

const pv = computed(() => estado.value?.pv_atual ?? 0)
const pm = computed(() => estado.value?.pm_atual ?? 0)
const pa = computed(() => estado.value?.pa_atual ?? 0)
const xp = computed(() => estado.value?.xp_atual ?? 0)

const pvMaximo = computed(() => (personagem.value ? pvMax(personagem.value) : 0))
const pmMaximo = computed(() => (personagem.value ? pmMax(personagem.value) : 0))
const paMaximo = computed(() => (personagem.value ? paMax(personagem.value) : 0))
const custoTotal = computed(() => {
  if (!personagem.value) return 0
  return calcularCustoTotal(personagem.value, vantagens.value)
})


const temRegen = computed(() => vantagens.value.some((v) => v.tags.includes('regen')))

const vantagensAtivas = computed(() =>
  vantagens.value.filter((v) => v.custo >= 0 && !v.tags.includes('desvantagem')),
)
const desvantagens = computed(() =>
  vantagens.value.filter((v) => v.custo < 0 || v.tags.includes('desvantagem')),
)


async function carregar() {
  try {
    const [p, e, v, s, i, m, c] = await withLoading(() =>
      Promise.all([
        api.getPersonagem(id.value),
        api.getEstado(id.value),
        api.getVantagens(id.value),
        api.getSessoes(id.value),
        api.getImagens(id.value),
        api.getMochila(id.value),
        api.getCombos(id.value),
      ]),
    )
    personagem.value = p
    estado.value = e
    vantagens.value = v
    sessoes.value = s
    sessaoAtiva.value = s.find((s) => s.pv_fim === null) ?? null
    imagens.value = i
    mochila.value = m
    combos.value = c
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar ficha', life: 3000 })
  }
}

function abrirDialogNovoItem() {
  novoItem.value = itemVazio()
  dialogNovoItem.value = true
}

async function confirmarNovoItem() {
  const atualizados = [...mochila.value, { ...novoItem.value }]
  try {
    await api.salvarMochila(id.value, atualizados)
    mochila.value = atualizados
    dialogNovoItem.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar item', life: 3000 })
  }
}

async function removerItem(index: number) {
  const atualizados = mochila.value.filter((_, i) => i !== index)
  try {
    await api.salvarMochila(id.value, atualizados)
    mochila.value = atualizados
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao remover item', life: 3000 })
  }
}

function abrirDialogNovoCombo() {
  novoCombo.value = comboVazio()
  dialogNovoCombo.value = true
}

async function confirmarNovoCombo() {
  const atualizados = [...combos.value, { ...novoCombo.value }]
  try {
    await api.salvarCombos(id.value, atualizados)
    combos.value = atualizados
    dialogNovoCombo.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar combo', life: 3000 })
  }
}

async function removerCombo(index: number) {
  const atualizados = combos.value.filter((_, i) => i !== index)
  try {
    await api.salvarCombos(id.value, atualizados)
    combos.value = atualizados
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao remover combo', life: 3000 })
  }
}

function salvarEstadoDebounced() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    api.salvarEstado(id.value, pv.value, pm.value, pa.value, xp.value)
  }, 300)
}

function atualizarPv(valor: number) {
  if (!estado.value) return
  estado.value.pv_atual = valor
  salvarEstadoDebounced()
}

function atualizarPm(valor: number) {
  if (!estado.value) return
  estado.value.pm_atual = valor
  salvarEstadoDebounced()
}

function atualizarPa(valor: number) {
  if (!estado.value) return
  estado.value.pa_atual = valor
  salvarEstadoDebounced()
}

function atualizarXp(valor: number) {
  if (!estado.value) return
  estado.value.xp_atual = valor
  salvarEstadoDebounced()
}

function irParaEditor() {
  router.push(`/editor/${id.value}`)
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function exportarJson() {
  const dados = await api.exportar(id.value)
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${personagem.value?.slug ?? 'personagem'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function iniciarSessao() {
  const { id: sessaoId } = await api.iniciarSessao(id.value)
  sessaoAtiva.value = {
    id: sessaoId,
    personagem_id: Number(id.value),
    data: new Date().toISOString(),
    notas: '',
    pv_inicio: pv.value,
    pv_fim: null,
    pm_inicio: pm.value,
    pm_fim: null,
  }
  toast.add({ severity: 'success', summary: 'Sessão iniciada', life: 2000 })
}

function abrirDialogEncerrar() {
  notasSessao.value = ''
  dialogEncerrar.value = true
}

async function confirmarEncerrarSessao() {
  if (!sessaoAtiva.value) return
  await api.encerrarSessao(sessaoAtiva.value.id, pv.value, pm.value, notasSessao.value)
  sessaoAtiva.value = null
  dialogEncerrar.value = false
  toast.add({ severity: 'success', summary: 'Sessão encerrada', life: 2000 })
}

onMounted(carregar)
</script>

<template>
  <template v-if="personagem">
    <div class="mx-auto max-w-120 p-4 pb-24">
      <div class="mb-6 flex items-center gap-3">
        <RouterLink to="/" class="text-surface-400 transition-colors hover:text-surface-0">
          <i class="pi pi-arrow-left" />
        </RouterLink>

        <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-800 ring-1 ring-white/6">
          <img v-if="personagem.avatar_url" :src="personagem.avatar_url" :alt="personagem.nome"
            class="h-full w-full object-cover" @error="($event.target as HTMLImageElement).style.display = 'none'" />
          <div v-else class="flex h-full w-full items-center justify-center font-medium text-surface-500">
            {{ personagem.nome?.charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <h1 class="truncate text-xl font-medium text-surface-0" style="font-family: var(--font-display)">
            {{ personagem.nome }}
          </h1>
          <p v-if="personagem.subtitulo" class="truncate text-sm text-surface-400">{{ personagem.subtitulo }}</p>
        </div>

        <Tag v-if="personagem.arquetipo" :value="personagem.arquetipo" severity="info" />
      </div>

      <!-- Aba: Dados -->
      <template v-if="abaAtiva === 'dados'">
        <!-- Custo total: primeiro, é dado de referência -->
        <div class="mb-6 flex items-center justify-between gap-4 rounded-lg bg-surface-800 px-3 py-2 text-sm">
          <div class="flex flex-col gap-1.5">
            <label for="xp-input" class="text-surface-400">Xp</label>
            <InputNumber v-model="estado!.xp_atual" inputId="xp-input" class="w-32" @update:modelValue="atualizarXp" />
          </div>

          <div class="flex flex-col items-end gap-0.5">
            <span class="text-surface-400">custo total</span>
            <span class="font-medium text-primary-400">{{ custoTotal }}pt</span>
          </div>
        </div>

        <Secao titulo="Recursos">
          <div class="flex flex-col gap-3">
            <ResourceBar label="PV — Pontos de Vida" :atual="pv" :max="pvMaximo" type="pv" :showRegen="temRegen"
              @update:atual="atualizarPv" />
            <ResourceBar label="PM — Pontos de Mana" :atual="pm" :max="pmMaximo" type="pm"
              @update:atual="atualizarPm" />
            <ResourceBar label="PA — Pontos de Ação" :atual="pa" :max="paMaximo" type="pa"
              @update:atual="atualizarPa" />
          </div>
        </Secao>

        <Secao titulo="Atributos">
          <div class="grid grid-cols-3 gap-2">
            <AtributoCard label="Poder" :valor="personagem.poder" />
            <AtributoCard label="Habilidade" :valor="personagem.habilidade" />
            <AtributoCard label="Resistência" :valor="personagem.resistencia" />
          </div>
        </Secao>

        <Secao v-if="personagem.pericias.length" titulo="Perícias">
          <div class="flex flex-wrap gap-2">
            <Chip v-for="p in personagem.pericias" :key="p" :label="p" />
          </div>
        </Secao>

        <Secao v-if="personagem.racial_nome" titulo="Habilidade Racial">
          <div class="rounded-lg bg-surface-800 p-3">
            <p class="font-medium text-surface-0">{{ personagem.racial_nome }}</p>
            <p class="mt-1 text-sm text-surface-400">{{ personagem.racial_desc }}</p>
          </div>
        </Secao>

        <Secao v-if="personagem.notas" titulo="Notas">
          <p class="text-sm text-surface-400">{{ personagem.notas }}</p>
        </Secao>

        <Secao v-if="sessoes.length" titulo="Últimas Sessões">
          <div class="flex flex-col gap-3">
            <div v-for="sessao in sessoes" :key="sessao.id" class="rounded-lg bg-surface-800 p-3">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-surface-0">{{ formatarData(sessao.data) }}</p>
                <span v-if="sessao.pv_fim === null" class="text-xs font-medium text-primary-400">em andamento</span>
              </div>

              <div v-if="sessao.pv_inicio !== null" class="mt-2 flex gap-4 text-xs text-surface-400">
                <span>PV: {{ sessao.pv_inicio }} → {{ sessao.pv_fim ?? '—' }}</span>
                <span>PM: {{ sessao.pm_inicio }} → {{ sessao.pm_fim ?? '—' }}</span>
              </div>

              <p v-if="sessao.notas" class="mt-2 text-sm text-surface-400">{{ sessao.notas }}</p>
            </div>
          </div>
        </Secao>

        <!-- Ação primária isolada -->
        <div class="mt-2">
          <Button v-if="!sessaoAtiva" label="Iniciar Sessão" icon="pi pi-play" class="min-h-9.5! w-full"
            @click="iniciarSessao" />
          <Button v-else label="Encerrar Sessão" icon="pi pi-stop" severity="danger" class="min-h-9.5! w-full"
            @click="abrirDialogEncerrar" />
        </div>

        <!-- Secundárias -->
        <div class="mt-2 flex gap-2">
          <Button label="Editar" icon="pi pi-pencil" outlined class="min-h-9.5! flex-1" @click="irParaEditor" />
          <Button label="Exportar" icon="pi pi-download" outlined class="min-h-9.5! flex-1" @click="exportarJson" />
        </div>
      </template>

      <!-- Aba: Vantagens -->
      <template v-if="abaAtiva === 'vantagens'">
        <Secao titulo="Vantagens">
          <div v-if="vantagensAtivas.length" class="flex flex-col gap-2">
            <VantagemItem v-for="(v, i) in vantagensAtivas" :key="v.id ?? i" :vantagem="v" />
          </div>
          <p v-else class="text-sm text-surface-500">Nenhuma vantagem cadastrada.</p>
        </Secao>

        <Secao v-if="desvantagens.length" titulo="Desvantagens">
          <div class="flex flex-col gap-2">
            <VantagemItem v-for="(v, i) in desvantagens" :key="v.id ?? i" :vantagem="v" />
          </div>
        </Secao>
      </template>

      <!-- Aba: Mochila -->
      <template v-if="abaAtiva === 'mochila'">
        <Secao titulo="Itens">
          <div v-if="mochila.length" class="flex flex-col gap-2">
            <div v-for="(item, i) in mochila" :key="item.id ?? i"
              class="flex items-start justify-between gap-2 rounded-lg border border-white/6 bg-surface-800 p-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-surface-0">{{ item.nome }}</span>
                  <span class="text-sm text-surface-400">x{{ item.quantidade }}</span>
                </div>
                <p v-if="item.descricao" class="mt-1 text-sm text-surface-400">{{ item.descricao }}</p>
              </div>
              <Button icon="pi pi-trash" severity="danger" text class="min-h-9.5! shrink-0" @click="removerItem(i)" />
            </div>
          </div>
          <p v-else class="text-sm text-surface-500">Nenhum item na mochila.</p>
          <Button label="+ Adicionar Item" text class="mt-2! min-h-9.5!" @click="abrirDialogNovoItem" />
        </Secao>

        <Secao titulo="Combos">
          <div v-if="combos.length" class="flex flex-col gap-2">
            <div v-for="(c, i) in combos" :key="c.id ?? i" class="rounded-lg border border-white/6 bg-surface-800 p-3">
              <div class="flex items-start justify-between gap-2">
                <span class="font-medium text-surface-0">{{ c.nome }}</span>
                <Button icon="pi pi-trash" severity="danger" text class="min-h-9.5! shrink-0" @click="removerCombo(i)" />
              </div>
              <div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-surface-400">
                <span v-if="c.dados">Dados: {{ c.dados }}</span>
                <span v-if="c.dano">Dano: {{ c.dano }}</span>
                <span v-if="c.custo">Custo: {{ c.custo }}</span>
                <span v-if="c.critico">Crítico: {{ c.critico }}</span>
                <span v-if="c.acoes_turno">Ações/turno: {{ c.acoes_turno }}</span>
              </div>
              <p v-if="c.observacao" class="mt-1 text-sm text-surface-400">{{ c.observacao }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-surface-500">Nenhum combo cadastrado.</p>
          <Button label="+ Adicionar Combo" text class="mt-2! min-h-9.5!" @click="abrirDialogNovoCombo" />
        </Secao>
      </template>

      <!-- Aba: Imagens -->
      <template v-if="abaAtiva === 'imagens'">
        <div v-if="imagens.length" class="grid grid-cols-2 gap-3">
          <div v-for="img in imagens" :key="img.id" class="overflow-hidden rounded-lg bg-surface-800">
            <img :src="img.url" :alt="img.titulo || personagem.nome" class="aspect-square w-full object-cover"
              @error="($event.target as HTMLImageElement).style.display = 'none'" />
            <div v-if="img.titulo || img.subtitulo" class="p-2">
              <p v-if="img.titulo" class="truncate text-sm font-medium text-surface-0">{{ img.titulo }}</p>
              <p v-if="img.subtitulo" class="truncate text-xs text-surface-400">{{ img.subtitulo }}</p>
            </div>
          </div>
        </div>
        <div v-else
          class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-surface-700 p-10 text-center">
          <i class="pi pi-image text-2xl text-surface-600" />
          <p class="text-sm text-surface-500">Nenhuma imagem cadastrada.</p>
        </div>
      </template>

      <!-- Aba: Lore -->
      <template v-if="abaAtiva === 'lore'">
        <Secao titulo="Lore">
          <div v-if="personagem.lore" class="markdown-lore text-sm text-surface-400" v-html="loreHtml" />
          <p v-else class="text-sm text-surface-500">Nenhuma lore cadastrada.</p>
        </Secao>
      </template>

      <Dialog v-model:visible="dialogEncerrar" header="Encerrar sessão" modal
        :style="{ width: '90vw', maxWidth: '420px' }">
        <label class="mb-2 block text-sm text-surface-400">Notas da sessão</label>
        <Textarea v-model="notasSessao" class="w-full" rows="4" autoResize />
        <template #footer>
          <Button label="Cancelar" text @click="dialogEncerrar = false" />
          <Button label="Confirmar" @click="confirmarEncerrarSessao" />
        </template>
      </Dialog>

      <Dialog v-model:visible="dialogNovoItem" header="Novo item" modal :style="{ width: '90vw', maxWidth: '420px' }">
        <div class="flex flex-col gap-3">
          <div>
            <label class="mb-1 block text-sm text-surface-400">Nome</label>
            <InputText v-model="novoItem.nome" class="w-full" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Quantidade</label>
            <InputNumber v-model="novoItem.quantidade" class="w-full" :min="1" showButtons />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Descrição</label>
            <Textarea v-model="novoItem.descricao" class="w-full" rows="3" autoResize />
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" text @click="dialogNovoItem = false" />
          <Button label="Adicionar" :disabled="!novoItem.nome" @click="confirmarNovoItem" />
        </template>
      </Dialog>

      <Dialog v-model:visible="dialogNovoCombo" header="Novo combo" modal :style="{ width: '90vw', maxWidth: '480px' }">
        <div class="flex flex-col gap-3">
          <div>
            <label class="mb-1 block text-sm text-surface-400">Nome</label>
            <InputText v-model="novoCombo.nome" class="w-full" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-sm text-surface-400">Dados</label>
              <InputText v-model="novoCombo.dados" class="w-full" placeholder="2d6+3" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-surface-400">Poder base</label>
              <InputText v-model="novoCombo.poder_base" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-surface-400">Custo</label>
              <InputText v-model="novoCombo.custo" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-surface-400">Dano</label>
              <InputText v-model="novoCombo.dano" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-surface-400">Ações/turno</label>
              <InputText v-model="novoCombo.acoes_turno" class="w-full" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-surface-400">Crítico</label>
              <InputText v-model="novoCombo.critico" class="w-full" />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Vantagens ativas</label>
            <InputText v-model="novoCombo.vantagens_ativas" class="w-full" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Mecânica extra</label>
            <Textarea v-model="novoCombo.mecanica_extra" class="w-full" rows="2" autoResize />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Observação</label>
            <Textarea v-model="novoCombo.observacao" class="w-full" rows="2" autoResize />
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" text @click="dialogNovoCombo = false" />
          <Button label="Adicionar" :disabled="!novoCombo.nome" @click="confirmarNovoCombo" />
        </template>
      </Dialog>
    </div>

    <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-white/6 bg-surface-900/95 backdrop-blur">
      <div class="mx-auto flex max-w-120" :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }">
        <button v-for="aba in abas" :key="aba.key" type="button"
          class="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors"
          :class="abaAtiva === aba.key ? 'text-primary-400' : 'text-surface-500'" @click="abaAtiva = aba.key">
          <i :class="aba.icon" class="text-lg" />
          {{ aba.label }}
        </button>
      </div>
    </nav>
  </template>
</template>