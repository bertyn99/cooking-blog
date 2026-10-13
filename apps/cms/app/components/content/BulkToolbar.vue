<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  selectedCount: number
  selectedHint?: string
  canChangeStatus: boolean
  statusItems: DropdownMenuItem[]
  loading: boolean
  deleteDescription: string
  deleteDisabled?: boolean
  deleteDisabledReason?: string
}>()

const deleteOpen = defineModel<boolean>('deleteOpen', { default: false })

const emit = defineEmits<{
  clear: []
  confirmDelete: [close: () => void]
}>()
</script>

<template>
  <div
    v-if="selectedCount"
    class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-default/70 bg-elevated/50 px-3 py-2"
  >
    <p class="text-sm font-medium text-highlighted">
      {{ selectedCount }} sélectionné(s)
      <span
        v-if="selectedHint"
        class="font-normal text-muted"
      >
        · {{ selectedHint }}
      </span>
    </p>
    <div class="flex flex-wrap items-center gap-1.5">
      <UDropdownMenu
        v-if="canChangeStatus"
        :items="statusItems"
        :content="{ align: 'end' }"
      >
        <UButton
          label="Statut"
          color="neutral"
          variant="outline"
          size="sm"
          trailing-icon="i-lucide-chevron-down"
          :disabled="loading"
        />
      </UDropdownMenu>
      <slot name="before-delete" />
      <UButton
        label="Supprimer"
        color="error"
        variant="subtle"
        size="sm"
        icon="i-lucide-trash"
        :disabled="loading || deleteDisabled"
        @click="deleteOpen = true"
      />
      <UModal
        v-model:open="deleteOpen"
        title="Supprimer la sélection ?"
        :ui="{ footer: 'justify-end' }"
      >
        <template #body>
          <p class="text-sm text-muted">
            {{ deleteDescription }}
          </p>
          <p
            v-if="deleteDisabledReason"
            class="mt-2 text-sm text-error"
          >
            {{ deleteDisabledReason }}
          </p>
        </template>
        <template #footer>
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            :disabled="loading"
            @click="deleteOpen = false"
          />
          <UButton
            label="Supprimer"
            color="error"
            :loading="loading"
            :disabled="deleteDisabled"
            @click="emit('confirmDelete', () => { deleteOpen = false })"
          />
        </template>
      </UModal>
      <UButton
        label="Annuler"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="loading"
        @click="emit('clear')"
      />
    </div>
  </div>
</template>
