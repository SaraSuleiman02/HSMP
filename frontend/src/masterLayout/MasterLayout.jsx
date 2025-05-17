import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Button, Row, Col } from 'react-bootstrap';
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MasterLayout = ({ children }) => {
    const { user, loading, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const isProfilePage = location.pathname === '/profile' || location.pathname === '/professional-profile';

    // This effect will add a scroll event listener to the window to change the navbar style based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            const threshold = window.innerHeight * 0.1;
            setScrolled(window.scrollY > threshold);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();       // Wait until logout finishes
        navigate('/');        // Then navigate to home
    };

    return (
        <>
            <Navbar
                expand="lg"
                className={`py-3 fixed-top ${(scrolled || isProfilePage) ? 'bg-light shadow-sm' : 'bg-transparent'}`}
            >
                <Container>
                    <Navbar.Brand href="/">HSMP</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mx-auto">
                            {/* The search goes here */}
                        </Nav>
                        {!user.id && (
                            <div className="d-flex gap-2">
                                <NavLink to='/login'>
                                    <Button className="button btn-orange">Login</Button>
                                </NavLink>
                                <NavLink to='/signup'>
                                    <Button className="button btn-primary">Sign Up</Button>
                                </NavLink>
                            </div>
                        )}

                        {user.id && (
                            <div className="d-flex gap-3">
                                <Nav.Link href="/feed" className='mt-2'>Feed</Nav.Link>
                                {user.role === 'homeowner' && (
                                    <Nav.Link href="/profile" className='mt-2'>Profile</Nav.Link>
                                )}
                                {user.role === 'professional' && (
                                    <Nav.Link href="/professional-profile" className='mt-2'>Profile</Nav.Link>
                                )}
                                <Button className="button btn-danger" onClick={handleLogout}>Logout</Button>
                            </div>
                        )}
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <main style={{ minHeight: '100vh' }}>{children}</main>

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