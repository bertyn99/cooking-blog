<script setup lang="ts">
import type { ContentStatus } from '~/types/cms'
import type { AdminPublishContentType } from '~/composables/useContentPublishing'
import SchedulePublicationPickerContent from '~/components/content/SchedulePublicationPickerContent.vue'

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
  <div v-if="showActions" class="contents">
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

    <div
      v-else
      class="inline-flex items-stretch shadow-sm"
    >
      <UButton
        type="button"
        icon="i-lucide-send"
        label="Publier"
        color="success"
        variant="solid"
        :loading="publishing"
        :disabled="scheduling"
        class="rounded-r-none transition-transform active:scale-[0.98]"
        @click="onPublishNow"
      />

      <UPopover
        v-model:open="scheduleOpen"
        :content="{ side: 'bottom', align: 'end' }"
        :ui="{ content: 'p-0' }"
      >
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
          class="rounded-l-none -ml-px transition-transform active:scale-[0.98]"
        />

        <template #content>
          <SchedulePublicationPickerContent
            v-if="scheduleOpen"
            :loading="scheduling"
            @confirm="onConfirmSchedule"
            @cancel="scheduleOpen = false"
          />
        </template>
      </UPopover>
    </div>
  </div>
</template>
