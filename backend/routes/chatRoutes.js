import express from 'express';
import {
  getOrCreateChatRoom,
  getUserChatRooms,
  getMessages,
  markMessagesAsRead
} from '../controllers/chatController.js';
import verifyToken from '../middlewares/verifyToken.js';
import authorizePosition from '../middlewares/authorizePosition.js';

const router = express.Router();

// Create or get existing chat room between two users
router.post('/:receiverId', verifyToken, authorizePosition('homeowner', 'professional'), getOrCreateChatRoom);

// Get all Chats for a User
router.get('/rooms', verifyToken, getUserChatRooms);

// Get all messages in a chat room
router.get('/:chatRoomId', verifyToken, authorizePosition('homeowner', 'professional'), getMessages);

// Mark messages as read for a user in a chat room
router.patch('/:chatRoomId/read', verifyToken, authorizePosition('homeowner', 'professional'), markMessagesAsRead);

export default router;
