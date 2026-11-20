import { createRouter, createWebHistory, useRoute, type RouteLocationNormalized } from 'vue-router'
import { defineComponent, h, type Component } from 'vue'
import { getToken } from '@/lib/auth'
import AppLayout from '@/views/AppLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import MarketGridView from '@/views/MarketGridView.vue'
import StockMarketPlaceholderView from '@/views/stock-market/StockMarketPlaceholderView.vue'
import TseStocksView from '@/views/tse/TseStocksView.vue'
import TseStockDetailView from '@/views/tse/TseStockDetailView.vue'

function iranOrPlaceholder(live: Component) {
  return defineComponent({
    name: 'IranOrPlaceholder',
    setup() {
      const route = useRoute()
      return () => (String(route.params.country) === 'iran' ? h(live) : h(StockMarketPlaceholderView))
    },
  })
}

function countryLabel(to: RouteLocationNormalized): string {
  return String(to.params.country ?? '')
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ')
}

function titled(kind: 'country' | 'index' | 'instrument' | 'history') {
  return (to: RouteLocationNormalized) => {
    const country = countryLabel(to)
    const instrument = String(to.params.instrument ?? '')
    if (kind === 'country') to.meta.title = `Stock market / ${country}`
    else if (kind === 'index') to.meta.title = `Stock market / ${country} / Index`
    else if (kind === 'history') to.meta.title = `Stock market / ${country} / ${instrument} / History`
    else to.meta.title = `Stock market / ${country} / ${instrument}`
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true, title: 'Login' },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
        { path: 'stock-market/tse', redirect: '/stock-market/iran' },
        { path: 'stock-market/tse/indexes', redirect: '/stock-market/iran/index' },
        {
          path: 'stock-market/tse/stock/history/:symbol',
          redirect: (to) => `/stock-market/iran/${encodeURIComponent(String(to.params.symbol))}/history`,
        },
        {
          path: 'stock-market/tse/stock/:symbol',
          redirect: (to) => `/stock-market/iran/${encodeURIComponent(String(to.params.symbol))}`,
        },
        {
          path: 'stock-market/:region/:country/overview',
          redirect: (to) => `/stock-market/${String(to.params.country)}`,
        },
        {
          path: 'stock-market/:region/:country/board',
          redirect: (to) => `/stock-market/${String(to.params.country)}`,
        },
        {
          path: 'stock-market/:region/:country/index',
          redirect: (to) => `/stock-market/${String(to.params.country)}/index`,
        },
        {
          path: 'stock-market/:country',
          component: iranOrPlaceholder(TseStocksView),
          beforeEnter: titled('country'),
          meta: { title: 'Stock market' },
        },
        {
          path: 'stock-market/:country/index',
          component: iranOrPlaceholder(MarketGridView),
          beforeEnter: titled('index'),
          meta: { title: 'Stock market / Index', gridKind: 'tse-indexes' },
        },
        {
          path: 'stock-market/:country/:instrument/history',
          component: iranOrPlaceholder(MarketGridView),
          beforeEnter: titled('history'),
          meta: { title: 'Stock history', gridKind: 'history' },
        },
        {
          path: 'stock-market/:country/:instrument',
          component: iranOrPlaceholder(TseStockDetailView),
          beforeEnter: titled('instrument'),
          meta: { title: 'Stock' },
        },
        {
          path: 'commodity/crude-oil',
          component: MarketGridView,
          meta: { title: 'Commodity / Crude oil', gridKind: 'commodity', gridKey: 'crude-oil' },
        },
        {
          path: 'commodity/natural-gas',
          component: MarketGridView,
          meta: { title: 'Commodity / Natural gas', gridKind: 'commodity', gridKey: 'natural-gas' },
        },
        {
          path: 'commodity/gold',
          component: MarketGridView,
          meta: { title: 'Commodity / Gold', gridKind: 'commodity', gridKey: 'gold' },
        },
        {
          path: 'commodity/silver',
          component: MarketGridView,
          meta: { title: 'Commodity / Silver', gridKind: 'commodity', gridKey: 'silver' },
        },
        {
          path: 'commodity/copper',
          component: MarketGridView,
          meta: { title: 'Commodity / Copper', gridKind: 'commodity', gridKey: 'copper' },
        },
        {
          path: 'commodity/steel',
          component: MarketGridView,
          meta: { title: 'Commodity / Steel', gridKind: 'commodity', gridKey: 'steel' },
        },
        {
          path: 'indexes/asia',
          component: MarketGridView,
          meta: { title: 'Indexes / Asia', gridKind: 'index', gridKey: 'asia' },
        },
        {
          path: 'indexes/top30',
          component: MarketGridView,
          meta: { title: 'Indexes / Top 30', gridKind: 'index', gridKey: 'top30' },
        },
        {
          path: 'indexes/europe',
          component: MarketGridView,
          meta: { title: 'Indexes / Europe', gridKind: 'index', gridKey: 'europe' },
        },
        {
          path: 'indexes/north-america',
          component: MarketGridView,
          meta: { title: 'Indexes / North America', gridKind: 'index', gridKey: 'north-america' },
        },
        {
          path: 'indexes/south-america',
          component: MarketGridView,
          meta: { title: 'Indexes / South America', gridKind: 'index', gridKey: 'south-america' },
        },
        {
          path: 'indexes/middle-east',
          component: MarketGridView,
          meta: { title: 'Indexes / Middle East', gridKind: 'index', gridKey: 'middle-east' },
        },
        {
          path: 'indexes/australia',
          component: MarketGridView,
          meta: { title: 'Indexes / Australia', gridKind: 'index', gridKey: 'australia' },
        },
        {
          path: 'indexes/africa',
          component: MarketGridView,
          meta: { title: 'Indexes / Africa', gridKind: 'index', gridKey: 'africa' },
        },
        {
          path: 'currencies',
          component: MarketGridView,
          meta: { title: 'Currencies', gridKind: 'currencies' },
        },
        {
          path: 'crypto-currencies',
          component: MarketGridView,
          meta: { title: 'Crypto currencies', gridKind: 'crypto' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = getToken()
  if (to.meta.requiresAuth && !token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.matched.some((r) => r.meta.requiresAuth) && !token && to.name !== 'login') {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guest && token) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
