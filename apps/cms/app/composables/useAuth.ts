import type { SafeUser } from '~/types/cms'

interface LoginResponse {
  token: string
  user: SafeUser
}

interface SessionResponse {
  user: SafeUser
}

export function useAuth() {
  const token = useCookie<string | null>('cms_token', {
    maxAge: 60 * 60,
    sameSite: 'lax'
  })
  const user = useState<SafeUser | null>('auth-user', () => null)
  const pending = useState('auth-pending', () => false)

  const isAuthenticated = computed(() => !!token.value)

  async function fetchSession() {
    if (!token.value) {
      user.value = null
      return null
    }

    pending.value = true
    try {
      const { user: sessionUser } = await $fetch<SessionResponse>('/api/auth/session', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      user.value = sessionUser
      return sessionUser
    } catch {
      token.value = null
      user.value = null
      return null
    } finally {
      pending.value = false
    }
  }

  async function login(email: string, password: string) {
    const response = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })

    token.value = response.token
    user.value = response.user
    return response
  }

  function logout() {
    token.value = null
    user.value = null
  }

  return {
    token,
    user,
    pending,
    isAuthenticated,
    login,
    logout,
    fetchSession
  }
}
