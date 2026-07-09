<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import type { Vantagem } from '@/types'

const props = defineProps<{
  vantagem: Vantagem
}>()

const isDesvantagem = computed(
  () => props.vantagem.custo < 0 || props.vantagem.tags.includes('desvantagem'),
)

const custoLabel = computed(() => (props.vantagem.custo >= 0 ? `+${props.vantagem.custo}pt` : `${props.vantagem.custo}pt`))
</script>

<template>
  <div
    class="rounded-lg border bg-surface-800 p-3"
    :class="[
      isDesvantagem ? 'border-rose-400/30' : 'border-white/6',
      vantagem.futura ? 'border-dashed opacity-45' : '',
    ]"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="font-medium text-surface-0">{{ vantagem.nome }}</span>
      <span
        class="text-sm font-semibold"
        :class="isDesvantagem ? 'text-rose-400' : 'text-primary-400'"
      >
        {{ custoLabel }}
      </span>
    </div>

    <p v-if="vantagem.descricao" class="mt-1 text-sm text-surface-400">
      {{ vantagem.descricao }}
    </p>

    <div v-if="vantagem.tags.length" class="mt-2 flex flex-wrap gap-1">
      <Tag
        v-for="tag in vantagem.tags"
        :key="tag"
        :value="tag"
        :severity="tag === 'desvantagem' ? 'danger' : 'info'"
      />
    </div>
  </div>
</template>