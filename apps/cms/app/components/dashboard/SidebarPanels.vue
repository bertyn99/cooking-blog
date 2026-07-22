<script setup lang="ts">
import type { DashboardHealthCounts, DashboardStrapiSnapshot, DashboardSummary } from '#shared/dashboard'
import { DASHBOARD_SURFACE_CLASS } from '~/utils/dashboard-shell'

defineProps<{
  taxonomy: DashboardSummary['taxonomy']
  health: DashboardHealthCounts
  strapiImport: DashboardStrapiSnapshot
  lastPublished: DashboardSummary['lastPublished']
}>()

const config = useRuntimeConfig()

function relativePublished(iso: string) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) {
    return 'aujourd\'hui'
  }
  if (days === 1) {
    return 'hier'
  }
  return `il y a ${days} j`
}
</script>

<template>
  <div class="space-y-4">
    <section :class="[DASHBOARD_SURFACE_CLASS, 'p-4']">
      <h2 class="text-sm font-semibold text-highlighted">
        À corriger
      </h2>
      <ul class="mt-3 space-y-2 text-sm">
        <li class="flex items-center justify-between gap-2">
          <span class="text-muted">Publiés sans couverture</span>
          <UBadge :color="health.publishedMissingCover ? 'warning' : 'success'" variant="subtle">
            {{ health.publishedMissingCover }}
          </UBadge>
        </li>
        <li class="flex items-center justify-between gap-2">
          <span class="text-muted">Publiés sans meta description</span>
          <UBadge :color="health.publishedMissingSeoDescription ? 'warning' : 'success'" variant="subtle">
            {{ health.publishedMissingSeoDescription }}
          </UBadge>
        </li>
        <li class="flex items-center justify-between gap-2">
          <NuxtLink to="/media" class="text-muted hover:text-primary">
            Images sans texte alternatif
          </NuxtLink>
          <UBadge :color="health.imagesMissingAlt ? 'warning' : 'success'" variant="subtle">
            {{ health.imagesMissingAlt }}
          </UBadge>
        </li>
      </ul>
    </section>

    <section :class="[DASHBOARD_SURFACE_CLASS, 'p-4']">
      <h2 class="text-sm font-semibold text-highlighted">
        Taxonomie &amp; médias
      </h2>
      <ul class="mt-3 space-y-2 text-sm">
        <li class="flex justify-between gap-2">
          <NuxtLink to="/categories" class="text-muted hover:text-primary">
            Catégories blog
          </NuxtLink>
          <span class="tabular-nums text-highlighted">{{ taxonomy.categoryArticles }}</span>
        </li>
        <li class="flex justify-between gap-2">
          <NuxtLink to="/categories" class="text-muted hover:text-primary">
            Catégories recettes
          </NuxtLink>
          <span class="tabular-nums text-highlighted">{{ taxonomy.recipeCategories }}</span>
        </li>
        <li class="flex justify-between gap-2">
          <NuxtLink to="/media" class="text-muted hover:text-primary">
            Fichiers médiathèque
          </NuxtLink>
          <span class="tabular-nums text-highlighted">{{ taxonomy.media }}</span>
        </li>
      </ul>
    </section>

    <section
      v-if="lastPublished?.articles || lastPublished?.recipes"
      :class="[DASHBOARD_SURFACE_CLASS, 'p-4']"
    >
      <h2 class="text-sm font-semibold text-highlighted">
        Dernières publications
      </h2>
      <ul class="mt-3 space-y-2 text-sm">
        <li v-if="lastPublished?.articles">
          <NuxtLink :to="lastPublished.articles.editPath" class="block hover:text-primary">
            <span class="text-muted">Article · </span>
            <span class="text-highlighted">{{ lastPublished.articles.title }}</span>
            <span class="text-muted"> — {{ relativePublished(lastPublished.articles.publishedAt) }}</span>
          </NuxtLink>
        </li>
        <li v-if="lastPublished?.recipes">
          <NuxtLink :to="lastPublished.recipes.editPath" class="block hover:text-primary">
            <span class="text-muted">Recette · </span>
            <span class="text-highlighted">{{ lastPublished.recipes.title }}</span>
            <span class="text-muted"> — {{ relativePublished(lastPublished.recipes.publishedAt) }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section :class="[DASHBOARD_SURFACE_CLASS, 'p-4']">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-highlighted">
          Import Strapi
        </h2>
        <UBadge
          :color="strapiImport.status === 'running' ? 'warning' : strapiImport.status === 'failed' ? 'error' : 'neutral'"
          variant="subtle"
          size="sm"
          class="capitalize"
        >
          {{ strapiImport.status }}
        </UBadge>
      </div>
      <p v-if="strapiImport.step" class="mt-2 text-xs text-muted">
        Étape : {{ strapiImport.step }}
      </p>
      <p v-if="strapiImport.message" class="mt-1 line-clamp-2 text-xs text-dimmed">
        {{ strapiImport.message }}
      </p>
      <UButton
        to="/import"
        class="mt-3"
        size="sm"
        color="neutral"
        variant="soft"
        block
        icon="i-lucide-download"
        label="Gérer l’import"
      />
    </section>

    <UButton
      :to="config.public.siteUrl"
      target="_blank"
      color="neutral"
      variant="outline"
      block
      icon="i-lucide-external-link"
      label="Voir le site public"
    />
  </div>
</template>
