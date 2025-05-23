import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from './AuthContext';
import { useSocketContext } from './SocketContext';
import { toast } from 'react-toastify';

const ChatContext = createContext();

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket, isConnected, isUserOnline } = useSocketContext(); // Use global socket and online status check

    // Removed: const [socket, setSocket] = useState(null);
    const [chatRooms, setChatRooms] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    // Removed: const [onlineUsers, setOnlineUsers] = useState(new Set()); // Handled globally now
    const [typingUsers, setTypingUsers] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    const activeChatRef = useRef(null);
    const messagesRef = useRef([]);
    const isTypingRef = useRef(false);

    useEffect(() => {
        activeChatRef.current = activeChat;
        messagesRef.current = messages;
    }, [activeChat, messages]);

    // Removed: useEffect for initializing socket connection (now handled globally)

    // Effect to set up chat-specific socket listeners using the global socket instance
    useEffect(() => {
        if (socket && isConnected) {
            console.log('ChatContext: Attaching chat-specific listeners to global socket.');

            // Handle incoming messages for the chat
            const handleReceiveMessage = ({ chatRoomId, message }) => {
                console.log('ChatContext: Received message:', message, 'for chat room:', chatRoomId);
                console.log('ChatContext: Active chat:', activeChatRef.current?._id);

                if (activeChatRef.current?._id === chatRoomId) {
                    console.log('ChatContext: Updating messages for active chat');
                    setMessages(prev => {
                        const exists = prev.some(m => m._id === message._id);
                        if (exists) return prev;
                        return [...prev, message];
                    });

                    if (message.receiver._id === user.id) {
                        console.log('ChatContext: Marking message as read');
                        socket.emit('markAsRead', { chatRoomId, userId: user.id });
                    }
                } else if (message.receiver._id === user.id) {
                    console.log('ChatContext: Incrementing unread count for chat room:', chatRoomId);
                    setUnreadCounts(prev => ({
                        ...prev,
                        [chatRoomId]: (prev[chatRoomId] || 0) + 1
                    }));
                }

                // Update chat rooms list to show latest message
                setChatRooms(prev => {
                    const roomIndex = prev.findIndex(room => room._id === chatRoomId);
                    if (roomIndex !== -1) {
                        const updatedRooms = [...prev];
                        updatedRooms[roomIndex] = {
                            ...updatedRooms[roomIndex],
                            lastMessage: message,
                            updatedAt: new Date().toISOString()
                        };
                        return updatedRooms.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
                    } else {
                        // If the room isn't in the list, fetch all rooms again
                        // Consider if this is the desired behavior or if the new room should be added
                        fetchChatRooms();
                        return prev;
                    }
                });
            };

            // Handle messages being read
            const handleMessagesRead = ({ chatRoomId, readBy }) => {
                console.log('ChatContext: Messages read in room:', chatRoomId, 'by user:', readBy);
                // Update message state only if it's the active chat
                if (activeChatRef.current?._id === chatRoomId) {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.sender._id === user.id && msg.receiver._id === readBy
                                ? { ...msg, read: true }
                                : msg
                        )
                    );
                }
                // Potentially update chatRooms state as well if needed
            };

            // Handle user typing status
            const handleUserTyping = ({ chatRoomId, userId, isTyping }) => {
                console.log('ChatContext: User typing:', userId, 'in room:', chatRoomId, 'status:', isTyping);
                setTypingUsers(prev => {
                    const newTypingUsers = { ...prev };
                    if (!newTypingUsers[chatRoomId]) {
                        newTypingUsers[chatRoomId] = [];
                    }
                    if (isTyping) {
                        if (!newTypingUsers[chatRoomId].includes(userId)) {
                            newTypingUsers[chatRoomId] = [...newTypingUsers[chatRoomId], userId];
                        }
                    } else {
                        newTypingUsers[chatRoomId] = newTypingUsers[chatRoomId].filter(id => id !== userId);
                    }
                    return newTypingUsers;
                });
            };

            // Removed: 'userStatus' listener (handled globally)

            // Attach listeners
            socket.on('receiveMessage', handleReceiveMessage);
            socket.on('messagesRead', handleMessagesRead);
            socket.on('userTyping', handleUserTyping);

            // Cleanup: remove chat-specific listeners when component unmounts or socket changes
            return () => {
                console.log('ChatContext: Removing chat-specific listeners.');
                socket.off('receiveMessage', handleReceiveMessage);
                socket.off('messagesRead', handleMessagesRead);
                socket.off('userTyping', handleUserTyping);
            };
        }
    }, [socket, isConnected, user?.id]); // Depend on the global socket instance and user ID

    // Fetch chat rooms when user logs in
    useEffect(() => {
        if (user?.id && isConnected) { // Also ensure socket is connected
            fetchChatRooms();
        }
        // Clear rooms if user logs out
        if (!user?.id) {
            setChatRooms([]);
            setActiveChat(null);
            setMessages([]);
            setUnreadCounts({});
            setTypingUsers({});
        }
    }, [user?.id, isConnected]); // Rerun when user ID or connection status changes

    // Fetch messages when active chat changes
    useEffect(() => {
        if (activeChat?._id && isConnected) { // Ensure socket is connected
            fetchMessages(activeChat._id);
            setUnreadCounts(prev => ({ ...prev, [activeChat._id]: 0 }));
            if (socket) {
                socket.emit('markAsRead', { chatRoomId: activeChat._id, userId: user.id });
            }
            isTypingRef.current = false;
        }
        // Clear messages if active chat is unset
        if (!activeChat?._id) {
            setMessages([]);
        }
    }, [activeChat?._id, socket, isConnected, user?.id]);

    const fetchChatRooms = useCallback(async () => {
        if (!user?.id) return; // Don't fetch if no user
        try {
            setLoading(true);
            const response = await axiosInstance.get('/chat/rooms');
            console.log('ChatContext: Fetched chat rooms:', response.data);
            const sortedRooms = [...response.data].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
            setChatRooms(sortedRooms);
            setError(null);
        } catch (err) {
            console.error('ChatContext: Error fetching chat rooms:', err);
            setError('Failed to load chat rooms');
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const fetchMessages = async (chatRoomId) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/chat/${chatRoomId}`);
            console.log('ChatContext: Fetched messages for room:', chatRoomId, response.data.messages);
            setMessages(response.data.messages);
            setError(null);
        } catch (err) {
            console.error('ChatContext: Error fetching messages:', err);
            setError('Failed to load messages');
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = (content, receiverId) => {
        if (!socket || !isConnected || !activeChat || !user?.id) {
            console.error('ChatContext: Cannot send message. Socket not connected or missing info.');
            toast.error('Connection error, cannot send message.');
            return;
        }

        const messageData = {
            senderId: user.id,
            receiverId,
            content,
            chatRoomId: activeChat._id
        };

        console.log('ChatContext: Sending message:', messageData);

        socket.emit('sendMessage', messageData, ({ success, message, error: sendError }) => {
            if (success) {
                console.log('ChatContext: Message sent successfully callback received:', message);
                // Add message optimistically (or wait for receiveMessage event)
                setMessages(prev => {
                    const exists = prev.some(m => m._id === message._id);
                    if (exists) return prev;
                    return [...prev, message];
                });
                // Update chat rooms list optimistically
                setChatRooms(prev => {
                    const roomIndex = prev.findIndex(room => room._id === activeChat._id);
                    if (roomIndex !== -1) {
                        const updatedRooms = [...prev];
                        updatedRooms[roomIndex] = {
                            ...updatedRooms[roomIndex],
                            lastMessage: message,
                            updatedAt: new Date().toISOString()
                        };
                        return updatedRooms.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
                    }
                    return prev;
                });
            } else {
                console.error('ChatContext: Error sending message via socket:', sendError);
                setError('Failed to send message');
                toast.error('Failed to send message');
            }
        });
    };

    const createOrGetChatRoom = async (receiverId) => {
        if (!user?.id) return null;
        try {
            setLoading(true);
            const response = await axiosInstance.post(`/chat/${receiverId}`);
            const newRoom = response.data.chatRoom;
            console.log('ChatContext: Created/got chat room:', newRoom);

            const existingRoomIndex = chatRooms.findIndex(room => room._id === newRoom._id);
            if (existingRoomIndex === -1) {
                setChatRooms(prev => [newRoom, ...prev].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)));
            } else {
                // If room exists, maybe just move it to the top?
                setChatRooms(prev => {
                    const existing = prev[existingRoomIndex];
                    const others = prev.filter(r => r._id !== newRoom._id);
                    return [existing, ...others]; // Keep existing data, just reorder
                });
            }

            setActiveChat(newRoom);
            setUnreadCounts(prev => ({ ...prev, [newRoom._id]: 0 }));
            setError(null);
            return newRoom;
        } catch (err) {
            console.error('ChatContext: Error creating/getting chat room:', err);
            setError('Failed to create/get chat room');
            toast.error('Failed to start conversation');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const setTypingStatus = (isTyping) => {
        if (!socket || !isConnected || !activeChat || !user?.id) return;

        if (isTypingRef.current !== isTyping) {
            isTypingRef.current = isTyping;
            const otherParticipant = activeChat.participants.find(p => p._id !== user.id);
            if (!otherParticipant) return;

            console.log('ChatContext: Setting typing status:', isTyping, 'for room:', activeChat._id);
            socket.emit('typing', {
                chatRoomId: activeChat._id,
                userId: user.id,
                isTyping
            });
        }
    };

    const value = {
        // Removed: socket - use from SocketContext directly if needed elsewhere
        chatRooms,
        activeChat,
        setActiveChat,
        messages,
        // Removed: onlineUsers - use isUserOnline from SocketContext
        typingUsers,
        loading,
        error,
        unreadCounts,
        sendMessage,
        createOrGetChatRoom,
        setTypingStatus,
        fetchChatRooms, // Keep if needed externally
        isUserOnline, // Pass through the global function
        isUserTyping: (chatRoomId, userId) => typingUsers[chatRoomId]?.includes(userId) || false,
        getUnreadCount: (roomId) => unreadCounts[roomId] || 0
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;