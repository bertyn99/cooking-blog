<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { slugifyString } from '#shared/slug'
import { pageFiliationLabel, type PageHierarchyNode } from '#shared/page-hierarchy'
import { pagePublicPath } from '#shared/public-site-paths'
import type { ContentStatus, PaginatedResponse } from '~/types/cms'
import type { EditorNavSection } from '~/types/content-editor'

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  title: z.string().optional(),
  content: z.string().default(''),
  parentId: z.number().nullable().optional(),
  locale: z.string().min(1, 'Langue requise'),
})

type Schema = z.output<typeof schema>

interface PageSeoInitial {
  description?: string | null
  keywords?: string | null
  metaRobots?: string | null
}

interface PageParentNode extends PageHierarchyNode {}

const props = defineProps<{
  pageId?: number
  initial?: Partial<Schema> & {
    slug?: string
    status?: string
    parent?: PageParentNode | null
    seoMeta?: PageSeoInitial | null
  }
}>()

const { $api } = useNuxtApp()
const toast = useToast()
const router = useRouter()
const saving = ref(false)
const formRef = ref<{ submit: () => Promise<void> } | null>(null)

const state = reactive<Schema>({
  name: props.initial?.name ?? '',
  title: props.initial?.title ?? '',
  content: props.initial?.content ?? '',
  parentId: props.initial?.parentId ?? null,
  locale: props.initial?.locale ?? 'fr',
})

const slugDisplay = ref(props.initial?.slug ?? '')

watch(
  () => state.name,
  (name) => {
    if (!props.pageId && name.trim()) {
      slugDisplay.value = slugifyString(name)
    }
  },
)

const seoState = reactive({
  description: props.initial?.seoMeta?.description ?? '',
  keywords: props.initial?.seoMeta?.keywords ?? '',
  metaRobots: props.initial?.seoMeta?.metaRobots ?? 'index, follow',
})

const hasSeoEntry = computed(() =>
  Boolean(
    props.initial?.seoMeta
    || seoState.description.trim()
    || seoState.keywords.trim(),
  ),
)

const contentStatus = ref<ContentStatus>((props.initial?.status as ContentStatus) ?? 'draft')

watch(
  () => props.initial?.status,
  (value) => {
    if (value) {
      contentStatus.value = value as ContentStatus
    }
  },
)

const selectedParentPage = computed(() => {
  if (state.parentId == null) {
    return null
  }
  return pageOptions.value?.find(page => page.id === state.parentId) ?? null
})

const publicPathPreview = computed(() => {
  const slug = slugDisplay.value || slugifyString(state.name) || '…'
  const parentForPath = selectedParentPage.value
    ? {
        slug: selectedParentPage.value.slug,
        parent: selectedParentPage.value.parent ?? null,
      }
    : null
  return pagePublicPath(slug, parentForPath)
})

const filiationPreview = computed(() => {
  if (!selectedParentPage.value) {
    return 'Page racine'
  }
  return pageFiliationLabel(selectedParentPage.value)
})

interface PageListItem {
  id: number
  name: string
  title: string | null
  slug: string
  status: ContentStatus
  parentId: number | null
  parent?: PageHierarchyNode | null
}

const { data: pageOptions } = await useAsyncData('page-parent-options', async () => {
  const first = await $api<PaginatedResponse<PageListItem>>('/api/pages', {
    query: { page: 1, pageSize: 100, include: 'parent' },
  })

  const all = [...(first.data ?? [])]
  const total = first.meta.pagination.total
  const pageSize = first.meta.pagination.pageSize
  const pageCount = Math.ceil(total / pageSize)

  for (let page = 2; page <= pageCount; page++) {
    const next = await $api<PaginatedResponse<PageListItem>>('/api/pages', {
      query: { page, pageSize: 100, include: 'parent' },
    })
    all.push(...(next.data ?? []))
  }

  return all
})

const editorSections: EditorNavSection[] = [
  { id: 'editor-general', label: 'Général' },
  { id: 'editor-seo', label: 'SEO' },
  { id: 'editor-content', label: 'Contenu' },
]

function regenerateSlugPreview() {
  if (!state.name.trim()) {
    toast.add({ title: 'Saisissez un nom d\'abord', color: 'warning' })
    return
  }
  slugDisplay.value = slugifyString(state.name)
  toast.add({
    title: 'Aperçu du permalien',
    description: props.pageId
      ? 'Le permalien en base n’est pas modifié automatiquement.'
      : 'Le permalien sera généré à la création.',
    color: 'neutral',
  })
}

async function saveSeo(pageId: number) {
  const body = {
    description: seoState.description || undefined,
    keywords: seoState.keywords || undefined,
    metaRobots: seoState.metaRobots || undefined,
  }

  const hasContent = body.description || body.keywords || body.metaRobots
  if (!hasContent && !props.initial?.seoMeta) {
    return
  }

  await $api(`/api/seo/page/${pageId}`, {
    method: 'PUT',
    body,
  })
}

async function savePage(): Promise<number | undefined> {
  const body = {
    name: state.name.trim(),
    title: state.title?.trim() || undefined,
    content: state.content || undefined,
    parentId: state.parentId ?? null,
    locale: state.locale.trim() || 'fr',
  }

  if (props.pageId) {
    await $api(`/api/pages/${props.pageId}`, { method: 'PUT', body })
    await saveSeo(props.pageId)
    return props.pageId
  }

  const created = await $api<{ data: { id: number, slug: string } }>('/api/pages', {
    method: 'POST',
    body,
  })
  await saveSeo(created.data.id)
  slugDisplay.value = created.data.slug
  await router.replace(`/pages/${created.data.id}`)
  return created.data.id
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await savePage()
    toast.add({ title: 'Page enregistrée', color: 'success' })
  }
  catch {
    toast.add({ title: 'Erreur', description: 'Impossible d\'enregistrer la page', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

</script>

<template>
  <ContentEditorBodyLayout :sections="editorSections">
    <UForm
      ref="formRef"
      :schema="schema"
      :state="state"
      class="space-y-6"
      @submit="onSubmit"
    >
      <ContentEditorSurface
        id="editor-general"
        class="scroll-mt-[7.25rem]"
      >
        <div class="mb-5 grid gap-4 md:grid-cols-2">
          <div>
            <ContentFieldLabel label="name" />
            <UFormField name="name" :ui="{ label: 'hidden' }">
              <UInput
                v-model="state.name"
                :size="pageId ? 'lg' : 'xl'"
                variant="outline"
                placeholder="Nom interne (CMS)"
                class="w-full"
              />
            </UFormField>
          </div>

          <div>
            <ContentFieldLabel label="title" />
            <UFormField name="title" :ui="{ label: 'hidden' }">
              <UInput
                v-model="state.title"
                variant="outline"
                placeholder="Titre affiché sur le site"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-4">
            <div>
              <ContentFieldLabel
                label="slug"
                hint="Généré à la création ; inchangé ensuite"
              />
              <UInput
                :model-value="slugDisplay"
                readonly
                placeholder="permalien-de-la-page"
                :ui="{ base: 'font-mono text-sm' }"
              >
                <template #trailing>
                  <UButton
                    icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Prévisualiser le permalien depuis le nom"
                    @click="regenerateSlugPreview"
                  />
                </template>
              </UInput>
              <p class="mt-1.5 text-[11px] text-muted">
                Chemin public : <code class="font-mono">{{ publicPathPreview }}</code>
              </p>
              <p
                v-if="filiationPreview !== 'Page racine'"
                class="mt-0.5 text-[11px] text-muted"
              >
                Filiation : {{ filiationPreview }}
              </p>
            </div>

            <div>
              <ContentFieldLabel label="locale" />
              <UFormField name="locale" :ui="{ label: 'hidden' }">
                <UInput
                  v-model="state.locale"
                  placeholder="fr"
                  class="max-w-[8rem] font-mono"
                />
              </UFormField>
            </div>
          </div>

          <ContentPageParentRelationField
            v-model="state.parentId"
            :pages="pageOptions ?? []"
            :exclude-page-id="pageId"
          />
        </div>
      </ContentEditorSurface>

      <ContentSeoPanel
        v-model:description="seoState.description"
        v-model:keywords="seoState.keywords"
        v-model:meta-robots="seoState.metaRobots"
        :has-entry="hasSeoEntry"
        anchor="editor-seo"
      />

      <ContentEditorSection
        label="content"
        anchor="editor-content"
        description="Corps de la page. Markdown et médias intégrés."
        surface
        flush-surface
      >
        <UFormField
          name="content"
          :ui="{ label: 'hidden', wrapper: 'm-0' }"
        >
          <ContentMarkdownEditor v-model="state.content" />
        </UFormField>
      </ContentEditorSection>

      <ContentEditorFormActions>
        <ContentStatusBadge
          v-if="pageId"
          :status="contentStatus"
          class="max-lg:hidden"
        />

        <UButton
          icon="i-lucide-save"
          label="Enregistrer"
          class="max-sm:hidden"
          :loading="saving"
          @click="formRef?.submit()"
        />
        <UButton
          icon="i-lucide-save"
          class="sm:hidden"
          aria-label="Enregistrer"
          :loading="saving"
          @click="formRef?.submit()"
        />

        <ContentPublishScheduleActions
          v-if="pageId"
          content-type="pages"
          :content-id="pageId"
          :status="contentStatus"
          redirect-after-publish="/pages"
          :ensure-saved="savePage"
          @update:status="contentStatus = $event"
        />
      </ContentEditorFormActions>
    </UForm>
  </ContentEditorBodyLayout>
</template>
