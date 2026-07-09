import { ref, readonly } from 'vue'

const loading = ref(false)
const contador = ref(0) // suporta chamadas concorrentes/aninhadas

export function useLoading() {
  function start() {
    contador.value++
    loading.value = true
  }

  function stop() {
    contador.value = Math.max(0, contador.value - 1)
    loading.value = contador.value > 0
  }

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    start()
    try {
      return await fn()
    } finally {
      stop()
    }
  }

  return { loading: readonly(loading), start, stop, withLoading }
}