// Local storage utility for persisting canvas and user state
export interface PersistedState {
  canvas?: {
    imageData: string;
    history: string[];
    historyIndex: number;
    lastUpdated: number;
  };
  user?: {
    id: string;
    username: string;
  };
  room?: {
    id: string;
    name: string;
  };
}

const STORAGE_KEYS = {
  CANVAS: 'retro-paint-canvas',
  USER: 'retro-paint-user',
  ROOM: 'retro-paint-room',
  SESSION: 'retro-paint-session',
} as const;

class PersistenceManager {
  // Save canvas state
  saveCanvas(imageData: string, history: string[], historyIndex: number): void {
    try {
      const canvasState = {
        imageData,
        history: history.slice(-20), // Keep last 20 for performance
        historyIndex,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.CANVAS, JSON.stringify(canvasState));
    } catch (error) {
      console.warn('Failed to save canvas to localStorage:', error);
    }
  }

  // Load canvas state
  loadCanvas(): PersistedState['canvas'] | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CANVAS);
      if (!stored) return null;
      
      const canvasState = JSON.parse(stored);
      
      // Check if data is stale (older than 24 hours)
      const isStale = Date.now() - canvasState.lastUpdated > 24 * 60 * 60 * 1000;
      if (isStale) {
        this.clearCanvas();
        return null;
      }
      
      return canvasState;
    } catch (error) {
      console.warn('Failed to load canvas from localStorage:', error);
      return null;
    }
  }

  // Save user identity
  saveUser(id: string, username: string): void {
    try {
      const userState = { id, username };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userState));
    } catch (error) {
      console.warn('Failed to save user to localStorage:', error);
    }
  }

  // Load user identity
  loadUser(): PersistedState['user'] | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load user from localStorage:', error);
      return null;
    }
  }

  // Save room info
  saveRoom(id: string, name: string): void {
    try {
      const roomState = { id, name };
      localStorage.setItem(STORAGE_KEYS.ROOM, JSON.stringify(roomState));
    } catch (error) {
      console.warn('Failed to save room to localStorage:', error);
    }
  }

  // Load room info
  loadRoom(): PersistedState['room'] | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ROOM);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load room from localStorage:', error);
      return null;
    }
  }

  // Generate or load persistent user ID
  getOrCreateUserId(): string {
    const existingUser = this.loadUser();
    if (existingUser?.id) {
      return existingUser.id;
    }
    
    // Generate new persistent ID
    const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return newId;
  }

  // Generate or load persistent username
  getOrCreateUsername(): string {
    const existingUser = this.loadUser();
    if (existingUser?.username) {
      return existingUser.username;
    }
    
    // Generate new username
    const adjectives = ['Retro', 'Pixel', 'Neon', 'Cyber', 'Digital', 'Classic', 'Vintage', 'Cool'];
    const nouns = ['Artist', 'Painter', 'Creator', 'Designer', 'Sketcher', 'Doodler', 'Master', 'Pro'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 100);
    
    return `${adjective}${noun}${number}`;
  }

  // Clear all stored data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Clear only canvas data
  clearCanvas(): void {
    localStorage.removeItem(STORAGE_KEYS.CANVAS);
  }

  // Clear only room data
  clearRoom(): void {
    localStorage.removeItem(STORAGE_KEYS.ROOM);
  }

  // Get default room ID
  getDefaultRoomId(): string {
    return 'default-collaboration-room';
  }
}

export const persistenceManager = new PersistenceManager();