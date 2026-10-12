<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { slugifyString } from '#shared/slug'
import { glossaryPublicPath } from '#shared/public-site-paths'
import {
  GLOSSARY_KINDS,
  GLOSSARY_KIND_LABELS_FR,
  type GlossaryKind,
} from '#shared/glossary-normalize'
import {
  GLOSSARY_ICON_KEYS,
  GLOSSARY_UTENSIL_CATEGORIES,
  GLOSSARY_UTENSIL_CATEGORY_LABELS_FR,
  parseGlossaryIconKey,
  type GlossaryIconKey,
} from '#shared/glossary-icons'
import { buildAmazonProductUrl, extractAmazonAsin } from '#shared/glossary-affiliate'
import { AMAZON_AFFILIATE_TAG_KEY, parseAmazonAffiliateTag } from '#shared/site-settings-keys'
import type { ContentStatus } from '~/types/cms'
import type { EditorNavSection } from '~/types/content-editor'

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  slug: z.string().optional(),
  kind: z.enum(GLOSSARY_KINDS),
  description: z.string().optional(),
  content: z.string().optional(),
  coverBlobPathname: z.string().nullable().optional(),
  coverAltText: z.string().nullable().optional(),
  coverDescription: z.string().nullable().optional(),
  iconKey: z.enum(GLOSSARY_ICON_KEYS).nullable().optional(),
  utensilCategory: z.enum(GLOSSARY_UTENSIL_CATEGORIES).nullable().optional(),
  brand: z.string().nullable().optional(),
  amazonAsin: z.string().nullable().optional(),
  partnerUrl: z.string().nullable().optional(),
  partnerName: z.string().nullable().optional(),
  relatedArticleId: z.number().nullable().optional(),
  parentId: z.number().nullable(),
})

type Schema = z.output<typeof schema>

interface GlossarySeoInitial {
  description?: string | null
  keywords?: string | null
  metaRobots?: string | null
}

interface GlossaryAliasInitial {
  alias: string
}

const props = defineProps<{
  termId?: number
  initial?: Partial<Schema> & {
    status?: string
    coverDisplayName?: string | null
    aliases?: GlossaryAliasInitial[] | null
    seo?: GlossarySeoInitial | null
    resolvedAffiliateUrl?: string | null
  }
}>()

const { $api } = useNuxtApp()
const toast = useToast()
const router = useRouter()
const saving = ref(false)
const formRef = ref<{ submit: () => Promise<void> } | null>(null)
const aliasDraft = ref('')

const state = reactive<Schema>({
  name: props.initial?.name ?? '',
  slug: props.initial?.slug ?? '',
  kind: props.initial?.kind ?? 'ingredient',
  description: props.initial?.description ?? '',
  content: props.initial?.content ?? '',
  coverBlobPathname: props.initial?.coverBlobPathname ?? null,
  coverAltText: props.initial?.coverAltText ?? null,
  coverDescription: props.initial?.coverDescription ?? null,
  iconKey: parseGlossaryIconKey(props.initial?.iconKey),
  utensilCategory: props.initial?.utensilCategory ?? null,
  brand: props.initial?.brand ?? '',
  amazonAsin: props.initial?.amazonAsin ?? '',
  partnerUrl: props.initial?.partnerUrl ?? '',
  partnerName: props.initial?.partnerName ?? '',
  relatedArticleId: props.initial?.relatedArticleId ?? null,
  parentId: props.initial?.parentId ?? null,
})

const seoState = reactive({
  description: props.initial?.seo?.description ?? '',
  keywords: props.initial?.seo?.keywords ?? '',
  metaRobots: props.initial?.seo?.metaRobots ?? 'noindex,follow',
})

const aliases = ref<string[]>(
  (props.initial?.aliases ?? []).map(row => row.alias).filter(Boolean),
)

const hasSeoEntry = computed(() =>
  Boolean(
    props.initial?.seo
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

const isUtensil = computed(() => state.kind === 'ustensile')
const isIngredient = computed(() => state.kind === 'ingredient')

const kindOptions = GLOSSARY_KINDS.map(kind => ({
  label: GLOSSARY_KIND_LABELS_FR[kind],
  value: kind,
}))

const utensilCategoryOptions = GLOSSARY_UTENSIL_CATEGORIES.map(category => ({
  label: GLOSSARY_UTENSIL_CATEGORY_LABELS_FR[category],
  value: category,
}))

const seoPreviewPath = computed(() => {
  const slug = state.slug?.trim()
  return slug ? glossaryPublicPath(slug) : undefined
})

const { data: siteSettings } = await useAsyncData('site-settings', () =>
  $api<{ data: Array<{ key: string, value: unknown }> }>('/api/site-settings'),
)

const amazonTag = computed(() => {
  const row = siteSettings.value?.data?.find(item => item.key === AMAZON_AFFILIATE_TAG_KEY)
  return parseAmazonAffiliateTag(row?.value) || null
})

const amazonPreview = computed(() => {
  const partner = state.partnerUrl?.trim()
  if (partner) return partner
  const asin = extractAmazonAsin(state.amazonAsin)
  if (!asin) return null
  return buildAmazonProductUrl(asin, amazonTag.value)
})

const editorSections = computed<EditorNavSection[]>(() => {
  const sections: EditorNavSection[] = [
    { id: 'editor-general', label: 'Général' },
    { id: 'editor-seo', label: 'SEO' },
    { id: 'editor-content', label: 'Contenu' },
  ]
  if (isUtensil.value) {
    sections.splice(2, 0, { id: 'editor-affiliate', label: 'Affiliation' })
  }
  return sections
})

function regenerateSlug() {
  if (!state.name.trim()) {
    toast.add({ title: 'Saisissez un nom d\'abord', color: 'warning' })
    return
  }
  state.slug = slugifyString(state.name)
}

function addAlias() {
  const value = aliasDraft.value.trim()
  if (!value) return
  if (!aliases.value.includes(value)) {
    aliases.value.push(value)
  }
  aliasDraft.value = ''
}

function removeAlias(index: number) {
  aliases.value.splice(index, 1)
}

watch(
  () => state.kind,
  (kind: GlossaryKind) => {
    if (kind !== 'ustensile') {
      state.iconKey = null
      state.utensilCategory = null
      state.brand = ''
      state.amazonAsin = ''
      state.partnerUrl = ''
      state.partnerName = ''
    }
    if (kind !== 'ingredient') {
      state.parentId = null
    }
  },
)

async function saveSeo(termId: number) {
  const body = {
    description: seoState.description || undefined,
    keywords: seoState.keywords || undefined,
    metaRobots: seoState.metaRobots || undefined,
  }
  const hasContent = body.description || body.keywords || body.metaRobots
  if (!hasContent && !props.initial?.seo) {
    return
  }
  await $api(`/api/seo/glossary/${termId}`, {
    method: 'PUT',
    body,
  })
}

async function saveTerm(): Promise<number | undefined> {
  const body = {
    name: state.name,
    slug: state.slug || undefined,
    kind: state.kind,
    description: state.description || undefined,
    content: state.content || undefined,
    coverBlobPathname: state.coverBlobPathname ?? undefined,
    coverAltText: state.coverAltText,
    coverDescription: state.coverDescription,
    iconKey: isUtensil.value ? state.iconKey : null,
    utensilCategory: isUtensil.value ? state.utensilCategory : null,
    brand: isUtensil.value ? (state.brand || null) : null,
    amazonAsin: isUtensil.value ? (state.amazonAsin || null) : null,
    partnerUrl: isUtensil.value ? (state.partnerUrl || null) : null,
    partnerName: isUtensil.value ? (state.partnerName || null) : null,
    relatedArticleId: state.relatedArticleId,
    parentId: isIngredient.value ? (state.parentId ?? null) : null,
    aliases: aliases.value.map(alias => ({ alias })),
  }

  if (props.termId) {
    await $api(`/api/glossary/${props.termId}`, { method: 'PUT', body })
    await saveSeo(props.termId)
    return props.termId
  }

  const created = await $api<{ id: number }>('/api/glossary', { method: 'POST', body })
  await saveSeo(created.id)
  await router.replace(`/glossaire/${created.id}`)
  return created.id
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await saveTerm()
    toast.add({ title: 'Terme enregistré', color: 'success' })
  }
  catch {
    toast.add({ title: 'Erreur', description: 'Impossible d\'enregistrer le terme', color: 'error' })
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
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_16rem]">
          <div class="min-w-0 space-y-4">
            <div>
              <ContentFieldLabel label="termName" />
              <UFormField name="name" :ui="{ label: 'hidden' }">
                <UInput
                  v-model="state.name"
                  :size="termId ? 'lg' : 'xl'"
                  variant="outline"
                  placeholder="Farine de blé, poêle en fonte…"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <ContentFieldLabel label="slug" />
                <UFormField name="slug" :ui="{ label: 'hidden' }">
                  <UInput v-model="state.slug" placeholder="farine-de-ble" class="w-full">
                    <template #trailing>
                      <UButton
                        icon="i-lucide-refresh-cw"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        aria-label="Générer le slug depuis le nom"
                        @click="regenerateSlug"
                      />
                    </template>
                  </UInput>
                </UFormField>
              </div>

              <div>
                <ContentFieldLabel label="kind" />
                <UFormField name="kind" :ui="{ label: 'hidden' }">
                  <USelect
                    v-model="state.kind"
                    :items="kindOptions"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>

            <div>
              <ContentFieldLabel label="description" />
              <UFormField name="description" :ui="{ label: 'hidden' }">
                <UTextarea
                  v-model="state.description"
                  :rows="3"
                  placeholder="Une phrase pour l’index et les extraits."
                />
              </UFormField>
            </div>

            <div>
              <ContentFieldLabel label="aliases" />
              <div class="flex flex-wrap gap-1.5">
                <UBadge
                  v-for="(alias, index) in aliases"
                  :key="alias"
                  color="neutral"
                  variant="subtle"
                  class="gap-1"
                >
                  {{ alias }}
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    square
                    aria-label="Retirer l’alias"
                    @click="removeAlias(index)"
                  />
                </UBadge>
              </div>
              <div class="mt-2 flex gap-2">
                <UInput
                  v-model="aliasDraft"
                  placeholder="Autre nom (farine T55…)"
                  class="flex-1"
                  @keydown.enter.prevent="addAlias"
                />
                <UButton
                  type="button"
                  variant="soft"
                  label="Ajouter"
                  @click="addAlias"
                />
              </div>
              <p class="mt-1.5 text-xs text-muted">
                Synonymes et pluriels uniquement (amandes → amande). Pas les formes culinaires.
              </p>
            </div>

            <div v-if="isIngredient">
              <ContentFieldLabel label="ingredientFamily" />
              <UFormField name="parentId" :ui="{ label: 'hidden' }">
                <ContentGlossaryFamilyField
                  v-model="state.parentId"
                  :exclude-term-id="termId"
                />
              </UFormField>
              <p class="mt-1.5 text-xs text-muted">
                Lait d’amande, pâte d’amande, amande en poudre… chacune a sa fiche, rattachée à Amande.
              </p>
            </div>
          </div>

          <ContentCoverField
            v-model="state.coverBlobPathname"
            v-model:cover-alt-text="state.coverAltText"
            v-model:cover-description="state.coverDescription"
            :display-name="initial?.coverDisplayName"
            :content-title="state.name"
            compact
          />
          <p
            v-if="isIngredient"
            class="mt-1.5 text-xs text-muted"
          >
            Photo de cette forme seulement. La fiche famille (Amande) a la sienne.
          </p>
        </div>
      </ContentEditorSurface>

      <ContentSeoPanel
        v-model:description="seoState.description"
        v-model:keywords="seoState.keywords"
        v-model:meta-robots="seoState.metaRobots"
        :has-entry="hasSeoEntry"
        :preview-title="state.name"
        :preview-path="seoPreviewPath"
        anchor="editor-seo"
      />

      <ContentEditorSection
        v-if="isUtensil"
        label="iconKey"
        anchor="editor-affiliate"
        description="Icône, famille, et un seul lien d’achat par terme (partenaire ou Amazon)."
        surface
      >
        <div class="space-y-5">
          <div>
            <ContentFieldLabel label="utensilCategory" />
            <USelect
              v-model="state.utensilCategory"
              :items="[{ label: '—', value: null }, ...utensilCategoryOptions]"
              class="max-w-xs"
            />
          </div>

          <ContentGlossaryIconPicker v-model="state.iconKey" />

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Marque">
              <UInput v-model="state.brand" placeholder="De Buyer, Staub…" />
            </UFormField>
            <UFormField label="ASIN Amazon">
              <UInput v-model="state.amazonAsin" placeholder="B00…" />
            </UFormField>
            <UFormField label="Lien partenaire">
              <UInput v-model="state.partnerUrl" type="url" placeholder="https://…" />
            </UFormField>
            <UFormField label="Nom du partenaire">
              <UInput v-model="state.partnerName" placeholder="Boutique, marque…" />
            </UFormField>
          </div>

          <p
            v-if="amazonPreview"
            class="text-sm text-muted"
          >
            Aperçu du lien d’achat :
            <a
              :href="amazonPreview"
              class="break-all text-highlighted underline"
              target="_blank"
              rel="nofollow sponsored noopener"
            >{{ amazonPreview }}</a>
          </p>
        </div>
      </ContentEditorSection>

      <ContentEditorSection
        label="content"
        anchor="editor-content"
        description="Fiche glossaire. Markdown, comme un article court."
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
          v-if="termId"
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
          v-if="termId"
          content-type="glossary"
          :content-id="termId"
          :status="contentStatus"
          :allow-schedule="false"
          redirect-after-publish="/glossaire"
          :ensure-saved="saveTerm"
          @update:status="contentStatus = $event"
        />
      </ContentEditorFormActions>
    </UForm>
  </ContentEditorBodyLayout>
</template>
