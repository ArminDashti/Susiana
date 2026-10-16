<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { APP_INFO } from '@/lib/app-info'

function checkForUpdates() {
  window.location.reload()
}
</script>

<template>
  <section class="space-y-4 rounded-lg border bg-card p-4 text-card-foreground">
    <div class="flex items-center justify-between text-sm">
      <span class="text-muted-foreground">Current version</span>
      <span class="font-mono">{{ APP_INFO.version }}</span>
    </div>
    <p class="text-xs text-muted-foreground">
      Reloads the app so the newest build from the server is loaded.
    </p>
    <Button variant="outline" size="sm" @click="checkForUpdates">Check for updates</Button>
  </section>
</template>
