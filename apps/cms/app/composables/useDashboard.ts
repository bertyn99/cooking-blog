import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-a': () => router.push('/articles'),
    'g-r': () => router.push('/recipes'),
    'g-p': () => router.push('/pages'),
    'g-c': () => router.push('/categories'),
    'g-m': () => router.push('/media')
  })

  watch(() => route.fullPath, () => {
    // Reserved for future slideover state
  })

  return {}
}

export const useDashboard = createSharedComposable(_useDashboard)
