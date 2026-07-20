<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { PaginatedResponse } from '~/types/cms'

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  slug: z.string().optional(),
  content: z.string().optional(),
  categoryId: z.number().optional(),
})

type Schema = z.output<typeof schema>

const props = defineProps<{
  articleId?: number
  initial?: Partial<Schema> & { status?: string }
}>()

const { $api } = useNuxtApp()
const toast = useToast()
const router = useRouter()
const saving = ref(false)
const publishing = ref(false)

const state = reactive<Schema>({
  title: props.initial?.title ?? '',
  slug: props.initial?.slug ?? '',
  content: props.initial?.content ?? '',
  categoryId: props.initial?.categoryId,
})

const status = computed(() => props.initial?.status ?? 'draft')

const { data: categories } = await useAsyncData('article-category-options', () =>
  $api<PaginatedResponse<{ id: number, name: string }>>('/api/category-articles', {
    query: { pageSize: 100 },
  }),
)

const categoryOptions = computed(() =>
  (categories.value?.data ?? []).map(category => ({
    label: category.name,
    value: category.id,
  })),
)

async function saveArticle(): Promise<number | undefined> {
  const body = {
    title: state.title,
    slug: state.slug || undefined,
    content: state.content || undefined,
    categoryId: state.categoryId,
  }

  if (props.articleId) {
    await $api(`/api/articles/${props.articleId}`, { method: 'PUT', body })
    return props.articleId
  }

  const created = await $api<{ id: number }>('/api/articles', { method: 'POST', body })
  await router.replace(`/articles/${created.id}`)
  return created.id
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await saveArticle()
    toast.add({ title: 'Article enregistré', color: 'success' })
  }
  catch {
    toast.add({ title: 'Erreur', description: 'Impossible d\'enregistrer l\'article', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

async function publishArticle() {
  publishing.value = true
  try {
    const id = props.articleId ?? await saveArticle()
    if (!id) return

    await $api(`/api/admin/articles/${id}/publish`, { method: 'POST' })
    toast.add({ title: 'Article publié', color: 'success' })
    await router.push('/articles')
  }
  catch {
    toast.add({ title: 'Erreur', description: 'Impossible de publier l\'article', color: 'error' })
  }
  finally {
    publishing.value = false
  }
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField label="Titre" name="title" required>
      <UInput v-model="state.title" placeholder="Titre de l'article" />
    </UFormField>

    <UFormField label="Slug" name="slug" hint="Généré automatiquement si vide">
      <UInput v-model="state.slug" placeholder="mon-article" />
    </UFormField>

    <UFormField label="Catégorie blog" name="categoryId">
      <USelect
        v-model="state.categoryId"
        :items="categoryOptions"
        placeholder="Choisir une catégorie"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Contenu (Markdown)" name="content">
      <UTextarea v-model="state.content" :rows="16" placeholder="Rédigez le contenu…" />
    </UFormField>

    <div class="flex flex-wrap items-center gap-2 border-t border-default pt-4">
      <UBadge v-if="articleId" variant="subtle" class="capitalize">
        {{ status }}
      </UBadge>

      <UButton
        type="submit"
        icon="i-lucide-save"
        label="Enregistrer"
        :loading="saving"
      />

      <UButton
        v-if="articleId && status !== 'published'"
        icon="i-lucide-send"
        label="Publier"
        color="success"
        variant="soft"
        :loading="publishing"
        @click="publishArticle"
      />

      <UButton
        to="/articles"
        label="Retour"
        color="neutral"
        variant="ghost"
      />
    </div>
  </UForm>
</template>
