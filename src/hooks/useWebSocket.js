import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthToken } from './authStore';
import { useSnackbar } from 'notistack';

export function useWebSocket() {
	const [socket, setSocket] = useState(null);
	const [notifications, setNotifications] = useState([]);
	const [messages, setMessages] = useState([]);
	const [notificationCount, setNotificationCount] = useState(0);
	const reconnectAttemptsRef = useRef(0);
	const { token } = useAuthToken.getState();
	const { enqueueSnackbar } = useSnackbar();

	const connect = useCallback(() => {
		if (!token?.data?.token) {
			// enqueueSnackbar('Please login first', { variant: 'error' });
			return;
		}

		const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}?token=${encodeURIComponent(token.data.token)}`);

		ws.onopen = () => {
			setSocket(ws);
			reconnectAttemptsRef.current = 0;
			//	enqueueSnackbar('Connected to notification server', { variant: 'success' });
		};

		ws.onmessage = (event) => {
			try {
				const messageText = event.data;
				console.log('Received notification :', messageText);
				// Handle notifications (plain text)
				if (typeof messageText === 'string' && messageText.startsWith('Notification:')) {
					const content = messageText.substring(13).trim();
					const notification = {
						type: 'notification',
						content: content,
						timestamp: new Date().toISOString(),
					};

					setNotifications((prev) => [...prev, notification]);
					setNotificationCount((prev) => prev + 1);

					enqueueSnackbar(content, { variant: 'info', autoHideDuration: 3000 });
					return;
				}

				// Handle direct messages (e.g., "From 19: uuuu")
				if (typeof messageText === 'string' && messageText.startsWith('From')) {
					const [fromPart, toPart] = messageText.split(' To: ');
					if (fromPart && toPart) {
						const parts = fromPart.split(':');
						if (parts.length >= 2) {
							const senderId = parts[0].substring(5).trim();
							const content = parts.slice(1).join(':').trim();
							const receiverId = toPart.trim();
							const message = {
								senderId,
								receiverId,
								content,
								isReceived: true,
								timestamp: new Date().toISOString(),
							};
							setMessages((prev) => {
								const newMessages = [...prev, message];
								return newMessages;
							});
						}
					}
					return;
				}

				// Handle JSON messages
				const data = JSON.parse(messageText);
				if (data.type === 'notification') {
					setNotifications((prev) => [...prev, data]);
					setNotificationCount((prev) => prev + 1);
					enqueueSnackbar(data.content, { variant: 'info', autoHideDuration: 3000 });
				}
			} catch (error) {
				console.error('Failed to process message:', error);
				// enqueueSnackbar('Error processing message', { variant: 'error' });
			}
		};

		ws.onclose = () => {
			setSocket(null);
			if (reconnectAttemptsRef.current < 5) {
				setTimeout(connect, 1000 * Math.pow(2, reconnectAttemptsRef.current));
				reconnectAttemptsRef.current++;
				// enqueueSnackbar('Reconnecting...', { variant: 'info' });
			} else {
				// enqueueSnackbar('Failed to reconnect after 5 attempts', { variant: 'error' });
			}
		};

		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
			// enqueueSnackbar('Connection error', { variant: 'error' });
		};
	}, [token]);

	const clearNotifications = () => {
		setNotifications([]);
		setNotificationCount(0);
	};

	const clearMessages = () => {
		setMessages([]);
	};

	useEffect(() => {
		connect();
		return () => socket?.close();
	}, [connect]);

	return {
		socket,
		notifications,
		notificationCount,
		messages, // Added
		clearNotifications,
		clearMessages, // Added
	};
}
