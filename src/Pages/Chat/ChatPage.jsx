import React, { useState, useEffect, useRef, Fragment, useCallback, useMemo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
	ArrowLeft as IconArrowLeft,
	MoreVertical as IconDotsVertical,
	MessageSquare as IconMessages,
	Paperclip as IconPaperclip,
	ImagePlus as IconPhotoPlus,
	Plus as IconPlus,
	Send as IconSend,
	Video as IconVideo,
	Phone as IconPhone,
	Search as IconSearch,
	Check,
	CheckCheck,
	ChevronUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '@/lib/api';
import { useAuthToken } from '@/hooks/authStore';
import { enqueueSnackbar } from 'notistack';
import { useWebSocketContext } from '@/hooks/WebSocketContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Loader from '@/components/Loader';

// Placeholder components (replace with your actual implementations)
const Header = ({ children }) => (
	<header className="sticky top-0 z-10 border-b bg-background px-4 py-2">{children}</header>
);
const Main = ({ children, fixed }) => (
	<main className={cn('flex-1 px-4 py-2', fixed && 'h-[calc(100vh-4rem)]')}>{children}</main>
);
const ProfileDropdown = () => <div>Profile</div>;
const ThemeSwitch = () => <div>Theme</div>;
const Search = () => <div>Search</div>;
const NewChat = ({ users, open, onOpenChange }) => <div>{open ? 'New Chat Dialog' : ''}</div>;

// Enhanced Message Storage Hook with optimization for large chats
const useOptimizedMessageStorage = () => {
	const [storedMessages, setStoredMessages] = useState(() => {
		try {
			const saved = localStorage.getItem('chatMessages');
			if (!saved) return [];

			const messages = JSON.parse(saved);
			// Keep only last 1000 messages to prevent memory issues
			const recentMessages = Array.isArray(messages) ? messages.slice(-1000) : [];
			return recentMessages;
		} catch (error) {
			console.warn('Failed to load messages from localStorage:', error);
			return [];
		}
	});

	const [isLoading, setIsLoading] = useState(false);

	const addMessage = useCallback((message) => {
		if (!message || !message.content?.trim()) return;

		setStoredMessages((prev) => {
			// Prevent duplicate messages
			const exists = prev.some(
				(msg) =>
					(msg.id && msg.id === message.id) ||
					(msg.senderId === message.senderId &&
						msg.receiverId === message.receiverId &&
						msg.timestamp === message.timestamp &&
						msg.content === message.content),
			);

			if (exists) return prev;

			const newMessage = {
				...message,
				id: message.id || `${message.senderId}-${message.receiverId}-${message.timestamp || Date.now()}`,
				timestamp: message.timestamp || new Date().toISOString(),
				content: message.content.trim(),
			};

			const updated = [...prev, newMessage];
			// Keep only last 1000 messages for performance
			const trimmed = updated.slice(-1000);

			try {
				localStorage.setItem('chatMessages', JSON.stringify(trimmed));
			} catch (error) {
				console.warn('Failed to save messages to localStorage:', error);
				// If storage is full, keep only last 500 messages
				const reducedMessages = trimmed.slice(-500);
				try {
					localStorage.setItem('chatMessages', JSON.stringify(reducedMessages));
					return reducedMessages;
				} catch {
					return prev; // If still failing, don't update
				}
			}
			return trimmed;
		});
	}, []);

	const getMessagesForUser = useCallback(
		(currentUserId, targetUserId) => {
			if (!currentUserId || !targetUserId || !Array.isArray(storedMessages)) {
				return [];
			}

			return storedMessages
				.filter((msg) => {
					if (!msg || !msg.senderId || !msg.receiverId) return false;

					const isSentToUser = msg.senderId === currentUserId && msg.receiverId === targetUserId;
					const isReceivedFromUser = msg.senderId === targetUserId && msg.receiverId === currentUserId;

					return isSentToUser || isReceivedFromUser;
				})
				.sort((a, b) => {
					const dateA = new Date(a.timestamp || 0);
					const dateB = new Date(b.timestamp || 0);
					return dateA.getTime() - dateB.getTime();
				});
		},
		[storedMessages],
	);

	const clearMessages = useCallback(() => {
		setStoredMessages([]);
		localStorage.removeItem('chatMessages');
	}, []);

	const getMessageCount = useCallback(
		(currentUserId, targetUserId) => {
			return getMessagesForUser(currentUserId, targetUserId).length;
		},
		[getMessagesForUser],
	);

	return {
		storedMessages,
		addMessage,
		getMessagesForUser,
		clearMessages,
		getMessageCount,
		isLoading,
	};
};

// Enhanced Date Separator Component
const DateSeparator = React.memo(({ date }) => {
	const formatDate = useCallback((date) => {
		try {
			const parsedDate = new Date(date);
			if (isNaN(parsedDate.getTime())) return 'Invalid Date';

			if (isToday(parsedDate)) return 'Today';
			if (isYesterday(parsedDate)) return 'Yesterday';
			return format(parsedDate, 'EEEE, MMMM d, yyyy');
		} catch {
			return 'Invalid Date';
		}
	}, []);

	return (
		<div className="flex items-center justify-center my-4">
			<div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
				{formatDate(date)}
			</div>
		</div>
	);
});

DateSeparator.displayName = 'DateSeparator';

// Enhanced Message Component with error handling
const MessageBubble = React.memo(({ message, isOwn, showAvatar = false, user }) => {
	if (!message || !message.content) return null;

	const messageTime = useMemo(() => {
		try {
			const date = new Date(message.timestamp);
			if (isNaN(date.getTime())) return '';
			return format(date, 'h:mm a');
		} catch {
			return '';
		}
	}, [message.timestamp]);

	return (
		<div className={cn('flex gap-2 mb-2', isOwn ? 'justify-end' : 'justify-start')}>
			{!isOwn && showAvatar && (
				<Avatar className="w-8 h-8 mt-1 flex-shrink-0">
					<AvatarImage
						src={user?.profile || ''}
						alt={user?.username || 'User'}
						onError={(e) => {
							e.target.src = '';
						}}
					/>
					<AvatarFallback className="text-xs">{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
				</Avatar>
			)}
			{!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

			<div className={cn('max-w-[70%] lg:max-w-[60%] group', isOwn ? 'items-end' : 'items-start')}>
				<div
					className={cn(
						'px-4 py-2 rounded-2xl shadow-sm relative break-words',
						isOwn
							? 'bg-blue-500 text-white rounded-br-md'
							: 'bg-secondary text-secondary-foreground rounded-bl-md',
					)}
				>
					<p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
					<div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
						{messageTime && (
							<span className={cn('text-xs opacity-70', isOwn ? 'text-white' : 'text-muted-foreground')}>
								{messageTime}
							</span>
						)}
						{isOwn && (
							<div className="text-white opacity-70">
								{message.isDelivered ? (
									message.isRead ? (
										<CheckCheck size={12} className="text-blue-200" />
									) : (
										<CheckCheck size={12} />
									)
								) : (
									<Check size={12} />
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
});

MessageBubble.displayName = 'MessageBubble';

// Enhanced Typing Indicator
const TypingIndicator = React.memo(({ user }) => {
	if (!user) return null;

	return (
		<div className="flex gap-2 mb-2">
			<Avatar className="w-8 h-8 mt-1 flex-shrink-0">
				<AvatarImage
					src={user.profile || ''}
					alt={user.username || 'User'}
					onError={(e) => {
						e.target.src = '';
					}}
				/>
				<AvatarFallback className="text-xs">{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
			</Avatar>
			<div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-2xl rounded-bl-md">
				<div className="flex gap-1">
					<div
						className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
						style={{ animationDelay: '0ms' }}
					/>
					<div
						className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
						style={{ animationDelay: '150ms' }}
					/>
					<div
						className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
						style={{ animationDelay: '300ms' }}
					/>
				</div>
			</div>
		</div>
	);
});

TypingIndicator.displayName = 'TypingIndicator';

// User List Item Component with enhanced error handling
const UserListItem = React.memo(({ user, isSelected, lastMessage, lastTime, unreadCount, onClick }) => {
	// Safety check for user data
	if (!user || !user.username) {
		return null;
	}

	return (
		<div
			className={cn(
				'w-full p-3 rounded-lg text-left hover:bg-muted/50 transition-colors duration-200 cursor-pointer',
				isSelected && 'bg-muted shadow-sm border-l-4 border-blue-500',
			)}
			onClick={onClick}
		>
			<div className="flex gap-3 items-center">
				<div className="relative flex-shrink-0">
					<Avatar className="w-12 h-12">
						<AvatarImage
							src={user.profile || ''}
							alt={user.username}
							onError={(e) => {
								e.target.src = '';
							}}
						/>
						<AvatarFallback className="text-sm font-medium">
							{user.username[0]?.toUpperCase() || 'U'}
						</AvatarFallback>
					</Avatar>
					<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex justify-between items-start mb-1">
						<span className="font-medium text-sm truncate pr-2">{user.username}</span>
						<div className="flex flex-col items-end gap-1 flex-shrink-0">
							{lastTime && <span className="text-xs text-muted-foreground">{lastTime}</span>}
							{unreadCount > 0 && (
								<Badge variant="default" className="h-5 min-w-[20px] text-xs">
									{unreadCount > 99 ? '99+' : unreadCount}
								</Badge>
							)}
						</div>
					</div>
					<p className="text-muted-foreground text-sm truncate">{lastMessage || 'No messages yet'}</p>
				</div>
			</div>
		</div>
	);
});

UserListItem.displayName = 'UserListItem';

// Load More Messages Button
const LoadMoreMessages = React.memo(({ onLoadMore, hasMore, isLoading }) => {
	if (!hasMore) return null;

	return (
		<div className="flex justify-center py-2">
			<Button variant="ghost" size="sm" onClick={onLoadMore} disabled={isLoading} className="text-xs">
				{isLoading ? <Loader className="w-4 h-4 mr-2" /> : <ChevronUp className="w-4 h-4 mr-2" />}
				{isLoading ? 'Loading...' : 'Load older messages'}
			</Button>
		</div>
	);
});

LoadMoreMessages.displayName = 'LoadMoreMessages';

function ChatPage() {
	// Basic state
	const [selectedUser, setSelectedUser] = useState(null);
	const [mobileSelectedUser, setMobileSelectedUser] = useState(null);
	const [message, setMessage] = useState('');
	const [unreadCounts, setUnreadCounts] = useState({});
	const [search, setSearch] = useState('');
	const [createConversationDialogOpened, setCreateConversationDialog] = useState(false);

	// Chat state
	const [isTyping, setIsTyping] = useState(false);
	const [typingUsers, setTypingUsers] = useState(new Set());
	const [processedMessageIds, setProcessedMessageIds] = useState(new Set());

	// Pagination state
	const [messagesPerPage] = useState(50);
	const [currentMessagePage, setCurrentMessagePage] = useState(0);
	const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

	// Loading states
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);

	// Refs
	const { socket, messages, notifications } = useWebSocketContext();
	const { storedMessages, addMessage, getMessagesForUser, getMessageCount } = useOptimizedMessageStorage();
	const messagesEndRef = useRef(null);
	const messagesContainerRef = useRef(null);
	const typingTimeoutRef = useRef(null);

	// Auth
	const { token } = useAuthToken.getState();
	const currentUserId = token?.data?.user?.id;

	// Fetch users
	const {
		data: users = [],
		isLoading: isLoadingUsers,
		error: usersError,
	} = useQuery({
		queryKey: ['users'],
		queryFn: async () => {
			try {
				const response = await getAllUsers(token.data.token);
				return Array.isArray(response) ? response : [];
			} catch (error) {
				console.error('Failed to fetch users:', error);
				return [];
			}
		},
		enabled: !!token?.data?.token,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
	});

	// Memoized filtered users
	const filteredUsers = useMemo(() => {
		if (!Array.isArray(users) || !token?.data?.user?.username) return [];

		return users.filter((user) => {
			if (!user || !user.username) return false;
			return (
				user.username !== token.data.user.username &&
				user.username.toLowerCase().includes(search.trim().toLowerCase())
			);
		});
	}, [users, token?.data?.user?.username, search]);

	// Enhanced message grouping with pagination
	const currentMessages = useMemo(() => {
		if (!selectedUser || !currentUserId) return {};

		setIsLoadingMessages(true);

		try {
			const allUserMessages = getMessagesForUser(String(currentUserId), String(selectedUser.id));

			if (!Array.isArray(allUserMessages)) return {};

			// Calculate pagination
			const totalMessages = allUserMessages.length;
			const messagesToShow = (currentMessagePage + 1) * messagesPerPage;
			const startIndex = Math.max(0, totalMessages - messagesToShow);

			const paginatedMessages = allUserMessages.slice(startIndex);

			// Group messages by date
			const groupedByDate = {};
			paginatedMessages.forEach((msg) => {
				if (!msg || !msg.timestamp) return;

				try {
					const dateKey = format(new Date(msg.timestamp), 'yyyy-MM-dd');
					if (!groupedByDate[dateKey]) {
						groupedByDate[dateKey] = [];
					}
					groupedByDate[dateKey].push({
						...msg,
						isOwn: msg.senderId === String(currentUserId),
					});
				} catch (error) {
					console.warn('Error processing message date:', error);
				}
			});

			setIsLoadingMessages(false);
			return groupedByDate;
		} catch (error) {
			console.error('Error processing messages:', error);
			setIsLoadingMessages(false);
			return {};
		}
	}, [selectedUser, currentUserId, storedMessages, currentMessagePage, messagesPerPage, getMessagesForUser]);

	// Check if there are more messages to load
	const hasMoreMessages = useMemo(() => {
		if (!selectedUser || !currentUserId) return false;

		const totalMessages = getMessageCount(String(currentUserId), String(selectedUser.id));
		const currentlyShown = (currentMessagePage + 1) * messagesPerPage;
		return totalMessages > currentlyShown;
	}, [selectedUser, currentUserId, currentMessagePage, messagesPerPage, getMessageCount]);

	// Memoized helper functions
	const getLastMessage = useCallback(
		(userId) => {
			try {
				if (!currentUserId || !userId) return 'No messages yet';

				const userMessages = getMessagesForUser(String(currentUserId), String(userId));
				if (!Array.isArray(userMessages) || userMessages.length === 0) {
					return 'No messages yet';
				}

				const lastMessage = userMessages[userMessages.length - 1];
				if (!lastMessage || !lastMessage.content) return 'No messages yet';

				const isOwn = lastMessage.senderId === String(currentUserId);
				const prefix = isOwn ? 'You: ' : '';
				const content =
					lastMessage.content.length > 30
						? lastMessage.content.substring(0, 30) + '...'
						: lastMessage.content;

				return `${prefix}${content}`;
			} catch (error) {
				console.warn('Error getting last message:', error);
				return 'No messages yet';
			}
		},
		[currentUserId, getMessagesForUser],
	);

	const getLastMessageTime = useCallback(
		(userId) => {
			try {
				if (!currentUserId || !userId) return '';

				const userMessages = getMessagesForUser(String(currentUserId), String(userId));
				if (!Array.isArray(userMessages) || userMessages.length === 0) {
					return '';
				}

				const lastMessage = userMessages[userMessages.length - 1];
				if (!lastMessage || !lastMessage.timestamp) return '';

				const messageDate = new Date(lastMessage.timestamp);
				if (isNaN(messageDate.getTime())) return '';

				if (isToday(messageDate)) {
					return format(messageDate, 'h:mm a');
				} else if (isYesterday(messageDate)) {
					return 'Yesterday';
				} else {
					return format(messageDate, 'MMM d');
				}
			} catch (error) {
				console.warn('Error getting last message time:', error);
				return '';
			}
		},
		[currentUserId, getMessagesForUser],
	);

	// Load older messages
	const loadOlderMessages = useCallback(() => {
		if (isLoadingOlderMessages || !hasMoreMessages) return;

		setIsLoadingOlderMessages(true);

		// Simulate loading delay for better UX
		setTimeout(() => {
			setCurrentMessagePage((prev) => prev + 1);
			setIsLoadingOlderMessages(false);
		}, 500);
	}, [isLoadingOlderMessages, hasMoreMessages]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		const scrollToBottom = () => {
			if (messagesEndRef.current && messagesContainerRef.current) {
				const container = messagesContainerRef.current;
				const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;

				if (isScrolledToBottom) {
					messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
				}
			}
		};

		scrollToBottom();
	}, [currentMessages, typingUsers]);

	// Reset pagination when user changes
	useEffect(() => {
		setCurrentMessagePage(0);
	}, [selectedUser]);

	// Handle new messages from WebSocket
	useEffect(() => {
		if (!Array.isArray(messages) || messages.length === 0 || !currentUserId) return;

		const latestMessage = messages[messages.length - 1];
		if (!latestMessage || !latestMessage.timestamp || !latestMessage.content?.trim()) return;

		const messageId = `${latestMessage.senderId}-${latestMessage.receiverId}-${latestMessage.timestamp}`;

		if (!processedMessageIds.has(messageId)) {
			setProcessedMessageIds((prev) => new Set([...prev, messageId]));

			const messageWithMetadata = {
				...latestMessage,
				id: messageId,
				isDelivered: true,
				isRead: latestMessage.senderId === String(currentUserId),
				timestamp: latestMessage.timestamp,
			};

			addMessage(messageWithMetadata);

			// Update unread counts
			if (latestMessage.senderId !== String(currentUserId)) {
				const senderId = latestMessage.senderId;
				if (!selectedUser || senderId !== String(selectedUser.id)) {
					setUnreadCounts((prev) => ({
						...prev,
						[senderId]: (prev[senderId] || 0) + 1,
					}));
				}
			}
		}
	}, [messages, currentUserId, selectedUser?.id, addMessage, processedMessageIds]);

	// Handle typing indicator
	useEffect(() => {
		if (message.trim() && selectedUser && socket?.readyState === WebSocket.OPEN && currentUserId) {
			if (!isTyping) {
				setIsTyping(true);
				socket.send(
					JSON.stringify({
						type: 'typing',
						senderId: String(currentUserId),
						receiverId: String(selectedUser.id),
						isTyping: true,
					}),
				);
			}

			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}

			typingTimeoutRef.current = setTimeout(() => {
				setIsTyping(false);
				if (socket?.readyState === WebSocket.OPEN) {
					socket.send(
						JSON.stringify({
							type: 'typing',
							senderId: String(currentUserId),
							receiverId: String(selectedUser.id),
							isTyping: false,
						}),
					);
				}
			}, 1000);
		} else if (!message.trim() && isTyping) {
			setIsTyping(false);
			if (socket?.readyState === WebSocket.OPEN && currentUserId && selectedUser) {
				socket.send(
					JSON.stringify({
						type: 'typing',
						senderId: String(currentUserId),
						receiverId: String(selectedUser.id),
						isTyping: false,
					}),
				);
			}
		}

		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, [message, selectedUser, socket, currentUserId, isTyping]);

	// Clear unread count and reset pagination when selecting user
	const handleUserSelect = useCallback((user) => {
		if (!user) return;

		setSelectedUser(user);
		setMobileSelectedUser(user);
		setCurrentMessagePage(0); // Reset pagination
		setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));
	}, []);

	// Handle send message
	const handleSendMessage = useCallback(
		async (e) => {
			e.preventDefault();

			const trimmedMessage = message.trim();
			if (!trimmedMessage || !selectedUser || !socket || socket.readyState !== WebSocket.OPEN || !currentUserId) {
				if (!trimmedMessage) {
					enqueueSnackbar('Please enter a message', { variant: 'warning' });
				} else if (!selectedUser) {
					enqueueSnackbar('Please select a user to chat with', { variant: 'warning' });
				} else {
					enqueueSnackbar('Connection error. Please try again.', { variant: 'error' });
				}
				return;
			}

			const timestamp = new Date().toISOString();
			const messageId = `${currentUserId}-${selectedUser.id}-${timestamp}`;

			const newMessage = {
				id: messageId,
				senderId: String(currentUserId),
				receiverId: String(selectedUser.id),
				content: trimmedMessage,
				timestamp,
				isDelivered: false,
				isRead: false,
			};

			try {
				// Add to local storage immediately for instant UI update
				addMessage(newMessage);

				// Send via WebSocket
				socket.send(
					JSON.stringify({
						type: 'message',
						...newMessage,
					}),
				);

				// Clear input and typing state
				setMessage('');

				if (isTyping) {
					setIsTyping(false);
					socket.send(
						JSON.stringify({
							type: 'typing',
							senderId: String(currentUserId),
							receiverId: String(selectedUser.id),
							isTyping: false,
						}),
					);
				}

				// Auto-scroll to bottom
				setTimeout(() => {
					if (messagesEndRef.current) {
						messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
					}
				}, 100);
			} catch (error) {
				console.error('Error sending message:', error);
				enqueueSnackbar('Failed to send message. Please try again.', { variant: 'error' });
			}
		},
		[message, selectedUser, socket, currentUserId, addMessage, isTyping],
	);

	// Handle input key press
	const handleKeyPress = useCallback(
		(e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSendMessage(e);
			}
		},
		[handleSendMessage],
	);

	// Auto-resize textarea
	const handleTextareaChange = useCallback((e) => {
		setMessage(e.target.value);

		// Auto-resize
		e.target.style.height = 'auto';
		e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
	}, []);

	// Loading state
	if (isLoadingUsers) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<Loader className="mx-auto mb-4" />
					<p className="text-muted-foreground">Loading conversations...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (usersError) {
		return (
			<div className="flex items-center justify-center h-screen text-destructive">
				<div className="text-center">
					<p className="mb-2">Error loading conversations</p>
					<p className="text-sm text-muted-foreground">{usersError.message}</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<section className="flex h-screen bg-background overflow-hidden">
				{/* Left Side: User List - Fixed height with individual scroll */}
				<div className="flex w-full flex-col sm:w-80 lg:w-96 border-r bg-background/50 h-full">
					{/* Header - Fixed at top */}
					<div className="bg-background/95 backdrop-blur-sm sticky top-0 z-10 border-b px-4 py-4 flex-shrink-0 shadow-sm">
						<div className="flex items-center justify-between mb-4">
							<h1 className="text-2xl font-bold">Messages</h1>
							<Button
								size="icon"
								variant="ghost"
								className="rounded-full"
								onClick={() => setCreateConversationDialog(true)}
							>
								<IconMessages size={20} />
							</Button>
						</div>

						<div className="relative">
							<IconSearch
								size={16}
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								type="text"
								className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
								placeholder="Search conversations..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					</div>

					{/* Users List - Scrollable area */}
					<div className="flex-1 overflow-hidden">
						<ScrollArea className="h-full">
							<div className="px-3 py-2 space-y-1">
								{filteredUsers.length === 0 ? (
									<div className="text-center py-12 text-muted-foreground text-sm">
										{search.trim() ? (
											<div className="space-y-3">
												<IconSearch className="w-12 h-12 mx-auto opacity-30" />
												<div>
													<p className="font-medium">No users found</p>
													<p className="text-xs mt-1">Try a different search term</p>
												</div>
											</div>
										) : (
											<div className="space-y-3">
												<IconMessages className="w-12 h-12 mx-auto opacity-30" />
												<div>
													<p className="font-medium">No conversations yet</p>
													<p className="text-xs mt-1">Start by searching for users above</p>
												</div>
											</div>
										)}
									</div>
								) : (
									filteredUsers.map((user) => {
										const lastMsg = getLastMessage(user.id);
										const lastTime = getLastMessageTime(user.id);
										const unreadCount = unreadCounts[user.id] || 0;

										return (
											<UserListItem
												key={user.id}
												user={user}
												isSelected={selectedUser?.id === user.id}
												lastMessage={lastMsg}
												lastTime={lastTime}
												unreadCount={unreadCount}
												onClick={() => handleUserSelect(user)}
											/>
										);
									})
								)}
							</div>
						</ScrollArea>
					</div>
				</div>

				{/* Right Side: Chat Area - Fixed height with individual scroll */}
				{selectedUser ? (
					<div
						className={cn(
							'flex-1 flex flex-col bg-background h-full absolute inset-0 left-full z-50 sm:static sm:z-auto sm:relative',
							mobileSelectedUser && 'left-0',
						)}
					>
						{/* Chat Header - Fixed at top */}
						<div className="bg-background/95 backdrop-blur-sm border-b px-4 py-3 flex justify-between items-center flex-shrink-0 shadow-sm">
							<div className="flex items-center gap-3">
								<Button
									size="icon"
									variant="ghost"
									className="sm:hidden"
									onClick={() => setMobileSelectedUser(null)}
								>
									<IconArrowLeft size={20} />
								</Button>

								<div className="flex items-center gap-3">
									<div className="relative">
										<Avatar className="w-10 h-10">
											<AvatarImage
												src={selectedUser.profile || ''}
												alt={selectedUser.username}
												onError={(e) => {
													e.target.src = '';
												}}
											/>
											<AvatarFallback>
												{selectedUser.username?.[0]?.toUpperCase() || 'U'}
											</AvatarFallback>
										</Avatar>
										<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
									</div>

									<div>
										<h3 className="font-semibold text-sm">{selectedUser.username}</h3>
										<p className="text-xs text-muted-foreground">
											{typingUsers.has(selectedUser.id) ? (
												<span className="flex items-center gap-1">
													<span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
													typing...
												</span>
											) : (
												'Online'
											)}
										</p>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-1">
								<Button size="icon" variant="ghost" className="rounded-full h-9 w-9">
									<IconVideo size={18} />
								</Button>
								<Button size="icon" variant="ghost" className="rounded-full h-9 w-9">
									<IconPhone size={18} />
								</Button>
								<Button size="icon" variant="ghost" className="rounded-full h-9 w-9">
									<IconDotsVertical size={18} />
								</Button>
							</div>
						</div>

						{/* Messages Area - Scrollable with individual scroll */}
						<div className="flex-1 overflow-hidden bg-gradient-to-b from-background/30 to-background/50">
							<ScrollArea className="h-full" ref={messagesContainerRef}>
								<div className="px-4 py-4 space-y-2">
									{/* Load More Button */}
									<LoadMoreMessages
										onLoadMore={loadOlderMessages}
										hasMore={hasMoreMessages}
										isLoading={isLoadingOlderMessages}
									/>

									{/* Loading State */}
									{isLoadingMessages && (
										<div className="flex items-center justify-center py-8">
											<div className="flex flex-col items-center gap-2">
												<Loader className="w-6 h-6" />
												<p className="text-sm text-muted-foreground">Loading messages...</p>
											</div>
										</div>
									)}

									{/* Messages */}
									{Object.keys(currentMessages).length === 0 && !isLoadingMessages ? (
										<div className="flex items-center justify-center h-96">
											<div className="text-center space-y-4">
												<div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mx-auto">
													<IconMessages className="w-8 h-8 text-muted-foreground" />
												</div>
												<div>
													<h3 className="font-medium text-lg mb-2">No messages yet</h3>
													<p className="text-muted-foreground text-sm max-w-sm">
														Start the conversation with{' '}
														<span className="font-medium">{selectedUser.username}</span>
													</p>
												</div>
											</div>
										</div>
									) : (
										<div className="space-y-4">
											{Object.keys(currentMessages)
												.sort((a, b) => new Date(a) - new Date(b))
												.map((dateKey) => (
													<div key={dateKey} className="space-y-2">
														<DateSeparator date={new Date(dateKey)} />
														<div className="space-y-1">
															{currentMessages[dateKey].map((msg, index) => {
																const prevMsg = currentMessages[dateKey][index - 1];
																const showAvatar =
																	!prevMsg || prevMsg.senderId !== msg.senderId;

																return (
																	<MessageBubble
																		key={
																			msg.id ||
																			`${msg.senderId}-${msg.timestamp}-${index}`
																		}
																		message={msg}
																		isOwn={msg.isOwn}
																		showAvatar={showAvatar}
																		user={selectedUser}
																	/>
																);
															})}
														</div>
													</div>
												))}
										</div>
									)}

									{/* Typing Indicator */}
									{typingUsers.has(selectedUser.id) && (
										<div className="py-2">
											<TypingIndicator user={selectedUser} />
										</div>
									)}

									{/* Scroll anchor */}
									<div ref={messagesEndRef} className="h-1" />
								</div>
							</ScrollArea>
						</div>

						{/* Message Input - Fixed at bottom */}
						<div className="border-t bg-background/95 backdrop-blur-sm px-4 py-3 flex-shrink-0">
							<form onSubmit={handleSendMessage} className="flex gap-3 items-end">
								<div className="flex-1 flex items-end gap-2 bg-muted/70 rounded-2xl px-4 py-2 min-h-[44px]">
									<Button
										size="icon"
										type="button"
										variant="ghost"
										className="rounded-full h-8 w-8 flex-shrink-0 hover:bg-background"
									>
										<IconPlus size={18} />
									</Button>

									<textarea
										placeholder="Type a message..."
										className="flex-1 bg-transparent border-none resize-none outline-none text-sm leading-5 py-2 max-h-32 min-h-[20px] placeholder:text-muted-foreground"
										value={message}
										onChange={handleTextareaChange}
										onKeyDown={handleKeyPress}
										rows={1}
										style={{
											height: 'auto',
											overflow: 'hidden',
										}}
									/>

									<div className="flex gap-1 flex-shrink-0">
										<Button
											size="icon"
											type="button"
											variant="ghost"
											className="rounded-full h-8 w-8 hover:bg-background"
										>
											<IconPaperclip size={16} />
										</Button>
										<Button
											size="icon"
											type="button"
											variant="ghost"
											className="rounded-full h-8 w-8 hover:bg-background"
										>
											<IconPhotoPlus size={16} />
										</Button>
									</div>
								</div>

								<Button
									type="submit"
									size="icon"
									className={cn(
										'rounded-full h-11 w-11 flex-shrink-0 transition-all',
										message.trim()
											? 'bg-blue-500 hover:bg-blue-600 scale-100'
											: 'bg-muted/50 scale-95',
									)}
									disabled={!message.trim()}
								>
									<IconSend
										size={18}
										className={cn(
											'transition-colors',
											message.trim() ? 'text-white' : 'text-muted-foreground',
										)}
									/>
								</Button>
							</form>
						</div>
					</div>
				) : (
					<div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background/80 to-muted/30">
						<div className="text-center space-y-6 p-8 max-w-md">
							<div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mx-auto">
								<IconMessages className="w-12 h-12 text-muted-foreground" />
							</div>
							<div className="space-y-3">
								<h2 className="text-2xl font-semibold">Your messages</h2>
								<p className="text-muted-foreground leading-relaxed">
									Send a message to start a conversation with your contacts. Your messages are
									end-to-end encrypted.
								</p>
							</div>
							<Button
								onClick={() => setCreateConversationDialog(true)}
								className="bg-blue-500 hover:bg-blue-600 px-6 py-2"
							>
								Start messaging
							</Button>
						</div>
					</div>
				)}
			</section>

			<NewChat users={users} onOpenChange={setCreateConversationDialog} open={createConversationDialogOpened} />
		</>
	);
}

export default ChatPage;
