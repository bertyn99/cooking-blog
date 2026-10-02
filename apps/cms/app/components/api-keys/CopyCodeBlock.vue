<script setup lang="ts">
const props = defineProps<{
  label?: string
  code: string
  filename?: string
}>()

const toast = useToast()
const { copy, copied, isSupported } = useClipboard()

async function copyCode() {
  if (!isSupported.value) {
    toast.add({
      title: 'Copie impossible',
      description: 'Sélectionnez le texte et copiez-le manuellement.',
      color: 'warning',
    })
    return
  }
  try {
    await copy(props.code)
    toast.add({ title: 'Copié', color: 'success' })
  }
  catch {
    toast.add({
      title: 'Copie impossible',
      description: 'Sélectionnez le texte et copiez-le manuellement.',
      color: 'warning',
    })
  }
}
</script>

<template>
  <div class="overflow-hidden rounded-md border border-default/60 bg-elevated/50">
    <div class="flex items-center gap-2 border-b border-default/50 bg-elevated/80 px-3 py-2">
      <UIcon
        name="i-lucide-file-json"
        class="size-3.5 shrink-0 text-muted"
      />
      <span class="min-w-0 flex-1 truncate font-mono text-xs text-toned">
        {{ filename || label || 'configuration' }}
      </span>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :label="copied ? 'Copié' : 'Copier'"
        @click="copyCode"
      />
    </div>
    <pre class="max-h-56 overflow-auto p-3 text-[11px] leading-relaxed sm:text-xs"><code class="font-mono text-highlighted/90">{{ code }}</code></pre>
  </div>
</template>
