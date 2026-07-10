<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import type { Combo } from '@/types'

defineProps<{ editando: boolean }>()
const emit = defineEmits<{ salvar: []; excluir: []; fechar: [] }>()

const combo = defineModel<Combo>({ required: true })
</script>

<template>
  <div class="fixed inset-0 z-30 flex flex-col bg-surface-900">
    <div class="flex items-center gap-3 border-b border-white/6 px-4 py-3">
      <button type="button" class="text-surface-400 transition-colors hover:text-surface-0" @click="emit('fechar')">
        <i class="pi pi-arrow-left" />
      </button>
      <h2 class="flex-1 truncate font-medium text-surface-0" style="font-family: var(--font-display)">
        {{ editando ? 'Editar combo' : 'Novo combo' }}
      </h2>
      <Button label="Salvar" size="small" :disabled="!combo.nome" @click="emit('salvar')" />
    </div>

    <div class="flex-1 overflow-y-auto p-4 pb-24">
      <div class="flex flex-col gap-3">
        <div>
          <label class="mb-1 block text-sm text-surface-400">Nome</label>
          <InputText v-model="combo.nome" class="w-full" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-sm text-surface-400">Dados</label>
            <InputText v-model="combo.dados" class="w-full" placeholder="2d6+3" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Poder base</label>
            <InputText v-model="combo.poder_base" class="w-full" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Custo</label>
            <InputText v-model="combo.custo" class="w-full" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Dano</label>
            <InputText v-model="combo.dano" class="w-full" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Ações/turno</label>
            <InputText v-model="combo.acoes_turno" class="w-full" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-surface-400">Crítico</label>
            <InputText v-model="combo.critico" class="w-full" />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm text-surface-400">Vantagens ativas</label>
          <InputText v-model="combo.vantagens_ativas" class="w-full" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-surface-400">Mecânica extra</label>
          <Textarea v-model="combo.mecanica_extra" class="w-full" rows="2" autoResize />
        </div>
        <div>
          <label class="mb-1 block text-sm text-surface-400">Observação</label>
          <Textarea v-model="combo.observacao" class="w-full" rows="2" autoResize />
        </div>
      </div>

      <Button v-if="editando" label="Excluir combo" icon="pi pi-trash" severity="danger" text
        class="mt-4! min-h-9.5! w-full" @click="emit('excluir')" />
    </div>
  </div>
</template>
