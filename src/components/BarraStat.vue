<script setup>
import { computed } from 'vue'

const props = defineProps({ label: String, atual: Number, max: Number, cor: String })
const pct = computed(() => (props.max ? Math.min(100, ((props.atual ?? 0) / props.max) * 100) : 0))
</script>

<template>
    <div class="flex items-center gap-2 text-xs text-text-mid">
        <span class="w-6 shrink-0 font-semibold">{{ label }}</span>
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-black/30">
            <div class="h-full rounded-full transition-all" :class="cor" :style="{ width: pct + '%' }" />
        </div>
        <span class="w-12 shrink-0 text-right tabular-nums">{{ atual ?? '—' }}/{{ max }}</span>
    </div>
</template>
