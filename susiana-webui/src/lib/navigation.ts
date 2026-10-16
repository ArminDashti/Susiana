import type { Component } from 'vue'

export type NavItem = {
  key: string
  label: string
  to?: string
  icon?: Component
  children?: NavItem[]
}

export type NavGroup = { label: string; items: NavItem[] }

export type LinkItem = NavItem & { to: string }

export function link(label: string, to: string, icon?: Component): NavItem {
  return { key: to, label, to, icon }
}

// Flattens a nav tree into its links (items that have a route), depth-first.
export function collectLinks(items: NavItem[]): LinkItem[] {
  return items.flatMap((item): LinkItem[] => {
    if (item.children) return collectLinks(item.children)
    return item.to ? [{ ...item, to: item.to }] : []
  })
}
