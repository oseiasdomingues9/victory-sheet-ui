<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import type { ImagemPersonagem } from '@/types'

defineProps<{
  imagem: ImagemPersonagem
  index: number
}>()

defineEmits<{
  remover: [index: number]
}>()
</script>

<template>
  <div class="rounded-lg border border-white/6 bg-surface-800 p-3">
    <div class="flex items-center justify-between gap-2">
      <label class="text-xs text-surface-500">Link da imagem</label>
      <Button icon="pi pi-trash" severity="danger" text class="min-h-9.5!" @click="$emit('remover', index)" />
    </div>
    <InputText v-model="imagem.url" class="w-full" placeholder="https://..." />

    <div class="mt-2 grid grid-cols-2 gap-2">
      <div>
        <label class="mb-1 block text-xs text-surface-500">Título</label>
        <InputText v-model="imagem.titulo" class="w-full" placeholder="Ex: Mochi" />
      </div>
      <div>
        <label class="mb-1 block text-xs text-surface-500">Subtítulo</label>
        <InputText v-model="imagem.subtitulo" class="w-full" placeholder="Ex: Retrato principal" />
      </div>
    </div>

    <div v-if="imagem.url" class="mt-2 h-24 w-24 overflow-hidden rounded-lg bg-surface-900">
      <img :src="imagem.url" class="h-full w-full object-cover"
        @error="($event.target as HTMLImageElement).style.opacity = '0.2'" />
    </div>
  </div>
</template>