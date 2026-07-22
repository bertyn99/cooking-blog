<script setup lang="ts">
import { pageFiliationLabel, pageHierarchyLabel } from '#shared/page-hierarchy'
import { pagePublicPath } from '#shared/public-site-paths'

const route = useRoute()
const { $api } = useNuxtApp()

const id = computed(() => Number.parseInt(route.params.id as string, 10))

interface PageParentNode {
  slug: string
  title?: string | null
  name?: string
  parent?: PageParentNode | null
}

interface PageDetail {
  id: number
  name: string
  title: string | null
  slug: string
  content: string | null
  parentId: number | null
  locale: string
  status: string
  parent?: PageParentNode | null
  seoMeta?: {
    description: string | null
    keywords: string | null
    metaRobots: string | null
  } | null
}

const { data: pageResponse, status } = await useAsyncData(
  () => `page-${id.value}`,
  () => $api<{ data: PageDetail }>(`/api/pages/${id.value}`, {
    query: { include: 'parent,seoMeta' },
  }),
  { watch: [id] },
)

const page = computed(() => pageResponse.value?.data)

const layoutTitle = computed(() =>
  page.value ? pageHierarchyLabel(page.value) : undefined,
)

const layoutSubtitle = computed(() => {
  if (!page.value) {
    return undefined
  }
  const path = pagePublicPath(page.value.slug, page.value.parent ?? null)
  const filiation = pageFiliationLabel(page.value.parent ?? null)
  if (filiation === 'Page racine') {
    return path
  }
  return `${path} · ${filiation}`
})
</script>

<template>
  <ContentEditorDetailLayout
    resource-label="Pages"
    resource-to="/pages"
    :title="layoutTitle"
    :subtitle="layoutSubtitle"
    :loading="status === 'pending'"
  >
    <ContentPageForm
      v-if="page"
      :page-id="page.id"
      :initial="{
        name: page.name,
        title: page.title ?? undefined,
        slug: page.slug,
        content: page.content ?? undefined,
        parentId: page.parentId,
        locale: page.locale,
        status: page.status,
        parent: page.parent ?? null,
        seoMeta: page.seoMeta,
      }"
    />

    <UAlert
      v-else-if="status !== 'pending'"
      color="error"
      title="Page introuvable"
      description="Cette page n'existe pas ou a été supprimée."
      class="mx-auto max-w-lg"
    />
  </ContentEditorDetailLayout>
</template>
