<script setup lang="ts">
import { ref } from 'vue'
import DataGrid from '@/components/DataGrid.vue'
import { INDEX_COLUMNS, TSE_LIST_COLUMNS } from '@/mocks/columns'
import { mockIndexes, mockTseStocks } from '@/mocks/market'
import { Button } from '@/components/ui/button'

const movers = mockTseStocks
const asia = mockIndexes.asia.slice(0, 5)
const apiHint = ref(import.meta.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080')
</script>

<template>
  <div class="space-y-8">
    <section class="s-panel overflow-hidden">
      <div class="grid gap-6 border-b border-border/70 p-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div class="space-y-3">
          <h2 class="text-xl font-semibold tracking-tight">Morning sheet</h2>
          <p class="max-w-prose text-sm leading-relaxed text-muted-foreground">
            Start with movers on Tehran, then scan Asia indexes. Rows open detail when the underlying market
            supports it.
          </p>
          <Button size="sm" @click="$router.push('/stock-market/asia/iran/board')">Open TSE board</Button>
        </div>
        <dl class="grid gap-3 sm:grid-cols-2">
          <div class="s-panel-inset px-4 py-3">
            <dt class="text-xs text-muted-foreground">Symbols tracked</dt>
            <dd class="mt-1 font-mono text-2xl font-medium tabular-nums">{{ movers.length }}+</dd>
          </div>
          <div class="s-panel-inset px-4 py-3 sm:col-span-2 lg:col-span-1">
            <dt class="text-xs text-muted-foreground">API proxy</dt>
            <dd class="mt-1 truncate font-mono text-xs">{{ apiHint }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="s-section-title">Watchlist</h2>
      <DataGrid
        :columns="TSE_LIST_COLUMNS"
        :rows="movers"
        row-key="ticker"
        @row-click="(r) => $router.push(`/stock-market/tse/stock/${r.ticker}`)"
      />
    </section>

    <section class="space-y-3">
      <h2 class="s-section-title">Asia indexes</h2>
      <DataGrid :columns="INDEX_COLUMNS" :rows="asia" />
    </section>
  </div>
</template>