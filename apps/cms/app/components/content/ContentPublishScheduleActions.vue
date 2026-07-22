<script setup lang="ts">
import type { ContentStatus } from '~/types/cms'
import type { AdminPublishContentType } from '~/composables/useContentPublishing'

const props = defineProps<{
  contentType: AdminPublishContentType
  contentId?: number
  status: string
  ensureSaved: () => Promise<number | undefined>
  redirectAfterPublish?: string
}>()

const emit = defineEmits<{
  'update:status': [status: ContentStatus]
}>()

const router = useRouter()
const {
  publishing,
  scheduling,
  unpublishing,
  publishNow,
  scheduleOnDay,
  unpublishNow,
} = useContentPublishing(props.contentType)

const scheduleOpen = ref(false)

const isPublished = computed(() => props.status === 'published')
const showActions = computed(() => Boolean(props.contentId))
const showScheduleModal = computed(() => showActions.value && !isPublished.value)

function openScheduleModal() {
  scheduleOpen.value = true
}

async function onPublishNow() {
  const next = await publishNow(props.ensureSaved)
  if (next) {
    emit('update:status', next)
    if (props.redirectAfterPublish) {
      await router.push(props.redirectAfterPublish)
    }
  }
}

async function onUnpublish() {
  const next = await unpublishNow(props.ensureSaved)
  if (next) {
    emit('update:status', next)
  }
}

async function onConfirmSchedule(dayKey: string) {
  const next = await scheduleOnDay(props.ensureSaved, dayKey)
  if (next) {
    emit('update:status', next)
    scheduleOpen.value = false
  }
}
</script>

<template>
  <template v-if="showActions">
    <UButton
      v-if="isPublished"
      type="button"
      icon="i-lucide-eye-off"
      label="Dépublier"
      color="warning"
      variant="outline"
      :loading="unpublishing"
      class="transition-transform active:scale-[0.98]"
      @click="onUnpublish"
    />

    <UFieldGroup
      v-else
      orientation="horizontal"
      class="shadow-sm"
    >
      <UButton
        type="button"
        icon="i-lucide-send"
        label="Publier"
        color="success"
        variant="solid"
        :loading="publishing"
        :disabled="scheduling"
        class="min-w-[6.5rem] transition-transform active:scale-[0.98]"
        @click="onPublishNow"
      />
      <UButton
        type="button"
        icon="i-lucide-calendar-clock"
        color="success"
        variant="outline"
        square
        aria-label="Planifier la publication"
        title="Planifier la publication"
        :loading="scheduling"
        :disabled="publishing"
        class="relative z-[1] transition-transform active:scale-[0.98]"
        @click.stop.prevent="openScheduleModal"
      />
    </UFieldGroup>
  </template>

  <Teleport to="body">
    <SchedulePublicationModal
      v-if="showScheduleModal"
      v-model:open="scheduleOpen"
      :loading="scheduling"
      @confirm="onConfirmSchedule"
    />
  </Teleport>
</template>
