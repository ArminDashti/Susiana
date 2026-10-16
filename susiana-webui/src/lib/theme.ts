export type ThemeMode = 'system' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'susiana_theme'

export function getStoredTheme(): ThemeMode {
  const value = localStorage.getItem(THEME_STORAGE_KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'dark'
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark)
  root.classList.toggle('dark', isDark)
}
