let connectedUsers = new Map();

export const configureSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Register the user with their ID
        socket.on('register', (userId) => {
            connectedUsers.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ID ${socket.id}`);
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

        socket.emit('message', 'Hello from the server!');
    });
};

export const getConnectedUsers = () => connectedUsers;
