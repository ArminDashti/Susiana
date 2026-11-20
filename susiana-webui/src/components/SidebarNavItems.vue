<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import type { NavItem } from '@/lib/navigation'

const route = useRoute()

defineProps<{
  items: NavItem[]
  isOpen: (key: string, items: NavItem[]) => boolean
  toggle: (key: string, items: NavItem[]) => void
  linkClass: (to: string) => string
}>()
</script>

<template>
  <template v-for="item in items" :key="item.key">
    <div v-if="item.to && item.children?.length" class="mb-1">
      <div class="flex items-center gap-1">
        <RouterLink
          :to="item.to"
          class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
          :class="route.path === item.to ? linkClass(item.to) : 'text-foreground/80 hover:bg-accent'"
        >
          <component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" />
          <span class="truncate">{{ item.label }}</span>
        </RouterLink>
        <button
          type="button"
          class="rounded-md p-1.5 text-foreground/80 hover:bg-accent"
          :aria-expanded="isOpen(item.key, item.children)"
          :aria-label="`Toggle ${item.label}`"
          @click="toggle(item.key, item.children)"
        >
          <ChevronDown
            class="h-3.5 w-3.5 shrink-0 transition-transform"
            :class="isOpen(item.key, item.children) ? '' : '-rotate-90'"
          />
        </button>
      </div>
      <div v-show="isOpen(item.key, item.children)" class="ml-3 mt-0.5 border-l pl-2">
        <SidebarNavItems
          :items="item.children"
          :is-open="isOpen"
          :toggle="toggle"
          :link-class="linkClass"
        />
      </div>
    </div>
    <RouterLink
      v-else-if="item.to"
      :to="item.to"
      class="text-sm"
      :class="linkClass(item.to)"
    >
      <component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" />
      <span class="truncate">{{ item.label }}</span>
    </RouterLink>
    <div v-else class="mb-1">
      <button
        type="button"
        class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-accent"
        :aria-expanded="isOpen(item.key, item.children ?? [])"
        @click="toggle(item.key, item.children ?? [])"
      >
        <span class="truncate">{{ item.label }}</span>
        <ChevronDown
          class="h-3.5 w-3.5 shrink-0 transition-transform"
          :class="isOpen(item.key, item.children ?? []) ? '' : '-rotate-90'"
        />
      </button>
      <div v-show="isOpen(item.key, item.children ?? [])" class="ml-3 mt-0.5 border-l pl-2">
        <SidebarNavItems
          :items="item.children ?? []"
          :is-open="isOpen"
          :toggle="toggle"
          :link-class="linkClass"
        />
      </div>
    </div>
  </template>
</template>
