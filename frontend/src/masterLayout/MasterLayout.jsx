import React, { useEffect, useState, useRef } from 'react';
import { Navbar, Nav, Container, Button, Row, Col, Form, Dropdown, InputGroup, Badge, ListGroup } from 'react-bootstrap';
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSearch, FaTools } from 'react-icons/fa';
import { Icon } from "@iconify/react/dist/iconify.js";
import axiosInstance from '../axiosConfig';
import './MasterLayout.css';

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
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const isProfilePage = location.pathname === '/profile' || location.pathname === '/professional-profile' || location.pathname === '/feed' || location.pathname === '/post-details' || location.pathname === '/chat';
    const profileDropdownRef = useRef(null);

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

            if (
                profileDropdownRef.current &&
                !profileDropdownRef.current.contains(event.target)
            ) {
                setShowProfileDropdown(false);
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
        setShowProfileDropdown(false);
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
        setShowProfileDropdown(false);
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

    const toggleProfileDropdown = () => {
        setShowProfileDropdown(!showProfileDropdown);
    };

    return (
        <>
            <Navbar
                expand="lg"
                className={`py-2 fixed-top ${(scrolled || isProfilePage) ? 'bg-white shadow-sm' : 'bg-transparent'}`}
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

                                    {/* Chat Icon */}
                                    <div className="nav-icon-container">
                                        <div className="nav-icon-link">
                                            <Icon icon="lucide:message-circle" className="icon text-xl" />
                                            {chats.length > 0 && (
                                                <Badge pill bg="danger" className="notification-badge">
                                                    {chats.length}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notification Icon */}
                                    <div className="nav-icon-container">
                                        <div className="nav-icon-link">
                                            <Icon icon="lucide:bell" className="icon text-xl" />
                                            {notifications.length > 0 && (
                                                <Badge pill bg="danger" className="notification-badge">
                                                    {notifications.length}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Profile Dropdown */}
                                    <div className="nav-icon-container position-relative">
                                        <div
                                            className="nav-icon-link profile-icon"
                                            onClick={toggleProfileDropdown}
                                        >
                                            <img
                                                src={user.profilePictureUrl}
                                                alt={user.name}
                                                className="rounded-circle"
                                                width="40"
                                                height="40"
                                            />
                                        </div>

                                        {showProfileDropdown && (
                                            <div className="profile-dropdown-menu" ref={profileDropdownRef}>
                                                <div className="profile-dropdown-header">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <div className="fw-bold">{user.name}</div>
                                                            <div className="text-muted">{user.role}</div>
                                                        </div>
                                                        <button
                                                            className="btn-close"
                                                            onClick={() => setShowProfileDropdown(false)}
                                                        ></button>
                                                    </div>
                                                </div>

                                                <div className="profile-dropdown-item profile icon" onClick={handleProfileClick}>
                                                    <Icon icon="lucide:user" className=" text-sm me-2" />
                                                    My Profile
                                                </div>

                                                <div className="profile-dropdown-item logout icon" onClick={handleLogout}>
                                                    <Icon icon="lucide:power" className="text-sm me-2" />
                                                    Log Out
                                                </div>
                                            </div>
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
