<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { slugifyString } from '#shared/slug'
import type { ContentStatus, PaginatedResponse } from '~/types/cms'
import { provideDeferredArticleMedia } from '~/composables/useDeferredArticleMedia'

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  slug: z.string().optional(),
  content: z.string().optional(),
  categoryId: z.number().optional(),
  coverBlobPathname: z.string().nullable().optional(),
})

type Schema = z.output<typeof schema>

interface ArticleSeoInitial {
  description?: string | null
  keywords?: string | null
  metaRobots?: string | null
}

const props = defineProps<{
  articleId?: number
  initial?: Partial<Schema> & {
    status?: string
    coverDisplayName?: string | null
    seo?: ArticleSeoInitial | null
  }
}>()

const { $api } = useNuxtApp()
const toast = useToast()
const router = useRouter()
const saving = ref(false)
const publishing = ref(false)

const deferredMedia = !props.articleId ? provideDeferredArticleMedia() : null

const state = reactive<Schema>({
  title: props.initial?.title ?? '',
  slug: props.initial?.slug ?? '',
  content: props.initial?.content ?? '',
  categoryId: props.initial?.categoryId,
  coverBlobPathname: props.initial?.coverBlobPathname ?? null,
})

const seoState = reactive({
  description: props.initial?.seo?.description ?? '',
  keywords: props.initial?.seo?.keywords ?? '',
  metaRobots: props.initial?.seo?.metaRobots ?? 'index, follow',
})

const hasSeoEntry = computed(() =>
  Boolean(
    props.initial?.seo
    || seoState.description.trim()
    || seoState.keywords.trim(),
  ),
)

const status = computed(() => props.initial?.status ?? 'draft')

const { data: categories } = await useAsyncData('article-category-options', () =>
  $api<PaginatedResponse<{ id: number, name: string, status: ContentStatus }>>('/api/category-articles', {
    query: { pageSize: 100 },
  }),
)

const categoryRows = computed(() => categories.value?.data ?? [])

function regenerateSlug() {
  if (!state.title.trim()) {
    toast.add({ title: 'Saisissez un titre d\'abord', color: 'warning' })
    return
  }
  state.slug = slugifyString(state.title)
}

async function saveSeo(articleId: number) {
  const body = {
    description: seoState.description || undefined,
    keywords: seoState.keywords || undefined,
    metaRobots: seoState.metaRobots || undefined,
  }

  const hasContent = body.description || body.keywords || body.metaRobots
  if (!hasContent && !props.initial?.seo) {
    return
  }

  await $api(`/api/seo/article/${articleId}`, {
    method: 'PUT',
    body,
  })
}

async function saveArticle(): Promise<number | undefined> {
  let content = state.content || undefined
  let coverBlobPathname = state.coverBlobPathname

  if (!props.articleId && deferredMedia) {
    const prepared = await deferredMedia.prepareArticlePayloadForSave(
      state.content ?? '',
      state.coverBlobPathname,
    )
    content = prepared.content || undefined
    coverBlobPathname = prepared.coverBlobPathname
    state.content = prepared.content
    state.coverBlobPathname = prepared.coverBlobPathname
  }

  const body = {
    title: state.title,
    slug: state.slug || undefined,
    content,
    categoryId: state.categoryId,
    coverBlobPathname,
  }

  if (props.articleId) {
    await $api(`/api/articles/${props.articleId}`, { method: 'PUT', body })
    await saveSeo(props.articleId)
    return props.articleId
  }

  const created = await $api<{ id: number }>('/api/articles', { method: 'POST', body })
  await saveSeo(created.id)
  deferredMedia?.dispose()
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
  <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:items-start">
      <div class="space-y-4">
        <div>
          <ContentFieldLabel label="title" />
          <UFormField name="title" :ui="{ label: 'hidden' }">
            <UInput
              v-model="state.title"
              size="xl"
              variant="outline"
              placeholder="Titre de l'article"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <ContentFieldLabel label="slug" />
            <UFormField name="slug" :ui="{ label: 'hidden' }">
              <UInput v-model="state.slug" placeholder="mon-article">
                <template #trailing>
                  <UButton
                    icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Générer le slug depuis le titre"
                    @click="regenerateSlug"
                  />
                </template>
              </UInput>
            </UFormField>
          </div>

          <ContentCategoryRelationField
            v-model="state.categoryId"
            :categories="categoryRows"
          />
        </div>
      </div>

      <ContentCoverField
        v-model="state.coverBlobPathname"
        :display-name="initial?.coverDisplayName"
        :defer-upload="!articleId"
      />
    </div>

    <ContentSeoPanel
      v-model:description="seoState.description"
      v-model:keywords="seoState.keywords"
      v-model:meta-robots="seoState.metaRobots"
      :has-entry="hasSeoEntry"
    />

    <UFormField name="content" :ui="{ label: 'hidden' }">
      <ContentMarkdownEditor v-model="state.content" />
    </UFormField>

    <div class="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 border-t border-default bg-default/90 py-4 backdrop-blur">
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
