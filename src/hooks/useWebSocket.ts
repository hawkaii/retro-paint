import { useEffect, useRef, useState, useCallback } from 'react';
import { persistenceManager } from '../utils/persistence';

export interface DrawingEvent {
  type: 'drawing';
  drawingType: 'brush' | 'eraser' | 'bucket' | 'rectangle' | 'circle' | 'triangle' | 'line' | 'text' | 'paste' | 'ai-generate';
  userId: string;
  roomId: string;
  timestamp: number;
  payload: {
    x?: number;
    y?: number;
    endX?: number;
    endY?: number;
    color?: string;
    size?: number;
    text?: string;
    fontSize?: number;
    imageData?: string;
    fillColor?: string;
    coordinates?: Array<{ x: number; y: number }>;
  };
}

export interface ChatMessage {
  type: 'chat';
  userId: string;
  username: string;
  message: string;
  roomId: string;
  timestamp: number;
}

export interface PresenceUpdate {
  type: 'presence';
  userId: string;
  roomId: string;
  payload: {
    x: number;
    y: number;
    color: string;
    tool: string;
  };
}

export interface UserCountUpdate {
  type: 'userCount';
  count: number;
  roomId: string;
  timestamp: number;
}

export interface UserListUpdate {
  type: 'userList';
  users: Array<{
    id: string;
    username: string;
    presence: {
      x: number;
      y: number;
      color: string;
      tool: string;
    };
  }>;
  roomId: string;
  timestamp: number;
}

export interface CanvasStateUpdate {
  type: 'canvasState';
  canvas: {
    width: number;
    height: number;
    imageData: string;
    history: string[];
    historyIndex: number;
    lastUpdated: number;
  };
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  userCount: number;
  maxUsers: number;
  createdAt: number;
}

type WebSocketMessage = DrawingEvent | ChatMessage | PresenceUpdate | UserCountUpdate | UserListUpdate | CanvasStateUpdate;

interface UseWebSocketReturn {
  sendDrawingEvent: (event: Omit<DrawingEvent, 'type' | 'userId' | 'roomId' | 'timestamp'>) => void;
  sendChatMessage: (message: string) => void;
  sendPresenceUpdate: (x: number, y: number, color: string, tool: string) => void;
  sendCanvasUpdate: (imageData: string) => void;
  isConnected: boolean;
  userCount: number;
  currentRoom: string | null;
  users: UserListUpdate['users'];
  userId: string;
  username: string;
  onDrawingEvent: (callback: (event: DrawingEvent) => void) => void;
  onChatMessage: (callback: (message: ChatMessage) => void) => void;
  onPresenceUpdate: (callback: (presence: PresenceUpdate) => void) => void;
  onCanvasState: (callback: (canvas: CanvasStateUpdate) => void) => void;
  onUserListUpdate: (callback: (users: UserListUpdate) => void) => void;
  // Room management functions
  createRoom: (name: string, maxUsers: number, isPrivate: boolean, password?: string) => Promise<Room>;
  listRooms: () => Promise<Room[]>;
  getRoomInfo: (roomId: string) => Promise<Room>;
  // Connection management
  reconnect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (serverUrl: string, initialUsername?: string, initialRoomId?: string): UseWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState<UserListUpdate['users']>([]);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Stable user identity from persistence
  const [userId] = useState(() => persistenceManager.getOrCreateUserId());
  const [username] = useState(() => {
    const existing = persistenceManager.loadUser();
    if (existing?.username) return existing.username;
    
    const newUsername = initialUsername || persistenceManager.getOrCreateUsername();
    persistenceManager.saveUser(userId, newUsername);
    return newUsername;
  });
  
  // Room management with persistence
  const [currentRoom, setCurrentRoom] = useState<string | null>(() => {
    if (initialRoomId) return initialRoomId;
    
    const savedRoom = persistenceManager.loadRoom();
    if (savedRoom?.id) return savedRoom.id;
    
    // Use default room instead of creating new ones
    return persistenceManager.getDefaultRoomId();
  });
  
  // Event callbacks
  const drawingEventCallback = useRef<((event: DrawingEvent) => void) | null>(null);
  const chatMessageCallback = useRef<((message: ChatMessage) => void) | null>(null);
  const presenceUpdateCallback = useRef<((presence: PresenceUpdate) => void) | null>(null);
  const canvasStateCallback = useRef<((canvas: CanvasStateUpdate) => void) | null>(null);
  const userListUpdateCallback = useRef<((users: UserListUpdate) => void) | null>(null);

  const connect = useCallback(() => {
    try {
      // Clear existing reconnect timeout
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      const params = new URLSearchParams();
      params.append('username', username);
      if (currentRoom) params.append('roomId', currentRoom);
      
      const wsUrl = `${serverUrl}?${params.toString()}`;
      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected to room:', currentRoom);
        console.log('isConnected will be set to true');
        setIsConnected(true);
        reconnectAttempts.current = 0; // Reset attempts on successful connection
        
        // Save current room to persistence
        if (currentRoom) {
          persistenceManager.saveRoom(currentRoom, currentRoom);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Implement exponential backoff for reconnection
        if (reconnectAttempts.current < 5) { // Max 5 attempts
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Max 30s
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'drawing':
              if (drawingEventCallback.current) {
                drawingEventCallback.current(message);
              }
              break;
            case 'chat':
              if (chatMessageCallback.current) {
                chatMessageCallback.current(message);
              }
              break;
            case 'presence':
              if (presenceUpdateCallback.current) {
                presenceUpdateCallback.current(message);
              }
              break;
            case 'userCount':
              setUserCount(message.count);
              break;
            case 'userList':
              setUsers(message.users);
              if (userListUpdateCallback.current) {
                userListUpdateCallback.current(message);
              }
              break;
            case 'canvasState':
              if (canvasStateCallback.current) {
                canvasStateCallback.current(message);
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [serverUrl, username, currentRoom]);

  useEffect(() => {
    // Update current room when initialRoomId changes
    if (initialRoomId && initialRoomId !== currentRoom) {
      setCurrentRoom(initialRoomId);
    }
  }, [initialRoomId, currentRoom]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const sendDrawingEvent = useCallback((event: Omit<DrawingEvent, 'type' | 'userId' | 'roomId' | 'timestamp'>) => {
    const message = {
      type: 'drawing',
      userId,
      roomId: currentRoom,
      timestamp: Date.now(),
      ...event,
    };
    console.log('Sending drawing event:', message);
    sendMessage(message);
  }, [sendMessage, userId, currentRoom]);

  const sendChatMessage = useCallback((message: string) => {
    sendMessage({
      type: 'chat',
      userId,
      username,
      roomId: currentRoom,
      timestamp: Date.now(),
      message,
    });
  }, [sendMessage, userId, username, currentRoom]);

  const sendPresenceUpdate = useCallback((x: number, y: number, color: string, tool: string) => {
    sendMessage({
      type: 'presence',
      userId,
      roomId: currentRoom,
      payload: { x, y, color, tool },
    });
  }, [sendMessage, userId, currentRoom]);

  const sendCanvasUpdate = useCallback((imageData: string) => {
    sendMessage({
      type: 'canvasUpdate',
      payload: { imageData },
    });
  }, [sendMessage]);

  // Room management functions
  const createRoom = useCallback(async (name: string, maxUsers: number, isPrivate: boolean, password?: string): Promise<Room> => {
    const response = await fetch(`${serverUrl.replace('ws://', 'http://').replace('/ws', '')}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        maxUsers,
        isPrivate,
        password: password || '',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    return response.json();
  }, [serverUrl]);

  const listRooms = useCallback(async (): Promise<Room[]> => {
    const response = await fetch(`${serverUrl.replace('ws://', 'http://').replace('/ws', '')}/api/rooms`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }

    return response.json();
  }, [serverUrl]);

  const getRoomInfo = useCallback(async (roomId: string): Promise<Room> => {
    const response = await fetch(`${serverUrl.replace('ws://', 'http://').replace('/ws', '')}/api/rooms/info?id=${roomId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch room info');
    }

    return response.json();
  }, [serverUrl]);

  const onDrawingEvent = useCallback((callback: (event: DrawingEvent) => void) => {
    drawingEventCallback.current = callback;
  }, []);

  const onChatMessage = useCallback((callback: (message: ChatMessage) => void) => {
    chatMessageCallback.current = callback;
  }, []);

  const onPresenceUpdate = useCallback((callback: (presence: PresenceUpdate) => void) => {
    presenceUpdateCallback.current = callback;
  }, []);

  const onCanvasState = useCallback((callback: (canvas: CanvasStateUpdate) => void) => {
    canvasStateCallback.current = callback;
  }, []);

  const onUserListUpdate = useCallback((callback: (users: UserListUpdate) => void) => {
    userListUpdateCallback.current = callback;
  }, []);

  // Connection management
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    if (ws.current) {
      ws.current.close();
    }
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    reconnectAttempts.current = 0;
    if (ws.current) {
      ws.current.close();
    }
    setIsConnected(false);
  }, []);

  return {
    sendDrawingEvent,
    sendChatMessage,
    sendPresenceUpdate,
    sendCanvasUpdate,
    isConnected,
    userCount,
    currentRoom,
    users,
    userId,
    username,
    onDrawingEvent,
    onChatMessage,
    onPresenceUpdate,
    onCanvasState,
    onUserListUpdate,
    createRoom,
    listRooms,
    getRoomInfo,
    reconnect,
    disconnect,
  };
};
