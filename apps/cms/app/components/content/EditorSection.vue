<script setup lang="ts">
const props = defineProps<{
  label: string
  count?: number
  description?: string
  anchor?: string
  /** Wrap fields in the same bordered surface as Général / SEO */
  surface?: boolean
  /** Surface without padding (markdown editor chrome edge-to-edge). */
  flushSurface?: boolean
}>()

const sectionId = computed(() => props.anchor ?? undefined)
</script>

<template>
  <section
    :id="sectionId"
    class="scroll-mt-[7.25rem] space-y-3"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <ContentFieldLabel
          :label="label"
          :count="count"
          size="section"
        />
        <p
          v-if="description"
          class="mt-1 max-w-prose text-sm text-muted"
        >
          {{ description }}
        </p>
      </div>
      <slot name="actions" />
    </div>
    <ContentEditorSurface v-if="surface" :flush="flushSurface">
      <slot />
    </ContentEditorSurface>
    <slot v-else />
  </section>
</template>
