package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader with CORS settings
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin (adjust for production)
		return true
	},
}

// DrawingEvent represents any drawing action on the canvas
type DrawingEvent struct {
	Type      string                 `json:"type"`
	UserID    string                 `json:"userId"`
	Timestamp int64                  `json:"timestamp"`
	Payload   map[string]interface{} `json:"payload"`
}

// UserPresence represents user cursor position and status
type UserPresence struct {
	UserID   string  `json:"userId"`
	Username string  `json:"username"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Color    string  `json:"color"`
	Tool     string  `json:"tool"`
}

// ChatMessage represents chat messages
type ChatMessage struct {
	Type      string `json:"type"`
	UserID    string `json:"userId"`
	Username  string `json:"username"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}

// Client represents a connected user
type Client struct {
	ID       string
	Username string
	Conn     *websocket.Conn
	Hub      *Hub
	Send     chan []byte
	Presence *UserPresence
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mutex      sync.RWMutex
}

// NewHub creates a new hub instance
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			
			log.Printf("Client %s connected. Total clients: %d", client.ID, len(h.clients))
			
			// Send user count update to all clients
			h.broadcastUserCount()

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mutex.Unlock()
			
			log.Printf("Client %s disconnected. Total clients: %d", client.ID, len(h.clients))
			
			// Send user count update to all clients
			h.broadcastUserCount()

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// broadcastUserCount sends current user count to all clients
func (h *Hub) broadcastUserCount() {
	h.mutex.RLock()
	count := len(h.clients)
	h.mutex.RUnlock()
	
	userCountMsg := map[string]interface{}{
		"type":      "userCount",
		"count":     count,
		"timestamp": time.Now().Unix(),
	}
	
	data, _ := json.Marshal(userCountMsg)
	
	select {
	case h.broadcast <- data:
	default:
		close(h.broadcast)
	}
}

// ReadPump handles incoming messages from client
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	// Set read deadline and pong handler for keepalive
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Parse the incoming message
		var event map[string]interface{}
		if err := json.Unmarshal(message, &event); err != nil {
			log.Printf("Error parsing message: %v", err)
			continue
		}

		// Add metadata to the event
		event["userId"] = c.ID
		event["timestamp"] = time.Now().Unix()

		// Handle different message types
		msgType, ok := event["type"].(string)
		if !ok {
			continue
		}

		switch msgType {
		case "drawing":
			// Drawing events - broadcast to all other clients
			c.handleDrawingEvent(event)
		case "chat":
			// Chat messages - broadcast to all clients
			c.handleChatMessage(event)
		case "presence":
			// User presence updates (cursor position, tool selection)
			c.handlePresenceUpdate(event)
		}
	}
}

// WritePump handles outgoing messages to client
func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to current message
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleDrawingEvent processes and broadcasts drawing events
func (c *Client) handleDrawingEvent(event map[string]interface{}) {
	// Add drawing event to history (implement with database)
	log.Printf("Drawing event from %s: %s", c.ID, event["drawingType"])
	
	// Broadcast to all other clients (not the sender)
	data, _ := json.Marshal(event)
	
	c.Hub.mutex.RLock()
	for client := range c.Hub.clients {
		if client != c { // Don't send back to sender
			select {
			case client.Send <- data:
			default:
				close(client.Send)
				delete(c.Hub.clients, client)
			}
		}
	}
	c.Hub.mutex.RUnlock()
}

// handleChatMessage processes and broadcasts chat messages
func (c *Client) handleChatMessage(event map[string]interface{}) {
	log.Printf("Chat message from %s: %s", c.ID, event["message"])
	
	// Broadcast to all clients including sender for confirmation
	data, _ := json.Marshal(event)
	c.Hub.broadcast <- data
}

// handlePresenceUpdate processes user presence updates
func (c *Client) handlePresenceUpdate(event map[string]interface{}) {
	// Update client presence
	if payload, ok := event["payload"].(map[string]interface{}); ok {
		if x, ok := payload["x"].(float64); ok {
			c.Presence.X = x
		}
		if y, ok := payload["y"].(float64); ok {
			c.Presence.Y = y
		}
		if color, ok := payload["color"].(string); ok {
			c.Presence.Color = color
		}
		if tool, ok := payload["tool"].(string); ok {
			c.Presence.Tool = tool
		}
	}
	
	// Broadcast presence update to other clients
	data, _ := json.Marshal(event)
	
	c.Hub.mutex.RLock()
	for client := range c.Hub.clients {
		if client != c {
			select {
			case client.Send <- data:
			default:
				close(client.Send)
				delete(c.Hub.clients, client)
			}
		}
	}
	c.Hub.mutex.RUnlock()
}

// handleWebSocket handles WebSocket connection requests
func handleWebSocket(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Generate unique client ID (in production, use proper UUID)
	clientID := generateClientID()
	username := r.URL.Query().Get("username")
	if username == "" {
		username = "User" + clientID[:8]
	}

	client := &Client{
		ID:       clientID,
		Username: username,
		Conn:     conn,
		Hub:      hub,
		Send:     make(chan []byte, 256),
		Presence: &UserPresence{
			UserID:   clientID,
			Username: username,
			X:        0,
			Y:        0,
			Color:    "#000000",
			Tool:     "brush",
		},
	}

	hub.register <- client

	// Start goroutines for reading and writing
	go client.WritePump()
	go client.ReadPump()
}

// generateClientID creates a simple client ID
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

// randomString generates a random string of given length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

func main() {
	hub := NewHub()
	go hub.Run()

	// WebSocket endpoint
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(hub, w, r)
	})

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// CORS middleware for development
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		w.WriteHeader(http.StatusNotFound)
	})

	log.Println("WebSocket server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
