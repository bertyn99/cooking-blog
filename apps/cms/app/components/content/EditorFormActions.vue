<script setup lang="ts">
import { CONTENT_EDITOR_TOOLBAR_ID } from '~/utils/content-editor-toolbar'

const toolbarReady = ref(false)

function hasToolbarTarget() {
  return Boolean(document.getElementById(CONTENT_EDITOR_TOOLBAR_ID))
}

onMounted(async () => {
  await nextTick()
  toolbarReady.value = hasToolbarTarget()

  if (!toolbarReady.value) {
    const observer = new MutationObserver(() => {
      if (hasToolbarTarget()) {
        toolbarReady.value = true
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    onUnmounted(() => observer.disconnect())
  }
})
</script>

<template>
  <Teleport
    :to="`#${CONTENT_EDITOR_TOOLBAR_ID}`"
    :disabled="!toolbarReady"
  >
    <div
      class="flex flex-wrap items-center justify-end gap-2"
      :class="!toolbarReady ? 'border-t border-default pt-4' : ''"
    >
      <slot />
    </div>
  </Teleport>
</template>
