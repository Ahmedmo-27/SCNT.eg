/**
 * Base URL for the Express API (/api/*).
 * - Dev (vite): defaults to same-origin `/api`, which is proxied to the server (see vite.config.ts).
 * - Production: set VITE_API_URL to the public API origin, e.g. https://api.example.com/api
 */
import { clearStoredAuthToken, getStoredAuthToken } from '../lib/authStorage'

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  '/api'

type ApiEnvelope<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string }

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function errorMessageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message
    if (typeof m === 'string') return m
  }
  if (typeof body === 'string' && body.length > 0) return body
  return fallback
}

/** Raw GET — use for routes that do not return `{ data }` (e.g. /api/health). */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  const body = await parseBody(res)
  if (!res.ok) throw new Error(errorMessageFromBody(body, res.statusText))
  return body as T
}

/** GET and unwrap `data` from the server's success envelope. */
export async function apiGetData<T>(path: string): Promise<T> {
  const body = await apiGet<ApiEnvelope<T>>(path)
  if (!body || typeof body !== 'object' || !('success' in body)) {
    throw new Error('Invalid API response')
  }
  if (!body.success) throw new Error(body.message)
  return body.data
}

/** GET with Bearer token; clears stored token on 401. */
export async function apiGetDataAuthed<T>(path: string): Promise<T> {
  const token = getStoredAuthToken()
  if (!token) throw new Error('Not signed in')

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const parsed = await parseBody(res)
  if (res.status === 401) clearStoredAuthToken()
  if (!res.ok) throw new Error(errorMessageFromBody(parsed, res.statusText))
  const body = parsed as ApiEnvelope<T>
  if (!body || typeof body !== 'object' || !('success' in body)) {
    throw new Error('Invalid API response')
  }
  if (!body.success) throw new Error(body.message)
  return body.data
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const parsed = await parseBody(res)
  if (!res.ok) throw new Error(errorMessageFromBody(parsed, res.statusText))
  return parsed as T
}

/** POST and unwrap `data` from the server's success envelope. */
export async function apiPostData<T>(path: string, body: unknown): Promise<T> {
  const envelope = await apiPost<ApiEnvelope<T>>(path, body)
  if (!envelope || typeof envelope !== 'object' || !('success' in envelope)) {
    throw new Error('Invalid API response')
  }
  if (!envelope.success) throw new Error(envelope.message)
  return envelope.data
}

/** POST with Bearer token; clears stored token on 401. */
export async function apiPostDataAuthed<T>(path: string, body: unknown): Promise<T> {
  const token = getStoredAuthToken()
  if (!token) throw new Error('Not signed in')

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const parsed = await parseBody(res)
  if (res.status === 401) clearStoredAuthToken()
  if (!res.ok) throw new Error(errorMessageFromBody(parsed, res.statusText))
  const envelope = parsed as ApiEnvelope<T>
  if (!envelope || typeof envelope !== 'object' || !('success' in envelope)) {
    throw new Error('Invalid API response')
  }
  if (!envelope.success) throw new Error(envelope.message)
  return envelope.data
}

/** PATCH with Bearer token; clears stored token on 401. */
export async function apiPatchDataAuthed<T>(path: string, body: unknown): Promise<T> {
  const token = getStoredAuthToken()
  if (!token) throw new Error('Not signed in')

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const parsed = await parseBody(res)
  if (res.status === 401) clearStoredAuthToken()
  if (!res.ok) throw new Error(errorMessageFromBody(parsed, res.statusText))
  const envelope = parsed as ApiEnvelope<T>
  if (!envelope || typeof envelope !== 'object' || !('success' in envelope)) {
    throw new Error('Invalid API response')
  }
  if (!envelope.success) throw new Error(envelope.message)
  return envelope.data
}

/** PUT with Bearer token; clears stored token on 401. */
export async function apiPutDataAuthed<T>(path: string, body: unknown): Promise<T> {
  const token = getStoredAuthToken()
  if (!token) throw new Error('Not signed in')

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const parsed = await parseBody(res)
  if (res.status === 401) clearStoredAuthToken()
  if (!res.ok) throw new Error(errorMessageFromBody(parsed, res.statusText))
  const envelope = parsed as ApiEnvelope<T>
  if (!envelope || typeof envelope !== 'object' || !('success' in envelope)) {
    throw new Error('Invalid API response')
  }
  if (!envelope.success) throw new Error(envelope.message)
  return envelope.data
}

/** DELETE with Bearer token; clears stored token on 401. */
export async function apiDeleteDataAuthed<T>(path: string): Promise<T> {
  const token = getStoredAuthToken()
  if (!token) throw new Error('Not signed in')

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  const parsed = await parseBody(res)
  if (res.status === 401) clearStoredAuthToken()
  if (!res.ok) throw new Error(errorMessageFromBody(parsed, res.statusText))
  const envelope = parsed as ApiEnvelope<T>
  if (!envelope || typeof envelope !== 'object' || !('success' in envelope)) {
    throw new Error('Invalid API response')
  }
  if (!envelope.success) throw new Error(envelope.message)
  return envelope.data
}
