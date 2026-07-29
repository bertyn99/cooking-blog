<script setup lang="ts">
import type { GenerationRun, GenerationRunListResponse } from '~/types/generation'

const props = defineProps<{
  targetType: 'article' | 'recipe'
  contentId: number
  requiresHumanReview?: boolean | null
}>()

const { $api } = useNuxtApp()

const { data } = await useAsyncData(
  () => `generation-banner-${props.targetType}-${props.contentId}`,
  () => $api<GenerationRunListResponse>('/api/admin/generation-runs', {
    query: props.targetType === 'article'
      ? { articleId: props.contentId, limit: 1 }
      : { recipeId: props.contentId, limit: 1 },
  }),
  {
    watch: [() => props.contentId, () => props.targetType],
    server: false,
  },
)

const latestRun = computed<GenerationRun | null>(() => data.value?.data?.[0] ?? null)

const show = computed(() => {
  return Boolean(props.requiresHumanReview) || latestRun.value?.status === 'awaiting_review'
    || latestRun.value?.status === 'revising'
})

const description = computed(() => {
  const run = latestRun.value
  if (!run) {
    return 'Ce contenu a été généré par l’IA et nécessite une relecture avant publication.'
  }
  if (run.status === 'awaiting_review') {
    return 'Un run IA attend une relecture croisée. La publication admin reste bloquée tant que le run n’est pas approuvé sur la version courante.'
  }
  if (run.status === 'approved') {
    return 'Run IA approuvé — un admin peut publier si la version correspond encore.'
  }
  if (run.status === 'revising') {
    return 'L’agent applique les corrections demandées…'
  }
  return 'Ce contenu est lié à un run de génération IA.'
})
</script>

<template>
  <UAlert
    v-if="show"
    color="warning"
    variant="subtle"
    title="Relecture IA requise"
    :description="description"
    class="mb-4"
  >
    <template
      v-if="latestRun"
      #actions
    >
      <UButton
        :to="`/generate/${latestRun.id}`"
        size="sm"
        color="warning"
        variant="soft"
        icon="i-lucide-sparkles"
      >
        Voir le run
      </UButton>
    </template>
  </UAlert>
</template>
