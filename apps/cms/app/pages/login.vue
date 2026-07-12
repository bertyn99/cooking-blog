<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  layout: false,
  middleware: []
})

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: '',
  password: ''
})

const { login, isAuthenticated } = useAuth()
const toast = useToast()
const loading = ref(false)
const router = useRouter()

onMounted(async () => {
  if (isAuthenticated.value) {
    await router.push('/')
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await login(event.data.email, event.data.password)
    await navigateTo('/')
  } catch (error: unknown) {
    const message = error instanceof Error
      ? error.message
      : 'Identifiants invalides'

    toast.add({
      title: 'Connexion impossible',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UApp>
    <div class="flex min-h-svh items-center justify-center p-4">
      <UPageCard class="w-full max-w-md">
        <div class="mb-6 text-center">
          <UIcon name="i-lucide-chef-hat" class="mx-auto mb-3 size-10 text-primary" />
          <h1 class="text-xl font-semibold text-highlighted">
            Journal du Cuistot
          </h1>
          <p class="mt-1 text-sm text-muted">
            Connectez-vous pour gérer le contenu
          </p>
        </div>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="admin@journalducuistot.fr"
              icon="i-lucide-mail"
              autocomplete="email"
            />
          </UFormField>

          <UFormField label="Mot de passe" name="password">
            <UInput
              v-model="state.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              autocomplete="current-password"
            />
          </UFormField>

          <UButton
            type="submit"
            block
            :loading="loading"
            icon="i-lucide-log-in"
          >
            Se connecter
          </UButton>
        </UForm>
      </UPageCard>
    </div>
  </UApp>
</template>
