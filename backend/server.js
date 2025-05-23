import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as socketIo } from 'socket.io';
import { configureSocket } from './utils/socket.js';

import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import professionalProfileRoutes from './routes/professionalProfileRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = new socketIo(server);

// Attach Socket.IO instance to req before defining routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to HSMP API' });
});

// Routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', professionalProfileRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/bid', bidRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/chat', chatRoutes);

// Socket.IO Connection Handler
configureSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});