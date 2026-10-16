<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { APP_INFO } from '@/lib/app-info'

const categories = ['Bug', 'Idea', 'Question'] as const

const category = ref<(typeof categories)[number]>('Idea')
const message = ref('')

function sendFeedback() {
  const subject = `[${APP_INFO.name}] ${category.value}`
  const body = `${message.value.trim()}\n\n---\nVersion: ${APP_INFO.version}`
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
</script>

<template>
  <form class="space-y-4 rounded-lg border bg-card p-4 text-card-foreground" @submit.prevent="sendFeedback">
    <label class="block space-y-1 text-sm">
      <span class="font-medium">Type</span>
      <select
        v-model="category"
        class="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
      </select>
    </label>
    <label class="block space-y-1 text-sm">
      <span class="font-medium">Message</span>
      <textarea
        v-model="message"
        rows="6"
        required
        placeholder="Tell us what you think"
        class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
    <div class="flex items-center gap-3 pt-2">
      <Button type="submit" size="sm">Send feedback</Button>
      <p class="text-xs text-muted-foreground">Opens your email app.</p>
    </div>
  </form>
</template>
