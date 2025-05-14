import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import axiosInstance from '../../axiosConfig';

const SKILLS_OPTIONS = [
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Tiling",
    "HVAC (Heating, Ventilation, and Air Conditioning)",
    "Roofing",
    "Landscaping",
    "Gardening",
    "Appliance Repair",
    "Home Cleaning",
];
const SERVICE_AREAS_OPTIONS = ['Amman', 'Zarqa', 'Irbid', 'Karak', 'Tafilah', 'Madaba', 'Aqaba',
    'Ajloun', 'Ma\'an', 'Balqa', 'Jerash', 'Mafraq', 'Russeifa', 'Salt', 'Wadi Musa'];

const SignUpLayer = () => {
    const [userRole, setUserRole] = useState('homeowner'); // 'professional' or 'homeowner'
    const [step, setStep] = useState(1); // 1 for initial role selection & basic info, 2 for professional details
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: {
            street: '',
            city: '',
        },
        // Professional specific fields
        bio: '',
        skills: [],
        experienceYears: '',
        serviceArea: [],
        portfolio: [{ title: '', description: '', imageUrl: null }],
    });

    const handleRoleChange = (event) => {
        setUserRole(event.target.value);
        setStep(1); // Reset to step 1 if role changes
        if (event.target.value !== 'professional') {
            setFormData(prev => ({
                ...prev,
                bio: '',
                skills: [],
                experienceYears: '',
                serviceArea: [],
                portfolio: [{ title: '', description: '', imageUrl: '' }],
            }));
        }
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        if (type === 'checkbox') {
            let currentValues = formData[name] || []; // Handles skills or serviceArea
            if (checked) {
                setFormData(prevData => ({
                    ...prevData,
                    [name]: [...currentValues, value],
                }));
            } else {
                setFormData(prevData => ({
                    ...prevData,
                    [name]: currentValues.filter(item => item !== value),
                }));
            }
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const handleAddressChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            address: {
                ...prevData.address,
                [name]: value,
            },
        }));
    };

    const handlePortfolioImageFile = (index, event) => {
        const file = event.target.files[0];
        if (!file) return;

        const updatedPortfolio = [...formData.portfolio];
        updatedPortfolio[index].imageUrl = file; // Store file object
        setFormData(prev => ({
            ...prev,
            portfolio: updatedPortfolio,
        }));
    };

    const handlePortfolioChange = (index, event) => {
        const { name, value } = event.target;
        const updatedPortfolio = formData.portfolio.map((project, i) => (
            i === index ? { ...project, [name]: value } : project
        ));
        setFormData(prevData => ({ ...prevData, portfolio: updatedPortfolio }));
    };

    const addPortfolioProject = () => {
        setFormData(prevData => ({
            ...prevData,
            portfolio: [...prevData.portfolio, { title: '', description: '', imageUrl: '' }],
        }));
    };

    const removePortfolioProject = (index) => {
        const updatedPortfolio = formData.portfolio.filter((_, i) => i !== index);
        setFormData(prevData => ({ ...prevData, portfolio: updatedPortfolio }));
    };

    const handleSubmitStep1 = async (event) => {
        event.preventDefault();
        if (userRole === 'professional') {
            setStep(2);
        } else {
            const completeFormData = { ...formData, role: userRole };

            // Remove professional-specific fields
            delete completeFormData.bio;
            delete completeFormData.skills;
            delete completeFormData.experienceYears;
            delete completeFormData.serviceArea;
            delete completeFormData.portfolio;

            try {
                await axiosInstance.post('/user', completeFormData);
                toast.success('Home Owner account created successfully!');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
            }
        }
    };

    const handleProfessionalSubmit = async (event) => {
        event.preventDefault();
        const completeFormData = { ...formData, role: userRole };

        const data = new FormData();
        for (const key in completeFormData) {
            if (key === 'address') {
                data.append('address[street]', completeFormData.address.street);
                data.append('address[city]', completeFormData.address.city);
            } else if (key === 'skills' || key === 'serviceArea') {
                completeFormData[key].forEach(item => data.append(`${key}[]`, item));
            } else if (key === 'portfolio') {
                completeFormData.portfolio.forEach(project => {
                    data.append('portfolioTitles', project.title);
                    data.append('portfolioDescriptions', project.description);
                    if (project.imageUrl) {
                        data.append('portfolioImages', project.imageUrl);
                    }
                });
            } else if (key !== 'profilePic') {
                data.append(key, completeFormData[key]);
            }
        }

        try {
            await axiosInstance.post('/user', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Show SweetAlert and redirect on confirmation
            Swal.fire({
                title: 'Your Info Sent Successfully!',
                text: 'Please wait for the email approval.',
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = '/';
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
        }
    };

    const isStep1SubmitDisabled = !userRole ||
        (userRole && (!formData.name ||
            !formData.email ||
            !formData.password ||
            !formData.phone ||
            !formData.address.street ||
            !formData.address.city));

    const isProfessionalSubmitDisabled = !formData.bio ||
        !formData.experienceYears ||
        formData.portfolio.some(p => !p.title || !p.description);

    return (
        <div className='auth-form-container bg-gradient'>
            <ToastContainer />
            <Container className="mt-5 mb-5 padding-medium">
                <Row className="justify-content-md-center">
                    <Col md={8}>
                        <Card className='auth-form'>
                            <Card.Header as="h3" className="text-center" style={{ background: "#e0e7f7" }}>Sign Up</Card.Header>
                            <Card.Body>
                                {/* For both professioal and homeowner */}
                                {step === 1 && (
                                    <Form onSubmit={handleSubmitStep1} noValidate>
                                        <Form.Group className="mb-3 d-flex flex-wrap align-items-center justify-content-center" >

                                            <Form.Label className="mb-0" column sm={3}>
                                                Sign Up as:
                                            </Form.Label>
                                            <div className="d-flex gap-3">
                                                <Form.Check
                                                    type="radio"
                                                    label="Professional"
                                                    name="userRoleRadio"
                                                    id="roleProfessional"
                                                    value="professional"
                                                    checked={userRole === 'professional'}
                                                    onChange={handleRoleChange}
                                                    required
                                                />
                                                <Form.Check
                                                    type="radio"
                                                    label="Home Owner"
                                                    name="userRoleRadio"
                                                    id="roleHomeOwner"
                                                    value="homeowner"
                                                    checked={userRole === 'homeowner'}
                                                    onChange={handleRoleChange}
                                                    required
                                                />
                                            </div>
                                        </Form.Group>
                                        <hr />

                                        {userRole && (
                                            <>
                                                <Form.Group as={Row} className="mb-3" controlId="formName">
                                                    <Form.Label column sm={3}>Name</Form.Label>
                                                    <Col sm={9}>
                                                        <Form.Control type="text" placeholder="Enter your name" name="name" value={formData.name} onChange={handleChange} required />
                                                    </Col>
                                                </Form.Group>

                                                <Form.Group as={Row} className="mb-3" controlId="formEmail">
                                                    <Form.Label column sm={3}>Email address</Form.Label>
                                                    <Col sm={9}>
                                                        <Form.Control type="email" placeholder="Enter email" name="email" value={formData.email} onChange={handleChange} required />
                                                    </Col>
                                                </Form.Group>

                                                <Form.Group as={Row} className="mb-3" controlId="formPassword">
                                                    <Form.Label column sm={3}>Password</Form.Label>
                                                    <Col sm={9}>
                                                        <Form.Control type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} required />
                                                    </Col>
                                                </Form.Group>

                                                <Form.Group as={Row} className="mb-3" controlId="formPhone">
                                                    <Form.Label column sm={3}>Phone</Form.Label>
                                                    <Col sm={9}>
                                                        <Form.Control type="text" placeholder="ex. 079*******" name="phone" value={formData.phone} onChange={handleChange} required />
                                                    </Col>
                                                </Form.Group>

                                                <Form.Group as={Row} className="mb-3" controlId="formStreet">
                                                    <Form.Label column sm={3}>Street Address</Form.Label>
                                                    <Col sm={9}>
                                                        <Form.Control type="text" placeholder="1234 Main St" name="street" value={formData.address.street} onChange={handleAddressChange} required />
                                                    </Col>
                                                </Form.Group>

                                                <Form.Group as={Row} className="mb-3" controlId="formCity">
                                                    <Form.Label column sm={3}>City</Form.Label>
                                                    <Col sm={9}>
                                                        <Form.Control type="text" placeholder="City" name="city" value={formData.address.city} onChange={handleAddressChange} required />
                                                    </Col>
                                                </Form.Group>
                                            </>
                                        )}

                                        <div className="d-grid mt-4">
                                            <Button variant="primary" type="submit" disabled={isStep1SubmitDisabled}>
                                                {userRole === 'professional' ? 'Next' : 'Sign Up'}
                                            </Button>
                                        </div>
                                    </Form>
                                )}

                                {/* For professional only */}
                                {step === 2 && userRole === 'professional' && (
                                    <Form onSubmit={handleProfessionalSubmit} noValidate>
                                        <h4 className="mb-3">Professional Details</h4>

                                        <Form.Group as={Row} className="mb-3" controlId="formBio">
                                            <Form.Label column sm={3}>Bio</Form.Label>
                                            <Col sm={9}>
                                                <Form.Control as="textarea" rows={3} placeholder="Tell us about yourself" name="bio" value={formData.bio} onChange={handleChange} required />
                                            </Col>
                                        </Form.Group>

                                        <Form.Group as={Row} className="mb-3">
                                            <Form.Label column sm={3}>Skills</Form.Label>
                                            <Col sm={9}>
                                                <Row>
                                                    {[0, 1].map(col => (
                                                        <Col key={col}>
                                                            {SKILLS_OPTIONS.slice(col * 6, col * 6 + 6).map(skill => (
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    key={skill}
                                                                    label={skill}
                                                                    name="skills"
                                                                    value={skill}
                                                                    checked={formData.skills.includes(skill)}
                                                                    onChange={handleChange}
                                                                />
                                                            ))}
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </Col>
                                        </Form.Group>

                                        <Form.Group as={Row} className="mb-3" controlId="formExperience">
                                            <Form.Label column sm={3}>Experience (Years)</Form.Label>
                                            <Col sm={9}>
                                                <Form.Control type="number" placeholder="e.g., 5" name="experienceYears" value={formData.experienceYears} onChange={handleChange} required min="0" />
                                            </Col>
                                        </Form.Group>

                                        <Form.Group as={Row} className="mb-3">
                                            <Form.Label column sm={3}>Service Areas</Form.Label>
                                            <Col sm={9}>
                                                <Row>
                                                    {[0, 1, 2].map(col => (
                                                        <Col key={col}>
                                                            {SERVICE_AREAS_OPTIONS.slice(col * 5, col * 5 + 5).map(area => (
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    key={area}
                                                                    label={area}
                                                                    name="serviceArea"
                                                                    value={area}
                                                                    checked={formData.serviceArea.includes(area)}
                                                                    onChange={handleChange}
                                                                />
                                                            ))}
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </Col>
                                        </Form.Group>

                                        <h5 className="mt-4 mb-3">Portfolio Projects</h5>
                                        {formData.portfolio.map((project, index) => (
                                            <Card key={index} className="mb-3">
                                                <Card.Body>
                                                    <Form.Group as={Row} className="mb-2" controlId={`portfolioTitle-${index}`}>
                                                        <Form.Label column sm={3}>Project Title</Form.Label>
                                                        <Col sm={9}>
                                                            <Form.Control type="text" placeholder="Project Title" name="title" value={project.title} onChange={(e) => handlePortfolioChange(index, e)} required />
                                                        </Col>
                                                    </Form.Group>
                                                    <Form.Group as={Row} className="mb-2" controlId={`portfolioDesc-${index}`}>
                                                        <Form.Label column sm={3}>Description</Form.Label>
                                                        <Col sm={9}>
                                                            <Form.Control as="textarea" rows={2} placeholder="Project Description" name="description" value={project.description} onChange={(e) => handlePortfolioChange(index, e)} required />
                                                        </Col>
                                                    </Form.Group>
                                                    <Form.Group as={Row} className="mb-2" controlId={`portfolioImg-${index}`}>
                                                        <Form.Label column sm={3}>Image</Form.Label>
                                                        <Col sm={9}>
                                                            <Form.Control
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handlePortfolioImageFile(index, e)}
                                                            />
                                                        </Col>
                                                    </Form.Group>
                                                    {formData.portfolio.length > 1 && (
                                                        <Button variant="danger" size="sm" onClick={() => removePortfolioProject(index)} className="mt-2 float-end">
                                                            Remove Project
                                                        </Button>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        ))}
                                        <Button variant="outline-primary" onClick={addPortfolioProject} className="mb-3">
                                            Add Another Project
                                        </Button>

                                        <div className="d-flex justify-content-between mt-4">
                                            <Button variant="secondary" onClick={() => setStep(1)}>
                                                Back
                                            </Button>
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={isProfessionalSubmitDisabled}
                                                onClick={() => console.log('Submit disabled:', isProfessionalSubmitDisabled)}
                                            >
                                                Sign Up
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default SignUpLayer;