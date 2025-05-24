import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { toast, ToastContainer } from 'react-toastify';
import axiosInstance from '../../axiosConfig';
import { BsEye, BsEyeSlash } from 'react-icons/bs';

const SKILLS_OPTIONS = [
    "Plumbing", "Electrical", "Carpentry", "Painting", "Tiling",
    "HVAC", "Roofing",
    "Landscaping", "Gardening", "Appliance Repair", "Home Cleaning"
];

const SERVICE_AREAS_OPTIONS = [
    'Amman', 'Zarqa', 'Irbid', 'Karak', 'Tafilah', 'Madaba', 'Aqaba',
    'Ajloun', 'Ma\'an', 'Balqa', 'Jerash', 'Mafraq', 'Russeifa', 'Salt', 'Wadi Musa'
];

const ProfileChild = ({ proProfile }) => {
    const { user, updateUser } = useAuth();

    const [personalInfo, setPersonalInfo] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
            street: user.address.street || '',
            city: user.address.city || ''
        }
    });
    const [proInfo, setProInfo] = useState({
        bio: proProfile?.bio || '',
        experienceYears: proProfile?.experienceYears || '',
        skills: proProfile?.skills || [],
        serviceArea: proProfile?.serviceArea || []
    });
    const [personalInfoErrors, setPersonalInfoErrors] = useState({ email: '', phone: '' });
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [passwordErrors, setPasswordErrors] = useState({ newPassword: '', confirmPassword: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validatePhone = (phone) => /^07[7-9]\d{7}$/.test(phone);

    // to update state when proProfile changes
    useEffect(() => {
        if (proProfile) {
            setProInfo({
                bio: proProfile.bio || '',
                experienceYears: proProfile.experienceYears || '',
                skills: proProfile.skills || [],
                serviceArea: proProfile.serviceArea || []
            });
        }
    }, [proProfile]);

    useEffect(() => {
        setPersonalInfo({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: {
                street: user.address?.street || '',
                city: user.address?.city || ''
            }
        });
    }, [user]);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        if (name === 'street' || name === 'city') {
            setPersonalInfo(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [name]: value
                }
            }));
        } else {
            setPersonalInfo(prev => ({ ...prev, [name]: value }));
        }
    };

    // Handle personal info update
    const handlePersonalInfoUpdate = async (e) => {
        e.preventDefault();

        const errors = {
            email: '',
            phone: ''
        };

        if (!validateEmail(personalInfo.email)) {
            errors.email = 'Invalid email format';
        }

        if (personalInfo.phone && !validatePhone(personalInfo.phone)) {
            errors.phone = 'Invalid phone number (e.g., 0791234567)';
        }

        setPersonalInfoErrors(errors);

        if (errors.email || errors.phone) return;

        const result = await Swal.fire({
            title: 'Confirm Changes',
            text: 'Are you sure you want to update your profile?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'No, cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await axiosInstance.put(`/user/${user.id}`, personalInfo);
                if (response.data) {
                    updateUser({
                        name: personalInfo.name,
                        email: personalInfo.email,
                        phone: personalInfo.phone,
                        address: personalInfo.address
                    });
                }

                toast.success('Personal information updated successfully!');
            } catch (error) {
                toast.error('Failed to update personal info.');
            }
        }
    };

    const handleProInfoChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'skills' || name === 'serviceArea') {
            const current = [...proInfo[name]];
            const updated = checked
                ? [...current, value]
                : current.filter(v => v !== value);
            setProInfo(prev => ({ ...prev, [name]: updated }));
        } else {
            setProInfo(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleProInfoUpdate = async (e) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: 'Confirm Changes',
            text: 'Are you sure you want to update your profile?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'No, cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await axiosInstance.put(`/profile/${user.professionalProfileId}`, proInfo);
                toast.success('Profile updated successfully!');
            } catch (error) {
                toast.error('Failed to update profile.');
            }
        }
    }

    const togglePasswordVisibility = () => setShowNewPassword(prev => !prev);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev);

    const validatePassword = (password) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

    const validatePasswordForm = () => {
        const newErrors = { newPassword: '', confirmPassword: '' };
        if (!passwordData.newPassword.trim()) {
            newErrors.newPassword = 'New password is required';
        } else if (!validatePassword(passwordData.newPassword)) {
            newErrors.newPassword = 'Password must be 8+ chars, include upper/lowercase, number & special char';
        }

        if (!passwordData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setPasswordErrors(newErrors);
        Object.values(newErrors).forEach(error => error && toast.error(error));
        return !Object.values(newErrors).some(err => err);
    };

    const handlePasswordDataChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordDataUpdate = async (e) => {
        e.preventDefault();
        if (!validatePasswordForm()) return;

        try {
            await axiosInstance.put('/user/update-password', {
                ...passwordData,
                email: personalInfo.email
            });
            toast.success('Password updated successfully!');
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch {
            toast.error('Failed to update password.');
        }
    };

    return (
        <div>
            <Card className="mb-4">
                <Card.Header as="h5">Personal Information</Card.Header>
                <Card.Body>
                    <Form onSubmit={handlePersonalInfoUpdate}>
                        {/* Name */}
                        <Form.Group as={Row} className="mb-3">
                            <Form.Label column sm={3}>Name</Form.Label>
                            <Col sm={9}>
                                <Form.Control type="text" name="name" value={personalInfo.name} onChange={handlePersonalInfoChange} required />
                            </Col>
                        </Form.Group>

                        {/* Email */}
                        <Form.Group as={Row} className="mb-3">
                            <Form.Label column sm={3}>Email</Form.Label>
                            <Col sm={9}>
                                <Form.Control type="email" name="email" value={personalInfo.email} onChange={handlePersonalInfoChange} required />
                            </Col>
                        </Form.Group>

                        {/* Phone */}
                        <Form.Group as={Row} className="mb-3">
                            <Form.Label column sm={3}>Phone</Form.Label>
                            <Col sm={9}>
                                <Form.Control type="tel" name="phone" value={personalInfo.phone} onChange={handlePersonalInfoChange} />
                            </Col>
                        </Form.Group>

                        {/* Address */}
                        <Form.Group as={Row} className="mb-3">
                            <Form.Label column sm={3}>Address</Form.Label>
                            <Col sm={9}>
                                <Form.Control type="text" name="street" placeholder="Street" value={personalInfo.address.street} onChange={handlePersonalInfoChange} className="mb-2" />
                                <Form.Select
                                    name="city"
                                    value={personalInfo.address.city}
                                    onChange={handlePersonalInfoChange}
                                >
                                    <option value="">Select a City</option>
                                    {SERVICE_AREAS_OPTIONS.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                            <Button variant="primary" type="submit">Update</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Professional Info */}
            {proProfile && (
                <Card className="mb-4">
                    <Card.Header as="h5">Professional Profile Information</Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleProInfoUpdate}>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={3}>Bio</Form.Label>
                                <Col sm={9}>
                                    <Form.Control type="text" name="bio" value={proInfo.bio} onChange={handleProInfoChange} />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={3}>Experience Years</Form.Label>
                                <Col sm={9}>
                                    <Form.Control type="number" name="experienceYears" value={proInfo.experienceYears} onChange={handleProInfoChange} />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={3}>Skills</Form.Label>
                                <Col sm={9}>
                                    <Row>
                                        {SKILLS_OPTIONS.map((skill, idx) => (
                                            <Col xs={6} md={4} key={idx}>
                                                <Form.Check
                                                    type="checkbox"
                                                    label={skill}
                                                    name="skills"
                                                    value={skill}
                                                    checked={proInfo.skills.includes(skill)}
                                                    onChange={handleProInfoChange}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm={3}>Service Area</Form.Label>
                                <Col sm={9}>
                                    <Row>
                                        {SERVICE_AREAS_OPTIONS.map((area, idx) => (
                                            <Col xs={6} md={4} key={idx}>
                                                <Form.Check
                                                    type="checkbox"
                                                    label={area}
                                                    name="serviceArea"
                                                    value={area}
                                                    checked={proInfo.serviceArea.includes(area)}
                                                    onChange={handleProInfoChange}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </Col>
                            </Form.Group>

                            <div className="d-flex justify-content-end">
                                <Button variant="primary" type="submit">Update</Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {/* Password Section */}
            <Card>
                <Card.Header as="h5">Account Information</Card.Header>
                <Card.Body>
                    <Form onSubmit={handlePasswordDataUpdate}>
                        <Form.Group as={Row} className="mb-3">
                            <Form.Label column sm={3}>New Password</Form.Label>
                            <Col sm={9}>
                                <InputGroup>
                                    <Form.Control type={showNewPassword ? 'text' : 'password'} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordDataChange} required />
                                    <Button variant="outline-secondary" onClick={togglePasswordVisibility}>
                                        {showNewPassword ? <BsEyeSlash /> : <BsEye />}
                                    </Button>
                                </InputGroup>
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className="mb-3">
                            <Form.Label column sm={3}>Confirm Password</Form.Label>
                            <Col sm={9}>
                                <InputGroup>
                                    <Form.Control type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordDataChange} required />
                                    <Button variant="outline-secondary" onClick={toggleConfirmPasswordVisibility}>
                                        {showConfirmPassword ? <BsEyeSlash /> : <BsEye />}
                                    </Button>
                                </InputGroup>
                            </Col>
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                            <Button variant="primary" type="submit">Update</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ProfileChild;
