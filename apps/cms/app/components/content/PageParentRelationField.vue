<script setup lang="ts">
import type { ContentStatus } from '~/types/cms'
import { orderPagesAsTree, pageHierarchyLabel, type PageHierarchyNode, type PageTreeRow } from '#shared/page-hierarchy'
import { contentStatusLabel } from '~/utils/content-status'

const model = defineModel<number | null | undefined>()

interface PageOption {
  id: number
  name: string
  title: string | null
  slug: string
  status: ContentStatus
  parentId: number | null
  parent?: PageHierarchyNode | null
}

const props = defineProps<{
  pages: PageOption[]
  /** Page being edited — excluded from picker (and its descendants). */
  excludePageId?: number
}>()

const search = ref('')
const listOpen = ref(false)

const treeRows = computed(() => orderPagesAsTree(props.pages))

const excludedIds = computed(() => {
  if (props.excludePageId == null) {
    return new Set<number>()
  }
  const childrenByParent = new Map<number, number[]>()
  for (const page of props.pages) {
    if (page.parentId != null) {
      const bucket = childrenByParent.get(page.parentId) ?? []
      bucket.push(page.id)
      childrenByParent.set(page.parentId, bucket)
    }
  }
  const blocked = new Set<number>([props.excludePageId])
  const stack = [props.excludePageId]
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const childId of childrenByParent.get(current) ?? []) {
      if (!blocked.has(childId)) {
        blocked.add(childId)
        stack.push(childId)
      }
    }
  }
  return blocked
})

const selectableRows = computed(() =>
  treeRows.value.filter(row => !excludedIds.value.has(row.id)),
)

const selected = computed(() =>
  props.pages.find(page => page.id === model.value),
)

const selectedRow = computed((): PageTreeRow<PageOption> | undefined => {
  if (!selected.value) {
    return undefined
  }
  return treeRows.value.find(row => row.id === selected.value!.id)
})

const showList = computed(() =>
  model.value == null && (listOpen.value || search.value.trim().length > 0),
)

const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) {
    return selectableRows.value
  }
  return selectableRows.value.filter((row) => {
    const label = pageHierarchyLabel(row).toLowerCase()
    return (
      label.includes(q)
      || row.slug.toLowerCase().includes(q)
      || row.publicPath.toLowerCase().includes(q)
      || row.filiation.toLowerCase().includes(q)
    )
  })
})

const statusColor = {
  draft: 'neutral',
  published: 'success',
  scheduled: 'warning',
} as const

function clearParent() {
  model.value = null
  listOpen.value = false
  search.value = ''
}

function pickParent(id: number) {
  model.value = id
  search.value = ''
  listOpen.value = false
}

function openPicker() {
  listOpen.value = true
}
</script>

<template>
  <div class="space-y-2">
    <ContentFieldLabel label="parent" :count="model != null ? 1 : 0" />

    <div
      v-if="selected && selectedRow"
      class="flex items-center gap-2 rounded-lg bg-elevated/50 px-3 py-2 ring-1 ring-default"
    >
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">
          {{ pageHierarchyLabel(selectedRow) }}
        </p>
        <p
          v-if="selectedRow.filiation !== 'Page racine'"
          class="truncate text-[11px] text-muted"
        >
          {{ selectedRow.filiation }}
        </p>
        <code class="block truncate text-[11px] text-dimmed font-mono">{{ selectedRow.publicPath }}</code>
      </div>
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
        aria-label="Retirer la page parente"
        @click="clearParent"
      />
    </div>

    <div
      v-else-if="!showList"
      class="flex flex-wrap items-center gap-2"
    >
      <UButton
        type="button"
        size="sm"
        variant="soft"
        icon="i-lucide-git-branch"
        label="Choisir une page parente"
        @click="openPicker"
      />
      <span class="text-xs text-muted">Laisser vide pour une page racine</span>
    </div>

    <template v-else>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Filtrer par titre, slug ou chemin…"
        autofocus
      />

      <ul
        v-if="filteredOptions.length"
        class="max-h-48 space-y-1 overflow-y-auto rounded-lg p-1 ring-1 ring-default"
      >
        <li
          v-for="row in filteredOptions"
          :key="row.id"
        >
          <button
            type="button"
            class="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated"
            :style="row.depth > 0 ? { paddingLeft: `${0.5 + row.depth * 0.75}rem` } : undefined"
            @click="pickParent(row.id)"
          >
            <UIcon
              v-if="row.depth > 0"
              name="i-lucide-corner-down-right"
              class="mt-0.5 size-3.5 shrink-0 text-muted"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium">{{ pageHierarchyLabel(row) }}</span>
              <span class="block truncate text-[11px] text-muted">{{ row.publicPath }}</span>
            </span>
            <UBadge
              :color="statusColor[row.status]"
              variant="subtle"
              size="xs"
              class="shrink-0"
            >
              {{ contentStatusLabel(row.status) }}
            </UBadge>
          </button>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Aucune page trouvée.
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
