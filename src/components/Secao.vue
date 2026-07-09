<template>
  <div class="mb-6">
    <h2 class="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-500"
      style="font-family: var(--font-body)">
      {{ titulo }}
    </h2>
    <slot />
  </div>
</template>

<script setup>
defineProps({ titulo: String })
</script>