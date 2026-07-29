<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { getApiErrorMessage } from '#shared/api-error'
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

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'admin@journalducuistot.fr',
    icon: 'i-lucide-mail',
    autocomplete: 'email',
    required: true,
    size: 'lg',
    defaultValue: '',
  },
  {
    name: 'password',
    type: 'password',
    label: 'Mot de passe',
    placeholder: '••••••••',
    icon: 'i-lucide-lock',
    autocomplete: 'current-password',
    required: true,
    size: 'lg',
    defaultValue: '',
  }
]

const { loggedIn, fetch: fetchSession } = useUserSession()
const loading = ref(false)
const router = useRouter()
const submitError = ref<string>()
const authForm = useTemplateRef('authForm')

function clearLoginErrors() {
  submitError.value = undefined
  authForm.value?.formRef?.clear('password')
}

function setLoginError(message: string) {
  submitError.value = message
  authForm.value?.formRef?.setErrors([
    { name: 'password', message },
  ])
}

function getLoginErrorMessage(error: unknown): string {
  return getApiErrorMessage(error, 'Identifiants invalides')
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
  } catch (error: unknown) {
    setLoginError(getLoginErrorMessage(error))
  } finally {
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
        container: 'p-6 sm:p-8'
      }"
    >
      <UAuthForm
        ref="authForm"
        :fields="fields"
        :schema="schema"
        title="Journal du Cuistot"
        description="Connectez-vous pour gérer le contenu"
        :loading="loading"
        :submit="{
          label: 'Se connecter',
          icon: 'i-lucide-log-in',
          size: 'lg',
          block: true
        }"
        :ui="{
          root: 'w-full',
          header: 'items-center text-center',
          title: 'text-2xl font-semibold tracking-tight',
          description: 'text-sm',
          form: 'space-y-5',
          leadingIcon: 'hidden'
        }"
        :on-submit="onSubmit"
      >
        <template #validation>
          <UAlert
            v-if="submitError"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-alert"
            title="Connexion impossible"
            :description="submitError"
          />
        </template>

        <template #leading>
          <div
            class="mb-1 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-sm"
          >
            <UIcon name="i-lucide-chef-hat" class="size-9 text-primary" />
          </div>
        </template>

        <template #footer>
          <p class="text-center text-xs text-muted">
            Accès réservé aux administrateurs
          </p>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
