import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [generalNotifications, setGeneralNotifications] = useState([]);
    const [messageNotifications, setMessageNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const notificationAudioRef = useRef(null);

    // Load the notification sound
    useEffect(() => {
        notificationAudioRef.current = new Audio('/notification.mp3');
        notificationAudioRef.current.load();
    }, []);

    const playNotificationSound = useCallback(() => {
        if (notificationAudioRef.current) {
            notificationAudioRef.current.play().catch((error) => {
                console.error('Error playing notification sound:', error);
            });
        }
    }, []);

    // Effect to manage socket connection based on authentication status
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            const newSocket = io('http://localhost:8000', {
                withCredentials: false,
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                setIsConnected(true);
                newSocket.emit('register', user.id);
                console.log(`User ${user.id} registered with socket.`);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                setIsConnected(false);
                setOnlineUsers(new Set());
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setIsConnected(false);
            });

            // Handle status updates for a single user
            newSocket.on('userStatus', ({ userId, isOnline }) => {
                console.log(
                    `Received status update: User ${userId} is ${isOnline ? 'online' : 'offline'
                    }`
                );
                setOnlineUsers((prev) => {
                    const newSet = new Set(prev);
                    isOnline ? newSet.add(userId) : newSet.delete(userId);
                    return newSet;
                });
            });

            // ✅ Full list of online users
            newSocket.on('onlineUsers', (usersArray) => {
                console.log('Full online users list received:', usersArray);
                setOnlineUsers(new Set(usersArray));
            });

            // All notifications
            newSocket.on('notification', (notification) => {
                console.log('Received notification:', notification);

                // Sort notification into the correct list
                if (notification.type === 'new_message') {
                    setMessageNotifications((prev) => [notification, ...prev]);
                } else {
                    setGeneralNotifications((prev) => [notification, ...prev]);
                }

                // Play sound for any new notification
                playNotificationSound();
            });

            // Cleanup on component unmount or when user logs out
            return () => {
                console.log('Disconnecting socket...');
                newSocket.off('connect');
                newSocket.off('disconnect');
                newSocket.off('connect_error');
                newSocket.off('userStatus');
                newSocket.off('onlineUsers');
                newSocket.off('notification');
                newSocket.disconnect();

                setSocket(null);
                setIsConnected(false);
                setOnlineUsers(new Set());
                setGeneralNotifications([]);
                setMessageNotifications([]);
            };
        } else if (socket) {
            // Clean up if the user logs out
            console.log('User logged out, disconnecting socket...');
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            setOnlineUsers(new Set());
            setGeneralNotifications([]);
            setMessageNotifications([]);
        }

    }, [isAuthenticated, user?.id, playNotificationSound]);

    const isUserOnline = useCallback(
        (userId) => onlineUsers.has(userId),
        [onlineUsers]
    );

    const sendNotification = useCallback(
        (notificationData) => {
            if (socket && isConnected) {
                socket.emit('sendNotification', notificationData, (ack) => {
                    if (ack?.success) {
                        console.log('Custom notification sent successfully.');
                    } else {
                        console.error('Failed to send custom notification:', ack?.error);
                    }
                });
            } else {
                console.error('Socket not connected, cannot send notification.');
            }
        },
        [socket, isConnected]
    );

    // Function to remove a specific notification (can be used by both dropdowns)
    const removeNotification = (notificationToRemove) => {
        if (notificationToRemove.type === 'new_message') {
            setMessageNotifications((prev) =>
                prev.filter((n) => n !== notificationToRemove)
            );
        } else {
            setGeneralNotifications((prev) =>
                prev.filter((n) => n !== notificationToRemove)
            );
        }
    };

    const clearAllGeneralNotifications = () => {
        setGeneralNotifications([]);
    };

    const clearAllMessageNotifications = () => {
        setMessageNotifications([]);
    };


    const value = {
        socket,
        isConnected,
        onlineUsers,
        isUserOnline,
        generalNotifications,
        messageNotifications,
        setGeneralNotifications,
        setMessageNotifications,
        sendNotification,
        removeNotification,
        clearAllGeneralNotifications,
        clearAllMessageNotifications,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;