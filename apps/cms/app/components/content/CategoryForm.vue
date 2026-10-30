<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { AdminPublishContentType } from '~/composables/useContentPublishing'
import type { ContentStatus } from '~/types/cms'

const props = defineProps<{
  categoryId?: number
  categoryType?: 'blog' | 'recette'
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const schema = z.object({
  type: z.enum(['blog', 'recette']),
  name: z.string().min(1, 'Nom requis'),
  desc: z.string().optional(),
})

type Schema = z.output<typeof schema>

const { $api } = useNuxtApp()
const toast = useToast()
const saving = ref(false)

const state = reactive<Schema>({
  type: props.categoryType ?? 'blog',
  name: '',
  desc: '',
})

const categoryId = ref<number | null>(props.categoryId ?? null)
const contentStatus = ref<ContentStatus>('draft')

const typeOptions = [
  { label: 'Blog (articles)', value: 'blog' },
  { label: 'Recette', value: 'recette' },
] as const

const isRecipeType = computed(() => state.type === 'recette')

const adminContentType = computed((): AdminPublishContentType =>
  state.type === 'blog' ? 'category-articles' : 'categories',
)

const writeEndpoint = computed(() =>
  state.type === 'blog' ? '/api/category-articles' : '/api/categories',
)

function buildBody(status: ContentStatus) {
  return {
    name: state.name.trim(),
    status,
    locale: 'fr',
    ...(isRecipeType.value && state.desc?.trim()
      ? { desc: state.desc.trim() }
      : {}),
  }
}

async function saveCategory(): Promise<number | undefined> {
  const body = buildBody(contentStatus.value === 'published' ? 'published' : 'draft')

  if (categoryId.value) {
    await $api(`${writeEndpoint.value}/${categoryId.value}`, {
      method: 'PUT',
      body: {
        name: body.name,
        ...(isRecipeType.value ? { desc: state.desc?.trim() || null } : {}),
      },
    })
    return categoryId.value
  }

  const created = await $api<{ data: { id: number, slug: string } }>(writeEndpoint.value, {
    method: 'POST',
    body: { ...body, status: 'draft' },
  })

  categoryId.value = created.data.id
  contentStatus.value = 'draft'
  await refreshNuxtData(['categories-recipes-list', 'categories-articles-list'])
  return created.data.id
}

async function loadCategory() {
  if (!categoryId.value) return
  try {
    const res = await $api<{ data: { name: string, desc?: string | null, status: ContentStatus } }>(
      `${writeEndpoint.value}/${categoryId.value}`,
    )
    state.name = res.data.name
    state.desc = res.data.desc ?? ''
    contentStatus.value = res.data.status
  }
  catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de charger la catégorie',
      color: 'error',
    })
  }
}

if (categoryId.value) {
  void loadCategory()
}

function onStatusChange(status: ContentStatus) {
  contentStatus.value = status
  emit('saved')
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const id = await saveCategory()
    if (!id) return

    toast.add({
      title: 'Catégorie enregistrée',
      description: categoryId.value ? undefined : 'Brouillon créé — vous pouvez publier ou planifier.',
      color: 'success',
    })
    emit('saved')
  }
  catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible d\'enregistrer la catégorie',
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="mx-auto max-w-lg space-y-4" @submit="onSubmit">
    <UFormField label="Type" name="type" required>
      <USelect
        v-model="state.type"
        :items="[...typeOptions]"
        class="w-full"
        :disabled="Boolean(categoryId)"
      />
      <template #hint>
        Les catégories blog et recette sont enregistrées dans des tables distinctes.
      </template>
    </UFormField>

    <UFormField label="Nom" name="name" required>
      <UInput v-model="state.name" placeholder="Ex. Pâtisserie" autocomplete="off" />
      <template #hint>
        Le slug est généré automatiquement à partir du nom.
      </template>
    </UFormField>

    <UFormField v-if="isRecipeType" label="Description" name="desc">
      <UTextarea
        v-model="state.desc"
        :rows="3"
        placeholder="Courte description (optionnelle)"
      />
    </UFormField>

    <div
      class="flex flex-wrap items-center gap-2 border-t border-default pt-4"
    >
      <ContentStatusBadge
        v-if="categoryId"
        :status="contentStatus"
      />

      <UButton
        type="submit"
        icon="i-lucide-save"
        :label="categoryId ? 'Enregistrer' : 'Enregistrer (brouillon)'"
        :loading="saving"
      />

      <ContentPublishScheduleActions
        v-if="categoryId"
        :content-type="adminContentType"
        :content-id="categoryId"
        :status="contentStatus"
        :ensure-saved="saveCategory"
        @update:status="onStatusChange"
      />

      <UButton
        label="Annuler"
        color="neutral"
        variant="ghost"
        @click="emit('cancel')"
      />
    </div>
  </UForm>
</template>
