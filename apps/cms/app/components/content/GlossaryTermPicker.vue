<script setup lang="ts">
import type { GlossaryKind } from '#shared/glossary-normalize'
import {
  groupGlossaryPickerItems,
  type GlossaryPickerTerm,
} from '#shared/glossary-family'

export interface GlossaryTermOption {
  id: number
  name: string
  slug: string
  status: string
  resolvedAffiliateUrl?: string | null
  icon?: string | null
  parentId?: number | null
  parent?: { id: number, name: string, slug?: string } | null
}

const props = defineProps<{
  kind: GlossaryKind
  placeholder?: string
}>()

const glossaryTermId = defineModel<number | undefined>('glossaryTermId')
const name = defineModel<string>('name', { required: true })

const emit = defineEmits<{
  select: [term: GlossaryTermOption]
}>()

const { $api } = useNuxtApp()
const items = ref<GlossaryPickerTerm[]>([])
const loading = ref(false)

const showIcons = computed(() => props.kind === 'ustensile')

const menuItems = computed(() => {
  const grouped = groupGlossaryPickerItems(items.value, { showIcons: showIcons.value })
  const currentId = glossaryTermId.value
  const currentName = name.value.trim()
  if (
    currentId
    && currentName
    && !items.value.some(item => item.id === currentId)
  ) {
    return [
      {
        id: currentId,
        name: currentName,
        label: currentName,
        slug: '',
        status: 'draft',
      },
      ...grouped,
    ]
  }
  return grouped
})

const canCreate = computed(() => {
  const query = name.value.trim()
  if (!query) return false
  const key = query.toLowerCase()
  return !items.value.some(item => item.name.toLowerCase() === key)
})

const pickerUi = {
  content: 'min-w-[min(22rem,calc(100vw-2rem))] w-max max-w-[min(28rem,calc(100vw-2rem))]',
  item: 'items-start',
  itemLabel: 'whitespace-normal text-pretty',
  itemDescription: 'whitespace-normal text-pretty',
  itemLeadingIcon: 'mt-0.5',
}

async function fetchTerms(query: string) {
  loading.value = true
  try {
    const result = await $api<{ data: GlossaryTermOption[] }>('/api/glossary', {
      query: {
        kind: props.kind,
        search: query.trim() || undefined,
        pageSize: 24,
        expandFamily: true,
      },
    })
    items.value = result.data ?? []
  }
  catch {
    items.value = []
  }
  finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounceFn(fetchTerms, 220)

function syncSelection(value: string) {
  name.value = value
  const match = items.value.find(item => item.name === value)
    ?? (glossaryTermId.value && name.value === value
      ? items.value.find(item => item.id === glossaryTermId.value)
      : undefined)
  if (match) {
    glossaryTermId.value = match.id
    emit('select', match as GlossaryTermOption)
    return
  }
  glossaryTermId.value = undefined
}

function onSearch(value: string) {
  syncSelection(value)
  debouncedFetch(value)
}

function onOpen(isOpen: boolean) {
  if (isOpen) {
    fetchTerms(name.value)
  }
}
</script>

<template>
  <UInputMenu
    :model-value="name"
    mode="autocomplete"
    :items="menuItems"
    label-key="label"
    description-key="description"
    :placeholder="placeholder"
    :loading="loading"
    :ignore-filter="true"
    :trailing-icon="false"
    open-on-focus
    open-on-click
    class="w-full"
    :ui="pickerUi"
    @update:model-value="syncSelection"
    @update:search-term="onSearch"
    @update:open="onOpen"
  >
    <template #item-label="{ item }">
      <span class="text-pretty">{{ item.label }}</span>
    </template>
    <template #item-trailing="{ item }">
      <UBadge
        v-if="item.status === 'draft'"
        color="neutral"
        variant="subtle"
        size="xs"
        class="rounded-sm"
      >
        brouillon
      </UBadge>
    </template>
    <template #empty>
      <p
        v-if="name.trim()"
        class="px-2 py-2 text-left text-xs text-muted"
      >
        Nouveau terme « {{ name.trim() }} » (brouillon, noindex).
      </p>
      <p
        v-else
        class="px-2 py-2 text-left text-xs text-muted"
      >
        Tapez un nom pour chercher ou créer.
      </p>
    </template>
    <template #content-bottom>
      <p
        v-if="canCreate && items.length"
        class="border-t border-default px-2.5 py-2 text-xs text-muted"
      >
        Pas dans la liste — « {{ name.trim() }} » sera créé en brouillon.
      </p>
    </template>
  </UInputMenu>