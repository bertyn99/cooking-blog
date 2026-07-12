<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const appConfig = useAppConfig()
const { user, logout } = useAuth()
const router = useRouter()

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const displayName = computed(() => user.value?.username || user.value?.email || 'Utilisateur')

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: displayName.value,
  avatar: {
    alt: displayName.value,
    icon: 'i-lucide-user'
  }
}], [{
  label: 'Apparence',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Clair',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'light'
    }
  }, {
    label: 'Sombre',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'dark'
    }
  }]
}, {
  label: 'Couleur primaire',
  icon: 'i-lucide-palette',
  children: colors.map(color => ({
    label: color,
    chip: color,
    slot: 'chip',
    type: 'checkbox',
    checked: appConfig.ui.colors.primary === color,
    onSelect: (e: Event) => {
      e.preventDefault()
      appConfig.ui.colors.primary = color
    }
  }))
}, {
  label: 'Couleur neutre',
  icon: 'i-lucide-circle',
  children: neutrals.map(color => ({
    label: color,
    chip: color === 'neutral' ? 'old-neutral' : color,
    slot: 'chip',
    type: 'checkbox',
    checked: appConfig.ui.colors.neutral === color,
    onSelect: (e: Event) => {
      e.preventDefault()
      appConfig.ui.colors.neutral = color
    }
  }))
}], [{
  label: 'Se déconnecter',
  icon: 'i-lucide-log-out',
  onSelect: () => {
    logout()
    router.push('/login')
  }
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :label="collapsed ? undefined : displayName"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      icon="i-lucide-user"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex size-5 shrink-0 items-center justify-center">
        <span
          class="size-2 rounded-full bg-(--chip-light) ring ring-bg dark:bg-(--chip-dark)"
          :style="{
            '--chip-light': `var(--color-${(item as { chip: string }).chip}-500)`,
            '--chip-dark': `var(--color-${(item as { chip: string }).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
