declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    username: string | null
    role: 'admin' | 'editor'
    createdAt: string
    updatedAt: string
  }

  interface UserSession {
    loggedInAt?: number
  }
}

export {}
