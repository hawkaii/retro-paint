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

// Room represents a collaborative drawing session
type Room struct {
	ID         string       `json:"id"`
	Name       string       `json:"name"`
	CreatedAt  int64        `json:"createdAt"`
	MaxUsers   int          `json:"maxUsers"`
	IsPrivate  bool         `json:"isPrivate"`
	Password   string       `json:"password,omitempty"`
	Canvas     *CanvasState `json:"canvas"`
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mutex      sync.RWMutex
	manager    *RoomManager
}

// CanvasState represents the current state of a room's canvas
type CanvasState struct {
	Width        int      `json:"width"`
	Height       int      `json:"height"`
	ImageData    string   `json:"imageData"`
	History      []string `json:"history"`
	HistoryIndex int      `json:"historyIndex"`
	LastUpdated  int64    `json:"lastUpdated"`
}

// DrawingEvent represents any drawing action on the canvas
type DrawingEvent struct {
	Type      string                 `json:"type"`
	UserID    string                 `json:"userId"`
	RoomID    string                 `json:"roomId"`
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
	RoomID    string `json:"roomId"`
	Timestamp int64  `json:"timestamp"`
}

// Client represents a connected user
type Client struct {
	ID       string
	Username string
	Conn     *websocket.Conn
	Room     *Room
	Send     chan []byte
	Presence *UserPresence
}

// RoomManager manages all active rooms
type RoomManager struct {
	rooms map[string]*Room
	mutex sync.RWMutex
}

// NewRoomManager creates a new room manager
func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: make(map[string]*Room),
	}
}

// CreateRoom creates a new room
func (rm *RoomManager) CreateRoom(name string, maxUsers int, isPrivate bool, password string) *Room {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	roomID := generateRoomID()
	room := &Room{
		ID:        roomID,
		Name:      name,
		CreatedAt: time.Now().Unix(),
		MaxUsers:  maxUsers,
		IsPrivate: isPrivate,
		Password:  password,
		Canvas: &CanvasState{
			Width:        640,
			Height:       480,
			ImageData:    "",
			History:      []string{},
			HistoryIndex: -1,
			LastUpdated:  time.Now().Unix(),
		},
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		manager:    rm,
	}

	rm.rooms[roomID] = room
	go room.Run()

	return room
}

// GetRoom retrieves a room by ID
func (rm *RoomManager) GetRoom(roomID string) (*Room, bool) {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()
	room, exists := rm.rooms[roomID]
	return room, exists
}

// ListRooms returns all public rooms
func (rm *RoomManager) ListRooms() []*Room {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	var publicRooms []*Room
	for _, room := range rm.rooms {
		if !room.IsPrivate {
			publicRooms = append(publicRooms, room)
		}
	}
	return publicRooms
}

// DeleteRoom removes a room
func (rm *RoomManager) DeleteRoom(roomID string) {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	if room, exists := rm.rooms[roomID]; exists {
		// Close the room
		room.mutex.Lock()
		for client := range room.clients {
			close(client.Send)
		}
		close(room.broadcast)
		room.mutex.Unlock()

		delete(rm.rooms, roomID)
	}
}

// NewRoom creates a new room instance
func NewRoom(id, name string, maxUsers int) *Room {
	return &Room{
		ID:       id,
		Name:     name,
		MaxUsers: maxUsers,
		Canvas: &CanvasState{
			Width:        640,
			Height:       480,
			ImageData:    "",
			History:      []string{},
			HistoryIndex: -1,
			LastUpdated:  time.Now().Unix(),
		},
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the room's main loop
func (r *Room) Run() {
	for {
		select {
		case client := <-r.register:
			r.mutex.Lock()
			r.clients[client] = true
			r.mutex.Unlock()

			log.Printf("Client %s joined room %s. Room has %d users", client.ID, r.ID, len(r.clients))

			// Send current canvas state to new client
			r.sendCanvasState(client)

			// Send user count update to all clients
			r.broadcastUserCount()

			// Send user list update
			r.broadcastUserList()

		case client := <-r.unregister:
			r.mutex.Lock()
			if _, ok := r.clients[client]; ok {
				delete(r.clients, client)
				close(client.Send)
			}
			userCount := len(r.clients)
			r.mutex.Unlock()

			log.Printf("Client %s left room %s. Room has %d users", client.ID, r.ID, userCount)

			// Clean up empty rooms (except default room)
			if userCount == 0 && r.ID != "default-collaboration-room" {
				log.Printf("Room %s is empty, scheduling cleanup", r.ID)
				// Schedule room deletion after 5 minutes of being empty
				go func(roomID string, manager *RoomManager) {
					time.Sleep(5 * time.Minute)
					// Check if room is still empty
					room, exists := manager.GetRoom(roomID)
					if exists {
						room.mutex.RLock()
						stillEmpty := len(room.clients) == 0
						room.mutex.RUnlock()

						if stillEmpty {
							log.Printf("Deleting empty room %s", roomID)
							manager.DeleteRoom(roomID)
						}
					}
				}(r.ID, r.manager)
			}
			// Send user count update to remaining clients
			if userCount > 0 {
				r.broadcastUserCount()
				r.broadcastUserList()
			}
		case message := <-r.broadcast:
			r.mutex.RLock()
			for client := range r.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(r.clients, client)
				}
			}
			r.mutex.RUnlock()
		}
	}
}

// sendCanvasState sends the current canvas state to a client
func (r *Room) sendCanvasState(client *Client) {
	canvasStateMsg := map[string]interface{}{
		"type":      "canvasState",
		"canvas":    r.Canvas,
		"timestamp": time.Now().Unix(),
	}

	data, _ := json.Marshal(canvasStateMsg)

	select {
	case client.Send <- data:
	default:
		close(client.Send)
		r.mutex.Lock()
		delete(r.clients, client)
		r.mutex.Unlock()
	}
}

// broadcastUserCount sends current user count to all clients
func (r *Room) broadcastUserCount() {
	r.mutex.RLock()
	count := len(r.clients)
	r.mutex.RUnlock()

	userCountMsg := map[string]interface{}{
		"type":      "userCount",
		"count":     count,
		"roomId":    r.ID,
		"timestamp": time.Now().Unix(),
	}

	data, _ := json.Marshal(userCountMsg)

	select {
	case r.broadcast <- data:
	default:
		// Channel is full, skip this update
	}
}

// broadcastUserList sends current user list to all clients
func (r *Room) broadcastUserList() {
	r.mutex.RLock()
	var users []map[string]interface{}
	for client := range r.clients {
		users = append(users, map[string]interface{}{
			"id":       client.ID,
			"username": client.Username,
			"presence": client.Presence,
		})
	}
	r.mutex.RUnlock()

	userListMsg := map[string]interface{}{
		"type":      "userList",
		"users":     users,
		"roomId":    r.ID,
		"timestamp": time.Now().Unix(),
	}

	data, _ := json.Marshal(userListMsg)

	select {
	case r.broadcast <- data:
	default:
		// Channel is full, skip this update
	}
}

// updateCanvasState updates the room's canvas state
func (r *Room) updateCanvasState(imageData string) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	r.Canvas.ImageData = imageData
	r.Canvas.LastUpdated = time.Now().Unix()

	// Add to history (keep last 50 states)
	r.Canvas.History = append(r.Canvas.History, imageData)
	if len(r.Canvas.History) > 50 {
		r.Canvas.History = r.Canvas.History[1:]
	} else {
		r.Canvas.HistoryIndex++
	}
}

// ReadPump handles incoming messages from client
func (c *Client) ReadPump() {
	defer func() {
		if c.Room != nil {
			c.Room.unregister <- c
		}
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
		event["roomId"] = c.Room.ID
		event["timestamp"] = time.Now().Unix()

		// Handle different message types
		msgType, ok := event["type"].(string)
		if !ok {
			continue
		}

		switch msgType {
		case "drawing":
			// Drawing events - broadcast to all other clients in room
			c.handleDrawingEvent(event)
		case "chat":
			// Chat messages - broadcast to all clients in room
			c.handleChatMessage(event)
		case "presence":
			// User presence updates (cursor position, tool selection)
			c.handlePresenceUpdate(event)
		case "canvasUpdate":
			// Full canvas state update
			c.handleCanvasUpdate(event)
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
	log.Printf("Drawing event from %s in room %s: %s", c.ID, c.Room.ID, event["drawingType"])

	// Broadcast to all other clients in room (not the sender)
	data, _ := json.Marshal(event)

	c.Room.mutex.RLock()
	for client := range c.Room.clients {
		if client != c { // Don't send back to sender
			select {
			case client.Send <- data:
			default:
				close(client.Send)
				delete(c.Room.clients, client)
			}
		}
	}
	c.Room.mutex.RUnlock()
}

// handleChatMessage processes and broadcasts chat messages
func (c *Client) handleChatMessage(event map[string]interface{}) {
	log.Printf("Chat message from %s in room %s: %s", c.ID, c.Room.ID, event["message"])

	// Broadcast to all clients in room including sender for confirmation
	data, _ := json.Marshal(event)
	c.Room.broadcast <- data
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

	// Broadcast presence update to other clients in room
	data, _ := json.Marshal(event)

	c.Room.mutex.RLock()
	for client := range c.Room.clients {
		if client != c {
			select {
			case client.Send <- data:
			default:
				close(client.Send)
				delete(c.Room.clients, client)
			}
		}
	}
	c.Room.mutex.RUnlock()
}

// handleCanvasUpdate processes full canvas state updates
func (c *Client) handleCanvasUpdate(event map[string]interface{}) {
	if payload, ok := event["payload"].(map[string]interface{}); ok {
		if imageData, ok := payload["imageData"].(string); ok {
			c.Room.updateCanvasState(imageData)

			// Broadcast canvas update to other clients
			data, _ := json.Marshal(event)

			c.Room.mutex.RLock()
			for client := range c.Room.clients {
				if client != c {
					select {
					case client.Send <- data:
					default:
						close(client.Send)
						delete(c.Room.clients, client)
					}
				}
			}
			c.Room.mutex.RUnlock()
		}
	}
}

// handleWebSocket handles WebSocket connection requests
func handleWebSocket(roomManager *RoomManager, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Get connection parameters
	roomID := r.URL.Query().Get("roomId")
	username := r.URL.Query().Get("username")

	// Generate unique client ID
	clientID := generateClientID()
	if username == "" {
		username = "User" + clientID[:8]
	}

	// Get or create room
	var room *Room
	if roomID == "" || roomID == "default-collaboration-room" {
		// Use default room instead of creating new ones
		roomID = "default-collaboration-room"
		var exists bool
		room, exists = roomManager.GetRoom(roomID)
		if !exists {
			room = roomManager.CreateRoom("Default Collaboration Room", 50, false, "")
			room.ID = roomID
			roomManager.rooms[roomID] = room
		}
	} else {
		var exists bool
		room, exists = roomManager.GetRoom(roomID)
		if !exists {
			conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"error","message":"Room not found"}`))
			conn.Close()
			return
		}
	}

	// Check room capacity
	room.mutex.RLock()
	userCount := len(room.clients)
	room.mutex.RUnlock()

	if userCount >= room.MaxUsers {
		conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"error","message":"Room is full"}`))
		conn.Close()
		return
	}

	client := &Client{
		ID:       clientID,
		Username: username,
		Conn:     conn,
		Room:     room,
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

	room.register <- client

	// Start goroutines for reading and writing
	go client.WritePump()
	go client.ReadPump()
}

// REST API handlers

// handleCreateRoom creates a new room
func handleCreateRoom(roomManager *RoomManager, w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Name      string `json:"name"`
		MaxUsers  int    `json:"maxUsers"`
		IsPrivate bool   `json:"isPrivate"`
		Password  string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		req.Name = "Untitled Room"
	}
	if req.MaxUsers <= 0 {
		req.MaxUsers = 10
	}

	room := roomManager.CreateRoom(req.Name, req.MaxUsers, req.IsPrivate, req.Password)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":        room.ID,
		"name":      room.Name,
		"maxUsers":  room.MaxUsers,
		"isPrivate": room.IsPrivate,
		"createdAt": room.CreatedAt,
	})
}

// handleListRooms lists all public rooms
func handleListRooms(roomManager *RoomManager, w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rooms := roomManager.ListRooms()

	var roomList []map[string]interface{}
	for _, room := range rooms {
		room.mutex.RLock()
		userCount := len(room.clients)
		room.mutex.RUnlock()

		roomList = append(roomList, map[string]interface{}{
			"id":        room.ID,
			"name":      room.Name,
			"userCount": userCount,
			"maxUsers":  room.MaxUsers,
			"createdAt": room.CreatedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roomList)
}

// handleRoomInfo gets info about a specific room
func handleRoomInfo(roomManager *RoomManager, w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	roomID := r.URL.Query().Get("id")
	if roomID == "" {
		http.Error(w, "Room ID required", http.StatusBadRequest)
		return
	}

	room, exists := roomManager.GetRoom(roomID)
	if !exists {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	room.mutex.RLock()
	userCount := len(room.clients)
	room.mutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":        room.ID,
		"name":      room.Name,
		"userCount": userCount,
		"maxUsers":  room.MaxUsers,
		"isPrivate": room.IsPrivate,
		"createdAt": room.CreatedAt,
		"canvas":    room.Canvas,
	})
}

// generateRoomID creates a simple room ID
func generateRoomID() string {
	return "room-" + time.Now().Format("20060102150405") + "-" + randomString(6)
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
	roomManager := NewRoomManager()

	// WebSocket endpoint
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(roomManager, w, r)
	})

	// REST API endpoints
	http.HandleFunc("/api/rooms", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			handleListRooms(roomManager, w, r)
		case "POST":
			handleCreateRoom(roomManager, w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/rooms/info", func(w http.ResponseWriter, r *http.Request) {
		handleRoomInfo(roomManager, w, r)
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
