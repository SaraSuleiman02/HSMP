import React, { useEffect, useState, useRef } from 'react';
import { Navbar, Nav, Container, Button, Row, Col, Form, Dropdown, InputGroup, Badge, ListGroup } from 'react-bootstrap';
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSearch, FaComments, FaBell, FaUser, FaSignOutAlt, FaUserCircle, FaEnvelope, FaTools } from 'react-icons/fa';
import axiosInstance from '../axiosConfig';

const MasterLayout = ({ children }) => {
    const { user, loading, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchInputRef = useRef(null);
    const searchResultsRef = useRef(null);
    const [users, setUsers] = useState([]);

    // Mock data for notifications and chats - replace with actual data from your API
    const [notifications, setNotifications] = useState([]);
    const [chats, setChats] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();
    const isProfilePage = location.pathname === '/profile' || location.pathname === '/professional-profile' || location.pathname === '/feed' || location.pathname === '/post-details';

    // This effect will add a scroll event listener to the window to change the navbar style based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            const threshold = window.innerHeight * 0.1;
            setScrolled(window.scrollY > threshold);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle clicks outside of search results to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchResultsRef.current &&
                !searchResultsRef.current.contains(event.target) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target)
            ) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch notifications and chats - replace with your actual API calls
    useEffect(() => {
        fetchUsers();
        // Mock API call for notifications
        // const fetchNotifications = async () => {
        //     try {
        //         const response = await axiosInstance.get('/notifications');
        //         setNotifications(response.data);
        //     } catch (error) {
        //         console.error('Error fetching notifications:', error);
        //     }
        // };

        // Mock API call for chats
        // const fetchChats = async () => {
        //     try {
        //         const response = await axiosInstance.get('/chats');
        //         setChats(response.data);
        //     } catch (error) {
        //         console.error('Error fetching chats:', error);
        //     }
        // };

        // fetchNotifications();
        // fetchChats();

        // For now, using empty arrays
        setNotifications([]);
        setChats([]);
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axiosInstance.get('/user');
            setUsers(response.data);
        } catch (error) {
            console.log("Error fetching users: ", error);
        }
    }

    const handleLogout = async () => {
        await logout();       // Wait until logout finishes
        navigate('/');        // Then navigate to home
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // If there are search results and the first one is selected, navigate to it
        if (searchResults.length > 0) {
            const firstResult = searchResults[0];
            handleUserSelect(firstResult);
        }
    };

    const handleSearchInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length > 0) {
            // Filter users by name or skills
            const filteredUsers = users.filter(user => {
                // Check if name matches (case insensitive)
                const nameMatch = user.name.toLowerCase().includes(query.toLowerCase());

                // Check if any skills match (for professionals only)
                let skillMatch = false;
                if (user.role === 'professional' && user.professionalProfileId && user.professionalProfileId.skills) {
                    skillMatch = user.professionalProfileId.skills.some(skill =>
                        skill.toLowerCase().includes(query.toLowerCase())
                    );
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

        if (selectedUser.role === 'professional') {
            navigate('/professional-profile', { state: { viewedUserId: selectedUser._id } });
        } else if (selectedUser.role === 'homeowner') {
            navigate('/profile', { state: { viewedUserId: selectedUser._id } });
        }
    };

    const handleProfileClick = () => {
        if (user.role === 'homeowner') {
            navigate('/profile');
        } else if (user.role === 'professional') {
            navigate('/professional-profile');
        }
    };

    // Function to get user skills as a string
    const getUserSkills = (user) => {
        if (user.role === 'professional' &&
            user.professionalProfileId &&
            user.professionalProfileId.skills &&
            user.professionalProfileId.skills.length > 0) {
            return user.professionalProfileId.skills.join(', ');
        }
        return '';
    };

    return (
        <>
            <Navbar
                expand="lg"
                className={`py-2 fixed-top ${(scrolled || isProfilePage) ? 'bg-light shadow-sm' : 'bg-transparent'}`}
            >
                <Container>
                    {/* Brand on the left */}
                    <Navbar.Brand as={Link} to="/" className="me-0 me-md-3 brand-logo">
                        HSMP
                    </Navbar.Brand>

                    {/* Hamburger menu */}
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />

                    <Navbar.Collapse id="basic-navbar-nav">
                        {/* Search box in center */}
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
                                                onFocus={() => {
                                                    if (searchQuery.trim().length > 0) {
                                                        setShowSearchResults(true);
                                                    }
                                                }}
                                                ref={searchInputRef}
                                                className="search-input"
                                                autoComplete="off"
                                            />
                                            <Button variant="outline-secondary" type="submit" className="search-button">
                                                <FaSearch />
                                            </Button>
                                        </InputGroup>
                                    </Form>

                                    {/* Search Results Dropdown */}
                                    {showSearchResults && searchResults.length > 0 && (
                                        <div className="search-results-dropdown" ref={searchResultsRef}>
                                            <ListGroup>
                                                {searchResults.map((result) => (
                                                    <ListGroup.Item
                                                        key={result._id}
                                                        action
                                                        onClick={() => handleUserSelect(result)}
                                                        className="search-result-item"
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <div className="search-result-avatar me-2">
                                                                <img
                                                                    src={result.profilePictureUrl || "https://via.placeholder.com/40"}
                                                                    alt={result.name}
                                                                    className="rounded-circle"
                                                                    width="40"
                                                                    height="40"
                                                                />
                                                            </div>
                                                            <div className="search-result-info">
                                                                <div className="search-result-name">{result.name}</div>
                                                                <div className="search-result-details">
                                                                    <span className={`badge ${result.role === 'professional' ? 'bg-primary' : 'bg-success'} me-2`}>
                                                                        {result.role === 'professional' ? 'Professional' : 'Homeowner'}
                                                                    </span>
                                                                    {result.role === 'professional' && getUserSkills(result) && (
                                                                        <span className="search-result-skills">
                                                                            <FaTools className="me-1" size={12} />
                                                                            {getUserSkills(result)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </div>
                                    )}

                                    {/* No Results Message */}
                                    {showSearchResults && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                                        <div className="search-results-dropdown" ref={searchResultsRef}>
                                            <ListGroup>
                                                <ListGroup.Item className="text-center text-muted">
                                                    No users found matching "{searchQuery}"
                                                </ListGroup.Item>
                                            </ListGroup>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Right side navigation */}
                        <Nav className="ms-auto align-items-center">
                            {!user.id ? (
                                <div className="d-flex gap-2">
                                    <NavLink to='/login'>
                                        <Button className="button btn-orange">Login</Button>
                                    </NavLink>
                                    <NavLink to='/signup'>
                                        <Button className="button btn-primary">Sign Up</Button>
                                    </NavLink>
                                </div>
                            ) : (
                                <>
                                    <Nav.Link as={Link} to="/feed" className="nav-link-text">
                                        Feed
                                    </Nav.Link>

                                    {/* Chat Dropdown */}
                                    <Dropdown align="end" className="nav-dropdown">
                                        <Dropdown.Toggle as="div" className="nav-icon-link">
                                            <FaComments />
                                            {chats.length > 0 && (
                                                <Badge pill bg="danger" className="notification-badge">
                                                    {chats.length}
                                                </Badge>
                                            )}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="dropdown-menu-end">
                                            <Dropdown.Header>Messages</Dropdown.Header>
                                            {chats.length > 0 ? (
                                                <>
                                                    {chats.map((chat, index) => (
                                                        <Dropdown.Item key={index} as={Link} to={`/chat/${chat.id}`}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="chat-avatar me-2">
                                                                    <img
                                                                        src={chat.profilePicture || "https://via.placeholder.com/40"}
                                                                        alt={chat.name}
                                                                        className="rounded-circle"
                                                                        width="40"
                                                                        height="40"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold">{chat.name}</div>
                                                                    <div className="text-muted small text-truncate" style={{ maxWidth: "200px" }}>
                                                                        {chat.lastMessage}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Dropdown.Item>
                                                    ))}
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item as={Link} to="/chat" className="text-center">
                                                        See all messages
                                                    </Dropdown.Item>
                                                </>
                                            ) : (
                                                <div className="px-3 py-2 text-center">
                                                    <p className="mb-0">No messages</p>
                                                    <Dropdown.Item as={Link} to="/chat" className="btn btn-sm btn-outline-primary mt-2">
                                                        Go to Chat
                                                    </Dropdown.Item>
                                                </div>
                                            )}
                                        </Dropdown.Menu>
                                    </Dropdown>

                                    {/* Notifications Dropdown */}
                                    <Dropdown align="end" className="nav-dropdown">
                                        <Dropdown.Toggle as="div" className="nav-icon-link">
                                            <FaBell />
                                            {notifications.length > 0 && (
                                                <Badge pill bg="danger" className="notification-badge">
                                                    {notifications.length}
                                                </Badge>
                                            )}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="dropdown-menu-end">
                                            <Dropdown.Header>Notifications</Dropdown.Header>
                                            {notifications.length > 0 ? (
                                                <>
                                                    {notifications.map((notification, index) => (
                                                        <Dropdown.Item key={index} as={Link} to={notification.link || "#"}>
                                                            <div className="d-flex">
                                                                <div className="me-3">
                                                                    <div className="notification-icon bg-primary text-white">
                                                                        <FaBell />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div>{notification.message}</div>
                                                                    <div className="text-muted small">
                                                                        {notification.time}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Dropdown.Item>
                                                    ))}
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item as={Link} to="/notifications" className="text-center">
                                                        See all notifications
                                                    </Dropdown.Item>
                                                </>
                                            ) : (
                                                <div className="px-3 py-2 text-center">
                                                    <p className="mb-0">No notifications</p>
                                                </div>
                                            )}
                                        </Dropdown.Menu>
                                    </Dropdown>

                                    {/* Profile Dropdown */}
                                    <Dropdown align="end" className="nav-dropdown">
                                        <Dropdown.Toggle as="div" className="nav-icon-link user-dropdown">
                                            <FaUser />
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={handleProfileClick}>
                                                <FaUserCircle className="me-2" /> Profile
                                            </Dropdown.Item>
                                            <Dropdown.Divider />
                                            <Dropdown.Item onClick={handleLogout}>
                                                <FaSignOutAlt className="me-2" /> Logout
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Main content with padding to account for fixed navbar */}
            <main className="main-content">{children}</main>

            <footer className="footer text-light py-1 mt-4" style={{ background: 'linear-gradient(to bottom, #c0d1f9, #dce6fd)' }}>
                <Container>
                    <Row>
                        <Col className="text-center mt-3">
                            <p><strong>&copy; 2025 HSMP.JO | All rights reserved.</strong></p>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </>
    );
};

export default MasterLayout;