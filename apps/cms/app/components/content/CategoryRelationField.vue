<script setup lang="ts">
import type { ContentStatus } from '~/types/cms'
import { contentStatusLabel } from '~/utils/content-status'

const model = defineModel<number | undefined>()

interface CategoryOption {
  id: number
  name: string
  status: ContentStatus
}

const props = defineProps<{
  categories: CategoryOption[]
}>()

const search = ref('')
const listOpen = ref(false)

const selected = computed(() =>
  props.categories.find(category => category.id === model.value),
)

const showCategoryList = computed(() =>
  !selected.value && (listOpen.value || search.value.trim().length > 0),
)

const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) {
    return props.categories
  }
  return props.categories.filter(category =>
    category.name.toLowerCase().includes(q),
  )
})

const statusColor = {
  draft: 'neutral',
  published: 'success',
  scheduled: 'warning',
} as const

function clearCategory() {
  model.value = undefined
  listOpen.value = false
  search.value = ''
}

function pickCategory(id: number) {
  model.value = id
  search.value = ''
  listOpen.value = false
}

function openCategoryPicker() {
  listOpen.value = true
}
</script>

<template>
  <div class="space-y-2">
    <ContentFieldLabel label="category" :count="model ? 1 : 0" />

    <div
      v-if="selected"
      class="flex items-center gap-2 rounded-lg bg-elevated/50 px-3 py-2 ring-1 ring-default"
    >
      <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ selected.name }}</span>
      <UBadge
        :color="statusColor[selected.status]"
        variant="subtle"
        size="xs"
        class="shrink-0"
      >
        {{ contentStatusLabel(selected.status) }}
      </UBadge>
      <UButton
        icon="i-lucide-x"
        size="xs"
        color="neutral"
        variant="ghost"
        aria-label="Retirer la catégorie"
        @click="clearCategory"
      />
    </div>

    <div
      v-else-if="!showCategoryList"
      class="flex flex-wrap items-center gap-2"
    >
      <UButton
        type="button"
        size="sm"
        variant="soft"
        icon="i-lucide-folder-search"
        label="Choisir une catégorie"
        @click="openCategoryPicker"
      />
      <NuxtLink
        to="/categories/new"
        class="text-xs text-muted hover:text-primary hover:underline"
      >
        Créer une catégorie
      </NuxtLink>
    </div>

    <template v-else>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Filtrer les catégories…"
        autofocus
      />

      <ul
        v-if="filteredOptions.length"
        class="max-h-36 space-y-1 overflow-y-auto rounded-lg p-1 ring-1 ring-default"
      >
        <li v-for="category in filteredOptions" :key="category.id">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated"
            @click="pickCategory(category.id)"
          >
            <span class="min-w-0 flex-1 truncate">{{ category.name }}</span>
            <UBadge :color="statusColor[category.status]" variant="subtle" size="xs">
              {{ contentStatusLabel(category.status) }}
            </UBadge>
          </button>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Aucune catégorie trouvée.
        <NuxtLink to="/categories/new" class="text-primary hover:underline">
          Créer une catégorie
        </NuxtLink>
      </p>

      <UButton
        type="button"
        size="xs"
        color="neutral"
        variant="ghost"
        label="Fermer"
        @click="listOpen = false; search = ''"
      />
    </template>
  </div>
</template>
