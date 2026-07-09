export function pvMax(p: { resistencia: number; pv_bonus: number }): number {
  return 10 + p.resistencia * 5 + p.pv_bonus
}

export function pmMax(p: { habilidade: number; pm_bonus: number }): number {
  return 10 + p.habilidade * 5 + p.pm_bonus
}

export function paMax(p: { poder: number }): number {
  return p.poder
}

export function calcularCustoTotal(
  p: { poder: number; habilidade: number; resistencia: number; pericias: string[] },
  v: { custo: number; futura: boolean; tags: string[] }[],
): number {
  const custoVantagens = v
    .filter((item) => !item.futura)
    .reduce((soma, item) => soma + item.custo, 0)

  return custoVantagens + p.poder + p.habilidade + p.resistencia + p.pericias.length
}
