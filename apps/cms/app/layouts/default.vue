<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)
const { user } = useUserSession()

useDashboard()

const isAdmin = computed(() => user.value?.role === 'admin')

const links = computed(() => {
  const primary: NavigationMenuItem[] = [{
    label: 'Tableau de bord',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
    onSelect: () => { open.value = false },
  }, {
    label: 'Contenu',
    icon: 'i-lucide-files',
    defaultOpen: true,
    type: 'trigger',
    children: [{
      label: 'Articles',
      icon: 'i-lucide-newspaper',
      to: '/articles',
      onSelect: () => { open.value = false },
    }, {
      label: 'Recettes',
      icon: 'i-lucide-utensils',
      to: '/recipes',
      onSelect: () => { open.value = false },
    }, {
      label: 'Pages',
      icon: 'i-lucide-file-text',
      to: '/pages',
      onSelect: () => { open.value = false },
    }, {
      label: 'Planning',
      icon: 'i-lucide-calendar-days',
      to: '/planning',
      onSelect: () => { open.value = false },
    }, {
      label: 'Génération IA',
      icon: 'i-lucide-sparkles',
      to: '/generate',
      onSelect: () => { open.value = false },
    }, {
      label: 'Inbox relecture',
      icon: 'i-lucide-inbox',
      to: '/generate/review',
      onSelect: () => { open.value = false },
    }],
  }, {
    label: 'Taxonomie',
    icon: 'i-lucide-tags',
    defaultOpen: true,
    type: 'trigger',
    children: [{
      label: 'Catégories',
      icon: 'i-lucide-folder',
      to: '/categories',
      onSelect: () => { open.value = false },
    }],
  }, {
    label: 'Médias',
    icon: 'i-lucide-image',
    to: '/media',
    onSelect: () => { open.value = false },
  }]

  if (isAdmin.value) {
    primary.push(
      {
        label: 'Équipe',
        icon: 'i-lucide-users',
        to: '/staff',
        onSelect: () => { open.value = false },
      },
      {
        label: 'Clés API & transfert',
        icon: 'i-lucide-key-round',
        to: '/api-keys',
        onSelect: () => { open.value = false },
      },
      {
        label: 'Import Strapi',
        icon: 'i-lucide-download',
        to: '/import',
        onSelect: () => { open.value = false },
      },
      {
        label: 'Maintenance',
        icon: 'i-lucide-wrench',
        to: '/maintenance',
        onSelect: () => { open.value = false },
      },
    )
  }

  const secondary: NavigationMenuItem[] = [{
    label: 'Site public',
    icon: 'i-lucide-external-link',
    to: 'https://journalducuistot.fr',
    target: '_blank',
  }, {
    label: 'Documentation Nuxt UI',
    icon: 'i-lucide-book-open',
    to: 'https://ui.nuxt.com',
    target: '_blank',
  }]

  return [primary, secondary] satisfies NavigationMenuItem[][]
})

const groups = computed(() => [{
  id: 'links',
  label: 'Navigation',
  items: links.value.flat(),
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="cms"
      v-model:open="open"
      collapsible
      resizable
      :ui="{ footer: 'lg:border-t lg:border-default/60' }"
    >
      <template #header="{ collapsed }">
        <BrandMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip popover />

        <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" tooltip class="mt-auto" />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
