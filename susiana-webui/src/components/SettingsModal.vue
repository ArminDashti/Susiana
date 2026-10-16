<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const apiBase = ref('')
const theme = ref('dark')
const locale = ref('en')
const saved = ref(false)
let savedTimeout: number | undefined

function applyTheme(value: string) {
  const root = document.documentElement
  if (value === 'dark') root.classList.add('dark')
  else if (value === 'light') root.classList.remove('dark')
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark')
  else root.classList.remove('dark')
}

function loadFromStorage() {
  apiBase.value = localStorage.getItem('susiana_api_base') ?? ''
  theme.value = localStorage.getItem('susiana_theme') ?? 'dark'
  locale.value = localStorage.getItem('susiana_locale') ?? 'en'
  saved.value = false
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadFromStorage()
      applyTheme(theme.value)
    }
  },
  { immediate: true },
)

function close() {
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (props.open && event.key === 'Escape') close()
}

function save() {
  localStorage.setItem('susiana_api_base', apiBase.value)
  localStorage.setItem('susiana_theme', theme.value)
  localStorage.setItem('susiana_locale', locale.value)
  applyTheme(theme.value)
  saved.value = true
  window.clearTimeout(savedTimeout)
  savedTimeout = window.setTimeout(() => {
    saved.value = false
  }, 1500)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.clearTimeout(savedTimeout)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="settings-modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="close"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          class="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg"
        >
          <div class="mb-4 flex items-center justify-between">
            <h2 id="settings-modal-title" class="text-base font-semibold">Settings</h2>
            <Button variant="ghost" size="sm" class="px-2" title="Close" aria-label="Close" @click="close">
              <X class="h-4 w-4" />
            </Button>
          </div>

          <form class="space-y-4" @submit.prevent="save">
            <label class="block space-y-1 text-sm">
              <span>api_base_url (optional override; leave empty to use Vite proxy)</span>
              <input
                v-model="apiBase"
                placeholder="http://127.0.0.1:8080"
                class="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label class="block space-y-1 text-sm">
              <span>theme</span>
              <select
                v-model="theme"
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="system">system</option>
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </label>
            <label class="block space-y-1 text-sm">
              <span>locale</span>
              <select
                v-model="locale"
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="en">en</option>
                <option value="fa">fa</option>
              </select>
            </label>
            <div class="flex items-center gap-3">
              <button
                type="submit"
                class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Save
              </button>
              <p v-if="saved" class="text-sm text-primary">Saved.</p>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.settings-modal-enter-active,
.settings-modal-leave-active {
  transition: opacity 200ms ease;
}

.settings-modal-enter-from,
.settings-modal-leave-to {
  opacity: 0;
}
</style>
