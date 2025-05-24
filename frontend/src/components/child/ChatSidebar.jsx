import React, { useState, useEffect } from 'react';
import { ListGroup, Form, InputGroup, Spinner, Badge } from 'react-bootstrap';
import { useChatContext } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { FaSearch, FaCircle} from 'react-icons/fa';
import '../chat.css';

const ChatSidebar = ({ onSelectUser }) => {
    const {
        chatRooms,
        activeChat,
        setActiveChat,
        loading,
        isUserOnline,
        isUserTyping,
        getUnreadCount
    } = useChatContext();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRooms, setFilteredRooms] = useState([]);

    // Filter rooms based on search term
    useEffect(() => {
        if (!chatRooms) return;

        if (!searchTerm.trim()) {
            setFilteredRooms(chatRooms);
            return;
        }

        const filtered = chatRooms.filter(room => {
            // Find the other participant
            const otherParticipant = room.participants.find(
                participant => participant._id !== user.id
            );

            if (!otherParticipant) return false;

            // Search by name
            return otherParticipant.name.toLowerCase().includes(searchTerm.toLowerCase());
        });

        setFilteredRooms(filtered);
    }, [chatRooms, searchTerm, user.id]);

    const handleRoomSelect = (room) => {
        setActiveChat(room);

        // Find the other participant to pass to parent
        const otherParticipant = room.participants.find(
            participant => participant._id !== user.id
        );

        if (otherParticipant) {
            onSelectUser(otherParticipant);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // If less than 24 hours, show time
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // If less than 7 days, show day of week
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }

        // Otherwise show date
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getLastMessagePreview = (room) => {
        if (!room.lastMessage) return 'No messages yet';

        // Truncate message if too long
        const content = room.lastMessage.content || '';
        return content.length > 30 ? content.substring(0, 30) + '...' : content;
    };

    return (
        <div className="chat-sidebar">
            <div className="sidebar-header d-flex justify-content-center">
                <h4>Chats</h4>
            </div>

            <div className="sidebar-search">
                <InputGroup>
                    <InputGroup.Text>
                        <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ backgroundColor: "#fff"}}
                    />
                </InputGroup>
            </div>

            <div className="sidebar-tabs">
                <div className="tab active">Inbox</div>
            </div>

            <div className="chat-rooms-list">
                {loading ? (
                    <div className="text-center p-4">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="text-center p-4 text-muted">
                        {searchTerm ? 'No conversations found' : 'No conversations yet'}
                    </div>
                ) : (
                    <ListGroup variant="flush">
                        {filteredRooms.map(room => {
                            // Find the other participant
                            const otherParticipant = room.participants.find(
                                participant => participant._id !== user.id
                            );

                            if (!otherParticipant) return null;

                            const isActive = activeChat?._id === room._id;
                            const isOnline = isUserOnline(otherParticipant._id);
                            const isTypingNow = isUserTyping(room._id, otherParticipant._id);
                            const unreadCount = getUnreadCount(room._id);
                            console.log(getUnreadCount(room._id))

                            return (
                                <ListGroup.Item
                                    key={room._id}
                                    action
                                    active={isActive}
                                    className={`chat-room-item ${unreadCount > 0 ? 'has-unread' : ''}`}
                                    onClick={() => handleRoomSelect(room)}
                                >
                                    <div className="chat-room-avatar">
                                        <img
                                            src={otherParticipant.profilePictureUrl || `https://ui-avatars.com/api/?name=${otherParticipant.name || 'User'}&background=random`}
                                            alt={otherParticipant.name || 'User'}
                                        />
                                        {isOnline && (
                                            <span className="online-indicator">
                                                <FaCircle />
                                            </span>
                                        )}
                                    </div>
                                    <div className="chat-room-info">
                                        <div className="chat-room-name">
                                            <span>{otherParticipant.name || 'User'}</span>
                                            <small>{formatTime(room.updatedAt)}</small>
                                        </div>
                                        <div className="chat-room-preview">
                                            {isTypingNow ? (
                                                <span className="typing-text">Typing...</span>
                                            ) : (
                                                <span>{getLastMessagePreview(room)}</span>
                                            )}
                                            {unreadCount > 0 && (
                                                <Badge bg="primary" pill className="unread-badge">
                                                    {unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;