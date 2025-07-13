import { useEffect, useRef, useState, useCallback } from 'react';

export interface DrawingEvent {
  type: 'drawing';
  drawingType: 'brush' | 'eraser' | 'bucket' | 'rectangle' | 'circle' | 'triangle' | 'line' | 'text' | 'paste' | 'ai-generate';
  userId: string;
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
  timestamp: number;
}

export interface PresenceUpdate {
  type: 'presence';
  userId: string;
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
  timestamp: number;
}

type WebSocketMessage = DrawingEvent | ChatMessage | PresenceUpdate | UserCountUpdate;

interface UseWebSocketReturn {
  sendDrawingEvent: (event: Omit<DrawingEvent, 'type' | 'userId' | 'timestamp'>) => void;
  sendChatMessage: (message: string) => void;
  sendPresenceUpdate: (x: number, y: number, color: string, tool: string) => void;
  isConnected: boolean;
  userCount: number;
  onDrawingEvent: (callback: (event: DrawingEvent) => void) => void;
  onChatMessage: (callback: (message: ChatMessage) => void) => void;
  onPresenceUpdate: (callback: (presence: PresenceUpdate) => void) => void;
}

export const useWebSocket = (serverUrl: string, username?: string): UseWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  
  // Event callbacks
  const drawingEventCallback = useRef<((event: DrawingEvent) => void) | null>(null);
  const chatMessageCallback = useRef<((message: ChatMessage) => void) | null>(null);
  const presenceUpdateCallback = useRef<((presence: PresenceUpdate) => void) | null>(null);

  const connect = useCallback(() => {
    try {
      const wsUrl = username ? `${serverUrl}?username=${encodeURIComponent(username)}` : serverUrl;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 3000);
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
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [serverUrl, username]);

  useEffect(() => {
    connect();

    return () => {
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

  const sendDrawingEvent = useCallback((event: Omit<DrawingEvent, 'type' | 'userId' | 'timestamp'>) => {
    sendMessage({
      type: 'drawing',
      ...event,
    });
  }, [sendMessage]);

  const sendChatMessage = useCallback((message: string) => {
    sendMessage({
      type: 'chat',
      message,
    });
  }, [sendMessage]);

  const sendPresenceUpdate = useCallback((x: number, y: number, color: string, tool: string) => {
    sendMessage({
      type: 'presence',
      payload: { x, y, color, tool },
    });
  }, [sendMessage]);

  const onDrawingEvent = useCallback((callback: (event: DrawingEvent) => void) => {
    drawingEventCallback.current = callback;
  }, []);

  const onChatMessage = useCallback((callback: (message: ChatMessage) => void) => {
    chatMessageCallback.current = callback;
  }, []);

  const onPresenceUpdate = useCallback((callback: (presence: PresenceUpdate) => void) => {
    presenceUpdateCallback.current = callback;
  }, []);

  return {
    sendDrawingEvent,
    sendChatMessage,
    sendPresenceUpdate,
    isConnected,
    userCount,
    onDrawingEvent,
    onChatMessage,
    onPresenceUpdate,
  };
};
