<template>
  <div
    class="rounded-lg bg-surface-800 p-3 text-center transition-colors"
    :class="bloqueio && 'ring-1 ring-rose-400/40'"
  >
    <p class="text-xs text-surface-500" style="font-family: var(--font-body)">{{ label }}</p>
    <p class="text-lg font-semibold text-primary-400" style="font-family: var(--font-display)">{{ valor }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  valor: [String, Number],
  bloqueio: Boolean,
})
</script>