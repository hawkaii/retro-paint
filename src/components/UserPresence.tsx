import React from 'react';
import { UserListUpdate } from '../hooks/useWebSocket';

interface UserPresenceProps {
  users: UserListUpdate['users'];
  currentUserId?: string;
  canvasWidth: number;
  canvasHeight: number;
}

const UserPresence: React.FC<UserPresenceProps> = ({ 
  users, 
  currentUserId, 
  canvasWidth, 
  canvasHeight 
}) => {
  // Filter out current user
  const otherUsers = users.filter(user => user.id !== currentUserId);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {otherUsers.map((user) => {
        // Only show cursor if user is within canvas bounds
        if (
          user.presence.x < 0 || 
          user.presence.x > canvasWidth || 
          user.presence.y < 0 || 
          user.presence.y > canvasHeight
        ) {
          return null;
        }

        return (
          <div
            key={user.id}
            className="absolute pointer-events-none"
            style={{
              left: user.presence.x - 8,
              top: user.presence.y - 8,
              zIndex: 1000,
            }}
          >
            {/* Cursor */}
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: user.presence.color }}
            />
            
            {/* User label */}
            <div
              className="absolute top-5 left-0 px-2 py-1 rounded text-xs font-bold whitespace-nowrap shadow-lg border border-gray-400"
              style={{
                backgroundColor: user.presence.color,
                color: getContrastColor(user.presence.color),
              }}
            >
              {user.username} ({user.presence.tool})
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Helper function to determine if text should be black or white based on background color
const getContrastColor = (hexColor: string): string => {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export default UserPresence;