<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage } from '#shared/api-error'
import { z } from 'zod'

definePageMeta({
  layout: false,
  middleware: [],
})

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  email: '',
  password: '',
})

const { loggedIn, fetch: fetchSession } = useUserSession()
const loading = ref(false)
const router = useRouter()
const submitError = ref<string>()
const formRef = useTemplateRef('formRef')

function clearLoginErrors() {
  submitError.value = undefined
  formRef.value?.clear('password')
}

function setLoginError(message: string) {
  submitError.value = message
  formRef.value?.setErrors([{ name: 'password', message }])
}

onMounted(async () => {
  if (!loggedIn.value) {
    await fetchSession()
  }
  if (loggedIn.value) {
    await router.push('/')
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  clearLoginErrors()
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: event.data,
    })
    await fetchSession()
    await navigateTo('/')
  }
  catch (error: unknown) {
    setLoginError(getApiErrorMessage(error, 'Identifiants invalides'))
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-svh items-center justify-center overflow-hidden p-4 sm:p-6">
    <div
      class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-orange-50 via-stone-50 to-orange-100 dark:from-stone-950 dark:via-stone-900 dark:to-orange-950"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-orange-300/30 via-transparent to-transparent dark:from-orange-800/20"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.15] [background-image:linear-gradient(to_right,var(--ui-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--ui-border)_1px,transparent_1px)] [background-size:3rem_3rem]"
      aria-hidden="true"
    />

    <UPageCard
      class="w-full max-w-md"
      variant="subtle"
      spotlight
      spotlight-color="primary"
      :ui="{
        root: 'shadow-xl shadow-orange-500/10 ring-1 ring-orange-500/10 backdrop-blur-sm',
        container: 'p-6 sm:p-8',
      }"
    >
      <div class="flex w-full flex-col items-center text-center">
        <div
          class="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-sm"
        >
          <UIcon name="i-lucide-chef-hat" class="size-9 text-primary" />
        </div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Journal du Cuistot
        </h1>
        <p class="mt-1 text-sm text-muted">
          Connectez-vous pour gérer le contenu
        </p>
      </div>

      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        :loading-auto="false"
        class="mt-6 w-full space-y-5"
        :on-submit="onSubmit"
      >
        <UFormField name="email" label="Email">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="admin@journalducuistot.fr"
            icon="i-lucide-mail"
            autocomplete="email"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField name="password" label="Mot de passe">
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
            autocomplete="current-password"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="submitError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Connexion impossible"
          :description="submitError"
          role="alert"
        />

        <UButton
          type="submit"
          label="Se connecter"
          icon="i-lucide-log-in"
          size="lg"
          block
          :loading="loading"
        />
      </UForm>

      <p class="mt-6 text-center text-xs text-muted">
        Accès réservé aux administrateurs
      </p>
    </UPageCard>
  </div>
</template>
