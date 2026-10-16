import type { Component } from 'vue'
import { ChartLine, PanelsTopLeft, Table } from 'lucide-vue-next'
import { link, type NavItem } from '@/lib/navigation'

export type StockMarketSection = { slug: string; label: string; icon: Component }

export const STOCK_MARKET_SECTIONS: StockMarketSection[] = [
  { slug: 'overview', label: 'Overview', icon: PanelsTopLeft },
  { slug: 'board', label: 'Board', icon: Table },
  { slug: 'index', label: 'Index', icon: ChartLine },
]

export const STOCK_MARKET_REGIONS: { label: string; countries: string[] }[] = [
  { label: 'Asia', countries: ['Iran', 'Japan', 'China', 'South Korea', 'India'] },
  { label: 'Europe', countries: ['United Kingdom', 'Germany', 'France'] },
  { label: 'North America', countries: ['United States', 'Canada', 'Mexico'] },
  { label: 'South America', countries: ['Brazil', 'Argentina', 'Chile'] },
  { label: 'Africa', countries: ['South Africa', 'Egypt', 'Nigeria'] },
  { label: 'Australia', countries: ['Australia', 'New Zealand'] },
]

export function toSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-')
}

export function stockMarketPath(region: string, country: string, section: string): string {
  return `/stock-market/${toSlug(region)}/${toSlug(country)}/${section}`
}

export function buildStockMarketNav(): NavItem[] {
  return STOCK_MARKET_REGIONS.map((region) => ({
    key: `stock-market/${toSlug(region.label)}`,
    label: region.label,
    children: region.countries.map((country) => ({
      key: `stock-market/${toSlug(region.label)}/${toSlug(country)}`,
      label: country,
      children: STOCK_MARKET_SECTIONS.map((section) =>
        link(section.label, stockMarketPath(region.label, country, section.slug), section.icon),
      ),
    })),
  }))
}
