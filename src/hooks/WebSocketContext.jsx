// src/hooks/WebSocketContext.jsx
import React, { createContext, useContext } from 'react';
import { useWebSocket } from './useWebSocket';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
	const webSocket = useWebSocket();
	return <WebSocketContext.Provider value={webSocket}>{children}</WebSocketContext.Provider>;
}

export function useWebSocketContext() {
	const context = useContext(WebSocketContext);
	if (!context) {
		throw new Error('useWebSocketContext must be used within a WebSocketProvider');
	}
	return context;
}
