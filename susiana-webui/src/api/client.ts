export type ListResponse<T> = {
  data: T[]
  page: number
  limit: number
  total: number
}

const API_BASE_KEY = 'susiana_api_base'

function readApiBase(): string {
  const stored =
    typeof localStorage !== 'undefined' ? localStorage.getItem(API_BASE_KEY)?.trim() : ''
  const env = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
  return (stored || env).replace(/\/$/, '')
}

export function apiPath(path: string): string {
  if (path.startsWith('http')) return path
  const base = readApiBase()
  return `${base}${path}`
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = apiPath(path)
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message || `HTTP ${res.status}`)
  }
  return (await res.json()) as T
}
