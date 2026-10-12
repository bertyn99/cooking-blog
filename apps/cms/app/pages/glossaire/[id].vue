<script setup lang="ts">
const route = useRoute()
const { $api } = useNuxtApp()

const id = computed(() => Number.parseInt(route.params.id as string, 10))

interface GlossaryDetail {
  id: number
  name: string
  slug: string
  kind: 'ingredient' | 'technique' | 'ustensile'
  description: string | null
  content: string | null
  status: string
  coverBlobPathname: string | null
  coverAltText?: string | null
  coverDescription?: string | null
  cover?: { pathname: string, originalName: string | null } | null
  iconKey?: string | null
  utensilCategory?: 'cuisson' | 'preparation' | 'mesure' | 'electro' | 'service' | null
  brand?: string | null
  amazonAsin?: string | null
  partnerUrl?: string | null
  partnerName?: string | null
  relatedArticleId?: number | null
  parentId?: number | null
  resolvedAffiliateUrl?: string | null
  aliases?: Array<{ alias: string }> | null
  seo?: {
    description: string | null
    keywords: string | null
    metaRobots: string | null
  } | null
}

const { data: term, status } = await useAsyncData(
  () => `glossary-${id.value}`,
  () => $api<GlossaryDetail>(`/api/glossary/${id.value}`, {
    query: { include: 'cover,seo,aliases' },
  }),
  { watch: [id] },
)
</script>

<template>
  <ContentEditorDetailLayout
    resource-label="Glossaire"
    resource-to="/glossaire"
    :title="term?.name"
    :subtitle="term?.slug"
    :loading="status === 'pending'"
  >
    <ContentGlossaryForm
      v-if="term"
      :term-id="term.id"
      :initial="{
        name: term.name,
        slug: term.slug,
        kind: term.kind,
        description: term.description ?? undefined,
        content: term.content ?? undefined,
        status: term.status,
        coverBlobPathname: term.coverBlobPathname,
        coverAltText: term.coverAltText ?? null,
        coverDescription: term.coverDescription ?? null,
        coverDisplayName: term.cover?.originalName ?? term.cover?.pathname ?? null,
        iconKey: term.iconKey,
        utensilCategory: term.utensilCategory,
        brand: term.brand,
        amazonAsin: term.amazonAsin,
        partnerUrl: term.partnerUrl,
        partnerName: term.partnerName,
        relatedArticleId: term.relatedArticleId,
        parentId: term.parentId ?? null,
        aliases: term.aliases,
        seo: term.seo,
        resolvedAffiliateUrl: term.resolvedAffiliateUrl,
      }"
    />

    <UAlert
      v-else-if="status !== 'pending'"
      color="error"
      title="Terme introuvable"
      description="Ce terme n’existe pas ou a été supprimé."
      class="mx-auto max-w-lg"
    />
  </ContentEditorDetailLayout>
</template>
