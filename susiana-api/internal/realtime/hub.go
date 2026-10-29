package realtime

import (
	"encoding/json"
	"sync"

	"github.com/ArminDashti/susiana-api/internal/domain"
)

// Event is a JSON message delivered to WebUI clients over SSE.
type Event struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data,omitempty"`
}

// Hub fans out events to subscribed SSE clients.
type Hub struct {
	mu      sync.RWMutex
	clients map[chan Event]struct{}
}

func NewHub() *Hub {
	return &Hub{clients: make(map[chan Event]struct{})}
}

func (h *Hub) Subscribe() (<-chan Event, func()) {
	ch := make(chan Event, 16)
	h.mu.Lock()
	h.clients[ch] = struct{}{}
	h.mu.Unlock()
	return ch, func() {
		h.mu.Lock()
		delete(h.clients, ch)
		h.mu.Unlock()
		close(ch)
	}
}

func (h *Hub) Publish(e Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for ch := range h.clients {
		select {
		case ch <- e:
		default:
		}
	}
}

type syncCompletedPayload struct {
	InstrumentType string `json:"instrument_type"`
	Status         string `json:"status"`
	FetchedCount   int    `json:"fetched_count"`
	Error          string `json:"error,omitempty"`
}

func (h *Hub) PublishSyncCompleted(
	instrumentType domain.InstrumentType,
	status domain.SyncStatus,
	fetched int,
	errMsg string,
) {
	payload, err := json.Marshal(syncCompletedPayload{
		InstrumentType: string(instrumentType),
		Status:         string(status),
		FetchedCount:   fetched,
		Error:          errMsg,
	})
	if err != nil {
		return
	}
	h.Publish(Event{Type: "market.sync", Data: payload})
}
