<script setup lang="ts">
const description = defineModel<string>('description', { default: '' })
const keywords = defineModel<string>('keywords', { default: '' })
const metaRobots = defineModel<string>('metaRobots', { default: 'index, follow' })

const props = defineProps<{
  hasEntry: boolean
  anchor?: string
  /** Public title used in the search preview (falls back to a placeholder). */
  previewTitle?: string
  /** Public path on the site, e.g. /blog/cuisine/mon-article or /recette/…. */
  previewPath?: string
}>()

const showForm = ref(props.hasEntry)

watch(() => props.hasEntry, (value) => {
  if (value) {
    showForm.value = true
  }
})

const DESCRIPTION_TARGET = 160
const TITLE_TARGET = 60

const config = useRuntimeConfig()

const siteHost = computed(() => {
  const raw = String(config.public.siteUrl)
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  }
  catch {
    return raw
  }
})

const previewBreadcrumb = computed(() => {
  const path = props.previewPath?.trim()
  if (!path || path === '/') {
    return siteHost.value
  }
  const segments = path.split('/').filter(Boolean).slice(0, 4)
  return [siteHost.value, ...segments].join(' › ')
})

const previewHeadline = computed(() => props.previewTitle?.trim() || 'Titre de la page')

const previewExcerpt = computed(() => description.value.trim())

const descriptionOverflow = computed(() => description.value.length > DESCRIPTION_TARGET)

const titleTooLong = computed(() => (props.previewTitle?.trim().length ?? 0) > TITLE_TARGET)
</script>

<template>
  <ContentEditorSection
    label="seo"
    :count="hasEntry ? 1 : 0"
    :anchor="anchor"
    description="Titre et extrait pour Google et les réseaux sociaux."
  >
    <button
      v-if="!showForm"
      type="button"
      class="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-default bg-elevated/30 px-4 py-10 text-sm text-muted transition hover:border-primary/40 hover:bg-elevated/60"
      @click="showForm = true"
    >
      <UIcon name="i-lucide-search" class="size-5 text-primary" />
      <span>Ajouter une entrée SEO</span>
    </button>

    <div
      v-else
      class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start"
    >
      <ContentEditorSurface class="space-y-5">
        <div>
          <div class="mb-1.5 flex items-baseline justify-between gap-2">
            <span class="text-xs font-medium text-muted">Meta description</span>
            <span
              class="text-[11px] tabular-nums"
              :class="descriptionOverflow ? 'font-medium text-warning' : 'text-dimmed'"
            >
              {{ description.length }} / {{ DESCRIPTION_TARGET }}
            </span>
          </div>
          <UFormField name="seoDescription" :ui="{ label: 'hidden' }">
            <UTextarea
              v-model="description"
              :rows="4"
              autoresize
              placeholder="Résumé affiché sous le titre dans les résultats de recherche"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <ContentFieldLabel label="keywords" hint="Séparés par des virgules" />
            <UFormField name="seoKeywords" :ui="{ label: 'hidden' }">
              <UInput v-model="keywords" placeholder="cuisine, recette, été" class="w-full" />
            </UFormField>
          </div>

          <div>
            <ContentFieldLabel label="metaRobots" />
            <UFormField name="seoRobots" :ui="{ label: 'hidden' }">
              <UInput v-model="metaRobots" placeholder="index, follow" class="w-full" />
            </UFormField>
            <p class="mt-1.5 text-[11px] text-muted">
              Indexation : index / noindex, suivi des liens : follow / nofollow.
            </p>
          </div>
        </div>
      </ContentEditorSurface>

      <aside
        class="flex flex-col gap-2"
        aria-label="Aperçu dans les résultats de recherche"
      >
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-xs font-medium text-muted">Aperçu Google</span>
          <span class="text-[11px] text-dimmed">Estimation</span>
        </div>

        <div class="rounded-lg border border-default/70 bg-elevated/40 p-4">
          <div class="flex items-center gap-2.5">
            <span class="flex size-7 shrink-0 items-center justify-center rounded-full border border-default bg-default text-[11px] font-semibold text-muted uppercase">
              {{ siteHost.charAt(0) }}
            </span>
            <div class="min-w-0">
              <p class="truncate text-xs leading-tight text-default">
                {{ siteHost }}
              </p>
              <p
                class="truncate text-[11px] leading-tight text-dimmed"
                :title="previewBreadcrumb"
              >
                {{ previewBreadcrumb }}
              </p>
            </div>
          </div>

          <p
            class="mt-2.5 truncate text-[1.05rem] leading-snug text-[#1a0dab] dark:text-[#8ab4f8]"
            :title="previewHeadline"
          >
            {{ previewHeadline }}
          </p>
          <p
            class="mt-1 line-clamp-2 text-[13px] leading-relaxed"
            :class="previewExcerpt ? 'text-muted' : 'italic text-dimmed'"
          >
            {{ previewExcerpt || 'Aucune description — Google affichera un extrait de la page.' }}
          </p>
        </div>

        <p
          v-if="titleTooLong"
          class="flex items-start gap-1.5 text-[11px] text-warning"
        >
          <UIcon
            name="i-lucide-triangle-alert"
            class="mt-px size-3.5 shrink-0"
          />
          Le titre dépasse ~{{ TITLE_TARGET }} caractères et risque d'être tronqué.
        </p>
      </aside>
    </div>
  </ContentEditorSection>
</template>
