import React, { useState, useEffect, useRef } from 'react';
import { Card, Container, Image, Button, Tabs, Tab, Modal, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileChild from '../child/ProfileChild';
import ProfilePosts from '../child/ProfilePosts';
import profileBg from '../../images/profile-bg.png';
import axiosInstance from '../../axiosConfig';
import { FaEdit } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const HomeOwnerProfileLayer = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const viewedUserId = location.state?.viewedUserId || user.id;
  const isOwnProfile = viewedUserId === user.id;
  // State for active tab key
  const [key, setKey] = useState(isOwnProfile ? 'profile' : 'posts');

  // State for potentially viewed user's data (if not own profile)
  const [viewedUserData, setViewedUserData] = useState(null);
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
      fetchUserData(viewedUserId);
    } else {
      // If viewing own profile, we use the 'user' object from context directly.
      setViewedUserData(null);
      setLoadingProfile(false);
    }
    // This effect runs when the viewedUserId changes, or when isOwnProfile status changes.
  }, [viewedUserId, isOwnProfile]);

  // Separate fetch function for viewed user data
  const fetchUserData = async (userId) => {
    try {
      const response = await axiosInstance.get(`/user/${userId}`);
      setViewedUserData(response.data); // Set viewedUserData state
    } catch (error) {
      toast.error("Error Fetching user data for viewed profile");
      setViewedUserData(null); // Reset on error
      navigate('/'); // Optionally navigate away or show an error component
    } finally {
      setLoadingProfile(false); // Set loading to false here
    }
  }

  // Determine which user object's data to display in the top card
  const displayUser = isOwnProfile ? user : viewedUserData;


  // Handle Chat button click
  const handleChatClick = async () => {
    if (isOwnProfile || user.role !== 'professional') return;
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
          <Card.Body className="text-center d-flex flex-column align-items-center">
            <div className="position-relative" style={{ marginTop: '-75px' }}>
              <div className="position-relative d-inline-block">
                <Image
                  src={profilePicture}
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
                    onClick={handleImageClick}
                    title="Update Profile Picture"
                  >
                    <FaEdit color="white" size={18} />
                  </div>
                )}
              </div>
            </div>
            <div className='d-flex justify-content-center align-items-center gap-2 mt-3 mb-3'>
              <Card.Title className="mb-0">{displayUser?.name || "User Name"}</Card.Title>
              <Card.Text className="text-muted mb-0">({displayUser?.role || "Role"})</Card.Text>
            </div>
            <div>
              {user.role === 'professional' && !isOwnProfile && displayUser && (
                <span>
                  <div
                    className="me-2 button cta-button"
                    onClick={handleChatClick}
                  >
                    Chat
                  </div>
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
              className="mb-0 d-flex justify-content-center"
              fill
            >
              {isOwnProfile && (
                <Tab eventKey="profile" title="Edit Profile">
                  {/* Profile Tab Content */}
                </Tab>
              )}
              <Tab eventKey="posts" title="Posts">
                {/* Posts Tab Content */}
              </Tab>
            </Tabs>
          </Card.Header>
          <Card.Body>

            {key === 'profile' && isOwnProfile && (
              <ProfileChild />
            )}

            {key === 'posts' && (
              <ProfilePosts userId={viewedUserId} isOwnProfile={isOwnProfile} />
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
              <Image
                src={user?.profilePictureUrl}
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
                style={{ display: 'none' }}
              />
              <Form.Text className="text-muted">
                Recommended: Square image, max 5MB (JPEG, PNG, or WebP).
              </Form.Text>
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          {/* Added reset for preview/selection on cancel */}
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
              'Upload Image' // Changed button text
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HomeOwnerProfileLayer;