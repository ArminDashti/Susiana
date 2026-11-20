<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const username = ref('armin')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const router = useRouter()
const route = useRoute()

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    login(username.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="s-app-bg flex min-h-full flex-col lg:flex-row">
    <section
      class="flex flex-1 flex-col justify-between border-b border-border/70 px-6 py-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-14"
    >
      <div class="max-w-md">
        <div class="mb-6 flex items-center gap-3">
          <span class="s-brand-mark" aria-hidden="true" />
          <p class="text-2xl font-semibold tracking-tight">Susiana</p>
        </div>
        <p class="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          One desk for Tehran equities, global indexes, commodities, and rates — tuned for reading tables, not
          decorating dashboards.
        </p>
      </div>
      <dl class="mt-10 grid max-w-md gap-4 text-sm lg:mt-0">
        <div class="s-panel-inset px-4 py-3">
          <dt class="text-muted-foreground">Coverage</dt>
          <dd class="mt-1 font-medium">TSE, commodities, FX, crypto, regional indexes</dd>
        </div>
        <div class="s-panel-inset px-4 py-3">
          <dt class="text-muted-foreground">Data</dt>
          <dd class="mt-1 font-mono text-xs text-foreground/90">Live when the API stream is connected</dd>
        </div>
      </dl>
    </section>

    <section class="flex flex-1 items-center justify-center px-6 py-12 lg:px-10">
      <form class="s-panel w-full max-w-sm space-y-5 p-7" @submit.prevent="onSubmit">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">Sign in</h1>
          <p class="mt-1 text-sm text-muted-foreground">Use your Susiana account</p>
        </div>
        <label class="block space-y-1.5 text-sm">
          <span>Username</span>
          <input
            v-model="username"
            autocomplete="username"
            class="s-field"
          />
        </label>
        <label class="block space-y-1.5 text-sm">
          <span>Password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="s-field"
          />
        </label>
        <p v-if="error" class="rounded-md border border-ask/35 bg-ask/10 px-3 py-2 text-sm text-ask">
          {{ error }}
        </p>
        <Button class="w-full" type="submit" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </Button>
      </form>
    </section>
  </div>
</template>