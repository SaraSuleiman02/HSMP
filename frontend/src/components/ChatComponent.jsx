import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ChatSidebar from './child/ChatSidebar';
import ChatWindow from './child/ChatWindow';
import { ChatProvider } from '../context/ChatContext';
import './chat.css';

const ChatComponent = () => {
    const [selectedUser, setSelectedUser] = React.useState(null);

    return (
        <ChatProvider>
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
        </ChatProvider>
    );
};

export default ChatComponent;