import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Spinner, Badge } from 'react-bootstrap';
import { useChatContext } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { FaPaperPlane, FaCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../chat.css';

const ChatWindow = ({ selectedUser }) => {
    const {
        activeChat,
        messages,
        sendMessage,
        loading,
        typingUsers,
        isUserTyping,
        isUserOnline,
        setTypingStatus
    } = useChatContext();
    const { user } = useAuth();
    const [messageText, setMessageText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const typingDebounceRef = useRef(null);
    const navigate = useNavigate();

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle typing indicator with debounce
    useEffect(() => {
        // Clear previous debounce timeout
        if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
        }

        // Only emit typing event if user is actually typing
        if (isTyping) {
            typingDebounceRef.current = setTimeout(() => {
                setTypingStatus(true);
            }, 300); // Debounce typing events to prevent rapid state changes
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (typingDebounceRef.current) {
                clearTimeout(typingDebounceRef.current);
            }
        };
    }, [isTyping, setTypingStatus]);

    // Clear typing status when component unmounts
    useEffect(() => {
        return () => {
            setTypingStatus(false);
        };
    }, [setTypingStatus]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleMessageChange = (e) => {
        setMessageText(e.target.value);

        // Set typing status
        setIsTyping(true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing indicator after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setTypingStatus(false);
        }, 2000);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageText.trim() || !activeChat) return;

        // Find the other user in the chat
        const otherUser = activeChat.participants.find(
            participant => participant._id !== user.id
        );

        if (!otherUser) return;

        sendMessage(messageText.trim(), otherUser._id);
        setMessageText('');
        setIsTyping(false);
        setTypingStatus(false);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // If no active chat, show empty state
    if (!activeChat) {
        return (
            <div className="chat-window-empty">
                <div className="text-center">
                    <h4>Select a conversation or start a new one</h4>
                    <p>Choose a contact from the sidebar to start chatting</p>
                </div>
            </div>
        );
    }

    // Find the other user in the chat
    const otherUser = activeChat.participants.find(
        participant => participant._id !== user.id
    );

    const handleViewProfile = (otherUser) => {
        navigate(
            otherUser.role === "professional"
                ? '/professional-profile'
                : '/profile',
            { state: { viewedUserId: otherUser._id } }
        );
    }

    return (
        <div>
            <div className="chat-window">
                {/* Chat Header */}
                <div className="chat-header">
                    <div className="d-flex align-items-center">
                        <div className="chat-avatar">
                            <img
                                src={otherUser?.profilePictureUrl || `https://ui-avatars.com/api/?name=${otherUser?.name || 'User'}&background=random`}
                                alt={otherUser?.name || 'User'}
                                style={{ cursor: "pointer" }}
                                onClick={() => handleViewProfile(otherUser)}
                            />
                            {isUserOnline(otherUser?._id) && (
                                <span className="online-indicator">
                                    <FaCircle />
                                </span>
                            )}
                        </div>
                        <div className="ms-3">
                            <h5 className="mb-0" onClick={() => handleViewProfile(otherUser)} style={{ cursor: "pointer"}}>{otherUser?.name || 'User'}</h5>
                            <small className="text-muted">
                                {isUserOnline(otherUser?._id) ? 'Online' : 'Offline'}
                            </small>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="messages-container">
                    {loading ? (
                        <div className="text-center p-4">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : (
                        <>
                            <div className="messages-list">
                                {messages.map((message, index) => (
                                    <div
                                        key={message._id || index}
                                        className={`message-bubble ${message.sender._id === user.id ? 'sent' : 'received'}`}
                                    >
                                        {message.sender._id !== user.id && (
                                            <div className="message-avatar">
                                                <img
                                                    src={message.sender.profilePictureUrl || `https://ui-avatars.com/api/?name=${message.sender.name || 'User'}&background=random`}
                                                    alt={message.sender.name || 'User'}
                                                />
                                            </div>
                                        )}
                                        <div className="message-content">
                                            <div className="message-text">{message.content}</div>
                                            <div className="message-meta">
                                                <span className="message-time">{formatTime(message.createdAt)}</span>
                                                {message.sender._id === user.id && (
                                                    <span className="message-status">
                                                        {message.read ? 'Read' : 'Sent'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Typing indicator */}
                            {activeChat && isUserTyping(activeChat._id, otherUser?._id) && (
                                <div className="typing-indicator">
                                    <div className="typing-bubble">
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                    </div>
                                    <span>{otherUser?.name} is typing...</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Message Input */}
                <div className="message-input">
                    <Form onSubmit={handleSendMessage}>
                        <div className="input-group">
                            <Form.Control
                                type="text"
                                placeholder="Type a message..."
                                value={messageText}
                                onChange={handleMessageChange}
                                disabled={loading}
                            />
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={!messageText.trim() || loading}
                            >
                                <FaPaperPlane />
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;