export interface StaffUserPublic {
  id: number
  email: string
  username: string | null
  role: 'admin' | 'editor' | 'agent'
  isActive: boolean
  deactivatedAt: string | null
  createdAt: string
  updatedAt: string
}
