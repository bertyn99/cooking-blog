<script setup lang="ts">
export interface UtensilRow {
  name: string
  note?: string
  affiliateUrl?: string
}

const rows = defineModel<UtensilRow[]>({ required: true })

function addRow() {
  rows.value.push({ name: '' })
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
      name="i-lucide-cooking-pot"
      class="size-8 text-dimmed"
    />
    <p>Aucun ustensile listé.</p>
    <UButton
      type="button"
      size="sm"
      variant="soft"
      icon="i-lucide-plus"
      label="Ajouter un ustensile"
      @click="addRow"
    />
  </div>

  <div
    v-else
    class="overflow-hidden rounded-lg ring-1 ring-default"
  >
    <div
      class="hidden gap-x-2 border-b border-default bg-elevated/50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]"
      aria-hidden="true"
    >
      <span>Ustensile</span>
      <span>Précision</span>
      <span>Lien affilié</span>
      <span />
    </div>

    <ul
      class="max-h-[min(20rem,45vh)] divide-y divide-default overflow-y-auto"
      role="list"
    >
      <li
        v-for="(row, index) in rows"
        :key="index"
        class="grid gap-2 px-3 py-2.5 transition-colors hover:bg-elevated/25 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] lg:items-center lg:gap-x-2"
      >
        <UFormField
          label="Ustensile"
          :name="`utensil-name-${index}`"
          class="min-w-0 lg:[&_label]:sr-only"
        >
          <UInput
            v-model="row.name"
            placeholder="Ex. Poêle en fonte"
          />
        </UFormField>

        <UFormField
          label="Précision"
          :name="`utensil-note-${index}`"
          class="lg:[&_label]:sr-only"
        >
          <UInput
            v-model="row.note"
            placeholder="Taille, optionnel"
          />
        </UFormField>

        <UFormField
          label="Lien affilié"
          :name="`utensil-url-${index}`"
          class="lg:[&_label]:sr-only"
        >
          <UInput
            v-model="row.affiliateUrl"
            type="url"
            placeholder="https://…"
          />
        </UFormField>

        <div class="flex justify-end lg:justify-center">
          <UButton
            type="button"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            aria-label="Supprimer l’ustensile"
            @click="removeRow(index)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
