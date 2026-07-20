<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Chip from 'primevue/chip'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import ResourceBar from '@/components/ResourceBar.vue'
import VantagemItem from '@/components/VantagemItem.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'
import ComboSheet from '@/components/ComboSheet.vue'
import ItemMochilaSheet from '@/components/ItemMochilaSheet.vue'
import ImagemSheet from '@/components/ImagemSheet.vue'
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

const sheetItemAberto = ref(false)
const itemEditandoIndex = ref<number | null>(null)
const sheetComboAberto = ref(false)
const comboEditandoIndex = ref<number | null>(null)
const sheetImagemAberto = ref(false)
const imagemEditandoIndex = ref<number | null>(null)

const avatarErro = ref(false)

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

const imagemVazia = (): ImagemPersonagem => ({
  url: '',
  tipo: 'galeria',
  titulo: '',
  subtitulo: '',
  ordem: imagens.value.length,
})

const novoItem = ref<ItemMochila>(itemVazio())
const novoCombo = ref<Combo>(comboVazio())
const novaImagem = ref<ImagemPersonagem>(imagemVazia())

const imagemErro = ref<Record<number, boolean>>({})
const imagemRenovada = ref<Record<number, boolean>>({})

// URL assinada do R2 expira em 1h — se falhar ao carregar, tenta renovar uma vez
// antes de assumir que a imagem realmente quebrou.
async function tratarErroImagem(img: ImagemPersonagem) {
  if (!img.id) return
  if (imagemRenovada.value[img.id]) {
    imagemErro.value[img.id] = true
    return
  }
  imagemRenovada.value[img.id] = true
  try {
    const { url } = await api.getImagemUrl(img.id)
    img.url = url
  } catch {
    imagemErro.value[img.id] = true
  }
}

// Avatar novo (upload R2, tipo:'avatar' em ImagemPersonagem) tem prioridade sobre o
// campo legado personagem.avatar_url — personagens ainda não migrados caem no fallback.
const imagemAvatar = computed(() => imagens.value.find((img) => img.tipo === 'avatar'))
const avatarUrl = computed(() => imagemAvatar.value?.url || personagem.value?.avatar_url || '')

async function tratarErroAvatar() {
  if (imagemAvatar.value?.id) {
    await tratarErroImagem(imagemAvatar.value)
    if (imagemErro.value[imagemAvatar.value.id]) avatarErro.value = true
  } else {
    avatarErro.value = true
  }
}

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

function abrirNovoItem() {
  itemEditandoIndex.value = null
  novoItem.value = itemVazio()
  sheetItemAberto.value = true
}

function abrirEditarItem(index: number) {
  itemEditandoIndex.value = index
  novoItem.value = { ...(mochila.value[index] ?? itemVazio()) }
  sheetItemAberto.value = true
}

function fecharSheetItem() {
  sheetItemAberto.value = false
}

async function confirmarItem() {
  const atualizados = [...mochila.value]
  if (itemEditandoIndex.value === null) {
    atualizados.push({ ...novoItem.value })
  } else {
    atualizados[itemEditandoIndex.value] = { ...novoItem.value }
  }
  try {
    await api.salvarMochila(id.value, atualizados)
    mochila.value = atualizados
    sheetItemAberto.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar item', life: 3000 })
  }
}

async function excluirItemAtual() {
  if (itemEditandoIndex.value === null) return
  const atualizados = mochila.value.filter((_, i) => i !== itemEditandoIndex.value)
  try {
    await api.salvarMochila(id.value, atualizados)
    mochila.value = atualizados
    sheetItemAberto.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao remover item', life: 3000 })
  }
}

function abrirNovoCombo() {
  comboEditandoIndex.value = null
  novoCombo.value = comboVazio()
  sheetComboAberto.value = true
}

function abrirEditarCombo(index: number) {
  comboEditandoIndex.value = index
  novoCombo.value = { ...(combos.value[index] ?? comboVazio()) }
  sheetComboAberto.value = true
}

function fecharSheetCombo() {
  sheetComboAberto.value = false
}

async function confirmarCombo() {
  const atualizados = [...combos.value]
  if (comboEditandoIndex.value === null) {
    atualizados.push({ ...novoCombo.value })
  } else {
    atualizados[comboEditandoIndex.value] = { ...novoCombo.value }
  }
  try {
    await api.salvarCombos(id.value, atualizados)
    combos.value = atualizados
    sheetComboAberto.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar combo', life: 3000 })
  }
}

async function excluirComboAtual() {
  if (comboEditandoIndex.value === null) return
  const atualizados = combos.value.filter((_, i) => i !== comboEditandoIndex.value)
  try {
    await api.salvarCombos(id.value, atualizados)
    combos.value = atualizados
    sheetComboAberto.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao remover combo', life: 3000 })
  }
}

function abrirNovaImagem() {
  imagemEditandoIndex.value = null
  novaImagem.value = imagemVazia()
  sheetImagemAberto.value = true
}

function abrirEditarImagem(index: number) {
  imagemEditandoIndex.value = index
  novaImagem.value = { ...(imagens.value[index] ?? imagemVazia()) }
  sheetImagemAberto.value = true
}

function fecharSheetImagem() {
  sheetImagemAberto.value = false
}

async function confirmarImagem() {
  let atualizados = imagens.value.map((img) => ({ ...img }))

  // só pode existir 1 imagem tipo:'avatar' por personagem — o backend rejeita com 400
  if (novaImagem.value.tipo === 'avatar') {
    atualizados = atualizados.map((img, i) =>
      img.tipo === 'avatar' && i !== imagemEditandoIndex.value ? { ...img, tipo: 'galeria' } : img,
    )
  }

  if (imagemEditandoIndex.value === null) {
    atualizados.push({ ...novaImagem.value })
  } else {
    atualizados[imagemEditandoIndex.value] = { ...novaImagem.value }
  }

  try {
    await api.salvarImagens(id.value, atualizados)
    imagens.value = atualizados
    sheetImagemAberto.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar imagem', life: 3000 })
  }
}

async function excluirImagemAtual() {
  if (imagemEditandoIndex.value === null) return
  const atualizados = imagens.value.filter((_, i) => i !== imagemEditandoIndex.value)
  try {
    await api.salvarImagens(id.value, atualizados)
    imagens.value = atualizados
    sheetImagemAberto.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao remover imagem', life: 3000 })
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
          <Avatar :image="!avatarErro && avatarUrl ? avatarUrl : undefined"
            :label="!avatarUrl || avatarErro ? personagem.nome?.charAt(0).toUpperCase() : undefined"
            shape="circle" size="large" :pt="{ image: { class: 'object-cover object-top w-full h-full' } }"
            class="ring-1 ring-white/6" @error="tratarErroAvatar" />
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
              class="cursor-pointer rounded-lg border border-white/6 bg-surface-800 p-3 transition-colors active:bg-surface-700"
              @click="abrirEditarItem(i)">
              <div class="flex items-start justify-between gap-2">
                <span class="font-medium text-surface-0">{{ item.nome }}</span>
                <i class="pi pi-pencil shrink-0 text-xs text-surface-500" />
              </div>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <Tag :value="`x${item.quantidade}`" severity="secondary" />
              </div>
              <p v-if="item.descricao" class="mt-2 text-sm text-surface-400">{{ item.descricao }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-surface-500">Nenhum item na mochila.</p>
          <Button label="+ Adicionar Item" text class="mt-2! min-h-9.5!" @click="abrirNovoItem" />
        </Secao>

        <Secao titulo="Combos">
          <div v-if="combos.length" class="flex flex-col gap-2">
            <div v-for="(c, i) in combos" :key="c.id ?? i"
              class="cursor-pointer rounded-lg border border-white/6 bg-surface-800 p-3 transition-colors active:bg-surface-700"
              @click="abrirEditarCombo(i)">
              <div class="flex items-start justify-between gap-2">
                <span class="font-medium text-surface-0">{{ c.nome }}</span>
                <i class="pi pi-pencil shrink-0 text-xs text-surface-500" />
              </div>

              <div v-if="c.dados || c.dano || c.custo || c.critico || c.acoes_turno" class="mt-2 flex flex-wrap gap-1.5">
                <Tag v-if="c.dados" :value="c.dados" icon="pi pi-circle-fill" severity="secondary" />
                <Tag v-if="c.dano" :value="`Dano ${c.dano}`" severity="danger" />
                <Tag v-if="c.custo" :value="`Custo ${c.custo}`" severity="info" />
                <Tag v-if="c.critico" :value="`Crít. ${c.critico}`" severity="warn" />
                <Tag v-if="c.acoes_turno" :value="`${c.acoes_turno}x/turno`" severity="secondary" />
              </div>

              <p v-if="c.observacao" class="mt-2 text-sm text-surface-400">{{ c.observacao }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-surface-500">Nenhum combo cadastrado.</p>
          <Button label="+ Adicionar Combo" text class="mt-2! min-h-9.5!" @click="abrirNovoCombo" />
        </Secao>
      </template>

      <!-- Aba: Imagens -->
      <template v-if="abaAtiva === 'imagens'">
        <Secao titulo="Imagens">
          <div v-if="imagens.length" class="grid grid-cols-2 gap-3">
            <div v-for="(img, i) in imagens" :key="img.id ?? i"
              class="cursor-pointer overflow-hidden rounded-lg bg-surface-800" @click="abrirEditarImagem(i)">
              <div class="relative aspect-square w-full">
                <Image v-if="!imagemErro[img.id ?? -1]" :src="img.url" :alt="img.titulo || personagem.nome"
                  image-class="aspect-square w-full object-cover" class="block h-full w-full"
                  @error="tratarErroImagem(img)" />
                <div v-else class="flex h-full w-full items-center justify-center">
                  <i class="pi pi-image text-2xl text-surface-600" />
                </div>
                <i class="pi pi-pencil absolute right-2 top-2 text-xs text-surface-0" style="filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.6))" />
              </div>
              <div v-if="img.titulo || img.subtitulo" class="p-2">
                <p v-if="img.titulo" class="truncate text-sm font-medium text-surface-0">{{ img.titulo }}</p>
                <p v-if="img.subtitulo" class="truncate text-xs text-surface-400">{{ img.subtitulo }}</p>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-surface-500">Nenhuma imagem cadastrada.</p>
          <Button label="+ Adicionar Imagem" text class="mt-2! min-h-9.5!" @click="abrirNovaImagem" />
        </Secao>
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

    </div>

    <BottomTabBar v-model="abaAtiva" :abas="abas" />

    <ComboSheet v-if="sheetComboAberto" v-model="novoCombo" :editando="comboEditandoIndex !== null"
      @salvar="confirmarCombo" @excluir="excluirComboAtual" @fechar="fecharSheetCombo" />

    <ItemMochilaSheet v-if="sheetItemAberto" v-model="novoItem" :editando="itemEditandoIndex !== null"
      @salvar="confirmarItem" @excluir="excluirItemAtual" @fechar="fecharSheetItem" />

    <ImagemSheet v-if="sheetImagemAberto" v-model="novaImagem" :editando="imagemEditandoIndex !== null"
      @salvar="confirmarImagem" @excluir="excluirImagemAtual" @fechar="fecharSheetImagem" />
  </template>
</template>