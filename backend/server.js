import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as socketIo } from 'socket.io';

import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import professionalProfileRoutes from './routes/professionalProfileRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to HSMP API' });
});

app.use('/api/user', userRoutes); // User Routes
app.use('/api/admin', adminRoutes); // Admin Routes
app.use('/api/profile', professionalProfileRoutes); // Professional Profile Routes
app.use('/api/project', projectRoutes); // Project Routes


// Create HTTP server and pass the express app to it
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server (with 'new')
const io = new socketIo(server);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.emit('message', 'Hello from the server!');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});