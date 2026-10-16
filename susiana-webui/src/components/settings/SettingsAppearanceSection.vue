<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY, type ThemeMode } from '@/lib/theme'

const LOCALE_STORAGE_KEY = 'susiana_locale'

const theme = ref<ThemeMode>(getStoredTheme())
const locale = ref(localStorage.getItem(LOCALE_STORAGE_KEY) ?? 'en')
const saved = ref(false)

function save() {
  localStorage.setItem(THEME_STORAGE_KEY, theme.value)
  localStorage.setItem(LOCALE_STORAGE_KEY, locale.value)
  applyTheme(theme.value)
  saved.value = true
  window.setTimeout(() => {
    saved.value = false
  }, 1500)
}
</script>

<template>
  <form class="space-y-4 rounded-lg border bg-card p-4 text-card-foreground" @submit.prevent="save">
    <label class="block space-y-1 text-sm">
      <span class="font-medium">Theme</span>
      <select
        v-model="theme"
        class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <label class="block space-y-1 text-sm">
      <span class="font-medium">Language</span>
      <select
        v-model="locale"
        class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="en">English</option>
        <option value="fa">فارسی</option>
      </select>
    </label>
    <div class="flex items-center gap-3 pt-2">
      <Button type="submit" size="sm">Save</Button>
      <p v-if="saved" class="text-sm text-primary">Saved.</p>
    </div>
  </form>
</template>
