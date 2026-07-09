<script setup lang="ts">
import { computed } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import type { Vantagem } from '@/types'

const props = defineProps<{
  vantagem: Vantagem
  index: number
  isDesv?: boolean
}>()

defineEmits<{
  remover: [index: number]
}>()

const tagsTexto = computed({
  get: () => props.vantagem.tags.join(', '),
  set: (valor: string) => {
    props.vantagem.tags = valor
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  },
})
</script>

<template>
  <div class="rounded-lg border p-3" :class="isDesv ? 'border-rose-400/20 bg-surface-800' : 'border-white/6 bg-surface-800'">
    <div class="flex items-center justify-between gap-2">
      <label class="text-xs text-surface-500">Nome</label>
      <Button
        icon="pi pi-trash"
        severity="danger"
        text
        class="min-h-9.5!"
        @click="$emit('remover', index)"
      />
    </div>
    <InputText v-model="vantagem.nome" class="w-full" placeholder="Nome" />

    <label class="mt-3 block text-xs text-surface-500">Custo</label>
    <InputNumber
      v-model="vantagem.custo"
      class="w-full"
      :class="isDesv ? '[&_input]:text-rose-400!' : '[&_input]:text-primary-400!'"
      showButtons
    />

    <label class="mt-3 block text-xs text-surface-500">Descrição</label>
    <Textarea v-model="vantagem.descricao" class="w-full" rows="2" autoResize />

    <label class="mt-3 block text-xs text-surface-500">Tags (separadas por vírgula)</label>
    <InputText v-model="tagsTexto" class="w-full" placeholder="regen, ataque, bloqueio" />

    <div class="mt-3 flex items-center gap-2">
      <Checkbox v-model="vantagem.futura" :binary="true" inputId="futura" />
      <label for="futura" class="text-sm text-surface-400">Planejada (futura)</label>
    </div>
  </div>
</template>