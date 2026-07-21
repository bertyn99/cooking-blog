<script setup lang="ts">
import type { ContentStatus } from '~/types/cms'

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

const selected = computed(() =>
  props.categories.find(category => category.id === model.value),
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
}

function pickCategory(id: number) {
  model.value = id
  search.value = ''
}
</script>

<template>
  <div class="rounded-lg border border-default bg-elevated/20 p-3">
    <ContentFieldLabel label="category" :count="model ? 1 : 0" />

    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Ajouter ou rechercher une catégorie"
      class="mb-2"
      :disabled="!!selected"
    />

    <div
      v-if="selected"
      class="flex items-center gap-2 rounded-md border border-default bg-default px-3 py-2"
    >
      <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ selected.name }}</span>
      <UBadge
        :color="statusColor[selected.status]"
        variant="subtle"
        size="xs"
        class="capitalize shrink-0"
      >
        {{ selected.status === 'published' ? 'Published' : selected.status }}
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

    <ul
      v-else-if="filteredOptions.length"
      class="max-h-40 space-y-1 overflow-y-auto rounded-md border border-default bg-default p-1"
    >
      <li v-for="category in filteredOptions" :key="category.id">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated"
          @click="pickCategory(category.id)"
        >
          <span class="min-w-0 flex-1 truncate">{{ category.name }}</span>
          <UBadge :color="statusColor[category.status]" variant="subtle" size="xs" class="capitalize">
            {{ category.status }}
          </UBadge>
        </button>
      </li>
    </ul>

    <p v-else class="text-sm text-muted">
      Aucune catégorie trouvée.
      <NuxtLink to="/categories/new" class="text-primary hover:underline">
        Créer une catégorie
      </NuxtLink>
    </p>
  </div>
</template>
