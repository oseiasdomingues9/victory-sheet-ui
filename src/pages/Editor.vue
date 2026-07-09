<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import VantagemForm from '@/components/VantagemForm.vue'
import Secao from '@/components/Secao.vue'
import { api } from '@/composables/useApi'
import { useLoading } from '@/composables/useLoading'
import { pvMax, pmMax, calcularCustoTotal } from '@/composables/useCalculos'
import type { Personagem, Vantagem } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { withLoading } = useLoading()

const id = computed(() => route.params.id as string | undefined)
const modoEdicao = computed(() => !!id.value)

const nome = ref('')
const subtitulo = ref('')
const arquetipo = ref('')
const poder = ref(1)
const habilidade = ref(1)
const resistencia = ref(1)
const pvBonus = ref(0)
const pmBonus = ref(0)
const periciasTexto = ref('')
const racialNome = ref('')
const racialDesc = ref('')
const notas = ref('')

const vantagens = ref<Vantagem[]>([])
const desvantagens = ref<Vantagem[]>([])

const pvMaximo = computed(() => pvMax({ resistencia: resistencia.value, pv_bonus: pvBonus.value }))
const pmMaximo = computed(() => pmMax({ habilidade: habilidade.value, pm_bonus: pmBonus.value }))
const custoTotal = computed(() =>
  calcularCustoTotal(
    {
      poder: poder.value,
      habilidade: habilidade.value,
      resistencia: resistencia.value,
      pericias: periciasTexto.value.split(',').map((x) => x.trim()).filter(Boolean),
    },
    [...vantagens.value, ...desvantagens.value],
  ),
)


function adicionarVantagem() {
  vantagens.value.push({ nome: '', custo: 1, descricao: '', tags: [], futura: false })
}

function removerVantagem(index: number) {
  vantagens.value.splice(index, 1)
}

function adicionarDesvantagem() {
  desvantagens.value.push({ nome: '', custo: -1, descricao: '', tags: [], futura: false })
}

function removerDesvantagem(index: number) {
  desvantagens.value.splice(index, 1)
}

async function carregar() {
  if (!id.value) return
  try {
    const [p, v] = await withLoading(() =>
      Promise.all([api.getPersonagem(id.value!), api.getVantagens(id.value!)]),
    )
    nome.value = p.nome
    subtitulo.value = p.subtitulo
    arquetipo.value = p.arquetipo
    poder.value = p.poder
    habilidade.value = p.habilidade
    resistencia.value = p.resistencia
    pvBonus.value = p.pv_bonus
    pmBonus.value = p.pm_bonus
    periciasTexto.value = p.pericias.join(', ')
    racialNome.value = p.racial_nome
    racialDesc.value = p.racial_desc
    notas.value = p.notas
    vantagens.value = v.filter((x) => x.custo >= 0 && !x.tags.includes('desvantagem'))
    desvantagens.value = v.filter((x) => x.custo < 0 || x.tags.includes('desvantagem'))
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar personagem', life: 3000 })
    router.push('/')
  }
}

async function salvar() {
  const dados: Partial<Personagem> = {
    nome: nome.value,
    subtitulo: subtitulo.value,
    arquetipo: arquetipo.value,
    poder: poder.value,
    habilidade: habilidade.value,
    resistencia: resistencia.value,
    pv_bonus: pvBonus.value,
    pm_bonus: pmBonus.value,
    pericias: periciasTexto.value.split(',').map((p) => p.trim()).filter(Boolean),
    racial_nome: racialNome.value,
    racial_desc: racialDesc.value,
    notas: notas.value,
  }

  try {
    await withLoading(async () => {
      let personagemId = id.value
      if (modoEdicao.value && personagemId) {
        await api.atualizarPersonagem(personagemId, dados)
      } else {
        const { id: novoId } = await api.criarPersonagem(dados)
        personagemId = String(novoId)
      }

      await api.salvarVantagens(personagemId!, [...vantagens.value, ...desvantagens.value])
      return personagemId
    }).then((personagemId) => {
      toast.add({ severity: 'success', summary: 'Salvo', detail: 'Personagem salvo com sucesso.', life: 2000 })
      router.push(`/ficha/${personagemId}`)
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar personagem', life: 3000 })
  }
}

function cancelar() {
  router.back()
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto max-w-120 p-4">
    <h1 class="mb-4 text-xl font-medium text-surface-0" style="font-family: var(--font-display)">
      {{ modoEdicao ? 'Editar Personagem' : 'Novo Personagem' }}
    </h1>

    <Secao titulo="Identidade">
      <div class="flex flex-col gap-2">
        <InputText v-model="nome" placeholder="Nome" class="w-full" />
        <InputText v-model="subtitulo" placeholder="Subtítulo" class="w-full" />
        <InputText v-model="arquetipo" placeholder="Arquétipo" class="w-full" />
      </div>
    </Secao>

    <Secao titulo="Atributos">
      <div class="grid grid-cols-3 gap-2">
        <div>
          <label class="mb-1 block text-xs text-surface-500">Poder</label>
          <InputNumber v-model="poder" :min="1" :max="10" showButtons class="w-full" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-surface-500">Habilidade</label>
          <InputNumber v-model="habilidade" :min="1" :max="10" showButtons class="w-full" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-surface-500">Resistência</label>
          <InputNumber v-model="resistencia" :min="1" :max="10" showButtons class="w-full" />
        </div>
      </div>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label class="mb-1 block text-xs text-surface-500">Bônus PV</label>
          <InputNumber v-model="pvBonus" showButtons class="w-full" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-surface-500">Bônus PM</label>
          <InputNumber v-model="pmBonus" showButtons class="w-full" />
        </div>
      </div>
      <p class="mt-2 text-sm text-surface-400">
        PV máx: <span class="font-semibold text-primary-400">{{ pvMaximo }}</span>
        &nbsp;|&nbsp;
        PM máx: <span class="font-semibold text-primary-400">{{ pmMaximo }}</span>
      </p>
    </Secao>

    <Secao titulo="Perícias">
      <InputText v-model="periciasTexto" placeholder="Luta, Influência, Mística" class="w-full" />
    </Secao>

    <Secao titulo="Habilidade Racial">
      <div class="flex flex-col gap-2">
        <InputText v-model="racialNome" placeholder="Nome" class="w-full" />
        <Textarea v-model="racialDesc" placeholder="Descrição" rows="2" autoResize class="w-full" />
      </div>
    </Secao>

    <Secao titulo="Notas">
      <Textarea v-model="notas" rows="3" autoResize class="w-full" />
    </Secao>

    <Secao titulo="Vantagens">
      <div class="flex flex-col gap-2">
        <VantagemForm
          v-for="(v, i) in vantagens"
          :key="i"
          :vantagem="v"
          :index="i"
          @remover="removerVantagem"
        />
      </div>
      <Button
        label="+ Adicionar Vantagem"
        text
        class="mt-2! min-h-9.5!"
        @click="adicionarVantagem"
      />
    </Secao>

    <Secao titulo="Desvantagens">
      <div class="flex flex-col gap-2">
        <VantagemForm
          v-for="(v, i) in desvantagens"
          :key="i"
          :vantagem="v"
          :index="i"
          :isDesv="true"
          @remover="removerDesvantagem"
        />
      </div>
      <Button
        label="+ Adicionar Desvantagem"
        text
        class="mt-2! min-h-9.5! text-rose-400!"
        @click="adicionarDesvantagem"
      />
    </Secao>

    <!-- Custo total -->
    <div class="mb-6 flex items-center justify-between rounded-lg bg-surface-800 p-3">
      <span class="text-sm text-surface-400">Custo total</span>
      <span class="font-semibold text-primary-400">{{ custoTotal }}pt</span>
    </div>

    <!-- Ações -->
    <div class="flex gap-2">
      <Button label="Cancelar" outlined class="min-h-9.5! flex-1" @click="cancelar" />
      <Button label="Salvar" class="min-h-9.5! flex-1" @click="salvar" />
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputnumber .p-inputnumber-input) {
  width: 4rem;
}
</style>