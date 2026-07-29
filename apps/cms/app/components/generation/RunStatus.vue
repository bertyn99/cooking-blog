<script setup lang="ts">
import type { GenerationProgress, GenerationRun, GenerationStepKey } from '~/types/generation'
import {
  GENERATION_RUN_STATUS_LABELS,
  GENERATION_STEP_LABELS,
} from '~/types/generation'

const props = defineProps<{
  run: GenerationRun
  progress: GenerationProgress | null
}>()

function stepStatusColor(status: string) {
  switch (status) {
    case 'succeeded':
      return 'success' as const
    case 'running':
      return 'info' as const
    case 'failed':
      return 'error' as const
    case 'skipped':
      return 'neutral' as const
    default:
      return 'neutral' as const
  }
}

function runStatusColor(status: GenerationRun['status']) {
  switch (status) {
    case 'awaiting_review':
    case 'awaiting_selection':
      return 'warning' as const
    case 'approved':
      return 'success' as const
    case 'failed':
    case 'rejected':
    case 'canceled':
      return 'error' as const
    case 'running':
    case 'revising':
      return 'info' as const
    case 'queued':
      return 'neutral' as const
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

const orderedSteps = computed(() => {
  const steps = [...(props.run.steps ?? [])]
  return steps.sort((a, b) => a.ordinal - b.ordinal)
})

const progressLabel = computed(() => {
  if (!props.progress) return null
  const key = props.progress.stepKey
  if (key === 'queued' || key === 'awaiting_review' || key === 'failed') {
    return key
  }
  return GENERATION_STEP_LABELS[key as GenerationStepKey] ?? key
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <UBadge
        :color="runStatusColor(run.status)"
        variant="subtle"
      >
        {{ GENERATION_RUN_STATUS_LABELS[run.status] }}
      </UBadge>
      <UBadge
        color="neutral"
        variant="outline"
      >
        {{ run.targetType === 'recipe' ? 'Recette' : 'Article' }}
      </UBadge>
      <span
        v-if="progressLabel"
        class="text-sm text-muted"
      >
        Dernière étape : {{ progressLabel }}
        <template v-if="progress?.message">
          — {{ progress.message }}
        </template>
      </span>
    </div>

    <UAlert
      v-if="run.lastError"
      color="error"
      variant="subtle"
      title="Erreur"
      :description="run.lastError"
    />

    <ul class="space-y-2">
      <li
        v-for="step in orderedSteps"
        :key="step.id"
        class="flex items-start justify-between gap-3 rounded-lg border border-default/60 px-3 py-2"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted">
            {{ GENERATION_STEP_LABELS[step.stepKey] }}
          </p>
          <p
            v-if="step.lastError"
            class="mt-1 text-xs text-error"
          >
            {{ step.lastError }}
          </p>
        </div>
        <UBadge
          :color="stepStatusColor(step.status)"
          variant="subtle"
          class="shrink-0"
        >
          {{ step.status }}
        </UBadge>
      </li>
    </ul>
  </div>
</template>
