import React, { useEffect, useState, useRef } from 'react';
import { Navbar, Nav, Container, Button, Form, Dropdown, InputGroup, Badge, ListGroup } from 'react-bootstrap';
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocketContext } from '../context/SocketContext';
import { FaSearch, FaTools } from 'react-icons/fa';
import { Icon } from "@iconify/react/dist/iconify.js";
import axiosInstance from '../axiosConfig';
import './MasterLayout.css';
import TimeAgo from 'react-timeago';
import Logo from '../images/logo.png';

const MasterLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const {
        generalNotifications,
        messageNotifications,
        removeNotification,
        clearAllGeneralNotifications,
        clearAllMessageNotifications
    } = useSocketContext();

    const [scrolled, setScrolled] = useState(false);
    // --- Search State --- 
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchInputRef = useRef(null);
    const searchResultsRef = useRef(null);
    const [users, setUsers] = useState([]); // For search results
    // --- End Search State ---

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false); // For general notifications (bell)
    const [showChatDropdown, setShowChatDropdown] = useState(false); // For message notifications (chat icon)

    const navigate = useNavigate();
    const location = useLocation();
    const notTransparent = ['/profile', '/professional-profile', '/feed', '/post-details', '/chat', '/404'].includes(location.pathname);

    const profileDropdownRef = useRef(null);
    const notificationDropdownRef = useRef(null); // Ref for bell dropdown
    const chatDropdownRef = useRef(null); // Ref for chat dropdown

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            const threshold = window.innerHeight * 0.1;
            setScrolled(window.scrollY > threshold);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Click outside handler for ALL dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close search results
            if (searchResultsRef.current && !searchResultsRef.current.contains(event.target) && searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
            // Close profile dropdown
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            // Close notification dropdown
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
                setShowNotificationDropdown(false);
            }
            // Close chat dropdown
            if (chatDropdownRef.current && !chatDropdownRef.current.contains(event.target)) {
                setShowChatDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Fetch users for search --- 
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axiosInstance.get('/user');
                setUsers(response.data);
            } catch (error) {
                console.log("Error fetching users: ", error);
            }
        }
        if (user.id) {
            fetchUsers();
        }
    }, [user.id]);
    // --- End Fetch users ---

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setShowProfileDropdown(false);
    };

    // --- Search Handlers ---
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchResults.length > 0) {
            handleUserSelect(searchResults[0]);
        }
    };

    const handleSearchInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim().length > 0) {
            const filteredUsers = users.filter(u => {
                const nameMatch = u.name.toLowerCase().includes(query.toLowerCase());
                let skillMatch = false;
                if (u.role === 'professional' && u.professionalProfileId?.skills) {
                    skillMatch = u.professionalProfileId.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()));
                }
                return nameMatch || skillMatch;
            });
            setSearchResults(filteredUsers);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    const handleUserSelect = (selectedUser) => {
        setSearchQuery('');
        setShowSearchResults(false);
        const targetPath = selectedUser.role === 'professional' ? '/professional-profile' : '/profile';
        navigate(targetPath, { state: { viewedUserId: selectedUser._id } });
    };
    // --- End Search Handlers ---

    const handleProfileClick = () => {
        const targetPath = user.role === 'professional' ? '/professional-profile' : '/profile';
        navigate(targetPath);
        setShowProfileDropdown(false);
    };

    // --- Get User Skills (for search results) ---
    const getUserSkills = (user) => {
        return user.role === 'professional' && user.professionalProfileId?.skills?.length > 0
            ? user.professionalProfileId.skills.join(', ')
            : '';
    };
    // --- End Get User Skills ---

    const toggleProfileDropdown = () => setShowProfileDropdown(!showProfileDropdown);
    const toggleNotificationDropdown = () => {
        setShowNotificationDropdown(!showNotificationDropdown);
        setShowChatDropdown(false); // Close other dropdown
    };
    const toggleChatDropdown = () => {
        setShowChatDropdown(!showChatDropdown);
        setShowNotificationDropdown(false); // Close other dropdown
    };

    // Unified handler for clicking any notification item
    const handleNotificationItemClick = (notification) => {
        // Determine navigation target based on type
        if (notification.type === 'new_message' && notification.data?.chatRoomId) {
            navigate('/chat', { state: { chatRoomId: notification.data.chatRoomId } });
        } else if (notification.type === 'hired' && notification.data?.projectId) {
            navigate('/post-details', { state: { postId: notification.data.projectId } });
        } else if (notification.type === 'new_bid' && notification.data?.projectId) {
            navigate('/post-details', { state: { postId: notification.data.projectId } });
        }

        removeNotification(notification);

        if (notification.type === 'new_message') {
            setShowChatDropdown(false);
        } else {
            setShowNotificationDropdown(false);
        }
    };

    // Function to format notification content
    const formatNotification = (notification) => {
        switch (notification.type) {
            case 'new_message':
                const senderName = notification.data?.message?.sender?.name || 'Someone';
                const messageContent = notification.data?.message?.content || 'sent a message';
                const truncatedContent = messageContent.length > 30 ? messageContent.substring(0, 27) + '...' : messageContent;
                return `${senderName}: "${truncatedContent}"`;
            case 'hired':
                return `You were hired for: ${notification.data?.projectTitle || 'a project'}!`;
            case 'new_bid':
                return `New bid on: ${notification.data?.projectTitle || 'your post'}`;
            default:
                return `New notification: ${notification.type}`;
        }
    };

    return (
        <>
            <Navbar
                expand="lg"
                className={`py-2 fixed-top ${(scrolled || notTransparent) ? 'bg-white shadow-sm' : 'bg-transparent'}`}
            >
                <Container>
                    <Navbar.Brand as={Link} to="/" className="me-0 me-md-3"><img src={Logo} alt="logo" className='brand-logo'/></Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        {/* --- Search Bar --- */}
                        {user.id && (
                            <div className="search-wrapper d-flex justify-content-center flex-grow-1">
                                <div className="position-relative search-container">
                                    <Form onSubmit={handleSearch} className="d-flex search-form">
                                        <InputGroup>
                                            <Form.Control
                                                type="search"
                                                placeholder="Search users by name or skill..."
                                                value={searchQuery}
                                                onChange={handleSearchInputChange}
                                                onFocus={() => { if (searchQuery.trim().length > 0) setShowSearchResults(true); }}
                                                ref={searchInputRef}
                                                className="search-input"
                                                autoComplete="off"
                                            />
                                            <Button variant="outline-secondary" type="submit" className="search-button"><FaSearch /></Button>
                                        </InputGroup>
                                    </Form>
                                    {/* Search Results Dropdown */}
                                    {showSearchResults && (
                                        <div className="search-results-dropdown" ref={searchResultsRef}>
                                            <ListGroup>
                                                {searchResults.length > 0 ? (
                                                    searchResults.map((result) => (
                                                        <ListGroup.Item key={result._id} action onClick={() => handleUserSelect(result)} className="search-result-item">
                                                            <div className="d-flex align-items-center">
                                                                <img src={result.profilePictureUrl || "https://via.placeholder.com/40"} alt={result.name} className="rounded-circle me-2" width="40" height="40" />
                                                                <div className="search-result-info">
                                                                    <div className="search-result-name">{result.name}</div>
                                                                    <div className="search-result-details">
                                                                        <span className={`badge ${result.role === 'professional' ? 'bg-primary' : 'bg-success'} me-2 text-capitalize`}>{result.role}</span>
                                                                        {result.role === 'professional' && getUserSkills(result) && (
                                                                            <span className="search-result-skills"><FaTools className="me-1" size={12} />{getUserSkills(result)}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </ListGroup.Item>
                                                    ))
                                                ) : (
                                                    <ListGroup.Item className="text-center text-muted">No users found matching "{searchQuery}"</ListGroup.Item>
                                                )}
                                            </ListGroup>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Right side navigation */}
                        <Nav className="ms-auto align-items-center">
                            {!user.id ? (
                                /* Login/Signup Buttons */
                                <div className="d-flex gap-2">
                                    <NavLink to='/login'><Button className="button btn-orange">Login</Button></NavLink>
                                    <NavLink to='/signup'><Button className="button btn-primary">Sign Up</Button></NavLink>
                                </div>
                            ) : (
                                /* Logged-in User Icons */
                                <>
                                    <Nav.Link as={Link} to="/feed" className="nav-link-text">Feed</Nav.Link>

                                    {/* Chat Icon & Dropdown */}
                                    <div className="nav-icon-container position-relative" ref={chatDropdownRef}>
                                        <div className="nav-icon-link" onClick={toggleChatDropdown} style={{ cursor: 'pointer' }}>
                                            <Icon icon="lucide:message-circle" className="icon text-xl" />
                                            {messageNotifications.length > 0 && (
                                                <Badge pill bg="danger" className="notification-badge">
                                                    {messageNotifications.length}
                                                </Badge>
                                            )}
                                        </div>
                                        {showChatDropdown && (
                                            <Dropdown.Menu show className="chat-dropdown-menu" align="end">
                                                <Dropdown.Header className="d-flex justify-content-between align-items-center">
                                                    New Messages
                                                    {messageNotifications.length > 0 && (
                                                        <Button variant="link" size="sm" onClick={(e) => { e.stopPropagation(); clearAllMessageNotifications(); }}>Clear All</Button>
                                                    )}
                                                </Dropdown.Header>
                                                <Dropdown.Divider />
                                                <div className="notification-list">
                                                    {messageNotifications.length > 0 ? (
                                                        messageNotifications.map((notif, index) => (
                                                            <Dropdown.Item key={`msg-${index}`} onClick={() => handleNotificationItemClick(notif)} className="notification-item">
                                                                <div className="notification-content">{formatNotification(notif)}</div>
                                                                <div className="notification-time">
                                                                    <TimeAgo date={notif.timestamp} />
                                                                </div>
                                                            </Dropdown.Item>
                                                        ))
                                                    ) : (
                                                        <Dropdown.Item disabled className="text-center text-muted">No new messages</Dropdown.Item>
                                                    )}
                                                </div>
                                                <Dropdown.Divider />
                                                <Dropdown.Item as={Link} to="/chat" onClick={() => setShowChatDropdown(false)} className="text-center see-all-link">
                                                    See all Chats
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        )}
                                    </div>

                                    {/* Notification (Bell) Icon & Dropdown */}
                                    <div className="nav-icon-container position-relative" ref={notificationDropdownRef}>
                                        <div className="nav-icon-link" onClick={toggleNotificationDropdown} style={{ cursor: 'pointer' }}>
                                            <Icon icon="lucide:bell" className="icon text-xl" />
                                            {generalNotifications.length > 0 && (
                                                <Badge pill bg="danger" className="notification-badge">
                                                    {generalNotifications.length}
                                                </Badge>
                                            )}
                                        </div>
                                        {showNotificationDropdown && (
                                            <Dropdown.Menu show className="notification-dropdown-menu" align="end">
                                                <Dropdown.Header className="d-flex justify-content-between align-items-center">
                                                    Notifications
                                                    {generalNotifications.length > 0 && (
                                                        <Button variant="link" size="sm" onClick={(e) => { e.stopPropagation(); clearAllGeneralNotifications(); }}>Clear All</Button>
                                                    )}
                                                </Dropdown.Header>
                                                <Dropdown.Divider />
                                                <div className="notification-list">
                                                    {generalNotifications.length > 0 ? (
                                                        generalNotifications.map((notif, index) => (
                                                            <Dropdown.Item key={`gen-${index}`} onClick={() => handleNotificationItemClick(notif)} className="notification-item">
                                                                <div className="notification-content">{formatNotification(notif)}</div>
                                                                <div className="notification-time">
                                                                    <TimeAgo date={notif.timestamp} />
                                                                </div>
                                                            </Dropdown.Item>
                                                        ))
                                                    ) : (
                                                        <Dropdown.Item disabled className="text-center text-muted">No new notifications</Dropdown.Item>
                                                    )}
                                                </div>
                                            </Dropdown.Menu>
                                        )}
                                    </div>

                                    {/* Profile Dropdown */}
                                    <div className="nav-icon-container position-relative" ref={profileDropdownRef}>
                                        <div className="nav-icon-link profile-icon" onClick={toggleProfileDropdown} style={{ cursor: 'pointer' }}>
                                            <img src={user.profilePictureUrl || "https://via.placeholder.com/40"} alt={user.name} className="rounded-circle" width="40" height="40" />
                                        </div>
                                        {showProfileDropdown && (
                                            <Dropdown.Menu show className="profile-dropdown-menu" align="end">
                                                <Dropdown.Header className='profile-dropdown-header'>
                                                    <div className="fw-bold">{user.name}</div>
                                                    <div className="text-muted text-capitalize">{user.role}</div>
                                                </Dropdown.Header>
                                                <Dropdown.Divider />
                                                <Dropdown.Item className='profile' onClick={handleProfileClick}>
                                                    <Icon icon="lucide:user" className="me-2" /> My Profile
                                                </Dropdown.Item>
                                                <Dropdown.Item className='logout' onClick={handleLogout}>
                                                    <Icon icon="lucide:power" className="me-2" /> Log Out
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        )}
                                    </div>
                                </>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <main className="main-content">
                {children}
            </main>
        </>
    );
};

export default MasterLayout;