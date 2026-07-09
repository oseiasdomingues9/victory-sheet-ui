import { createRouter, createWebHistory } from 'vue-router'
import { userManager } from '@/composables/userAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lista',
      component: () => import('@/pages/Lista.vue'),
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import('@/pages/Callback.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/ficha/:id',
      name: 'ficha',
      component: () => import('@/pages/Ficha.vue'),
      props: true,
    },
    {
      path: '/editor',
      name: 'editor-novo',
      component: () => import('@/pages/Editor.vue'),
    },
    {
      path: '/editor/:id',
      name: 'editor-editar',
      component: () => import('@/pages/Editor.vue'),
      props: true,
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth === false) return true

  const user = await userManager.getUser()
  if (!user || user.expired) {
    await userManager.signinRedirect()
    return false
  }
})

export default router
