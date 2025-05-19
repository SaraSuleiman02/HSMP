import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { Form, Button, Container, Row, Col, Card, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

const LoginLayer = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
        setError(''); // Clear error on change
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        console.log("Attempting login with:", formData.email);
        try {
            const { email, password } = formData;
            if (!email || !password) {
                setError("Email and password are required.");
                toast.error("Email and password are required.");
                return;
            }
            const response = await login(email, password);

            if (response) {
                toast.success('Login successful!');
                navigate('/feed');
            } else {
                setError("Login failed. Please check your credentials or try again.");
                toast.error("Login failed. Please check your credentials or try again.");
            }

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Something went wrong. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    }
    return (
        <div className='auth-form-container bg-gradient'>
            <ToastContainer />
            <Container className="mt-5 padding-large">
                <Row className="justify-content-md-center">
                    <Col md={5}>
                        <Card className='auth-form'>
                            <Card.Header as="h3" className="text-center">Login</Card.Header>
                            <Card.Body>
                                {error && <Alert variant="danger" className="mt-2 mb-3">{error}</Alert>}
                                <Form onSubmit={handleSubmit} noValidate>
                                    <Form.Group className="mb-3" controlId="loginEmail">
                                        <Form.Label>Email address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="Enter email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            autoComplete="email"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="loginPassword">
                                        <Form.Label>Password</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                autoComplete="current-password"
                                            />
                                            <Button variant="outline-secondary" onClick={togglePasswordVisibility} style={{ borderTopRightRadius: '0.375rem', borderBottomRightRadius: '0.375rem' }}>
                                                {showPassword ?
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                                                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457L14.732 3.5H16v1.579l-1.881 1.881c.06.149.114.301.16.458l.744.743A3.974 3.974 0 0 1 16 8c0 .23-.02.454-.06.67l.737.736a4.47 4.47 0 0 1 .029.448l.006.05c.003.028.003.056.003.084s-.001.056-.003.084l-.006.05a4.479 4.479 0 0 1-.029.448l-.737.736c.04.216.06.44.06.67s-.094 1.29-.27 1.938l-.001.007c-.002.01-.003.02-.004.029l.792.792A7.018 7.018 0 0 0 16 8c0-1.72-.94-3.227-2.36-4.238l-1.42 1.42A5.936 5.936 0 0 1 13.359 11.238zM11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.288.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                                                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 6.079 1.42-1.422a3.937 3.937 0 0 1-1.426-1.42L12.16 9.176a5.936 5.936 0 0 0-1.359.238l.792.792a2.5 2.5 0 0 1-.004.004l.014.014a2.5 2.5 0 0 1 .004-.004l-.014-.014z" />
                                                        <path fillRule="evenodd" d="M13.646 14.354l-12-12 .708-.708 12 12-.708.708z" />
                                                    </svg> :
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                                                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.618-2.228C4.363 4.023 6.03 3.5 8 3.5c1.97 0 3.637.523 5.209 1.272A13.133 13.133 0 0 1 14.828 8c-.827.943-2.037 1.877-3.622 2.487C9.637 11.477 7.97 12 6.03 12c-1.97 0-3.637-.523-5.209-1.272A13.133 13.133 0 0 1 1.172 8z" />
                                                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                                                    </svg>
                                                }
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>

                                    <div className="d-grid mt-4">
                                        <Button variant="primary" type="submit" disabled={!formData.email || !formData.password}>
                                            Login
                                        </Button>
                                    </div>

                                    <hr className='mt-5' />

                                    <div className="text-center mt-3 mb-3">
                                        Don't have an account? <Link to="/SignUp" className='text-info'>Sign Up</Link>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default LoginLayer;