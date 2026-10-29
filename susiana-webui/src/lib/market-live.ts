import { onScopeDispose, ref, type Ref } from 'vue'
import { apiPath } from '@/api/client'

export type MarketLiveEvent = {
  type: string
  data?: unknown
}

const connected = ref(false)
const lastPingAt = ref<Date | null>(null)
const listeners = new Set<(event: MarketLiveEvent) => void>()

let es: EventSource | null = null
let subscribers = 0

function parseEvent(raw: string): MarketLiveEvent | null {
  try {
    return JSON.parse(raw) as MarketLiveEvent
  } catch {
    return null
  }
}

function dispatch(event: MarketLiveEvent) {
  for (const fn of listeners) fn(event)
}

function ensureConnected() {
  if (es) return
  es = new EventSource(apiPath('/api/v1/events'))
  es.onopen = () => {
    connected.value = true
  }
  es.onerror = () => {
    connected.value = false
  }
  es.addEventListener('connected', () => {
    connected.value = true
    lastPingAt.value = new Date()
  })
  es.addEventListener('ping', () => {
    connected.value = true
    lastPingAt.value = new Date()
  })
  es.addEventListener('message', (ev) => {
    const parsed = parseEvent(String(ev.data ?? ''))
    if (!parsed) return
    lastPingAt.value = new Date()
    dispatch(parsed)
  })
}

function releaseConnection() {
  subscribers = Math.max(0, subscribers - 1)
  if (subscribers === 0 && es) {
    es.close()
    es = null
    connected.value = false
  }
}

/** Shared SSE link to susiana-api; ref-counted per mounted consumer. */
export function useMarketLive(): {
  connected: Ref<boolean>
  lastPingAt: Ref<Date | null>
  onMarketEvent: (fn: (event: MarketLiveEvent) => void) => void
} {
  subscribers += 1
  ensureConnected()

  onScopeDispose(releaseConnection)

  function onMarketEvent(fn: (event: MarketLiveEvent) => void) {
    listeners.add(fn)
    onScopeDispose(() => listeners.delete(fn))
  }

  return { connected, lastPingAt, onMarketEvent }
}

export function isMarketSyncEvent(event: MarketLiveEvent): boolean {
  return event.type === 'market.sync'
}
