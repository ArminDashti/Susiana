<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getStoredUser, logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const API_BASE_KEY = 'susiana_api_base'

const router = useRouter()
const user = getStoredUser()
const apiBase = ref(localStorage.getItem(API_BASE_KEY) ?? '')
const saved = ref(false)

function saveApiBase() {
  localStorage.setItem(API_BASE_KEY, apiBase.value.trim())
  saved.value = true
  window.setTimeout(() => {
    saved.value = false
  }, 1500)
}

function onSignOut() {
  logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-lg border bg-card p-4 text-card-foreground">
      <p class="text-sm font-medium">{{ user?.display_name ?? 'User' }}</p>
      <p class="text-xs text-muted-foreground">{{ user?.username }}</p>
      <Button variant="outline" size="sm" class="mt-4" @click="onSignOut">Sign out</Button>
    </section>

    <form class="space-y-2 rounded-lg border bg-card p-4 text-card-foreground" @submit.prevent="saveApiBase">
      <label class="block space-y-1 text-sm">
        <span class="font-medium">API base URL</span>
        <span class="block text-xs text-muted-foreground">Optional. Leave empty to use the Vite proxy.</span>
        <input
          v-model="apiBase"
          placeholder="http://127.0.0.1:8080"
          class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div class="flex items-center gap-3 pt-2">
        <Button type="submit" size="sm">Save</Button>
        <p v-if="saved" class="text-sm text-primary">Saved.</p>
      </div>
    </form>
  </div>
</template>
