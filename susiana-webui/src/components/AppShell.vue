<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  ArrowRightLeft,
  Bitcoin,
  Cable,
  Castle,
  ChevronDown,
  Coins,
  Flag,
  Flame,
  Fuel,
  Gem,
  Globe,
  Hammer,
  LayoutDashboard,
  LogOut,
  Map,
  Mountain,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sunrise,
  Sun,
  Trophy,
} from 'lucide-vue-next'
import { getStoredUser, logout } from '@/lib/auth'
import { collectLinks, link, type NavGroup } from '@/lib/navigation'
import { buildStockMarketNav } from '@/lib/stock-market'
import { Button } from '@/components/ui/button'
import GlobalSearch, { type SearchItem } from '@/components/GlobalSearch.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import SidebarNavItems from '@/components/SidebarNavItems.vue'

const SIDEBAR_COLLAPSED_KEY = 'susiana.sidebar.collapsed'

const groups: NavGroup[] = [
  {
    label: 'Overview',
    items: [link('Dashboard', '/dashboard', LayoutDashboard)],
  },
  {
    label: 'Stock market',
    items: buildStockMarketNav(),
  },
  {
    label: 'Commodity',
    items: [
      link('Crude oil', '/commodity/crude-oil', Fuel),
      link('Natural gas', '/commodity/natural-gas', Flame),
      link('Gold', '/commodity/gold', Coins),
      link('Silver', '/commodity/silver', Gem),
      link('Copper', '/commodity/copper', Cable),
      link('Steel', '/commodity/steel', Hammer),
    ],
  },
  {
    label: 'Indexes',
    items: [
      link('Asia', '/indexes/asia', Globe),
      link('Top 30', '/indexes/top30', Trophy),
      link('Europe', '/indexes/europe', Castle),
      link('North America', '/indexes/north-america', Flag),
      link('South America', '/indexes/south-america', Mountain),
      link('Middle East', '/indexes/middle-east', Sun),
      link('Australia', '/indexes/australia', Sunrise),
      link('Africa', '/indexes/africa', Map),
    ],
  },
  {
    label: 'FX & crypto',
    items: [
      link('Currencies', '/currencies', ArrowRightLeft),
      link('Crypto', '/crypto-currencies', Bitcoin),
    ],
  },
]

const searchItems = computed<SearchItem[]>(() =>
  groups.flatMap((group) =>
    collectLinks(group.items).map((item) => ({ label: item.label, to: item.to, group: group.label })),
  ),
)

const route = useRoute()
const router = useRouter()
const user = computed(() => getStoredUser())

const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true')
// Open state per nav node, keyed by group label or nav item key. Unset means "open when it holds the active page".
const openNodes = ref<Record<string, boolean>>({})
const settingsOpen = ref(false)

function openSettings() {
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

watch(sidebarCollapsed, (value) => {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value))
})

function onLogout() {
  logout()
  router.push({ name: 'login' })
}

function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function containsActive(items: NavGroup['items']): boolean {
  return items.some(
    (item) =>
      (item.to !== undefined && isActive(item.to)) ||
      (item.children !== undefined && containsActive(item.children)),
  )
}

function isOpen(key: string, items: NavGroup['items']): boolean {
  return openNodes.value[key] ?? containsActive(items)
}

function toggleNode(key: string, items: NavGroup['items']) {
  openNodes.value[key] = !isOpen(key, items)
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function linkClass(to: string): string {
  return isActive(to) ? 'bg-primary/10 font-medium text-primary' : 'text-foreground/80 hover:bg-accent'
}

// Marks every folder on the path to the active page as open, so the current page is always visible.
function openActiveBranch(items: NavGroup['items']): boolean {
  let active = false
  for (const item of items) {
    const childActive = item.children !== undefined && openActiveBranch(item.children)
    const selfActive = item.to !== undefined && isActive(item.to)
    if (childActive) openNodes.value[item.key] = true
    if (childActive || selfActive) active = true
  }
  return active
}

watch(
  () => route.path,
  () => {
    for (const group of groups) {
      if (openActiveBranch(group.items)) {
        openNodes.value[group.label] = true
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex h-full min-h-0">
    <aside
      class="flex shrink-0 flex-col border-r bg-card transition-[width] duration-200"
      :class="sidebarCollapsed ? 'w-14' : 'w-60'"
    >
      <div class="flex items-center gap-2 border-b px-3 py-4">
        <div v-if="!sidebarCollapsed" class="min-w-0 flex-1">
          <RouterLink to="/dashboard" class="text-lg font-semibold tracking-tight">Susiana</RouterLink>
          <p class="text-xs text-muted-foreground">Market command center</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="shrink-0 px-2"
          :class="sidebarCollapsed ? 'mx-auto' : ''"
          :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleSidebar"
        >
          <PanelLeftOpen v-if="sidebarCollapsed" class="h-4 w-4" />
          <PanelLeftClose v-else class="h-4 w-4" />
        </Button>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 py-3">
        <!-- Collapsed: icons only, groups separated by dividers -->
        <template v-if="sidebarCollapsed">
          <template v-for="(group, index) in groups" :key="group.label">
            <div v-if="index > 0" class="my-2 border-t" />
            <RouterLink
              v-for="item in collectLinks(group.items)"
              :key="item.key"
              :to="item.to"
              :title="item.label"
              :aria-label="item.label"
              class="mb-0.5 flex items-center justify-center rounded-md p-2 transition-colors"
              :class="linkClass(item.to)"
            >
              <component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" />
            </RouterLink>
          </template>
        </template>

        <!-- Expanded: collapsible group sections with nested items -->
        <template v-else>
          <div v-for="group in groups" :key="group.label" class="mb-1">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent"
              :aria-expanded="isOpen(group.label, group.items)"
              @click="toggleNode(group.label, group.items)"
            >
              <span>{{ group.label }}</span>
              <ChevronDown
                class="h-3.5 w-3.5 transition-transform"
                :class="isOpen(group.label, group.items) ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen(group.label, group.items)" class="ml-3 mt-0.5 border-l pl-2">
              <SidebarNavItems
                :items="group.items"
                :is-open="isOpen"
                :toggle="toggleNode"
                :link-class="linkClass"
              />
            </div>
          </div>
        </template>
      </nav>

      <div
        class="flex gap-1 border-t px-3 py-3"
        :class="sidebarCollapsed ? 'flex-col items-center' : 'items-center justify-between'"
      >
        <div v-if="!sidebarCollapsed" class="min-w-0">
          <p class="truncate text-sm font-medium">{{ user?.display_name ?? 'User' }}</p>
          <p class="truncate text-xs text-muted-foreground">{{ user?.username }}</p>
        </div>
        <div class="flex gap-1">
          <Button variant="ghost" size="sm" class="px-2" title="Settings" @click="openSettings">
            <Settings class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" class="px-2" title="Log out" @click="onLogout">
            <LogOut class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
    <main class="min-w-0 flex-1 overflow-auto">
      <header class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background/90 px-6 py-3 backdrop-blur">
        <h1 class="min-w-0 truncate text-base font-semibold">{{ route.meta.title ?? 'Susiana' }}</h1>
        <GlobalSearch :items="searchItems" />
      </header>
      <div class="p-6">
        <slot />
      </div>
    </main>
    <SettingsModal :open="settingsOpen" @close="closeSettings" />
  </div>
</template>
