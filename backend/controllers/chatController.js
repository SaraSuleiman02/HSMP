import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

/**-----------------------------------------
 *  @desc   Create or get existing chat room between two users
 *  @route  POST /api/chat/:receiverId
 *  @access Private
 *  @role   homeowner, professional
 ------------------------------------------*/
export const getOrCreateChatRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const { receiverId } = req.params;

        let chatRoom = await ChatRoom.findOne({
            participants: { $all: [userId, receiverId] },
        });

        if (!chatRoom) {
            chatRoom = new ChatRoom({ participants: [userId, receiverId] });
            await chatRoom.save();
        }

        return res.status(200).json({ chatRoom });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc   Get all chat rooms for a user
 *  @route  GET /api/chat/rooms
 *  @access Private
 *  @role   homeowner, professional
 ------------------------------------------*/
export const getUserChatRooms = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all chat rooms where the user is a participant
        const chatRooms = await ChatRoom.find({
            participants: userId
        })
            .populate('lastMessage')
            .populate({
                path: 'participants',
                match: { _id: { $ne: userId } }, // Exclude the current user
                select: 'name email profilePictureUrl role' // Select only necessary fields
            })
            .sort({ updatedAt: -1 }); // Sort by most recent activity

        return res.status(200).json( chatRooms );
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc   Get all messages in a chat room
 *  @route  GET /api/chat/:chatRoomId
 *  @access Private
 *  @role   homeowner, professional
 ------------------------------------------*/
export const getMessages = async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        const messages = await Message.find({ chatRoom: chatRoomId }).populate('sender receiver');
        return res.status(200).json({ messages });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc   Mark all messages as read for a given user in a chat room
 *  @route  PATCH /api/chat/:chatRoomId/read
 *  @access Private
 *  @role   homeowner
 ------------------------------------------*/
export const markMessagesAsRead = async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        const userId = req.user.id;

        console.log('chatRoomId:', chatRoomId);
        console.log('userId:', userId);

        const messages = await Message.find({ chatRoom: chatRoomId, receiver: userId, read: false });
        console.log('Messages to be updated:', messages);  // Log the messages before update

        if (messages.length === 0) {
            return res.status(404).json({ message: 'No unread messages found for this user in the chat room' });
        }

        // Update messages to mark as read
        await Message.updateMany(
            { chatRoom: chatRoomId, receiver: userId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
