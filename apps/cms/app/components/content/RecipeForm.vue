<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { slugifyString } from '#shared/slug'
import type { ContentStatus, PaginatedResponse } from '~/types/cms'

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
})

type Schema = z.output<typeof schema>

interface RecipeIngredientRow {
  name: string
  qty?: number
  unit: z.infer<typeof ingredientUnitSchema>
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
    ingredients?: Array<{
      name: string
      qty?: number | null
      unit?: string | null
    }>
    nutrition?: RecipeNutritionInitial | null
    seo?: RecipeSeoInitial | null
  }
}>()

const { $api } = useNuxtApp()
const toast = useToast()
const router = useRouter()
const saving = ref(false)
const publishing = ref(false)

const state = reactive<Schema>({
  title: props.initial?.title ?? '',
  slug: props.initial?.slug ?? '',
  intro: props.initial?.intro ?? '',
  step: props.initial?.step ?? '',
  difficulty: props.initial?.difficulty ?? 'easy',
  time: props.initial?.time,
  categoryId: props.initial?.categoryId,
  coverBlobPathname: props.initial?.coverBlobPathname ?? null,
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

const status = computed(() => props.initial?.status ?? 'draft')

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

function regenerateSlug() {
  if (!state.title.trim()) {
    toast.add({ title: 'Saisissez un titre d\'abord', color: 'warning' })
    return
  }
  state.slug = slugifyString(state.title)
}

function addIngredient() {
  ingredients.value.push({ name: '', unit: 'none' })
}

function removeIngredient(index: number) {
  ingredients.value.splice(index, 1)
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
    ingredients: buildIngredientsPayload(),
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

async function publishRecipe() {
  publishing.value = true
  try {
    const id = props.recipeId ?? await saveRecipe()
    if (!id) return

    await $api(`/api/admin/recipes/${id}/publish`, { method: 'POST' })
    toast.add({ title: 'Recette publiée', color: 'success' })
    await router.push('/recipes')
  }
  catch {
    toast.add({ title: 'Erreur', description: 'Impossible de publier la recette', color: 'error' })
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
              placeholder="Titre de la recette"
              class="w-full"
            />
          </UFormField>
        </div>

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
        :display-name="initial?.coverDisplayName"
      />
    </div>

    <ContentSeoPanel
      v-model:description="seoState.description"
      v-model:keywords="seoState.keywords"
      v-model:meta-robots="seoState.metaRobots"
      :has-entry="hasSeoEntry"
    />

    <div>
      <ContentFieldLabel label="intro" />
      <UFormField name="intro" :ui="{ label: 'hidden' }">
        <UTextarea v-model="state.intro" :rows="4" placeholder="Courte introduction…" class="w-full" />
      </UFormField>
    </div>

    <div class="rounded-lg border border-default bg-elevated/20 p-3">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ContentFieldLabel label="ingredients" :count="ingredients.length" />
        <UButton
          type="button"
          size="xs"
          variant="soft"
          icon="i-lucide-plus"
          label="Ajouter"
          @click="addIngredient"
        />
      </div>

      <p v-if="!ingredients.length" class="text-sm text-muted">
        Aucun ingrédient. Cliquez sur Ajouter pour commencer.
      </p>

      <ul v-else class="space-y-2">
        <li
          v-for="(row, index) in ingredients"
          :key="index"
          class="grid gap-2 rounded-md border border-default bg-default p-2 sm:grid-cols-[1fr_5rem_8rem_auto]"
        >
          <UInput v-model="row.name" placeholder="Nom" />
          <UInput v-model.number="row.qty" type="number" min="0" step="any" placeholder="Qté" />
          <USelect v-model="row.unit" :items="unitOptions" />
          <UButton
            type="button"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            aria-label="Supprimer"
            @click="removeIngredient(index)"
          />
        </li>
      </ul>
    </div>

    <div class="rounded-lg border border-default bg-elevated/20 p-3">
      <ContentFieldLabel label="nutrition" :count="hasNutritionEntry ? 1 : 0" />
      <p class="mb-3 text-xs text-muted">
        Mêmes champs que Strapi (bandeau sur le site) : valeurs libres, ex. 22g, 380 kcal.
      </p>
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
    </div>

    <div>
      <ContentFieldLabel label="step" />
      <p class="mb-2 text-xs text-muted">
        Comme sur journalducuistot.fr : une étape par ligne numérotée (1. …, 2. …). Markdown et images possibles.
      </p>
      <UFormField name="step" :ui="{ label: 'hidden' }">
        <ContentMarkdownEditor v-model="state.step" />
      </UFormField>
    </div>

    <div class="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 border-t border-default bg-default/90 py-4 backdrop-blur">
      <UBadge v-if="recipeId" variant="subtle" class="capitalize">
        {{ status }}
      </UBadge>

      <UButton
        type="submit"
        icon="i-lucide-save"
        label="Enregistrer"
        :loading="saving"
      />

      <UButton
        v-if="recipeId && status !== 'published'"
        icon="i-lucide-send"
        label="Publier"
        color="success"
        variant="soft"
        :loading="publishing"
        @click="publishRecipe"
      />

      <UButton
        to="/recipes"
        label="Retour"
        color="neutral"
        variant="ghost"
      />
    </div>
  </UForm>
</template>
