<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { PaginatedResponse } from '~/types/cms'

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  slug: z.string().optional(),
  intro: z.string().optional(),
  step: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  time: z.number().int().positive().optional(),
  categoryId: z.number().optional(),
})

type Schema = z.output<typeof schema>

const props = defineProps<{
  recipeId?: number
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
  intro: props.initial?.intro ?? '',
  step: props.initial?.step ?? '',
  difficulty: props.initial?.difficulty ?? 'easy',
  time: props.initial?.time,
  categoryId: props.initial?.categoryId,
})

const status = computed(() => props.initial?.status ?? 'draft')

const difficultyOptions = [
  { label: 'Facile', value: 'easy' },
  { label: 'Moyen', value: 'medium' },
  { label: 'Difficile', value: 'hard' },
]

const { data: categories } = await useAsyncData('recipe-category-options', () =>
  $api<PaginatedResponse<{ id: number, name: string }>>('/api/categories', {
    query: { pageSize: 100 },
  }),
)

const categoryOptions = computed(() =>
  (categories.value?.data ?? []).map(category => ({
    label: category.name,
    value: category.id,
  })),
)

async function saveRecipe(): Promise<number | undefined> {
  const body = {
    title: state.title,
    slug: state.slug || undefined,
    intro: state.intro || undefined,
    step: state.step || undefined,
    difficulty: state.difficulty,
    time: state.time,
    categoryId: state.categoryId,
  }

  if (props.recipeId) {
    await $api(`/api/recipes/${props.recipeId}`, { method: 'PUT', body })
    return props.recipeId
  }

  const created = await $api<{ id: number }>('/api/recipes', { method: 'POST', body })
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
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField label="Titre" name="title" required>
      <UInput v-model="state.title" placeholder="Titre de la recette" />
    </UFormField>

    <UFormField label="Slug" name="slug" hint="Généré automatiquement si vide">
      <UInput v-model="state.slug" placeholder="ma-recette" />
    </UFormField>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Difficulté" name="difficulty">
        <USelect v-model="state.difficulty" :items="difficultyOptions" class="w-full" />
      </UFormField>

      <UFormField label="Temps (min)" name="time">
        <UInput v-model.number="state.time" type="number" min="1" placeholder="45" />
      </UFormField>
    </div>

    <UFormField label="Catégorie recette" name="categoryId">
      <USelect
        v-model="state.categoryId"
        :items="categoryOptions"
        placeholder="Choisir une catégorie"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Introduction" name="intro">
      <UTextarea v-model="state.intro" :rows="4" placeholder="Courte introduction…" />
    </UFormField>

    <UFormField label="Étapes (Markdown)" name="step">
      <UTextarea v-model="state.step" :rows="16" placeholder="Décrivez les étapes…" />
    </UFormField>

    <div class="flex flex-wrap items-center gap-2 border-t border-default pt-4">
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
