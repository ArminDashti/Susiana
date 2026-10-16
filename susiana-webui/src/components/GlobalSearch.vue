<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'

export type SearchItem = { label: string; to: string; group: string }

const props = defineProps<{ items: SearchItem[] }>()

const router = useRouter()
const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const isOpen = ref(false)
const activeIndex = ref(0)

const results = computed<SearchItem[]>(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return props.items
  return props.items.filter(
    (item) =>
      item.label.toLowerCase().includes(term) || item.group.toLowerCase().includes(term),
  )
})

function openResults() {
  isOpen.value = true
  activeIndex.value = 0
}

function closeResults() {
  isOpen.value = false
  query.value = ''
}

function go(item: SearchItem) {
  closeResults()
  inputRef.value?.blur()
  router.push(item.to)
}

function onKeydown(event: KeyboardEvent) {
  if (!isOpen.value || results.value.length === 0) {
    if (event.key === 'Escape') closeResults()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % results.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length
  } else if (event.key === 'Enter') {
    event.preventDefault()
    go(results.value[activeIndex.value])
  } else if (event.key === 'Escape') {
    closeResults()
    inputRef.value?.blur()
  }
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (next && rootRef.value?.contains(next)) return
  isOpen.value = false
}

function onGlobalShortcut(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    inputRef.value?.focus()
    openResults()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalShortcut))
</script>

<template>
  <div ref="rootRef" class="relative w-full max-w-sm" @focusout="onFocusOut">
    <Search class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <input
      ref="inputRef"
      v-model="query"
      type="search"
      role="combobox"
      aria-label="Search pages"
      aria-autocomplete="list"
      :aria-expanded="isOpen"
      placeholder="Search pages... (Ctrl+K)"
      class="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      @focus="openResults"
      @input="activeIndex = 0; isOpen = true"
      @keydown="onKeydown"
    />
    <ul
      v-if="isOpen"
      role="listbox"
      class="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-md border bg-card py-1 shadow-md"
    >
      <li v-if="results.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
        No pages found
      </li>
      <li
        v-for="(item, index) in results"
        :key="item.to"
        role="option"
        :aria-selected="index === activeIndex"
        class="flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm"
        :class="index === activeIndex ? 'bg-accent' : 'hover:bg-accent/60'"
        @mousedown.prevent="go(item)"
        @mouseenter="activeIndex = index"
      >
        <span class="truncate">{{ item.label }}</span>
        <span class="shrink-0 text-xs text-muted-foreground">{{ item.group }}</span>
      </li>
    </ul>
  </div>
</template>
