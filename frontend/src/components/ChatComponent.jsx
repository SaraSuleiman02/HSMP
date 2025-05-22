import React, { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ChatSidebar from './child/ChatSidebar';
import ChatWindow from './child/ChatWindow';
import { ChatProvider, useChatContext } from '../context/ChatContext';
import { useLocation } from 'react-router-dom';
import './chat.css';

// Inner component that uses ChatContext
const ChatContent = () => {
    const [selectedUser, setSelectedUser] = React.useState(null);
    const location = useLocation();
    const {
        chatRooms,
        setActiveChat,
        createOrGetChatRoom
    } = useChatContext();

    // Get initialChatRoomId and otherUserId from navigation state (if coming from profile)
    const initialChatRoomId = location.state?.initialChatRoomId;
    const otherUserId = location.state?.otherUserId;

    // Set active chat when navigating from profile page
    useEffect(() => {
        const initializeChat = async () => {
            // If we have both chatRooms and initialChatRoomId
            if (chatRooms.length > 0 && initialChatRoomId) {
                // Find the chat room in our list
                const chatRoom = chatRooms.find(room => room._id === initialChatRoomId);

                if (chatRoom) {
                    // Set it as active chat
                    setActiveChat(chatRoom);

                    // Find the other user to set as selected
                    const otherParticipant = chatRoom.participants.find(
                        participant => participant._id !== (otherUserId || '')
                    );

                    if (otherParticipant) {
                        setSelectedUser(otherParticipant);
                    }
                }
            }
            // If we only have otherUserId but no initialChatRoomId, create or get the chat
            else if (otherUserId && !initialChatRoomId) {
                try {
                    const chatRoom = await createOrGetChatRoom(otherUserId);
                    if (chatRoom) {
                        setActiveChat(chatRoom);
                    }
                } catch (error) {
                    console.error("Error initializing chat:", error);
                }
            }
        };

        if (initialChatRoomId || otherUserId) {
            initializeChat();
        }
    }, [chatRooms, initialChatRoomId, otherUserId, setActiveChat, createOrGetChatRoom]);

    return (
        <Container fluid className="chat-container mt-1">
            <Row className="h-100">
                {/* Chat Sidebar */}
                <Col md={3} className="chat-sidebar-col p-0">
                    <ChatSidebar onSelectUser={setSelectedUser} />
                </Col>

                {/* Chat Window */}
                <Col md={9} className="chat-window-col p-0">
                    <ChatWindow selectedUser={selectedUser} />
                </Col>
            </Row>
        </Container>
    );
};

// Main component that provides ChatContext
const ChatComponent = () => {
    return (
        <ChatProvider>
            <ChatContent />
        </ChatProvider>
    );
};

export default ChatComponent;