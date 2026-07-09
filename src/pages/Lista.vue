<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { api } from '@/composables/useApi'
import { pvMax, pmMax } from '@/composables/useCalculos'
import BarraStat from '@/components/BarraStat.vue'
import type { Personagem } from '@/types'
import { useLoading } from '@/composables/useLoading'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const personagens = ref<Personagem[]>([])

const { start, stop, withLoading } = useLoading()

async function carregar() {
  try {
    personagens.value = await withLoading(() => api.getPersonagens())
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar personagens', life: 3000 })
  }
}
async function abrirFicha(id: number) {
  start()
  try {
    await router.push(`/ficha/${id}`)
  } finally {
    stop()
  }
}
function novoPersonagem() {
  router.push('/editor')
}

function confirmarExclusao(p: Personagem, event: Event) {
  event.stopPropagation()
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: `Excluir "${p.nome}" permanentemente?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await api.deletarPersonagem(p.id)
      await carregar()
      toast.add({ severity: 'success', summary: 'Excluído', detail: `${p.nome} foi removido.`, life: 3000 })
    },
  })
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto max-w-120">
    <div class="mb-4 mt-2 flex items-center justify-between">
      <h1 class="text-xl font-bold tracking-wide text-surface-0">Personagens</h1>
      <Button label="Novo" icon="pi pi-plus" class="min-h-9.5!" @click="novoPersonagem" />
    </div>

    <div v-if="personagens.length === 0"
      class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-surface-700 p-10 text-center text-surface-400">
      <i class="pi pi-user-plus text-2xl" />
      <p>Nenhum personagem cadastrado ainda.</p>
      <Button label="Criar o primeiro" text @click="novoPersonagem" />
    </div>

    <div class="flex flex-col gap-3">
      <div v-for="p in personagens" :key="p.id"
        class="group relative cursor-pointer overflow-hidden rounded-xl bg-surface-800 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_4px_12px_rgba(0,0,0,0.3)] transition-colors duration-200 hover:bg-surface-700"
        @click="abrirFicha(p.id)">
        <!-- accent lateral -->
        <div
          class="absolute inset-y-0 left-0 w-0.5 bg-primary-500 opacity-30 transition-all duration-200 group-hover:w-1 group-hover:opacity-100" />

        <div class="flex items-start gap-3">
          <Avatar :label="p.nome?.charAt(0).toUpperCase()" shape="circle" size="xlarge" />

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h2 class="truncate font-medium text-surface-0" style="font-family: var(--font-display)">{{ p.nome }}</h2>
                <p v-if="p.subtitulo" class="truncate text-sm text-surface-400">{{ p.subtitulo }}</p>
              </div>
              <Tag v-if="p.arquetipo" :value="p.arquetipo" severity="info" class="shrink-0" />
            </div>

            <div class="mt-3 flex flex-col gap-1.5">
              <BarraStat label="PV" :atual="p.pv_atual" :max="pvMax(p)" cor="bg-rose-400/60" />
              <BarraStat label="PM" :atual="p.pm_atual" :max="pmMax(p)" cor="bg-sky-400/60" />
            </div>
          </div>
        </div>

        <Button icon="pi pi-trash" severity="danger" text size="small"
          class="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
          @click="confirmarExclusao(p, $event)" />
      </div>
    </div>
  </div>
</template>