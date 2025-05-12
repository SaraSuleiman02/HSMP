import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Button, Row, Col } from 'react-bootstrap';

const MasterLayout = ({ children }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const threshold = window.innerHeight * 0.6;
            setScrolled(window.scrollY > threshold);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Navbar
                expand="lg"
                className={`py-3 fixed-top ${scrolled ? 'bg-light shadow-sm' : 'bg-transparent'}`}
            >
                <Container>
                    <Navbar.Brand href="#home">HSMP</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mx-auto">
                            {/* The search goes here */}
                        </Nav>
                        <div className="d-flex gap-2">
                            <Button className="button btn-orange">Login</Button>
                            <Button className="button btn-primary">Sign Up</Button>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <main style={{ minHeight: '100vh' }}>{children}</main>

            <footer className="footer text-light py-1" style={{ backgroundColor: '#e5ebfb' }}>
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