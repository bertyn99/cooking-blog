<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { slugifyString } from '#shared/slug'
import type { ContentStatus, PaginatedResponse } from '~/types/cms'
import type { EditorNavSection } from '~/types/content-editor'

const ingredientUnitSchema = z.enum(['none', 'g', 'mg', 'kg', 'l', 'ml', 'cuillere_soupe', 'cuillere_cafe', 'tasse'])

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  slug: z.string().optional(),
  intro: z.string().optional(),
  step: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  time: z.number().int().positive().optional(),
  categoryId: z.number().optional(),
  coverBlobPathname: z.string().nullable().optional(),
  coverAltText: z.string().nullable().optional(),
  coverDescription: z.string().nullable().optional(),
})

type Schema = z.output<typeof schema>

interface RecipeIngredientRow {
  name: string
  qty?: number
  unit: z.infer<typeof ingredientUnitSchema>
}

interface RecipeUtensilRow {
  name: string
  note?: string
  affiliateUrl?: string
}

interface RecipeSeoInitial {
  description?: string | null
  keywords?: string | null
  metaRobots?: string | null
}

interface RecipeNutritionInitial {
  lipides?: string | null
  proteine?: string | null
  sucre?: string | null
  calories?: string | null
  glucides?: string | null
  sodium?: string | null
}

const props = defineProps<{
  recipeId?: number
  initial?: Partial<Schema> & {
    status?: string
    coverDisplayName?: string | null
    coverAltText?: string | null
    coverDescription?: string | null
    ingredients?: Array<{
      name: string
      qty?: number | null
      unit?: string | null
    }>
    utensils?: Array<{
      name: string
      note?: string | null
      affiliateUrl?: string | null
    }>
    nutrition?: RecipeNutritionInitial | null
    seo?: RecipeSeoInitial | null
  }
}>()

const { $api } = useNuxtApp()
const toast = useToast()
const router = useRouter()
const saving = ref(false)
const formRef = ref<{ submit: () => Promise<void> } | null>(null)
const ingredientListRef = ref<{ addRow: () => void } | null>(null)
const utensilListRef = ref<{ addRow: () => void } | null>(null)

const state = reactive<Schema>({
  title: props.initial?.title ?? '',
  slug: props.initial?.slug ?? '',
  intro: props.initial?.intro ?? '',
  step: props.initial?.step ?? '',
  difficulty: props.initial?.difficulty ?? 'easy',
  time: props.initial?.time,
  categoryId: props.initial?.categoryId,
  coverBlobPathname: props.initial?.coverBlobPathname ?? null,
  coverAltText: props.initial?.coverAltText ?? null,
  coverDescription: props.initial?.coverDescription ?? null,
})

const seoState = reactive({
  description: props.initial?.seo?.description ?? '',
  keywords: props.initial?.seo?.keywords ?? '',
  metaRobots: props.initial?.seo?.metaRobots ?? 'index, follow',
})

const ingredients = ref<RecipeIngredientRow[]>(
  (props.initial?.ingredients ?? []).map(row => ({
    name: row.name,
    qty: row.qty ?? undefined,
    unit: (row.unit as RecipeIngredientRow['unit']) || 'none',
  })),
)

const utensils = ref<RecipeUtensilRow[]>(
  (props.initial?.utensils ?? []).map(row => ({
    name: row.name,
    note: row.note ?? undefined,
    affiliateUrl: row.affiliateUrl ?? undefined,
  })),
)

const nutritionState = reactive({
  lipides: props.initial?.nutrition?.lipides ?? '',
  proteine: props.initial?.nutrition?.proteine ?? '',
  sucre: props.initial?.nutrition?.sucre ?? '',
  calories: props.initial?.nutrition?.calories ?? '',
  glucides: props.initial?.nutrition?.glucides ?? '',
  sodium: props.initial?.nutrition?.sodium ?? '',
})

const hasNutritionEntry = computed(() =>
  Object.values(nutritionState).some(v => String(v).trim()),
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

const difficultyOptions = [
  { label: 'Facile', value: 'easy' },
  { label: 'Moyen', value: 'medium' },
  { label: 'Difficile', value: 'hard' },
]

const unitOptions = [
  { label: '—', value: 'none' },
  { label: 'g', value: 'g' },
  { label: 'mg', value: 'mg' },
  { label: 'kg', value: 'kg' },
  { label: 'l', value: 'l' },
  { label: 'ml', value: 'ml' },
  { label: 'c. à soupe', value: 'cuillere_soupe' },
  { label: 'c. à café', value: 'cuillere_cafe' },
  { label: 'tasse', value: 'tasse' },
]

const { data: categories } = await useAsyncData('recipe-category-options', () =>
  $api<PaginatedResponse<{ id: number, name: string, status: ContentStatus }>>('/api/categories', {
    query: { pageSize: 100 },
  }),
)

const categoryRows = computed(() => categories.value?.data ?? [])

const editorSections: EditorNavSection[] = [
  { id: 'editor-general', label: 'Général' },
  { id: 'editor-seo', label: 'SEO' },
  { id: 'editor-intro', label: 'Introduction' },
  { id: 'editor-ingredients', label: 'Ingrédients' },
  { id: 'editor-ustensiles', label: 'Ustensiles' },
  { id: 'editor-nutrition', label: 'Nutrition' },
  { id: 'editor-step', label: 'Préparation' },
]

function regenerateSlug() {
  if (!state.title.trim()) {
    toast.add({ title: 'Saisissez un titre d\'abord', color: 'warning' })
    return
  }
  state.slug = slugifyString(state.title)
}

function addIngredient() {
  ingredientListRef.value?.addRow()
}

function addUtensil() {
  utensilListRef.value?.addRow()
}

async function saveSeo(recipeId: number) {
  const body = {
    description: seoState.description || undefined,
    keywords: seoState.keywords || undefined,
    metaRobots: seoState.metaRobots || undefined,
  }

  const hasContent = body.description || body.keywords || body.metaRobots
  if (!hasContent && !props.initial?.seo) {
    return
  }

  await $api(`/api/seo/recipe/${recipeId}`, {
    method: 'PUT',
    body,
  })
}

function buildIngredientsPayload() {
  return ingredients.value
    .filter(row => row.name.trim())
    .map((row, index) => ({
      name: row.name.trim(),
      qty: row.qty,
      unit: row.unit,
      sortOrder: index,
    }))
}

function buildUtensilsPayload() {
  return utensils.value
    .filter(row => row.name.trim())
    .map((row, index) => ({
      name: row.name.trim(),
      note: row.note?.trim() || undefined,
      affiliateUrl: row.affiliateUrl?.trim() || undefined,
      sortOrder: index,
    }))
}

function buildNutritionPayload() {
  const payload = {
    lipides: nutritionState.lipides.trim() || undefined,
    proteine: nutritionState.proteine.trim() || undefined,
    sucre: nutritionState.sucre.trim() || undefined,
    calories: nutritionState.calories.trim() || undefined,
    glucides: nutritionState.glucides.trim() || undefined,
    sodium: nutritionState.sodium.trim() || undefined,
  }
  const hasAny = Object.values(payload).some(Boolean)
  return hasAny ? payload : {}
}

async function saveRecipe(): Promise<number | undefined> {
  const body = {
    title: state.title,
    slug: state.slug || undefined,
    intro: state.intro || undefined,
    step: state.step || undefined,
    difficulty: state.difficulty,
    time: state.time,
    categoryId: state.categoryId,
    coverBlobPathname: state.coverBlobPathname ?? undefined,
    coverAltText: state.coverAltText,
    coverDescription: state.coverDescription,
    ingredients: buildIngredientsPayload(),
    utensils: buildUtensilsPayload(),
    nutrition: buildNutritionPayload(),
  }

  if (props.recipeId) {
    await $api(`/api/recipes/${props.recipeId}`, { method: 'PUT', body })
    await saveSeo(props.recipeId)
    return props.recipeId
  }

  const created = await $api<{ id: number }>('/api/recipes', { method: 'POST', body })
  await saveSeo(created.id)
  await router.replace(`/recipes/${created.id}`)
  return created.id
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    await saveRecipe()
    toast.add({ title: 'Recette enregistrée', color: 'success' })
  }
  catch {
    toast.add({ title: 'Erreur', description: 'Impossible d\'enregistrer la recette', color: 'error' })
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
        <div class="mb-5">
          <ContentFieldLabel label="title" />
          <UFormField name="title" :ui="{ label: 'hidden' }">
            <UInput
              v-model="state.title"
              :size="recipeId ? 'lg' : 'xl'"
              variant="outline"
              :placeholder="recipeId ? 'Titre affiché sur le blog' : 'Titre de la recette'"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_11rem] lg:items-start">
          <div class="min-w-0 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <ContentFieldLabel label="slug" />
                <UFormField name="slug" :ui="{ label: 'hidden' }">
                  <UInput v-model="state.slug" placeholder="ma-recette">
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

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <ContentFieldLabel label="difficulty" />
                <UFormField name="difficulty" :ui="{ label: 'hidden' }">
                  <USelect v-model="state.difficulty" :items="difficultyOptions" class="w-full" />
                </UFormField>
              </div>

              <div>
                <ContentFieldLabel label="time" />
                <UFormField name="time" :ui="{ label: 'hidden' }">
                  <UInput v-model.number="state.time" type="number" min="1" placeholder="45" />
                </UFormField>
              </div>
            </div>
          </div>

          <ContentCoverField
            v-model="state.coverBlobPathname"
            v-model:cover-alt-text="state.coverAltText"
            v-model:cover-description="state.coverDescription"
            :display-name="initial?.coverDisplayName"
            :content-title="state.title"
            compact
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
        label="intro"
        anchor="editor-intro"
        surface
      >
        <UFormField name="intro" :ui="{ label: 'hidden' }">
          <UTextarea v-model="state.intro" :rows="4" placeholder="Courte introduction pour le blog…" class="w-full" />
        </UFormField>
      </ContentEditorSection>

      <ContentEditorSection
        label="ingredients"
        anchor="editor-ingredients"
      :count="ingredients.length"
      description="Quantités et unités affichées sur le blog. Faites défiler la liste si elle est longue."
    >
      <template #actions>
        <UButton
          v-if="ingredients.length"
          type="button"
          size="sm"
          variant="soft"
          icon="i-lucide-plus"
          label="Ajouter"
          @click="addIngredient"
        />
      </template>

      <ContentIngredientRows
        ref="ingredientListRef"
        v-model="ingredients"
        :unit-options="unitOptions"
      />
    </ContentEditorSection>

    <ContentEditorSection
      label="ustensiles"
      anchor="editor-ustensiles"
      :count="utensils.length"
      description="Matériel utile pour la recette. Lien affilié optionnel (Amazon, etc.)."
    >
      <template #actions>
        <UButton
          v-if="utensils.length"
          type="button"
          size="sm"
          variant="soft"
          icon="i-lucide-plus"
          label="Ajouter"
          @click="addUtensil"
        />
      </template>

      <ContentUtensilRows
        ref="utensilListRef"
        v-model="utensils"
      />
    </ContentEditorSection>

    <ContentEditorSection
      label="nutrition"
      anchor="editor-nutrition"
      :count="hasNutritionEntry ? 1 : 0"
      description="Bandeau nutrition du site : valeurs libres (ex. 22 g, 380 kcal)."
      surface
    >
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <UFormField label="Glucides">
          <UInput v-model="nutritionState.glucides" placeholder="30g" />
        </UFormField>
        <UFormField label="Protéines">
          <UInput v-model="nutritionState.proteine" placeholder="15g" />
        </UFormField>
        <UFormField label="Lipides">
          <UInput v-model="nutritionState.lipides" placeholder="22g" />
        </UFormField>
        <UFormField label="Calories">
          <UInput v-model="nutritionState.calories" placeholder="380 kcal" />
        </UFormField>
        <UFormField label="Sucre">
          <UInput v-model="nutritionState.sucre" placeholder="6g" />
        </UFormField>
        <UFormField label="Sodium">
          <UInput v-model="nutritionState.sodium" placeholder="450mg" />
        </UFormField>
      </div>
    </ContentEditorSection>

    <ContentEditorSection
      label="step"
      anchor="editor-step"
      description="Une étape par ligne numérotée (1. …, 2. …). Markdown et images possibles."
      surface
      flush-surface
    >
      <UFormField
        name="step"
        :ui="{ label: 'hidden', wrapper: 'm-0' }"
      >
        <ContentMarkdownEditor v-model="state.step" />
      </UFormField>
    </ContentEditorSection>

    <ContentEditorFormActions>
      <ContentStatusBadge
        v-if="recipeId"
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
          v-if="recipeId"
          content-type="recipes"
          :content-id="recipeId"
          :status="contentStatus"
          redirect-after-publish="/recipes"
          :ensure-saved="saveRecipe"
          @update:status="contentStatus = $event"
        />
    </ContentEditorFormActions>
    </UForm>
  </ContentEditorBodyLayout>
</template>
