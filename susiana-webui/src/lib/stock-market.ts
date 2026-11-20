import { ChartLine } from 'lucide-vue-next'
import { link, type NavItem } from '@/lib/navigation'

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

export function countryPath(country: string): string {
  return `/stock-market/${toSlug(country)}`
}

export function countryIndexPath(country: string): string {
  return `${countryPath(country)}/index`
}

export function buildStockMarketNav(): NavItem[] {
  return STOCK_MARKET_REGIONS.map((region) => ({
    key: `stock-market/${toSlug(region.label)}`,
    label: region.label,
    children: region.countries.map((country) => ({
      key: countryPath(country),
      label: country,
      to: countryPath(country),
      children: [link('Index', countryIndexPath(country), ChartLine)],
    })),
  }))
}
