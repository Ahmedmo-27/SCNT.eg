import { apiGetDataAuthed, apiPatchDataAuthed, apiPostData } from './api'

export type AuthUser = {
  id: string
  full_name: string
  email: string
  role: string
  address?: {
    fullName?: string
    phone?: string
    city?: string
    addressLine1?: string
    addressLine2?: string
    postalCode?: string
  }
  createdAt?: string
}

export type RegisterPayload = {
  full_name: string
  email: string
  password: string
  address?: {
    fullName?: string
    phone?: string
    city?: string
    addressLine1?: string
    addressLine2?: string
    postalCode?: string
  }
}

export type AuthSuccess = {
  user: AuthUser
  token: string
}

export type UpdateProfilePayload = {
  full_name?: string
  email?: string
  address?: {
    fullName?: string
    phone?: string
    city?: string
    addressLine1?: string
    addressLine2?: string
    postalCode?: string
  }
}

export type LoginPayload = {
  email: string
  password: string
}

/** Deduplicate concurrent verifies for the same token (e.g. React StrictMode double mount). */
const verifyEmailInflight = new Map<string, Promise<AuthUser>>()

export function verifyEmailWithToken(token: string): Promise<AuthUser> {
  const trimmed = token.trim()
  if (!trimmed) return Promise.reject(new Error('Verification token is required'))

  const existing = verifyEmailInflight.get(trimmed)
  if (existing) return existing

  const pending = apiPostData<AuthUser>('/auth/verify-email', { token: trimmed }).finally(() => {
    verifyEmailInflight.delete(trimmed)
  })
  verifyEmailInflight.set(trimmed, pending)
  return pending
}

export function registerAccount(payload: RegisterPayload): Promise<AuthSuccess> {
  return apiPostData<AuthSuccess>('/auth/register', payload)
}

export function login(payload: LoginPayload): Promise<AuthSuccess> {
  return apiPostData<AuthSuccess>('/auth/login', payload)
}

export function fetchProfile(): Promise<AuthUser> {
  return apiGetDataAuthed<AuthUser>('/auth/me')
}

export function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  return apiPatchDataAuthed<AuthUser>('/auth/me', payload)
}
