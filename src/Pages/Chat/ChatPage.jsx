import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { enqueueSnackbar } from 'notistack';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import { Badge } from '@/components/ui/badge';

function ChatPage() {
	const [selectedUser, setSelectedUser] = useState(null);
	const [message, setMessage] = useState('');
	const [chatMessages, setChatMessages] = useState([]);
	const [unreadCounts, setUnreadCounts] = useState({});
	const { socket, messages, notifications } = useWebSocketContext();
	const messagesEndRef = useRef(null);
	const { token } = useAuthToken.getState();

	console.log('token:', token);

	const {
		data: users = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['users'],
		queryFn: async () => {
			const response = await getAllUsers(token.data.token);
			console.log('users:', response);
			return response || [];
		},
		enabled: !!token?.data?.token,
	});

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatMessages]);

	useEffect(() => {
		if (token?.data?.user?.id) {
			console.log('Messages:', messages);

			// Update unread message counts
			const newUnreadCounts = {};
			messages.forEach((msg) => {
				if (
					msg.isReceived &&
					msg.senderId !== String(token.data.user.id) &&
					msg.receiverId === String(token.data.user.id) &&
					(!selectedUser || msg.senderId !== String(selectedUser.id))
				) {
					newUnreadCounts[msg.senderId] = (newUnreadCounts[msg.senderId] || 0) + 1;
				}
			});
			setUnreadCounts(newUnreadCounts);

			// Filter messages for selected user without clearing previous messages
			if (selectedUser) {
				const relevantMessages = messages.filter((msg) => {
					const isSent =
						msg.senderId === String(token.data.user.id) && msg.receiverId === String(selectedUser.id);
					const isReceived =
						msg.senderId === String(selectedUser.id) && msg.receiverId === String(token.data.user.id);
					return isSent || isReceived;
				});

				// Transform messages without clearing previous ones
				const transformedMessages = relevantMessages.map((msg) => ({
					senderId: msg.senderId || '',
					receiverId: msg.receiverId || '',
					content: msg.content,
					timestamp: msg.timestamp,
					isSent: msg.senderId === String(token.data.user.id),
				}));

				// Update chat messages while preserving previous ones
				setChatMessages(transformedMessages);
			}
		}
	}, [messages, selectedUser, token?.data?.user?.id]);

	useEffect(() => {
		if (selectedUser) {
			setUnreadCounts((prev) => ({
				...prev,
				[selectedUser.id]: 0,
			}));
		}
	}, [selectedUser]);

	const handleSendMessage = async () => {
		if (!message.trim() || !selectedUser || !socket || socket.readyState !== WebSocket.OPEN) {
			enqueueSnackbar('Cannot send message: Check connection or select a user', {
				variant: 'error',
			});
			return;
		}
		const newMessage = {
			senderId: String(token.data.user.id),
			receiverId: String(selectedUser.id),
			content: message,
		};

		try {
			socket.send(JSON.stringify(newMessage));
			console.log('Sent message:', newMessage);
			const updatedMessages = [
				...chatMessages,
				{
					...newMessage,
					timestamp: new Date().toISOString(),
					isSent: true,
				},
			];
			setChatMessages(updatedMessages);
			console.log('Updated chatMessages:', updatedMessages);
			setMessage('');
		} catch (error) {
			console.error('Error sending message:', error);
			enqueueSnackbar('Failed to send message', { variant: 'error' });
		}
	};

	if (isLoading) {
		return <div className="flex items-center justify-center h-full">Loading users...</div>;
	}

	if (error) {
		return <div className="flex items-center justify-center h-full text-destructive">Error: {error.message}</div>;
	}

	return (
		<div className="flex h-[calc(80vh-2rem)] gap-2">
			<Card className="w-1/5 p-4">
				<h2 className="text-xl font-bold">Chat</h2>
				<ScrollArea className="h-[calc(100vh-8rem)]">
					{users
						.filter((user) => user.username !== token.data.user.username)
						.map((user) => (
							<div
								key={user.id}
								className={`p-2 cursor-pointer rounded-lg flex items-center justify-between ${
									selectedUser?.id === user.id
										? 'bg-primary text-primary-foreground'
										: 'hover:bg-secondary'
								}`}
								onClick={() => setSelectedUser(user)}
							>
								<div className="font-medium">{user.username}</div>
								{unreadCounts[user.id] > 0 && (
									<Badge variant="destructive" className="ml-2">
										{unreadCounts[user.id]}
									</Badge>
								)}
							</div>
						))}
				</ScrollArea>
			</Card>
			<Card className="flex-1 p-4 flex flex-col">
				{selectedUser ? (
					<>
						<div className="border-b pb-4">
							<h2 className="text-xl font-bold">{selectedUser.username}</h2>
						</div>
						<div className="flex flex-col flex-1 overflow-hidden">
							<ScrollArea className="flex-1">
								<div className="space-y-4 p-4">
									{chatMessages.map((msg, index) => (
										<div
											key={index}
											className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'}`}
										>
											<div
												className={`max-w-[70%] p-3 rounded-lg ${
													msg.isSent ? 'bg-primary text-primary-foreground' : 'bg-secondary'
												}`}
											>
												<p>{msg.content}</p>
												<p className="text-xs text-gray-500">
													{new Date(msg.timestamp).toLocaleTimeString()}
												</p>
											</div>
										</div>
									))}
									{notifications.map((notif, index) => (
										<div key={`notif-${index}`} className="flex justify-center">
											<div className="max-w-[70%] p-3 rounded-lg bg-info text-info-foreground">
												<p>{notif.content}</p>
												<p className="text-xs text-gray-500">
													{new Date(notif.timestamp).toLocaleTimeString()}
												</p>
											</div>
										</div>
									))}
									<div ref={messagesEndRef} />
								</div>
							</ScrollArea>
							<div className="pt-4 border-t mt-auto">
								<div className="flex gap-2">
									<Input
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										placeholder="Type a message..."
										onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
									/>
									<Button onClick={handleSendMessage}>Send</Button>
								</div>
							</div>
						</div>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						Select a user to start chatting
					</div>
				)}
			</Card>
		</div>
	);
}

export default ChatPage;
