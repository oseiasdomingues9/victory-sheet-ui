<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppHeader from '@/components/AppHeader.vue'
import { loadCurrentUser } from '@/composables/userAuth'

import { useLoading } from '@/composables/useLoading'

const { loading } = useLoading()

const route = useRoute()

onMounted(loadCurrentUser)
</script>

<template>
  <div class="min-h-screen bg-dark-bg font-sans text-text-hi">
    <Toast />
    <ConfirmDialog />
    <AppHeader v-if="route.name !== 'callback'" />
    <RouterView />

    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm">
      <ProgressSpinner style="width: 48px; height: 48px" strokeWidth="4" />
    </div>
  </div>
</template>
