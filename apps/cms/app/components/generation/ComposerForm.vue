<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { GenerationSourceKind, GenerationTargetType } from '~/types/generation'
import { useGenerationComposer } from '~/composables/useGenerationComposer'

const schema = z.object({
  targetType: z.enum(['article', 'recipe']),
  sourceKind: z.enum(['paste', 'article', 'ebook']),
  title: z.string().optional(),
  sourceUrl: z.union([z.literal(''), z.string().url('URL invalide')]).optional(),
  markdown: z.string().min(40, 'Collez au moins quelques phrases de contenu'),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  targetType: 'recipe',
  sourceKind: 'paste',
  title: '',
  sourceUrl: '',
  markdown: '',
})

const { submitting, createRun } = useGenerationComposer()

const targetItems = [
  { value: 'recipe' as const, label: 'Recette', description: 'Ingrédients, étapes, temps' },
  { value: 'article' as const, label: 'Article', description: 'Texte éditorial / conseils' },
]

const sourceItems = [
  { value: 'paste' as const, label: 'Coller du texte', description: 'Copier-coller libre' },
  { value: 'article' as const, label: 'Article source', description: 'Texte + URL optionnelle' },
  { value: 'ebook' as const, label: 'Ebook (texte)', description: 'Multi-recettes / articles' },
]

const sourceHint = computed(() => {
  const kind = state.sourceKind as GenerationSourceKind
  switch (kind) {
    case 'paste':
      return 'Collez notes, brouillon ou transcription. L’agent structurera le contenu et cherchera des mots-clés SEO.'
    case 'article':
      return 'Collez le corps de l’article. Ajoutez l’URL source si vous l’avez — le fetch auto viendra plus tard.'
    case 'ebook':
      return 'Collez le texte de l’ebook : on détecte automatiquement plusieurs recettes/articles (titres # / ##), puis vous choisissez lesquels générer.'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const data = event.data
  await createRun({
    targetType: data.targetType as GenerationTargetType,
    sourcePack: {
      sourceKind: data.sourceKind as GenerationSourceKind,
      title: data.title?.trim() || undefined,
      locale: 'fr',
      markdown: data.markdown.trim(),
      sourceUrl: data.sourceUrl?.trim() || undefined,
    },
  })
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-6"
    @submit="onSubmit"
  >
    <UFormField
      name="targetType"
      label="Type de contenu"
      required
    >
      <URadioGroup
        v-model="state.targetType"
        :items="targetItems"
        orientation="horizontal"
        variant="card"
      />
    </UFormField>

    <UFormField
      name="sourceKind"
      label="Source"
      required
      :hint="sourceHint"
    >
      <URadioGroup
        v-model="state.sourceKind"
        :items="sourceItems"
        orientation="horizontal"
        variant="card"
      />
    </UFormField>

    <UFormField
      name="title"
      label="Titre indicatif"
      hint="Optionnel — l’agent peut le reformuler"
    >
      <UInput
        v-model="state.title"
        placeholder="Ex. Tarte aux pommes de saison"
      />
    </UFormField>

    <UFormField
      v-if="state.sourceKind === 'article'"
      name="sourceUrl"
      label="URL source"
      hint="Optionnel pour l’instant"
    >
      <UInput
        v-model="state.sourceUrl"
        type="url"
        placeholder="https://…"
      />
    </UFormField>

    <UFormField
      name="markdown"
      label="Contenu source"
      required
      hint="Markdown ou texte brut"
    >
      <UTextarea
        v-model="state.markdown"
        :rows="16"
        autoresize
        class="w-full font-mono text-sm"
        placeholder="# Titre&#10;&#10;Collez ici le texte à transformer…"
      />
    </UFormField>

    <div class="flex flex-wrap items-center gap-3">
      <UButton
        type="submit"
        icon="i-lucide-sparkles"
        :loading="submitting"
        :disabled="submitting"
      >
        Lancer la génération
      </UButton>
      <p class="text-sm text-muted">
        L’agent utilise Workers AI + Nuxt SEO Pro (mots-clés) puis crée un brouillon à relire.
      </p>
    </div>
  </UForm>
</template>
