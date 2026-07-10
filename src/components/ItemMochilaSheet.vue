<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import type { ItemMochila } from '@/types'

defineProps<{ editando: boolean }>()
const emit = defineEmits<{ salvar: []; excluir: []; fechar: [] }>()

const item = defineModel<ItemMochila>({ required: true })
</script>

<template>
  <div class="fixed inset-0 z-30 flex flex-col bg-surface-900">
    <div class="flex items-center gap-3 border-b border-white/6 px-4 py-3">
      <button type="button" class="text-surface-400 transition-colors hover:text-surface-0" @click="emit('fechar')">
        <i class="pi pi-arrow-left" />
      </button>
      <h2 class="flex-1 truncate font-medium text-surface-0" style="font-family: var(--font-display)">
        {{ editando ? 'Editar item' : 'Novo item' }}
      </h2>
      <Button label="Salvar" size="small" :disabled="!item.nome" @click="emit('salvar')" />
    </div>

    <div class="flex-1 overflow-y-auto p-4 pb-24">
      <div class="flex flex-col gap-3">
        <div>
          <label class="mb-1 block text-sm text-surface-400">Nome</label>
          <InputText v-model="item.nome" class="w-full" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-surface-400">Quantidade</label>
          <InputNumber v-model="item.quantidade" class="w-full" :min="1" showButtons />
        </div>
        <div>
          <label class="mb-1 block text-sm text-surface-400">Descrição</label>
          <Textarea v-model="item.descricao" class="w-full" rows="3" autoResize />
        </div>
      </div>

      <Button v-if="editando" label="Excluir item" icon="pi pi-trash" severity="danger" text
        class="mt-4! min-h-9.5! w-full" @click="emit('excluir')" />
    </div>
  </div>
</template>
