import React, { useState, useEffect } from 'react';
import { Users, Plus, Globe } from 'lucide-react';
import { Room } from '../hooks/useWebSocket';

interface RoomManagerProps {
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (name: string, maxUsers: number, isPrivate: boolean, password?: string) => void;
  createRoom: (name: string, maxUsers: number, isPrivate: boolean, password?: string) => Promise<Room>;
  listRooms: () => Promise<Room[]>;
  currentRoom: string | undefined;
  onClose: () => void;
}

const RoomManager: React.FC<RoomManagerProps> = ({
  onJoinRoom,
  onCreateRoom,
  createRoom,
  listRooms,
  currentRoom,
  onClose,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Create room form state
  const [roomName, setRoomName] = useState('');
  const [maxUsers, setMaxUsers] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const roomList = await listRooms();
      setRooms(roomList);
    } catch (err) {
      setError('Failed to load rooms');
      console.error('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }

    try {
      setLoading(true);
      const newRoom = await createRoom(roomName, maxUsers, isPrivate, password);
      onCreateRoom(roomName, maxUsers, isPrivate, password);
      onJoinRoom(newRoom.id);
      setShowCreateForm(false);
      setRoomName('');
      setPassword('');
      loadRooms();
    } catch (err) {
      setError('Failed to create room');
      console.error('Error creating room:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    onJoinRoom(roomId);
    onClose();
  };

  return (
    <div className="w-80 bg-gray-200 border-2 border-gray-400 windows98-panel">
      {/* Header */}
      <div className="bg-gray-300 border-b border-gray-400 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users size={16} />
          <span className="text-sm font-bold windows98-text">Room Manager</span>
        </div>
        <button
          onClick={onClose}
          className="windows98-button px-2 py-1 text-xs"
          aria-label="Close room manager"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
        {/* Current Room */}
        {currentRoom && (
          <div className="bg-blue-100 border border-blue-300 p-2 rounded">
            <div className="text-xs font-bold">Current Room:</div>
            <div className="text-xs">{currentRoom}</div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-300 p-2 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Create Room Button */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="windows98-button w-full p-2 flex items-center justify-center space-x-2"
          disabled={loading}
        >
          <Plus size={16} />
          <span>Create New Room</span>
        </button>

        {/* Create Room Form */}
        {showCreateForm && (
          <div className="border border-gray-400 p-3 bg-gray-100 space-y-2">
            <div>
              <label className="text-xs windows98-text">Room Name:</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full p-1 border border-gray-400 text-xs"
                placeholder="Enter room name..."
                maxLength={50}
              />
            </div>
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="text-xs windows98-text">Max Users:</label>
                <input
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value) || 10)}
                  className="w-full p-1 border border-gray-400 text-xs"
                  min="2"
                  max="50"
                />
              </div>
              
              <div className="flex items-center space-x-1 pt-4">
                <input
                  type="checkbox"
                  id="private-room"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="text-xs"
                />
                <label htmlFor="private-room" className="text-xs windows98-text">Private</label>
              </div>
            </div>

            {isPrivate && (
              <div>
                <label className="text-xs windows98-text">Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-1 border border-gray-400 text-xs"
                  placeholder="Optional password..."
                />
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleCreateRoom}
                disabled={loading || !roomName.trim()}
                className="windows98-button flex-1 p-1 text-xs disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="windows98-button flex-1 p-1 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Room List */}
        <div className="space-y-1">
          <div className="text-xs font-bold windows98-text">Available Rooms:</div>
          
          {loading && (
            <div className="text-xs text-gray-600 text-center py-2">Loading rooms...</div>
          )}
          
          {!loading && rooms.length === 0 && (
            <div className="text-xs text-gray-600 text-center py-2">No rooms available</div>
          )}
          
          {!loading && rooms.map((room) => (
            <div
              key={room.id}
              className="border border-gray-400 p-2 bg-white hover:bg-gray-50 cursor-pointer"
              onClick={() => handleJoinRoom(room.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {/* <Lock size={12} /> */}
                  <Globe size={12} />
                  <span className="text-xs font-bold">{room.name}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {room.userCount}/{room.maxUsers}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Created: {new Date(room.createdAt * 1000).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadRooms}
          disabled={loading}
          className="windows98-button w-full p-1 text-xs disabled:opacity-50"
        >
          Refresh Rooms
        </button>
      </div>
    </div>
  );
};

export default RoomManager;