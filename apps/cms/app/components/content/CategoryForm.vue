<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { ContentStatus } from '~/types/cms'

const schema = z.object({
  type: z.enum(['blog', 'recette']),
  name: z.string().min(1, 'Nom requis'),
  desc: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']),
})

type Schema = z.output<typeof schema>

const { $api } = useNuxtApp()
const toast = useToast()
const router = useRouter()
const saving = ref(false)

const state = reactive<Schema>({
  type: 'blog',
  name: '',
  desc: '',
  status: 'published',
})

const typeOptions = [
  { label: 'Blog (articles)', value: 'blog' },
  { label: 'Recette', value: 'recette' },
] as const

const statusOptions: { label: string, value: ContentStatus }[] = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Publié', value: 'published' },
  { label: 'Planifié', value: 'scheduled' },
]

const isRecipeType = computed(() => state.type === 'recette')

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const body = {
      name: state.name.trim(),
      status: state.status,
      locale: 'fr',
      ...(isRecipeType.value && state.desc?.trim()
        ? { desc: state.desc.trim() }
        : {}),
    }

    const endpoint = state.type === 'blog'
      ? '/api/category-articles'
      : '/api/categories'

    const created = await $api<{ data: { slug: string } }>(endpoint, {
      method: 'POST',
      body,
    })

    await refreshNuxtData(['categories-recipes-list', 'categories-articles-list'])

    toast.add({
      title: 'Catégorie créée',
      description: `Slug : ${created.data.slug}`,
      color: 'success',
    })
    await router.push('/categories')
  }
  catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de créer la catégorie',
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="mx-auto max-w-lg space-y-4" @submit="onSubmit">
    <UFormField label="Type" name="type" required>
      <USelect
        v-model="state.type"
        :items="[...typeOptions]"
        class="w-full"
      />
      <template #hint>
        Les catégories blog et recette sont enregistrées dans des tables distinctes.
      </template>
    </UFormField>

    <UFormField label="Nom" name="name" required>
      <UInput v-model="state.name" placeholder="Ex. Pâtisserie" autocomplete="off" />
      <template #hint>
        Le slug est généré automatiquement à partir du nom.
      </template>
    </UFormField>

    <UFormField v-if="isRecipeType" label="Description" name="desc">
      <UTextarea
        v-model="state.desc"
        :rows="3"
        placeholder="Courte description (optionnelle)"
      />
    </UFormField>

    <UFormField label="Statut" name="status">
      <USelect
        v-model="state.status"
        :items="statusOptions"
        class="w-full"
      />
    </UFormField>

    <div
      class="flex flex-wrap items-center gap-2 border-t border-default pt-4"
    >
      <UButton
        type="submit"
        icon="i-lucide-plus"
        label="Créer la catégorie"
        :loading="saving"
      />
      <UButton
        to="/categories"
        label="Annuler"
        color="neutral"
        variant="ghost"
      />
    </div>
  </UForm>
</template>
