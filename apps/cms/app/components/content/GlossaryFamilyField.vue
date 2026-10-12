<script setup lang="ts">
interface FamilyOption {
  id: number
  name: string
  slug: string
  status?: string
}

const parentId = defineModel<number | null>({ required: true })

const props = defineProps<{
  excludeTermId?: number
}>()

const { $api } = useNuxtApp()
const items = ref<FamilyOption[]>([])
const loading = ref(false)
const selected = ref<FamilyOption | undefined>()

const menuItems = computed(() => {
  if (selected.value && !items.value.some(item => item.id === selected.value!.id)) {
    return [selected.value, ...items.value]
  }
  return items.value
})

watch(parentId, async (id) => {
  if (id == null) {
    selected.value = undefined
    return
  }
  if (selected.value?.id === id) return
  const existing = items.value.find(item => item.id === id)
  if (existing) {
    selected.value = existing
    return
  }
  try {
    const term = await $api<FamilyOption>(`/api/glossary/${id}`)
    selected.value = { id: term.id, name: term.name, slug: term.slug, status: term.status }
  }
  catch {
    selected.value = undefined
  }
}, { immediate: true })

async function fetchRoots(query: string) {
  loading.value = true
  try {
    const result = await $api<{ data: FamilyOption[] }>('/api/glossary', {
      query: {
        kind: 'ingredient',
        search: query.trim() || undefined,
        rootsOnly: true,
        pageSize: 24,
      },
    })
    items.value = (result.data ?? []).filter(item => item.id !== props.excludeTermId)
  }
  catch {
    items.value = []
  }
  finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounceFn(fetchRoots, 220)

function onUpdate(value: FamilyOption | undefined | null) {
  selected.value = value ?? undefined
  parentId.value = value?.id ?? null
}

function onOpen(isOpen: boolean) {
  if (isOpen) {
    fetchRoots('')
  }
}
</script>

<template>
  <UInputMenu
    :model-value="selected"
    :items="menuItems"
    label-key="name"
    by="id"
    placeholder="Amande, sésame…"
    :loading="loading"
    :ignore-filter="true"
    open-on-focus
    open-on-click
    clear
    :ui="{ content: 'min-w-[min(20rem,calc(100vw-2rem))] w-max', itemLabel: 'whitespace-normal text-pretty' }"
    @update:model-value="onUpdate"
    @update:search-term="debouncedFetch"
    @update:open="onOpen"
  >
    <template #item-label="{ item }">
      <span class="text-pretty">{{ item.name }}</span>
    </template>
    <template #empty>
      <p class="px-2 py-2 text-left text-xs text-muted">
        Cherchez la fiche racine (Amande), pas une forme (lait d’amande).
      </p>
    </template>
  </UInputMenu>
</template>
