import React, { useState, useEffect, useRef } from 'react';
import { Card, Container, Image, Button, Tabs, Tab, Modal, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileChild from '../child/ProfileChild';
import ProfileReviews from '../child/ProfileReviews.jsx';
import ProfileProjects from '../child/ProfileProjects';
import profileBg from '../../images/profile-bg.png';
import axiosInstance from '../../axiosConfig';
import { FaEdit } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const ProfessionalProfileLayer = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate(); // Initialize useNavigate
    const viewedUserId = location.state?.viewedUserId || user.id;
    const isOwnProfile = viewedUserId === user.id;
    // State for active tab key
    const [key, setKey] = useState(isOwnProfile ? 'profile' : 'projects');
    const [userData, setUserData] = useState([]);
    const [proProfileData, setProProfileData] = useState([]);

    // Profile picture upload states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOwnProfile) {
            fetchUserData(viewedUserId);
        } else {
            setUserData(user);
        }
    }, []);  // Empty dependency array to run once on mount

    useEffect(() => {
        if (userData && userData.professionalProfileId) {
            fetchProProfileData(userData.professionalProfileId);
        }
    }, [userData]);  // This runs whenever userData is updated

    const fetchUserData = async (userId) => {
        try {
            const response = await axiosInstance.get(`/user/${userId}`);
            setUserData(response.data);
        } catch (error) {
            toast.error("Error Fetching user data");
        }
    }

    const fetchProProfileData = async (profileId) => {
        try {
            const response = await axiosInstance.get(`/profile/${profileId}`);
            setProProfileData(response.data);
        } catch (error) {
            toast.error('Error fetching professional data!');
        }
    }

    // Handle Chat button click
    const handleChatClick = async () => {
        try {
            // Create or get existing chat room directly with API call
            const response = await axiosInstance.post(`/chat/${viewedUserId}`);
            const chatRoom = response.data.chatRoom;

            if (chatRoom) {
                // Navigate to chat page with chatRoomId in state
                navigate('/chat', {
                    state: {
                        initialChatRoomId: chatRoom._id,
                        otherUserId: viewedUserId
                    }
                });
            }
        } catch (error) {
            console.error("Error starting chat:", error);
            toast.error("Failed to start chat. Please try again.");
        }
    };

    const handleImageClick = () => {
        if (isOwnProfile) {
            setShowUploadModal(true);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
                return;
            }

            setSelectedImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadImage = async () => {
        if (!selectedImage) {
            toast.warning("Please select an image to upload");
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('profilePic', selectedImage);

        try {
            const response = await axiosInstance.put(`/user/${user.id}`, formData);

            // Update local state with new profile picture URL
            setUserData(prevData => ({
                ...prevData,
                profilePictureUrl: response.data.profilePictureUrl || response.data.user?.profilePictureUrl
            }));

            toast.success("Profile picture updated successfully!");
            setShowUploadModal(false);
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error) {
            console.error("Error updating profile picture:", error);
            toast.error(error.response?.data?.message || "Failed to update profile picture");
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div className='padding-small'>
            <ToastContainer position="top-right" autoClose={3000} />
            <Container className="my-1">
                {/* Top Profile Card */}
                <Card className="mb-4" data-aos="slide-right">
                    <Card.Img
                        variant="top"
                        src={profileBg}
                        style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <Card.Body className="text-center d-flex flex-column">
                        <div className="position-relative" style={{ marginTop: '-75px' }}>
                            <div className="position-relative d-inline-block">
                                <Image
                                    src={userData.profilePictureUrl}
                                    roundedCircle
                                    className="border border-white border-5"
                                    style={{ width: '150px', height: '150px', objectFit: 'cover', backgroundColor: '#f8f9fa' }}
                                />
                                {isOwnProfile && (
                                    <div
                                        className="position-absolute d-flex justify-content-center align-items-center bg-primary rounded-circle"
                                        style={{
                                            bottom: '5px',
                                            right: '5px',
                                            width: '35px',
                                            height: '35px',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                            zIndex: 10
                                        }}
                                        onClick={handleImageClick}
                                    >
                                        <FaEdit color="white" size={18} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='d-flex justify-content-center gap-2'>
                            <Card.Title className="mt-3 mb-3">{userData.name || "User"}</Card.Title>
                            <Card.Text className="text-muted mt-3">({userData.role || ""})</Card.Text>
                        </div>
                        <Card.Text className='align-self-center' style={{ maxWidth: "500px" }}>{proProfileData.bio}</Card.Text>

                        <hr />

                        <div className='mt-3 d-flex justify-content-around flex-wrap'>
                            <div className='d-felx felx-column' style={{ maxWidth: "200px" }}>
                                <h5>Skills</h5>
                                <p>{proProfileData.skills?.join(', ')}</p>
                            </div>
                            <div className='d-felx felx-column' style={{ maxWidth: "200px" }}>
                                <h5>Servie Area</h5>
                                <p>{proProfileData.serviceArea?.join(', ')}</p>
                            </div>
                            <div className='d-felx felx-column'>
                                <h5>Experience Years</h5>
                                <p>{proProfileData.experienceYears}</p>
                            </div>
                            <div className='d-flex flex-column align-items-center'>
                                <h5>Rating</h5>
                                <div>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} style={{ color: star <= proProfileData.averageRating ? '#ffc107' : '#e4e5e9', fontSize: '1.5rem' }}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            {user.role === 'homeowner' && (
                                <span>
                                    <Button
                                        variant="primary"
                                        className="me-2"
                                        onClick={handleChatClick} // Add click handler
                                    >
                                        Chat
                                    </Button>
                                </span>
                            )}
                        </div>
                    </Card.Body>
                </Card>

                {/* Bottom Tabbed Card */}
                <Card data-aos="slide-left">
                    <Card.Header>
                        <Tabs
                            id="profile-tabs"
                            activeKey={key}
                            onSelect={(k) => setKey(k)}
                            className=" d-flex justify-content-center"
                        >
                            {isOwnProfile && (
                                <Tab eventKey="profile" title="Profile">
                                    {/* Profile Tab Content */}
                                </Tab>
                            )}
                            <Tab eventKey="projects" title="Projects">
                                {/* Posts Tab Content */}
                            </Tab>
                            <Tab eventKey="reviews" title="Reviews">
                                {/* Posts Tab Content */}
                            </Tab>
                        </Tabs>
                    </Card.Header>
                    <Card.Body>

                        {key === 'profile' && isOwnProfile && (
                            <ProfileChild proProfile={proProfileData} />
                        )}

                        {key === 'projects' && (
                            <ProfileProjects proId={viewedUserId} />
                        )}

                        {key === 'reviews' && (
                            <ProfileReviews proId={viewedUserId} />
                        )}

                    </Card.Body>
                </Card>
            </Container>

            {/* Profile Picture Upload Modal */}
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Update Profile Picture</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center mb-3">
                        {imagePreview ? (
                            <Image
                                src={imagePreview}
                                roundedCircle
                                className="border"
                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            />
                        ) : (
                            <Image
                                src={userData.profilePictureUrl}
                                roundedCircle
                                className="border"
                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            />
                        )}
                    </div>

                    <Form.Group controlId="profilePicture" className="mb-3">
                        <Form.Label>Choose a new profile picture</Form.Label>
                        <div className="d-grid">
                            <Button
                                variant="outline-secondary"
                                onClick={triggerFileInput}
                                className="mb-2"
                            >
                                Select Image
                            </Button>
                            <Form.Control
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                style={{ display: 'none' }}
                            />
                            <Form.Text className="text-muted">
                                Recommended: Square image, max 5MB (JPEG, PNG, or WebP)
                            </Form.Text>
                        </div>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUploadImage}
                        disabled={!selectedImage || isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                Uploading...
                            </>
                        ) : (
                            'Upload'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ProfessionalProfileLayer;