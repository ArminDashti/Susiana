<script setup lang="ts">
import { APP_INFO } from '@/lib/app-info'

const stack = ['Vue 3', 'Vue Router', 'Vite', 'Tailwind CSS', 'Lucide icons']
</script>

<template>
  <section class="space-y-4 rounded-lg border bg-card p-4 text-card-foreground">
    <div>
      <p class="text-base font-semibold">{{ APP_INFO.name }}</p>
      <p class="text-sm text-muted-foreground">{{ APP_INFO.tagline }}</p>
    </div>
    <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      <dt class="text-muted-foreground">Version</dt>
      <dd class="font-mono">{{ APP_INFO.version }}</dd>
      <dt class="text-muted-foreground">Created by</dt>
      <dd>{{ APP_INFO.author }}</dd>
      <dt class="text-muted-foreground">Built with</dt>
      <dd>{{ stack.join(', ') }}</dd>
    </dl>
  </section>
</template>
