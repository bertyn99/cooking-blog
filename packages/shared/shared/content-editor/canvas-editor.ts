import { onBeforeUnmount, reactive, watch } from 'vue'

export function useCanvasEditorProps<K extends string>(
  props: Record<string, unknown>,
  keys: readonly K[],
  emit: (event: 'update:props', value: Record<string, string>) => void,
  delay = 300,
) {
  const draft = reactive(
    Object.fromEntries(keys.map(key => [key, String(props[key] ?? '')])) as Record<K, string>,
  )

  watch(
    () => keys.map(key => String(props[key] ?? '')).join('\0'),
    () => {
      for (const key of keys) {
        draft[key] = String(props[key] ?? '')
      }
    },
  )

  let timer: ReturnType<typeof setTimeout> | undefined

  function snapshot(): Record<string, string> {
    const next: Record<string, string> = {}
    for (const key of keys) {
      next[key] = draft[key] ?? ''
    }
    return next
  }

  function persist() {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
    emit('update:props', snapshot())
  }

  function schedulePersist() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(persist, delay)
  }

  onBeforeUnmount(persist)

  return { draft, persist, schedulePersist }
}
