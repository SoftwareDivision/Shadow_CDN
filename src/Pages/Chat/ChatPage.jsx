import React, { useState, useEffect, useRef, Fragment } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
	ArrowLeft as IconArrowLeft,
	MoreVertical as IconDotsVertical,
	Edit as IconEdit,
	MessageSquare as IconMessages,
	Paperclip as IconPaperclip,
	ImagePlus as IconPhotoPlus,
	Plus as IconPlus,
	Send as IconSend,
	Video as IconVideo,
	Phone as IconPhone,
	Search as IconSearch,
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

function ChatPage() {
	const [selectedUser, setSelectedUser] = useState(null);
	const [mobileSelectedUser, setMobileSelectedUser] = useState(null);
	const [message, setMessage] = useState('');
	const [chatMessages, setChatMessages] = useState([]);
	const [unreadCounts, setUnreadCounts] = useState({});
	const [search, setSearch] = useState('');
	const [createConversationDialogOpened, setCreateConversationDialog] = useState(false);
	const { socket, messages, notifications } = useWebSocketContext();
	const messagesEndRef = useRef(null);
	const { token } = useAuthToken.getState();

	const {
		data: users = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['users'],
		queryFn: async () => {
			const response = await getAllUsers(token.data.token);
			return response || [];
		},
		enabled: !!token?.data?.token,
	});

	// Filter users based on search query
	const filteredUsers = users.filter(
		(user) =>
			user.username !== token.data.user.username &&
			user.username.toLowerCase().includes(search.trim().toLowerCase()),
	);

	// Group messages by date for the selected user
	const currentMessages = React.useMemo(() => {
		if (!selectedUser) return null;
		const relevantMessages = chatMessages.filter((msg) => {
			const isSent = msg.senderId === String(token.data.user.id) && msg.receiverId === String(selectedUser.id);
			const isReceived =
				msg.senderId === String(selectedUser.id) && msg.receiverId === String(token.data.user.id);
			return isSent || isReceived;
		});

		return relevantMessages.reduce((acc, msg) => {
			const key = format(new Date(msg.timestamp), 'd MMM, yyyy');
			if (!acc[key]) acc[key] = [];
			acc[key].push(msg);
			return acc;
		}, {});
	}, [chatMessages, selectedUser, token.data.user.id]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatMessages, notifications]);

	useEffect(() => {
		if (token?.data?.user?.id) {
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

			// Filter messages for selected user
			if (selectedUser) {
				const relevantMessages = messages.filter((msg) => {
					const isSent =
						msg.senderId === String(token.data.user.id) && msg.receiverId === String(selectedUser.id);
					const isReceived =
						msg.senderId === String(selectedUser.id) && msg.receiverId === String(token.data.user.id);
					return isSent || isReceived;
				});

				const transformedMessages = relevantMessages.map((msg) => ({
					senderId: msg.senderId || '',
					receiverId: msg.receiverId || '',
					content: msg.content,
					timestamp: msg.timestamp,
					isSent: msg.senderId === String(token.data.user.id),
				}));

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

	const handleSendMessage = async (e) => {
		e.preventDefault();
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
			const updatedMessages = [
				...chatMessages,
				{
					...newMessage,
					timestamp: new Date().toISOString(),
					isSent: true,
				},
			];
			setChatMessages(updatedMessages);
			setMessage('');
		} catch (error) {
			console.error('Error sending message:', error);
			enqueueSnackbar('Failed to send message', { variant: 'error' });
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader />
			</div>
		);
	}

	if (error) {
		return <div className="flex items-center justify-center h-full text-destructive">Error: {error.message}</div>;
	}

	return (
		<>
			<section className="flex h-full">
				{/* Left Side: User List */}
				<div className="flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80">
					<div className="bg-background sticky top-0 z-10 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none">
						<div className="flex items-center justify-between py-2">
							<div className="flex gap-2">
								<h1 className="text-2xl font-bold">Inbox</h1>
							</div>
							<Button size="icon" variant="ghost" className="rounded-lg">
								<IconMessages size={40} />
							</Button>
						</div>
						<label className="border-input focus-within:ring-ring flex h-12 w-full items-center space-x-0 rounded-md border pl-2 focus-within:ring-1 focus-within:outline-hidden">
							<IconSearch size={15} className="mr-2 stroke-slate-500" />
							<span className="sr-only">Search</span>
							<input
								type="text"
								className="w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden"
								placeholder="Search chat..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</label>
					</div>

					<ScrollArea className="-mx-3 h-full p-3">
						{filteredUsers.map((user) => {
							const lastMessage = messages
								.filter(
									(msg) =>
										(msg.senderId === String(token.data.user.id) &&
											msg.receiverId === String(user.id)) ||
										(msg.senderId === String(user.id) &&
											msg.receiverId === String(token.data.user.id)),
								)
								.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
							const lastMsg = lastMessage
								? lastMessage.senderId === String(token.data.user.id)
									? `You: ${lastMessage.content}`
									: lastMessage.content
								: 'No messages yet';

							return (
								<Fragment key={user.id}>
									<button
										type="button"
										className={cn(
											`hover:bg-secondary/75 -mx-1 flex w-full rounded-md px-2 py-2 text-left text-sm`,
											selectedUser?.id === user.id && 'sm:bg-muted',
										)}
										onClick={() => {
											setSelectedUser(user);
											setMobileSelectedUser(user);
										}}
									>
										<div className="flex gap-2">
											<Avatar>
												<AvatarImage src={user.profile || ''} alt={user.username} />
												<AvatarFallback>{user.username?.[0] || 'U'}</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<div className="flex justify-between">
													<span className="font-medium">{user.username}</span>
													{unreadCounts[user.id] > 0 && (
														<Badge variant="destructive" className="ml-2">
															{unreadCounts[user.id]}
														</Badge>
													)}
												</div>
												<span className="text-muted-foreground line-clamp-2 text-ellipsis">
													{lastMsg}
												</span>
											</div>
										</div>
									</button>
									<Separator className="my-1" />
								</Fragment>
							);
						})}
					</ScrollArea>
				</div>

				{/* Right Side: Chat Area */}
				{selectedUser ? (
					<Card
						className={cn(
							'bg-primary-foreground absolute inset-0 left-full z-50 hidden w-full flex-1 flex-col rounded-md border shadow-xs transition-all duration-200 sm:static sm:z-auto sm:flex',
							mobileSelectedUser && 'left-0 flex',
						)}
					>
						{/* Top Part */}
						<div className="bg-secondary mb-1 flex flex-none justify-between rounded-t-md py-2 px-4 shadow-lg">
							<div className="flex gap-3">
								<Button
									size="icon"
									variant="ghost"
									className="-ml-2 h-full sm:hidden"
									onClick={() => setMobileSelectedUser(null)}
								>
									<IconArrowLeft />
								</Button>
								<div className="flex items-center gap-2 lg:gap-4">
									<Avatar className="size-9 lg:size-11">
										<AvatarImage src={selectedUser.profile || ''} alt={selectedUser.username} />
										<AvatarFallback>{selectedUser.username?.[0] || 'U'}</AvatarFallback>
									</Avatar>
									<div>
										<span className="text-sm font-medium lg:text-base">
											{selectedUser.username}
										</span>
										<span className="text-muted-foreground block max-w-32 text-xs text-nowrap text-ellipsis lg:max-w-none lg:text-sm">
											Online
										</span>
									</div>
								</div>
							</div>
							<div className="-mr-1 flex items-center gap-1 lg:gap-2">
								<Button
									size="icon"
									variant="ghost"
									className="hidden size-8 rounded-full sm:inline-flex lg:size-10"
								>
									<IconVideo size={22} className="stroke-muted-foreground" />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									className="hidden size-8 rounded-full sm:inline-flex lg:size-10"
								>
									<IconPhone size={22} className="stroke-muted-foreground" />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									className="h-10 rounded-md sm:h-8 sm:w-4 lg:h-10 lg:w-6"
								>
									<IconDotsVertical className="stroke-muted-foreground sm:size-5" />
								</Button>
							</div>
						</div>

						{/* Conversation */}
						<div className="flex flex-1 flex-col gap-2 rounded-md px-4 pt-0 pb-4">
							<div className="flex size-full flex-1">
								<div className="relative -mr-4 flex flex-1 flex-col overflow-y-hidden">
									<ScrollArea className="flex h-40 w-full grow flex-col-reverse justify-start gap-4 overflow-y-auto py-2 pr-4 pb-4">
										{currentMessages &&
											Object.keys(currentMessages).map((key) => (
												<Fragment key={key}>
													{currentMessages[key].map((msg, index) => (
														<div
															key={`${msg.senderId}-${msg.timestamp}-${index}`}
															className={cn(
																'max-w-72 px-3 py-2 break-words shadow-lg',
																msg.isSent
																	? 'bg-primary/85 text-primary-foreground/75 self-end rounded-[16px_16px_0_16px]'
																	: 'bg-secondary self-start rounded-[16px_16px_16px_0]',
															)}
														>
															{msg.content}{' '}
															<span
																className={cn(
																	'text-muted-foreground mt-1 block text-xs font-light italic',
																	msg.isSent && 'text-right',
																)}
															>
																{format(new Date(msg.timestamp), 'h:mm a')}
															</span>
														</div>
													))}
													<div className="text-center text-xs">{key}</div>
												</Fragment>
											))}
										{notifications.map((notif, index) => (
											<div key={`notif-${index}`} className="flex justify-center">
												<div className="max-w-72 px-3 py-2 rounded-lg bg-info text-info-foreground">
													<p>{notif.content}</p>
													<p className="text-xs">
														{format(new Date(notif.timestamp), 'h:mm a')}
													</p>
												</div>
											</div>
										))}
										<div ref={messagesEndRef} />
									</ScrollArea>
								</div>
							</div>
							<form className="flex w-full flex-none gap-2" onSubmit={handleSendMessage}>
								<div className="border-input focus-within:ring-ring flex flex-1 items-center gap-2 rounded-md border px-2 py-1 focus-within:ring-1 focus-within:outline-hidden lg:gap-4">
									<div className="space-x-1">
										<Button size="icon" type="button" variant="ghost" className="h-8 rounded-md">
											<IconPlus size={20} className="stroke-muted-foreground" />
										</Button>
										<Button
											size="icon"
											type="button"
											variant="ghost"
											className="hidden h-8 rounded-md lg:inline-flex"
										>
											<IconPhotoPlus size={20} className="stroke-muted-foreground" />
										</Button>
										<Button
											size="icon"
											type="button"
											variant="ghost"
											className="hidden h-8 rounded-md lg:inline-flex"
										>
											<IconPaperclip size={20} className="stroke-muted-foreground" />
										</Button>
									</div>
									<label className="flex-1">
										<span className="sr-only">Chat Text Box</span>
										<Input
											type="text"
											placeholder="Type your messages..."
											className="h-8 w-full bg-inherit focus-visible:outline-hidden"
											value={message}
											onChange={(e) => setMessage(e.target.value)}
										/>
									</label>
									<Button variant="ghost" size="icon" className="hidden sm:inline-flex" type="submit">
										<IconSend size={20} />
									</Button>
								</div>
								<Button className="h-full sm:hidden" type="submit">
									<IconSend size={18} /> Send
								</Button>
							</form>
						</div>
					</Card>
				) : (
					<Card
						className={cn(
							'bg-primary-foreground absolute inset-0 left-full z-50 hidden w-full flex-1 flex-col justify-center rounded-md border shadow-xs transition-all duration-200 sm:static sm:z-auto sm:flex',
						)}
					>
						<div className="flex flex-col items-center space-y-6">
							<div className="border-border flex size-16 items-center justify-center rounded-full border-2">
								<IconMessages className="size-8" />
							</div>
							<div className="space-y-2 text-center">
								<h1 className="text-xl font-semibold">Your messages</h1>
								<p className="text-muted-foreground text-sm">Send a message to start a chat.</p>
							</div>
							{/* <Button
								className="bg-blue-500 px-6 text-white hover:bg-blue-600"
								onClick={() => setCreateConversationDialog(true)}
							>
								Send message
							</Button> */}
						</div>
					</Card>
				)}
			</section>
			<NewChat users={users} onOpenChange={setCreateConversationDialog} open={createConversationDialogOpened} />
		</>
	);
}

export default ChatPage;
