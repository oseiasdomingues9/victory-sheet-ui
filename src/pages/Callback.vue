<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userManager } from '@/composables/userAuth'

const router = useRouter()

onMounted(async () => {
  await userManager.signinRedirectCallback()
  router.push('/')
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <ProgressSpinner />
  </div>
</template>
