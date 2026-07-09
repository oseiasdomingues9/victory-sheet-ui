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
import { api } from '@/composables/useApi'
import { pvMax, pmMax, paMax, calcularCustoTotal } from '@/composables/useCalculos'
import type { Personagem, Vantagem, Estado, Sessao } from '@/types'
import Secao from '@/components/Secao.vue'
import AtributoCard from '@/components/AtributoCard.vue'
import { useLoading } from '@/composables/useLoading'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { withLoading } = useLoading()

const id = computed(() => route.params.id as string)

const personagem = ref<Personagem | null>(null)
const estado = ref<Estado | null>(null)
const vantagens = ref<Vantagem[]>([])
const sessaoAtiva = ref<Sessao | null>(null)

const dialogEncerrar = ref(false)
const notasSessao = ref('')

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
    const [p, e, v, sessoes] = await withLoading(() =>
      Promise.all([
        api.getPersonagem(id.value),
        api.getEstado(id.value),
        api.getVantagens(id.value),
        api.getSessoes(id.value),
      ]),
    )
    personagem.value = p
    estado.value = e
    vantagens.value = v
    sessaoAtiva.value = sessoes.find((s) => s.pv_fim === null) ?? null
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar ficha', life: 3000 })
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
  <div v-if="personagem" class="mx-auto max-w-120 p-4">
    <div class="mb-6 flex items-center gap-3">
      <RouterLink to="/" class="text-surface-400 transition-colors hover:text-surface-0">
        <i class="pi pi-arrow-left" />
      </RouterLink>
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-xl font-medium text-surface-0" style="font-family: var(--font-display)">
          {{ personagem.nome }}
        </h1>
        <p v-if="personagem.subtitulo" class="truncate text-sm text-surface-400">{{ personagem.subtitulo }}</p>
      </div>
      <Tag v-if="personagem.arquetipo" :value="personagem.arquetipo" severity="info" />
    </div>

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
        <ResourceBar label="PM — Pontos de Mana" :atual="pm" :max="pmMaximo" type="pm" @update:atual="atualizarPm" />
        <ResourceBar label="PA — Pontos de Ação" :atual="pa" :max="paMaximo" type="pa" @update:atual="atualizarPa" />
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

    <Secao titulo="Vantagens">
      <div class="flex flex-col gap-2">
        <VantagemItem v-for="(v, i) in vantagensAtivas" :key="v.id ?? i" :vantagem="v" />
      </div>
    </Secao>

    <Secao v-if="desvantagens.length" titulo="Desvantagens">
      <div class="flex flex-col gap-2">
        <VantagemItem v-for="(v, i) in desvantagens" :key="v.id ?? i" :vantagem="v" />
      </div>
    </Secao>

    <Secao v-if="personagem.notas" titulo="Notas">
      <p class="text-sm text-surface-400">{{ personagem.notas }}</p>
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
</template>