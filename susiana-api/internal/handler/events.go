package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *MarketHandler) Events(c *gin.Context) {
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		writeError(c, http.StatusInternalServerError, "streaming unsupported")
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	ch, unsub := h.events.Subscribe()
	defer unsub()

	writeSSE(c, flusher, "connected", `{"type":"connected"}`)

	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			return
		case e, open := <-ch:
			if !open {
				return
			}
			body, err := json.Marshal(e)
			if err != nil {
				continue
			}
			writeSSE(c, flusher, "message", string(body))
		case <-ticker.C:
			writeSSE(c, flusher, "ping", `{}`)
		}
	}
}

func writeSSE(c *gin.Context, fl http.Flusher, event, data string) {
	fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", event, data)
	fl.Flush()
}
