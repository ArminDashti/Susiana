<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
    <p class="font-medium text-foreground">{{ route.meta.title }}</p>
    <p class="mt-1">This page is not built yet.</p>
  </div>
</template>
