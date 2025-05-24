import Message from '../models/Message.js';
import ChatRoom from '../models/ChatRoom.js';

let connectedUsers = new Map();
let typingUsers = new Map(); // Track typing status

export const configureSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Register the user with their ID
        socket.on('register', async (userId) => {
            connectedUsers.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ID ${socket.id}`);

            // Broadcast to others that this user is online
            broadcastUserStatus(io, userId, true);

            try {
                // Get all chat rooms this user is a participant in
                const chatRooms = await ChatRoom.find({ participants: userId });

                // Collect IDs of online users who share chat rooms with this user
                const onlineUsersInRooms = new Set();

                chatRooms.forEach(room => {
                    room.participants.forEach(participantId => {
                        const pid = participantId.toString();
                        if (pid !== userId && connectedUsers.has(pid)) {
                            onlineUsersInRooms.add(pid);
                        }
                    });
                });

                // Send the list of online users to the newly registered user
                io.to(socket.id).emit('onlineUsers', Array.from(onlineUsersInRooms));
            } catch (error) {
                console.error('Error fetching online users for registered user:', error);
            }
        });

        // Handle sending chat messages
        socket.on('sendMessage', async ({ senderId, receiverId, content, chatRoomId }, callback) => {
            try {
                let chatRoom = chatRoomId
                    ? await ChatRoom.findById(chatRoomId)
                    : await ChatRoom.findOne({ participants: { $all: [senderId, receiverId] } });

                // Create room if it doesn't exist
                if (!chatRoom) {
                    chatRoom = new ChatRoom({ participants: [senderId, receiverId] });
                    await chatRoom.save();
                }

                // Save message
                const message = new Message({
                    chatRoom: chatRoom._id,
                    sender: senderId,
                    receiver: receiverId,
                    content,
                    read: false,
                });
                await message.save();

                // Populate sender info
                await message.populate({
                    path: 'sender',
                    select: 'id name profilePictureUrl role'
                });

                await message.populate({
                    path: 'receiver',
                    select: 'id name profilePictureUrl role'
                });

                // Update lastMessage in room
                chatRoom.lastMessage = message._id;
                await chatRoom.save();

                // Emit to receiver if online
                const receiverSocketId = connectedUsers.get(receiverId);
                if (receiverSocketId) {
                    console.log(`Emitting message to receiver ${receiverId} with socket ID ${receiverSocketId}`);

                    // Live chat message
                    io.to(receiverSocketId).emit('receiveMessage', {
                        chatRoomId: chatRoom._id,
                        message,
                    });

                    // Notification for general use ( in the navbar )
                    io.to(receiverSocketId).emit('notification', {
                        senderId,
                        receiverId,
                        type: 'new_message',
                        data: {
                            chatRoomId: chatRoom._id,
                            message,
                        },
                        timestamp: new Date()
                    });
                } else {
                    console.log(`Receiver ${receiverId} is not online, message will be delivered when they connect`);
                }

                // Emit back to sender for confirmation
                if (callback) callback({ success: true, message });
            } catch (error) {
                console.error('Socket message error:', error);
                if (callback) callback({ success: false, error: error.message });
            }
        });

        // Mark messages as read
        socket.on('markAsRead', async ({ chatRoomId, userId }, callback) => {
            try {
                console.log(`Marking messages as read in room ${chatRoomId} for user ${userId}`);

                const result = await Message.updateMany(
                    { chatRoom: chatRoomId, receiver: userId, read: false },
                    { $set: { read: true } }
                );

                console.log(`Marked ${result.modifiedCount} messages as read`);

                // Notify the sender that their messages were read
                const messages = await Message.find({
                    chatRoom: chatRoomId,
                    receiver: userId,
                    read: true
                }).distinct('sender');

                messages.forEach(senderId => {
                    const senderSocketId = connectedUsers.get(senderId.toString());
                    if (senderSocketId) {
                        console.log(`Notifying sender ${senderId} that messages were read`);
                        io.to(senderSocketId).emit('messagesRead', {
                            chatRoomId,
                            readBy: userId
                        });
                    }
                });

                if (callback) callback({ success: true, count: result.modifiedCount });
            } catch (error) {
                console.error('Error marking messages as read:', error);
                if (callback) callback({ success: false, error: error.message });
            }
        });

        // Handle typing indicators
        socket.on('typing', async ({ chatRoomId, userId, isTyping }) => {
            try {
                // Get the other participant in the chat room
                const chatRoom = await ChatRoom.findById(chatRoomId);

                if (!chatRoom) return;

                // Find the other participant
                const otherParticipantId = chatRoom.participants.find(
                    p => p.toString() !== userId.toString()
                );

                if (!otherParticipantId) return;

                // Track typing status
                if (isTyping) {
                    if (!typingUsers.has(chatRoomId)) {
                        typingUsers.set(chatRoomId, new Set());
                    }
                    typingUsers.get(chatRoomId).add(userId);
                } else if (typingUsers.has(chatRoomId)) {
                    typingUsers.get(chatRoomId).delete(userId);
                    if (typingUsers.get(chatRoomId).size === 0) {
                        typingUsers.delete(chatRoomId);
                    }
                }

                // Emit to the other participant if online
                const receiverSocketId = connectedUsers.get(otherParticipantId.toString());
                if (receiverSocketId) {
                    console.log(`Emitting typing status to ${otherParticipantId}: ${isTyping}`);
                    io.to(receiverSocketId).emit('userTyping', {
                        chatRoomId,
                        userId,
                        isTyping
                    });
                }
            } catch (error) {
                console.error('Error handling typing indicator:', error);
            }
        });

        // Handle custom notifications (like "you are hired")
        socket.on('sendNotification', async ({ senderId, receiverId, type, data }, callback) => {
            try {
                // Send to receiver if online
                const receiverSocketId = connectedUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('notification', {
                        senderId,
                        type, // e.g., 'hired', 'project_completed', 'new_bid', etc.
                        data, // Any additional data
                        timestamp: new Date()
                    });
                }

                if (callback) callback({ success: true });
            } catch (error) {
                console.error('Error sending notification:', error);
                if (callback) callback({ success: false, error: error.message });
            }
        });

        socket.on('disconnect', () => {
            let disconnectedUserId = null;

            for (const [userId, socketId] of connectedUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    connectedUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }

            // Broadcast offline status if we found the user
            if (disconnectedUserId) {
                broadcastUserStatus(io, disconnectedUserId, false);
            }
        });
    });
};

// Helper function to broadcast user status
const broadcastUserStatus = async (io, userId, isOnline) => {
    try {
        console.log(`Broadcasting ${isOnline ? 'online' : 'offline'} status for user ${userId}`);

        // Find all chat rooms where this user is a participant
        const chatRooms = await ChatRoom.find({ participants: userId });

        // For each chat room, notify the other participants
        chatRooms.forEach(room => {
            room.participants.forEach(participantId => {
                // Skip the user whose status changed
                if (participantId.toString() === userId.toString()) return;

                // Emit to the other participant if online
                const socketId = connectedUsers.get(participantId.toString());
                if (socketId) {
                    io.to(socketId).emit('userStatus', {
                        userId,
                        isOnline,
                        timestamp: new Date()
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error broadcasting user status:', error);
    }
};

export const getConnectedUsers = () => connectedUsers;
export const getTypingUsers = () => typingUsers;