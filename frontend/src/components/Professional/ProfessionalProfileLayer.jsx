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
    const { user, updateUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    // Determine the ID of the user whose profile is being viewed
    const viewedUserId = location.state?.viewedUserId || user.id;
    // Check if the profile being viewed is the logged-in user's own profile
    const isOwnProfile = viewedUserId === user.id;

    // State for active tab key
    const [key, setKey] = useState(isOwnProfile ? 'profile' : 'projects');

    // State for the data of the user whose profile is being viewed (if not the logged-in user)
    const [viewedUserData, setViewedUserData] = useState(null);
    // State for the professional profile details (applies to both own and viewed profiles)
    const [proProfileData, setProProfileData] = useState(null);
    // Loading state for fetching profile data
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Profile picture upload states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Effect to load the primary user data (either fetch for viewed user or use context for own profile)
    useEffect(() => {
        setLoadingProfile(true);
        if (!isOwnProfile) {
            // If viewing someone else's profile, fetch their user data
            const fetchViewedUserData = async () => {
                try {
                    const response = await axiosInstance.get(`/user/${viewedUserId}`);
                    setViewedUserData(response.data);
                } catch (error) {
                    toast.error("Error Fetching user data for viewed profile");
                    setViewedUserData(null); // Reset on error
                } finally {
                    setLoadingProfile(false);
                }
            };
            fetchViewedUserData();
        } else {
            // If viewing own profile, we use the 'user' object from context directly.
            setViewedUserData(null);
            setLoadingProfile(false);
        }
        // This effect runs when the viewedUserId changes, or when isOwnProfile status changes.
    }, [viewedUserId, isOwnProfile, navigate]);

    // Effect to load the professional profile data based on the relevant user's professionalProfileId
    useEffect(() => {
        // Determine whose profile data to fetch: the logged-in user or the viewed user
        const profileHolder = isOwnProfile ? user : viewedUserData;
        const profileId = profileHolder?.professionalProfileId;

        if (profileId) {
            // If a professionalProfileId exists, fetch the professional details
            const fetchProData = async () => {
                try {
                    const response = await axiosInstance.get(`/profile/${profileId}`);
                    setProProfileData(response.data);
                } catch (error) {
                    toast.error('Error fetching professional data!');
                    setProProfileData(null); // Reset on error
                }
            };
            fetchProData();
        } else {
            // If no professionalProfileId, reset the professional data state
            setProProfileData(null);
        }
        // This effect runs if the profile owner changes (isOwnProfile), or if the user/viewedUserData object updates.
    }, [isOwnProfile, user, viewedUserData]);

    // Determine which user object's data to display in the top card
    const displayUser = isOwnProfile ? user : viewedUserData;

    // Handle Chat button click - only relevant when viewing another professional's profile as a homeowner
    const handleChatClick = async () => {
        if (isOwnProfile || user.role !== 'homeowner') return;
        try {
            // Create or get existing chat room directly with API call
            const response = await axiosInstance.post(`/chat/${viewedUserId}`);
            const chatRoom = response.data.chatRoom;

            if (chatRoom) {
                // Navigate to chat page
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

    // Open the upload modal when the edit icon is clicked (only on own profile)
    const handleImageClick = () => {
        if (isOwnProfile) {
            setShowUploadModal(true);
        }
    };

    // Handle file selection for profile picture upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle the actual image upload process
    const handleUploadImage = async () => {
        if (!selectedImage) {
            toast.warning("Please select an image to upload");
            return;
        }
        setIsUploading(true);
        const formData = new FormData();
        formData.append('profilePic', selectedImage);

        try {
            // API call to update the user's profile picture (always uses logged-in user's ID)
            const response = await axiosInstance.put(`/user/${user.id}`, formData);
            const newProfilePicUrl = response.data.profilePictureUrl || response.data.user?.profilePictureUrl;

            if (newProfilePicUrl) {
                updateUser({ profilePictureUrl: newProfilePicUrl });
            }
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

    // Trigger the hidden file input when the 'Select Image' button is clicked
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // Show loading spinner while fetching data
    if (loadingProfile) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    // Handle cases where the necessary user data couldn't be loaded
    if (!displayUser) {
        return (
            <Container className="text-center my-5">
                <h4>Error loading profile or profile not found.</h4>
                <Button variant="primary" onClick={() => navigate('/')}>Go Home</Button>
            </Container>
        );
    }

    // Default profile picture URL if none is available
    const profilePicture = displayUser?.profilePictureUrl || 'https://via.placeholder.com/150?text=No+Image';

    return (
        <div className='padding-small' style={{ marginTop: "-20px"}}>
            <ToastContainer position="top-right" autoClose={3000} />
            <Container className="my-1">
                {/* Top Profile Card: Displays data from 'displayUser' and 'proProfileData' */}
                <Card className="mb-4" data-aos="slide-right">
                    <Card.Img
                        variant="top"
                        src={profileBg}
                        style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <Card.Body className="text-center d-flex flex-column align-items-center">
                        <div className="position-relative" style={{ marginTop: '-75px' }}>
                            <div className="position-relative d-inline-block">
                                <Image
                                    src={profilePicture} // Use determined profile picture
                                    roundedCircle
                                    className="border border-white border-5 bg-light"
                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
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
                                        onClick={handleImageClick} // Opens the upload modal
                                        title="Update Profile Picture"
                                    >
                                        <FaEdit color="white" size={18} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='d-flex justify-content-center align-items-center gap-2 mt-3 mb-1'>
                            <Card.Title className="mb-0">{displayUser?.name || "User Name"}</Card.Title>
                            <Card.Text className="text-muted mb-0">({displayUser?.role || "Role"})</Card.Text>
                        </div>
                        {/* Display Professional Bio */}
                        <Card.Text className='text-muted mb-3' style={{ maxWidth: "600px" }}>
                            {proProfileData?.bio || (isOwnProfile ? 'No bio added yet.' : '')}
                        </Card.Text>

                        <hr className="w-75" />

                        {/* Display Professional Details */}
                        <div className='mt-2 d-flex justify-content-around flex-wrap gap-3 w-100 px-md-5'>
                            <div className='text-center' style={{ minWidth: "150px" }}>
                                <h5>Skills</h5>
                                <p className="text-muted">{proProfileData?.skills?.join(', ') || 'N/A'}</p>
                            </div>
                            <div className='text-center' style={{ minWidth: "150px" }}>
                                <h5>Service Area</h5>
                                <p className="text-muted">{proProfileData?.serviceArea?.join(', ') || 'N/A'}</p>
                            </div>
                            <div className='text-center'>
                                <h5>Experience</h5>
                                <p className="text-muted">{proProfileData?.experienceYears ? `${proProfileData.experienceYears} years` : 'N/A'}</p>
                            </div>
                            <div className='d-flex flex-column align-items-center'>
                                <h5>Rating</h5>
                                <div>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} style={{ color: star <= (proProfileData?.averageRating || 0) ? '#ffc107' : '#e4e5e9', fontSize: '1.5rem' }}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Chat Button: Show only if homeowner is viewing another professional's profile */}
                        {user.role === 'homeowner' && !isOwnProfile && (
                            <div className="mt-3">
                                <div
                                    className='button cta-button'
                                    onClick={handleChatClick}
                                >
                                    Chat
                                </div>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* Bottom Tabbed Card */}
                <Card data-aos="slide-left">
                    <Card.Header>
                        <Tabs
                            id="profile-tabs"
                            activeKey={key}
                            onSelect={(k) => setKey(k)}
                            className="mb-0 d-flex justify-content-center"
                            fill
                        >
                            {/* Profile Tab: Only shown for own profile */}
                            {isOwnProfile && (
                                <Tab eventKey="profile" title="Edit Profile">
                                    {/* Content is rendered below based on 'key' */}
                                </Tab>
                            )}
                            {/* Projects Tab: Always shown */}
                            <Tab eventKey="projects" title="Projects">
                                {/* Content is rendered below based on 'key' */}
                            </Tab>
                            {/* Reviews Tab: Always shown */}
                            <Tab eventKey="reviews" title="Reviews">
                                {/* Content is rendered below based on 'key' */}
                            </Tab>
                        </Tabs>
                    </Card.Header>
                    <Card.Body>
                        {/* Render content based on active tab */}
                        {key === 'profile' && isOwnProfile && (
                            // Pass the fetched professional profile data to the child component
                            <ProfileChild proProfile={proProfileData} />
                        )}
                        {key === 'projects' && (
                            // Pass the ID of the profile being viewed (could be own or other)
                            <ProfileProjects proId={viewedUserId} isOwnProfile={isOwnProfile} />
                        )}
                        {key === 'reviews' && (
                            // Pass the ID of the profile being viewed
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
                                className="border border-secondary"
                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            />
                        ) : (
                            // Show the current user's picture from context as the default
                            <Image
                                src={user?.profilePictureUrl || 'https://via.placeholder.com/150?text=No+Image'}
                                roundedCircle
                                className="border border-secondary bg-light"
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
                                style={{ display: 'none' }} // Keep the input hidden
                            />
                            <Form.Text className="text-muted">
                                Recommended: Square image, max 5MB (JPEG, PNG, or WebP).
                            </Form.Text>
                        </div>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowUploadModal(false); setImagePreview(null); setSelectedImage(null); }}>
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
                            'Upload Image'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ProfessionalProfileLayer;