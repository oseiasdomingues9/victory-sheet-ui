<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Menu from 'primevue/menu'
import { currentUser, logout } from '@/composables/userAuth'

const router = useRouter()
const menu = ref()

const nomeUsuario = computed(() => {
  const profile = currentUser.value?.profile
  return profile?.name ?? profile?.email ?? 'Usuário'
})

const iniciais = computed(() => nomeUsuario.value.charAt(0).toUpperCase())

const menuItems = computed(() => [
  { label: nomeUsuario.value, disabled: true, class: 'font-semibold text-surface-0' },
  { separator: true },
  { label: 'Sair', icon: 'pi pi-sign-out', command: () => logout() },
])

function irParaLista() {
  router.push('/')
}
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-white/6 bg-surface-900/95 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-120 items-center justify-between px-4">
      <button type="button"
        class="flex min-w-0 items-center gap-2 text-surface-300 transition-colors hover:text-surface-0"
        @click="irParaLista">
        <i class="pi pi-shield text-primary-500" />
        <span class="truncate font-medium tracking-wide text-surface-0"
          style="font-family: var(--font-display)">3DeT Victory</span>
      </button>

      <button type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-800 text-sm font-medium text-surface-0 ring-1 ring-white/8 transition hover:ring-primary-500"
        :aria-label="`Menu de ${nomeUsuario}`" @click="menu.toggle($event)">
        {{ iniciais }}
      </button>
      <Menu ref="menu" :model="menuItems" popup class="min-w-48" />
    </div>
  </header>
</template>