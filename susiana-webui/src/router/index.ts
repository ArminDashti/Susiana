import { createRouter, createWebHistory, type RouteMeta, type RouteRecordRaw } from 'vue-router'
import type { Component } from 'vue'
import { getToken } from '@/lib/auth'
import { STOCK_MARKET_REGIONS, STOCK_MARKET_SECTIONS, stockMarketPath } from '@/lib/stock-market'
import AppLayout from '@/views/AppLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import MarketGridView from '@/views/MarketGridView.vue'
import StockMarketPlaceholderView from '@/views/stock-market/StockMarketPlaceholderView.vue'
import TseStocksView from '@/views/tse/TseStocksView.vue'
import TseStockDetailView from '@/views/tse/TseStockDetailView.vue'

// Stock market pages with real content. Every other region / country / section uses the placeholder view.
const STOCK_MARKET_PAGES: Record<string, { component: Component; meta: RouteMeta }> = {
  [stockMarketPath('Asia', 'Iran', 'board')]: {
    component: TseStocksView,
    meta: { title: 'Stock market / Asia / Iran / Board' },
  },
  [stockMarketPath('Asia', 'Iran', 'index')]: {
    component: MarketGridView,
    meta: { title: 'Stock market / Asia / Iran / Index', gridKind: 'tse-indexes' },
  },
}

const stockMarketRoutes: RouteRecordRaw[] = STOCK_MARKET_REGIONS.flatMap((region) =>
  region.countries.flatMap((country) =>
    STOCK_MARKET_SECTIONS.map((section) => {
      const path = stockMarketPath(region.label, country, section.slug)
      const page = STOCK_MARKET_PAGES[path]
      return {
        path: path.slice(1),
        component: page?.component ?? StockMarketPlaceholderView,
        meta: page?.meta ?? { title: `Stock market / ${region.label} / ${country} / ${section.label}` },
      }
    }),
  ),
)

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
        // Old TSE list URLs now live under Stock market / Asia / Iran
        { path: 'stock-market/tse', redirect: stockMarketPath('Asia', 'Iran', 'board') },
        { path: 'stock-market/tse/indexes', redirect: stockMarketPath('Asia', 'Iran', 'index') },
        {
          path: 'stock-market/tse/stock/history/:symbol',
          name: 'tse-stock-history',
          component: MarketGridView,
          meta: { title: 'TSE stock history', gridKind: 'history' },
        },
        {
          path: 'stock-market/tse/stock/:symbol',
          name: 'tse-stock',
          component: TseStockDetailView,
          meta: { title: 'TSE stock' },
        },
        ...stockMarketRoutes,
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
