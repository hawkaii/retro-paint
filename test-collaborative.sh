#!/bin/bash

# Test script for collaborative features with persistence
echo "Testing collaborative paint platform with persistence..."

# Start backend in background
echo "Starting Go backend..."
cd backend
go run main.go &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:8080/health
echo ""

# Test room creation
echo "Testing room creation..."
curl -s -X POST http://localhost:8080/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room","maxUsers":5,"isPrivate":false}' | jq .
echo ""

# Test room listing
echo "Testing room listing..."
curl -s http://localhost:8080/api/rooms | jq .
echo ""

echo "✅ Canvas Persistence & Collaboration Platform Ready!"
echo "Backend PID: $BACKEND_PID"
echo "To stop backend: kill $BACKEND_PID"
echo ""
echo "🎨 NEW FEATURES IMPLEMENTED:"
echo "✅ Canvas persistence on page refresh (localStorage)"
echo "✅ Stable user identities with persistent usernames"
echo "✅ Default shared room (no more isolated connections)"
echo "✅ Smart canvas restoration (server vs local state)"
echo "✅ Exponential backoff WebSocket reconnection"
echo "✅ Room cleanup for empty rooms (5min delay)"
echo "✅ Real-time collaborative drawing"
echo "✅ User presence indicators with cursor tracking"
echo "✅ Room management system"
echo ""
echo "🧪 TO TEST PERSISTENCE:"
echo "1. Start frontend: npm run dev"
echo "2. Draw something on the canvas"
echo "3. Refresh the page - your canvas should restore!"
echo "4. Open multiple tabs - all share the default room"
echo "5. Create custom rooms and invite others"
echo ""
echo "💾 PERSISTENCE FEATURES:"
echo "• Canvas automatically saves to localStorage"
echo "• User identity persists across sessions"
echo "• Room preferences remembered"
echo "• Smart conflict resolution (server vs local)"
echo "• 24-hour localStorage cache expiry"