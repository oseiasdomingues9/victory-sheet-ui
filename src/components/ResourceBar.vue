<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from 'primevue/progressbar'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const props = defineProps<{
  label: string
  atual: number
  max: number
  type: 'pv' | 'pm' | 'pa'
  showRegen?: boolean
}>()

const emit = defineEmits<{
  'update:atual': [value: number]
}>()

const percentual = computed(() => (props.max > 0 ? Math.round((props.atual / props.max) * 100) : 0))

const cores = {
  pv: { bar: 'bg-rose-400/70!', botao: 'border-rose-400/40! text-rose-400!' },
  pm: { bar: 'bg-sky-400/70!', botao: 'border-sky-400/40! text-sky-400!' },
  pa: { bar: 'bg-amber-400/70!', botao: 'border-amber-400/40! text-amber-400!' },
}

const corAtual = computed(() => cores[props.type])

const barClass = computed(() => ({
  root: 'h-1.5! rounded-full! bg-surface-700!',
  value: `${corAtual.value.bar} rounded-full!`,
}))

function ajustar(delta: number) {
  aplicar(props.atual + delta)
}

function aplicar(valor: number) {
  const clamped = Math.min(props.max, Math.max(0, valor))
  emit('update:atual', clamped)
}

function resetar() {
  emit('update:atual', props.max)
}
</script>

<template>
  <div class="rounded-lg border border-white/6 bg-surface-800 p-4">
    <div class="mb-2 flex items-center justify-between">
      <span class="flex items-center gap-2 text-sm text-surface-400">
        {{ label }}
        <span v-if="showRegen" class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-green" />
      </span>
      <span class="font-semibold text-surface-0">{{ atual }} / {{ max }}</span>
    </div>

    <ProgressBar :value="percentual" :showValue="false" :pt="barClass" />

    <div class="mt-3 flex flex-col items-center gap-2 text-sm text-surface-400">
      <div class="flex items-center justify-center gap-2">
        <Button label="-1" outlined size="small" class="min-h-9.5!" :class="corAtual.botao" @click="ajustar(-1)" />

        <InputNumber :modelValue="atual" :min="0" :max="max" class="w-16"
          inputClass="bg-surface-900 border-white/6 text-surface-0 text-center" @update:modelValue="(v) => aplicar(v ?? 0)" />

        <Button label="+1" outlined size="small" class="min-h-9.5!" :class="corAtual.botao" @click="ajustar(+1)" />
      </div>

      <Button label="Resetar" icon="pi pi-refresh" text size="small" class="min-h-9.5! text-surface-500"
        @click="resetar()" />
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputnumber .p-inputnumber-input) {
  width: 4rem;
}
</style>