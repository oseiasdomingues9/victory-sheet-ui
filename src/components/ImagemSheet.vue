<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { api } from '@/composables/useApi'
import type { ImagemPersonagem, TipoImagem } from '@/types'

defineProps<{ editando: boolean }>()
const emit = defineEmits<{ salvar: []; excluir: []; fechar: [] }>()

const imagem = defineModel<ImagemPersonagem>({ required: true })

const toast = useToast()

const tiposDisponiveis: { label: string; value: TipoImagem }[] = [
  { label: 'Avatar', value: 'avatar' },
  { label: 'Galeria', value: 'galeria' },
  { label: 'Ficha', value: 'ficha' },
  { label: 'Capa', value: 'capa' },
]

const enviando = ref(false)
const previewLocal = ref<string | null>(null)
const inputArquivo = ref<HTMLInputElement>()

function abrirSeletorArquivo() {
  inputArquivo.value?.click()
}

async function onArquivoSelecionado(event: Event) {
  const arquivo = (event.target as HTMLInputElement).files?.[0]
  if (!arquivo) return

  if (arquivo.size > 10 * 1024 * 1024) {
    toast.add({ severity: 'error', summary: 'Arquivo muito grande', detail: 'Máximo de 10MB.', life: 3000 })
    return
  }

  if (previewLocal.value) URL.revokeObjectURL(previewLocal.value)
  previewLocal.value = URL.createObjectURL(arquivo)

  enviando.value = true
  try {
    const { key, bucket } = await api.uploadImagem(arquivo)
    imagem.value.r2_key = key
    imagem.value.r2_bucket = bucket
    imagem.value.url = key // campo obrigatório no banco, ignorado quando r2_key existe
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao enviar imagem', life: 3000 })
    if (previewLocal.value) URL.revokeObjectURL(previewLocal.value)
    previewLocal.value = null
  } finally {
    enviando.value = false
  }
}

function onUrlEditadaManualmente() {
  if (imagem.value.r2_key) {
    imagem.value.r2_key = undefined
    imagem.value.r2_bucket = undefined
    if (previewLocal.value) {
      URL.revokeObjectURL(previewLocal.value)
      previewLocal.value = null
    }
  }
}

onBeforeUnmount(() => {
  if (previewLocal.value) URL.revokeObjectURL(previewLocal.value)
})
</script>

<template>
  <div class="fixed inset-0 z-30 flex flex-col bg-surface-900">
    <div class="flex items-center gap-3 border-b border-white/6 px-4 py-3">
      <button type="button" class="text-surface-400 transition-colors hover:text-surface-0" @click="emit('fechar')">
        <i class="pi pi-arrow-left" />
      </button>
      <h2 class="flex-1 truncate font-medium text-surface-0" style="font-family: var(--font-display)">
        {{ editando ? 'Editar imagem' : 'Nova imagem' }}
      </h2>
      <Button label="Salvar" size="small" :disabled="!imagem.url" @click="emit('salvar')" />
    </div>

    <div class="flex-1 overflow-y-auto p-4 pb-24">
      <div class="flex flex-col gap-3">
        <div>
          <div class="flex items-center gap-2">
            <input ref="inputArquivo" type="file" accept="image/*" class="hidden" @change="onArquivoSelecionado" />
            <Button label="Enviar arquivo" icon="pi pi-upload" outlined :loading="enviando" class="min-h-9.5!"
              @click="abrirSeletorArquivo" />
            <span v-if="imagem.r2_key" class="text-xs text-primary-400">
              <i class="pi pi-check" /> Enviado
            </span>
          </div>

          <label class="mb-1 mt-2 block text-sm text-surface-400">ou link direto</label>
          <InputText v-model="imagem.url" class="w-full" placeholder="https://..." @input="onUrlEditadaManualmente" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-sm text-surface-400">Título</label>
            <InputText v-model="imagem.titulo" class="w-full" placeholder="Ex: Mochi" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Subtítulo</label>
            <InputText v-model="imagem.subtitulo" class="w-full" placeholder="Ex: Retrato principal" />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm text-surface-400">Tipo</label>
          <Select v-model="imagem.tipo" :options="tiposDisponiveis" optionLabel="label" optionValue="value"
            class="w-full" />
        </div>

        <div v-if="previewLocal || imagem.url" class="h-32 w-32 overflow-hidden rounded-lg bg-surface-800">
          <img :src="previewLocal ?? imagem.url" class="h-full w-full object-cover"
            @error="($event.target as HTMLImageElement).style.opacity = '0.2'" />
        </div>
      </div>

      <Button v-if="editando" label="Excluir imagem" icon="pi pi-trash" severity="danger" text
        class="mt-4! min-h-9.5! w-full" @click="emit('excluir')" />
    </div>
  </div>
</template>
