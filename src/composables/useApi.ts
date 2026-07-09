import axios from 'axios'
import type { Personagem, Vantagem, Estado, Sessao, ExportacaoPersonagem, ImagemPersonagem } from '@/types'
import { userManager } from './userAuth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})


http.interceptors.request.use(async (config) => {
  const user = await userManager.getUser()
  if (user?.access_token) {
    config.headers.Authorization = `Bearer ${user.access_token}`
  }
  return config
})



http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const user = await userManager.signinSilent()
        if (user?.access_token && error.config) {
          error.config.headers.Authorization = `Bearer ${user.access_token}`
          return http.request(error.config) // retry com token novo
        }
      } catch {
        // silent renew falhou, sessão do IdP realmente morreu
        userManager.signinRedirect()
      }
    }
    return Promise.reject(error)
  }
)

export const api = {
  getPersonagens() {
    return http.get<Personagem[]>('/personagens').then((r) => r.data)
  },
  getPersonagem(id: number | string) {
    return http.get<Personagem>(`/personagens/${id}`).then((r) => r.data)
  },
  criarPersonagem(dados: Partial<Personagem>) {
    return http.post<{ id: number }>('/personagens', dados).then((r) => r.data)
  },
  atualizarPersonagem(id: number | string, dados: Partial<Personagem>) {
    return http.put(`/personagens/${id}`, dados).then((r) => r.data)
  },
  deletarPersonagem(id: number | string) {
    return http.delete(`/personagens/${id}`).then((r) => r.data)
  },
  getVantagens(id: number | string) {
    return http.get<Vantagem[]>(`/personagens/${id}/vantagens`).then((r) => r.data)
  },
  salvarVantagens(id: number | string, vantagens: Vantagem[]) {
    return http.post(`/personagens/${id}/vantagens`, vantagens).then((r) => r.data)
  },
  getEstado(id: number | string) {
    return http.get<Estado>(`/personagens/${id}/estado`).then((r) => r.data)
  },
  salvarEstado(id: number | string, pv: number, pm: number, pa: number, xp: number) {
    console.log({ pv, pm, pa, xp })
    return http.put(`/personagens/${id}/estado`, { pv, pm, pa, xp }).then((r) => r.data)
  },
  iniciarSessao(id: number | string) {
    return http.post<{ id: number }>(`/personagens/${id}/sessoes`).then((r) => r.data)
  },
  encerrarSessao(sessaoId: number | string, pv_fim: number, pm_fim: number, notas: string) {
    return http.put(`/sessoes/${sessaoId}/encerrar`, { pv_fim, pm_fim, notas }).then((r) => r.data)
  },
  getSessoes(id: number | string) {
    return http.get<Sessao[]>(`/personagens/${id}/sessoes`).then((r) => r.data)
  },
  exportar(id: number | string) {
    return http.get<ExportacaoPersonagem>(`/export/${id}`).then((r) => r.data)
  },
  importar(dados: ExportacaoPersonagem) {
    return http.post<{ id: number }>('/import', dados).then((r) => r.data)
  },

  getImagens(id: number | string) {
    return http.get<ImagemPersonagem[]>(`/imagens/${id}`).then((r) => r.data)
  },
}
