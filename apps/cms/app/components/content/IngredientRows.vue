<script setup lang="ts">
export interface IngredientRow {
  name: string
  qty?: number
  unit: string
}

defineProps<{
  unitOptions: Array<{ label: string, value: string }>
}>()

const rows = defineModel<IngredientRow[]>({ required: true })

function addRow() {
  rows.value.push({ name: '', unit: 'none' })
}

function removeRow(index: number) {
  rows.value.splice(index, 1)
}

defineExpose({ addRow })
</script>

<template>
  <div
    v-if="!rows.length"
    class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-default px-4 py-10 text-center text-sm text-muted"
  >
    <UIcon
      name="i-lucide-shopping-basket"
      class="size-8 text-dimmed"
    />
    <p>Aucun ingrédient pour l’instant.</p>
    <UButton
      type="button"
      size="sm"
      variant="soft"
      icon="i-lucide-plus"
      label="Ajouter un ingrédient"
      @click="addRow"
    />
  </div>

  <div
    v-else
    class="overflow-hidden rounded-lg ring-1 ring-default"
  >
    <div
      class="grid grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_2.5rem] gap-x-2 border-b border-default bg-elevated/50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted max-sm:hidden"
      aria-hidden="true"
    >
      <span>Ingrédient</span>
      <span>Qté</span>
      <span>Unité</span>
      <span />
    </div>

    <ul
      class="max-h-[min(28rem,55vh)] divide-y divide-default overflow-y-auto"
      role="list"
    >
      <li
        v-for="(row, index) in rows"
        :key="index"
        class="grid gap-2 px-3 py-2.5 transition-colors hover:bg-elevated/25 max-sm:grid-cols-1 sm:grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_2.5rem] sm:items-center sm:gap-x-2"
      >
        <UFormField
          label="Ingrédient"
          :name="`ingredient-name-${index}`"
          class="min-w-0 sm:[&_label]:sr-only"
        >
          <UInput
            v-model="row.name"
            placeholder="Ex. Beurre doux"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Quantité"
          :name="`ingredient-qty-${index}`"
          class="sm:[&_label]:sr-only"
        >
          <UInput
            v-model.number="row.qty"
            type="number"
            min="0"
            step="any"
            placeholder="—"
            inputmode="decimal"
          />
        </UFormField>

        <UFormField
          label="Unité"
          :name="`ingredient-unit-${index}`"
          class="sm:[&_label]:sr-only"
        >
          <USelect
            v-model="row.unit"
            :items="unitOptions"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end sm:justify-center">
          <UButton
            type="button"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            aria-label="Supprimer l’ingrédient"
            @click="removeRow(index)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
