/**
 * Custom hook for WebSocket connection management using the shared WebSocketContext
 */

import { useWebSocketContext } from '@/context/WebSocketContext';

export const useWebSocket = () => {
  return useWebSocketContext();
};
