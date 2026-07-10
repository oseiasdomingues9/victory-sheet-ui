<script setup lang="ts">
defineProps<{
  modelValue: string
  abas: { key: string; label: string; icon: string }[]
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-white/6 bg-surface-900/95 backdrop-blur">
    <div class="mx-auto flex max-w-120" :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }">
      <button v-for="aba in abas" :key="aba.key" type="button"
        class="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors"
        :class="modelValue === aba.key ? 'text-primary-400' : 'text-surface-500'"
        @click="$emit('update:modelValue', aba.key)">
        <i :class="aba.icon" class="text-lg" />
        {{ aba.label }}
      </button>
    </div>
  </nav>
</template>
