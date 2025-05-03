let connectedUsers = new Map();

export const configureSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Register the user with their ID
        socket.on('register', (userId) => {
            connectedUsers.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ID ${socket.id}`);
        });

        // Handle sending chat messages
        socket.on('sendMessage', async ({ senderId, receiverId, content, chatRoomId }, callback) => {
            try {
                const { default: Message } = await import('../models/message.js');
                const { default: ChatRoom } = await import('../models/chatRoom.js');

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
                });
                await message.save();

                // Update lastMessage in room
                chatRoom.lastMessage = message._id;
                await chatRoom.save();

                // Emit to receiver if online
                const receiverSocketId = connectedUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receiveMessage', {
                        chatRoomId: chatRoom._id,
                        message,
                    });
                }

                // Emit back to sender for confirmation
                if (callback) callback(message);
            } catch (error) {
                console.error('Socket message error:', error);
            }
        });

        // Mark messages as read
        socket.on('markAsRead', async ({ chatRoomId, userId }) => {
            try {
                const { default: Message } = await import('./models/message.js');
                await Message.updateMany(
                    { chatRoom: chatRoomId, receiver: userId, read: false },
                    { $set: { read: true } }
                );
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        socket.on('disconnect', () => {
            for (const [userId, socketId] of connectedUsers.entries()) {
                if (socketId === socket.id) {
                    connectedUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });

        // test message
        socket.emit('message', 'Hello from the server!');
    });
};

export const getConnectedUsers = () => connectedUsers;