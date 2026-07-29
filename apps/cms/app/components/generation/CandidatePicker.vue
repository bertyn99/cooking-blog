<script setup lang="ts">
import type { DiscoverCandidate } from '~/types/generation'

const props = defineProps<{
  candidates: DiscoverCandidate[]
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [candidateIds: string[]]
}>()

const selected = ref<string[]>([])

watch(
  () => props.candidates,
  (list) => {
    selected.value = list.map(c => c.id)
  },
  { immediate: true },
)

function toggle(id: string) {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter(item => item !== id)
  }
  else {
    selected.value = [...selected.value, id]
  }
}

function selectAll() {
  selected.value = props.candidates.map(c => c.id)
}

function clearAll() {
  selected.value = []
}

function submit() {
  emit('select', [...selected.value])
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2">
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        @click="selectAll"
      >
        Tout sélectionner
      </UButton>
      <UButton
        size="sm"
        color="neutral"
        variant="ghost"
        @click="clearAll"
      >
        Tout désélectionner
      </UButton>
    </div>

    <ul class="space-y-2">
      <li
        v-for="candidate in candidates"
        :key="candidate.id"
      >
        <button
          type="button"
          class="flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition"
          :class="selected.includes(candidate.id)
            ? 'border-primary bg-primary/5'
            : 'border-default/60 hover:bg-elevated/40'"
          @click="toggle(candidate.id)"
        >
          <UCheckbox
            :model-value="selected.includes(candidate.id)"
            class="mt-0.5 pointer-events-none"
          />
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-medium text-highlighted truncate">
                {{ candidate.title }}
              </p>
              <UBadge
                size="sm"
                color="neutral"
                variant="subtle"
              >
                {{ candidate.targetType === 'recipe' ? 'Recette' : 'Article' }}
              </UBadge>
            </div>
            <p class="text-xs text-muted line-clamp-2">
              {{ candidate.markdown.slice(0, 180) }}…
            </p>
          </div>
        </button>
      </li>
    </ul>

    <UButton
      icon="i-lucide-play"
      :loading="loading"
      :disabled="loading || selected.length === 0"
      @click="submit"
    >
      Lancer {{ selected.length }} génération{{ selected.length > 1 ? 's' : '' }}
    </UButton>
  </div>
</template>
