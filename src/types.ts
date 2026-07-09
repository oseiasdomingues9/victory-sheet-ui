export interface Personagem {
  id: number
  slug: string
  nome: string
  subtitulo: string
  arquetipo: string
  poder: number
  habilidade: number
  resistencia: number
  pv_bonus: number
  pm_bonus: number
  pericias: string[]
  racial_nome: string
  racial_desc: string
  notas: string
  criado_em: string
  atualizado_em: string
  pv_atual?: number | null
  pm_atual?: number | null
}

export interface Vantagem {
  id?: number
  personagem_id?: number
  nome: string
  custo: number
  descricao: string
  tags: string[]
  futura: boolean
}

export interface Estado {
  personagem_id: number
  pv_atual: number
  pm_atual: number
  pa_atual: number
  xp_atual: number
  atualizado_em: string
}

export interface Sessao {
  id: number
  personagem_id: number
  data: string
  notas: string
  pv_inicio: number
  pv_fim: number | null
  pm_inicio: number
  pm_fim: number | null
}

export interface ExportacaoPersonagem {
  personagem: Personagem
  vantagens: Vantagem[]
  estado: Estado | null
}
