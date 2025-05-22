import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axiosInstance from '../axiosConfig';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const ChatContext = createContext();

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [chatRooms, setChatRooms] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    // Use refs to track active chat and messages for socket handlers
    const activeChatRef = useRef(null);
    const messagesRef = useRef([]);
    const isTypingRef = useRef(false); // Track current typing state

    // Keep refs in sync with state
    useEffect(() => {
        activeChatRef.current = activeChat;
        messagesRef.current = messages;
    }, [activeChat, messages]);

    // Initialize socket connection
    useEffect(() => {
        if (user?.id) {
            // Connect to socket server
            const newSocket = io('http://localhost:8000', {
                withCredentials: false,
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            // Set up socket event listeners
            newSocket.on('connect', () => {
                console.log('Connected to socket server');
                // Register user with socket server
                newSocket.emit('register', user.id);
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from socket server');
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            // Handle incoming messages
            newSocket.on('receiveMessage', ({ chatRoomId, message }) => {
                console.log('Received message:', message, 'for chat room:', chatRoomId);
                console.log('Active chat:', activeChatRef.current?._id);

                // Always update messages if it's for the active chat, regardless of who sent it
                if (activeChatRef.current?._id === chatRoomId) {
                    console.log('Updating messages for active chat');
                    setMessages(prev => {
                        // Check if message already exists to prevent duplicates
                        const exists = prev.some(m => m._id === message._id);
                        if (exists) {
                            console.log('Message already exists, not adding');
                            return prev;
                        }
                        console.log('Adding new message to state');
                        return [...prev, message];
                    });

                    // Only mark as read if the chat is currently active/open and the message is for the current user
                    if (message.receiver._id === user.id) {
                        console.log('Marking message as read');
                        newSocket.emit('markAsRead', { chatRoomId, userId: user.id });
                    }
                } else if (message.receiver._id === user.id) {
                    // Increment unread count for this room only if the message is for the current user
                    console.log('Incrementing unread count for chat room:', chatRoomId);
                    setUnreadCounts(prev => ({
                        ...prev,
                        [chatRoomId]: (prev[chatRoomId] || 0) + 1
                    }));
                }

                // Update chat rooms list to show latest message
                setChatRooms(prev => {
                    // Check if room exists in current list
                    const roomIndex = prev.findIndex(room => room._id === chatRoomId);

                    if (roomIndex !== -1) {
                        // Create a new array to trigger re-render
                        const updatedRooms = [...prev];
                        updatedRooms[roomIndex] = {
                            ...updatedRooms[roomIndex],
                            lastMessage: message,
                            updatedAt: new Date().toISOString()
                        };

                        // Sort rooms by most recent message
                        return updatedRooms.sort((a, b) =>
                            new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
                        );
                    } else {
                        // If the room isn't in our list, fetch all rooms again
                        fetchChatRooms();
                        return prev;
                    }
                });
            });

            // Handle messages being read
            newSocket.on('messagesRead', ({ chatRoomId, readBy }) => {
                console.log('Messages read in room:', chatRoomId, 'by user:', readBy);

                setMessages(prev =>
                    prev.map(msg =>
                        msg.sender._id === user.id && msg.receiver._id === readBy
                            ? { ...msg, read: true }
                            : msg
                    )
                );
            });

            // Handle user typing status
            newSocket.on('userTyping', ({ chatRoomId, userId, isTyping }) => {
                console.log('User typing:', userId, 'in room:', chatRoomId, 'status:', isTyping);

                // Update typing users state
                setTypingUsers(prev => {
                    // Create a new object to ensure React detects the change
                    const newTypingUsers = { ...prev };

                    if (!newTypingUsers[chatRoomId]) {
                        newTypingUsers[chatRoomId] = [];
                    }

                    if (isTyping) {
                        // Add user to typing list if not already there
                        if (!newTypingUsers[chatRoomId].includes(userId)) {
                            newTypingUsers[chatRoomId] = [...newTypingUsers[chatRoomId], userId];
                        }
                    } else {
                        // Remove user from typing list
                        newTypingUsers[chatRoomId] = newTypingUsers[chatRoomId].filter(id => id !== userId);
                    }

                    return newTypingUsers;
                });
            });

            // Handle user online status
            newSocket.on('userStatus', ({ userId, isOnline }) => {
                console.log('User status update:', userId, 'online:', isOnline);

                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    if (isOnline) {
                        newSet.add(userId);
                    } else {
                        newSet.delete(userId);
                    }
                    return newSet;
                });
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                newSocket.disconnect();
            };
        }
    }, [user?.id]);

    // Fetch chat rooms when user changes
    useEffect(() => {
        if (user?.id) {
            fetchChatRooms();
        }
    }, [user?.id]);

    // Fetch messages when active chat changes
    useEffect(() => {
        if (activeChat?._id) {
            fetchMessages(activeChat._id);

            // Reset unread count for this room
            setUnreadCounts(prev => ({
                ...prev,
                [activeChat._id]: 0
            }));

            // Mark messages as read when viewing a chat
            if (socket) {
                socket.emit('markAsRead', { chatRoomId: activeChat._id, userId: user.id });
            }

            // Reset typing state when changing chats
            isTypingRef.current = false;
        }
    }, [activeChat?._id, socket, user?.id]);

    const fetchChatRooms = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/chat/rooms');
            console.log('Fetched chat rooms:', response.data);

            // Sort rooms by most recent message
            const sortedRooms = [...response.data].sort((a, b) =>
                new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
            );

            setChatRooms(sortedRooms);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching chat rooms:', err);
            setError('Failed to load chat rooms');
            setLoading(false);
            toast.error('Failed to load conversations');
        }
    }, []);

    const fetchMessages = async (chatRoomId) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/chat/${chatRoomId}`);
            console.log('Fetched messages for room:', chatRoomId, response.data.messages);
            setMessages(response.data.messages);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError('Failed to load messages');
            setLoading(false);
            toast.error('Failed to load messages');
        }
    };

    const sendMessage = (content, receiverId) => {
        if (!socket || !activeChat) return;

        const messageData = {
            senderId: user.id,
            receiverId,
            content,
            chatRoomId: activeChat._id
        };

        console.log('Sending message:', messageData);

        socket.emit('sendMessage', messageData, ({ success, message, error }) => {
            if (success) {
                console.log('Message sent successfully:', message);

                // Add message to local state
                setMessages(prev => {
                    // Check if message already exists to prevent duplicates
                    const exists = prev.some(m => m._id === message._id);
                    if (exists) return prev;
                    return [...prev, message];
                });

                // Update chat rooms list
                setChatRooms(prev => {
                    const roomIndex = prev.findIndex(room => room._id === activeChat._id);

                    if (roomIndex !== -1) {
                        const updatedRooms = [...prev];
                        updatedRooms[roomIndex] = {
                            ...updatedRooms[roomIndex],
                            lastMessage: message,
                            updatedAt: new Date().toISOString()
                        };

                        // Sort rooms by most recent message
                        return updatedRooms.sort((a, b) =>
                            new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
                        );
                    }

                    return prev;
                });
            } else {
                console.error('Error sending message:', error);
                setError('Failed to send message');
                toast.error('Failed to send message');
            }
        });
    };

    const createOrGetChatRoom = async (receiverId) => {
        try {
            setLoading(true);
            const response = await axiosInstance.post(`/chat/${receiverId}`);
            const newRoom = response.data.chatRoom;
            console.log('Created/got chat room:', newRoom);

            // Check if room already exists in our list
            const existingRoomIndex = chatRooms.findIndex(room => room._id === newRoom._id);

            if (existingRoomIndex === -1) {
                // Add new room to list
                setChatRooms(prev => [newRoom, ...prev]);
            }

            // Set as active chat
            setActiveChat(newRoom);

            // Reset unread count for this room
            setUnreadCounts(prev => ({
                ...prev,
                [newRoom._id]: 0
            }));

            setLoading(false);
            return newRoom;
        } catch (err) {
            console.error('Error creating chat room:', err);
            setError('Failed to create chat room');
            setLoading(false);
            toast.error('Failed to create conversation');
            return null;
        }
    };

    const setTypingStatus = (isTyping) => {
        if (!socket || !activeChat) return;

        // Only emit if the typing state has changed
        if (isTypingRef.current !== isTyping) {
            isTypingRef.current = isTyping;

            const otherParticipant = activeChat.participants.find(p => p._id !== user.id);
            if (!otherParticipant) return;

            console.log('Setting typing status:', isTyping, 'for room:', activeChat._id);

            socket.emit('typing', {
                chatRoomId: activeChat._id,
                userId: user.id,
                isTyping
            });
        }
    };

    const value = {
        socket,
        chatRooms,
        activeChat,
        setActiveChat,
        messages,
        onlineUsers,
        typingUsers,
        loading,
        error,
        unreadCounts,
        sendMessage,
        createOrGetChatRoom,
        setTypingStatus,
        fetchChatRooms,
        isUserOnline: (userId) => onlineUsers.has(userId),
        isUserTyping: (chatRoomId, userId) =>
            typingUsers[chatRoomId]?.includes(userId) || false,
        getUnreadCount: (roomId) => unreadCounts[roomId] || 0
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;