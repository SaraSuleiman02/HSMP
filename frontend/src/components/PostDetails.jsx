import React, { useState, useEffect } from "react";
import { Card, Image, Button, Badge, Form, InputGroup, Modal } from 'react-bootstrap';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import axiosInstance from "../axiosConfig";
import { FaRegCommentDots, FaClock, FaMoneyBillWave, FaPaperPlane, FaEdit, FaTrash } from 'react-icons/fa';
import MasterLayout from "../masterLayout/MasterLayout";

const PostDetails = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const postId = location.state?.postId;

    const [bids, setBids] = useState([]);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [visibleBids, setVisibleBids] = useState(3); // Initially show 3 bids
    const [showBidForm, setShowBidForm] = useState(false);
    const [bidFormData, setBidFormData] = useState({
        proposal: '',
        amount: '',
        estimatedDuration: ''
    });
    const [submittingBid, setSubmittingBid] = useState(false);
    const [editingBidId, setEditingBidId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingBidId, setDeletingBidId] = useState(null);
    const [processingAction, setProcessingAction] = useState(false);
    const [assignedBidId, setAssignedBidId] = useState(null);

    // Function to fetch bids
    const fetchBids = async () => {
        try {
            const response = await axiosInstance.get(`/bid/project/${postId}`);
            setBids(response.data);
        } catch (error) {
            console.error("Error fetching bids:", error);
            toast.error("Error refreshing bids!");
        }
    };

    // Function to fetch post details
    const fetchPostDetails = async () => {
        try {
            const response = await axiosInstance.get(`/project/${postId}`);
            const postData = response.data;

            // Debug log to check post structure
            console.log("Post data from API:", postData);

            setPost(postData);

            // If post has an assigned professional, find the corresponding bid
            if (postData.assignedProfessionalId) {

                // Fetch the assigned bid if needed
                const bidsResponse = await axiosInstance.get(`/bid/project/${postId}`);
                const bidsData = bidsResponse.data;

                // Find the bid with the assigned professional
                const assignedBid = bidsData.find(bid =>
                    bid.professionalId &&
                    (bid.professionalId._id === postData.assignedProfessionalId ||
                        bid.professionalId === postData.assignedProfessionalId)
                );

                if (assignedBid) {
                    console.log("Found assigned bid:", assignedBid._id);
                    setAssignedBidId(assignedBid._id);
                }

                setBids(bidsData);
            }
        } catch (error) {
            console.error("Error fetching post details:", error);
            toast.error("Error fetching post details!");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                await fetchPostDetails();
                await fetchBids();
            } catch (error) {
                console.error("Error in initial data fetch:", error);
                toast.error("Error fetching data!");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [postId]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleShowMoreBids = () => {
        setVisibleBids(prevCount => prevCount + 3);
    };

    const handleHire = async (bidId, professionalId) => {
        try {
            await axiosInstance.put(`/project/hireProfessional/${postId}`, {
                bidId: bidId
            });

            // Set the assigned bid ID
            setAssignedBidId(bidId);

            // Update the post with the hired professional
            const updatedPost = { ...post, assignedProfessionalId: professionalId, status: "Assigned" };
            setPost(updatedPost);

            // Re-fetch post and bids to ensure we have the latest data
            await fetchPostDetails();
            await fetchBids();

            toast.success("Professional hired successfully!");
        } catch (error) {
            console.error("Error hiring professional:", error);
            toast.error("Error hiring professional!");
        }
    };

    const handleBidFormChange = (e) => {
        const { name, value } = e.target;
        setBidFormData({
            ...bidFormData,
            [name]: value
        });
    };

    const toggleBidForm = () => {
        setShowBidForm(!showBidForm);
        // Reset form data when toggling
        if (!showBidForm) {
            setBidFormData({
                proposal: '',
                amount: '',
                estimatedDuration: ''
            });
            setEditingBidId(null); // Clear any editing state
        }
    };

    const handleEditBid = (bid) => {
        // Set form data with bid values
        setBidFormData({
            proposal: bid.proposal,
            amount: bid.amount.toString(),
            estimatedDuration: bid.estimatedDuration
        });
        setEditingBidId(bid._id);
        setShowBidForm(true);

        // Scroll to the form
        setTimeout(() => {
            const formElement = document.querySelector('.bid-form-container');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleDeleteBid = (bidId) => {
        setDeletingBidId(bidId);
        setShowDeleteModal(true);
    };

    const confirmDeleteBid = async () => {
        if (!deletingBidId) return;

        setProcessingAction(true);
        try {
            await axiosInstance.delete(`/bid/${deletingBidId}`);

            // Re-fetch bids after deletion
            await fetchBids();

            toast.success("Bid deleted successfully!");
            setShowDeleteModal(false);
        } catch (error) {
            console.error("Error deleting bid:", error);
            toast.error(error.response?.data?.message || "Error deleting bid. Please try again.");
        } finally {
            setProcessingAction(false);
            setDeletingBidId(null);
        }
    };

    const handleSubmitBid = async (e) => {
        e.preventDefault();

        // Validate form data
        if (!bidFormData.proposal.trim()) {
            toast.error("Please enter a proposal");
            return;
        }

        if (!bidFormData.amount || isNaN(bidFormData.amount) || Number(bidFormData.amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (!bidFormData.estimatedDuration.trim()) {
            toast.error("Please enter an estimated duration");
            return;
        }

        setSubmittingBid(true);

        try {
            if (editingBidId) {
                // Update existing bid
                await axiosInstance.put(`/bid/${editingBidId}`, {
                    proposal: bidFormData.proposal,
                    amount: Number(bidFormData.amount),
                    estimatedDuration: bidFormData.estimatedDuration
                });

                // Re-fetch bids after update
                await fetchBids();

                toast.success("Bid updated successfully!");
            } else {
                // Create new bid
                await axiosInstance.post(`/bid/${postId}`, {
                    proposal: bidFormData.proposal,
                    amount: Number(bidFormData.amount),
                    estimatedDuration: bidFormData.estimatedDuration
                });

                // Re-fetch bids after creation
                await fetchBids();

                toast.success("Bid submitted successfully!");
            }

            // Hide the form and reset
            setShowBidForm(false);
            setBidFormData({
                proposal: '',
                amount: '',
                estimatedDuration: ''
            });
            setEditingBidId(null);
        } catch (error) {
            console.error("Error with bid:", error);
            toast.error(error.response?.data?.message || "Error processing bid. Please try again.");
        } finally {
            setSubmittingBid(false);
        }
    };

    // Helper function to check if a bid is from the assigned professional
    const isBidFromAssignedProfessional = (bid) => {
        if (!bid || !bid.professionalId) return false;

        // Check if this bid's professional matches the assigned professional
        const bidProfessionalId = typeof bid.professionalId === 'object' ? bid.professionalId._id : bid.professionalId;

        // Check against both post.assignedProfessionalId and assignedBidId
        const isAssigned = post.assignedProfessionalId &&
            (post.assignedProfessionalId === bidProfessionalId ||
                (typeof post.assignedProfessionalId === 'object' && post.assignedProfessionalId._id === bidProfessionalId));

        const isAssignedBid = bid._id === assignedBidId;

        return isAssigned || isAssignedBid;
    };

    if (loading || !post) {
        return (
            <div className="feed-container padding-medium d-flex justify-content-center align-items-center min-vh-100 bg-light">
                <ToastContainer />
                <div className="container bg-white p-4 rounded shadow text-center" style={{ maxWidth: '500px' }}>
                    <p className="text-muted" style={{ fontSize: "20px"}}>Loading post details...</p>
                </div>
            </div>
        );
    }

    return (
        <MasterLayout>
            <div className="post-details-container padding-medium d-flex flex-column align-items-center">
                <ToastContainer />
                <div className="container">
                    <div className="post-details-inner-container" data-aos="slide-right">
                        {/* Post Card */}
                        <Card key={post._id} className="mb-4 post-details-card facebook-style-card">
                            <Card.Body>
                                {/* Post Header with User Info */}
                                <div className="post-header d-flex align-items-center mb-3">
                                    <Image
                                        src={post.homeownerId?.profilePictureUrl || "https://via.placeholder.com/70"}
                                        roundedCircle
                                        alt={post.homeownerId?.name || "User"}
                                        className="post-avatar"
                                        onClick={() =>
                                            navigate('/profile', {
                                                state: { viewedUserId: post.homeownerId?._id }
                                            })
                                        }
                                    />
                                    <div className="post-user-info">
                                        <h5
                                            className="mb-0 user-name"
                                            onClick={() =>
                                                navigate('/profile', {
                                                    state: { viewedUserId: post.homeownerId?._id }
                                                })
                                            }
                                        >
                                            {post.homeownerId?.name || "User"}
                                        </h5>
                                        <small className="text-muted">{post.createdAt ? formatDate(post.createdAt) : ""}</small>
                                    </div>
                                    <div className="ms-auto">
                                        <Badge bg="primary">{post.status || "Open"}</Badge>
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="post-content mb-3">
                                    <h5 className="post-title">{post.title}</h5>
                                    <p className="post-description">{post.description}</p>

                                    <div className="post-details">
                                        <div className="detail-item">
                                            <strong className="post-title">Category:</strong> {post.category}
                                        </div>
                                        <div className="detail-item">
                                            <strong className="post-title">Budget:</strong> {post.budget ? `${post.budget.min} - ${post.budget.max} JD` : "N/A"}
                                        </div>
                                        <div className="detail-item">
                                            <strong className="post-title">Address:</strong> {post.address ? `${post.address.city}, ${post.address.country}` : "N/A"}
                                        </div>
                                        <div className="detail-item">
                                            <strong className="post-title">Deadline:</strong> {post.deadline ? formatDate(post.deadline) : "N/A"}
                                        </div>
                                    </div>
                                </div>

                                {/* Post Images */}
                                {post.images?.length > 0 && (
                                    <div className="post-images mb-3">
                                        <Carousel
                                            autoPlay
                                            infiniteLoop
                                            showThumbs={false}
                                            showStatus={false}
                                            interval={3000}
                                        >
                                            {post.images.map((img, index) => (
                                                <div key={index}>
                                                    <img
                                                        src={img}
                                                        alt={`Project ${index}`}
                                                        className="carousel-image"
                                                    />
                                                </div>
                                            ))}
                                        </Carousel>
                                    </div>
                                )}

                                {/* Post Status */}
                                <div className="post-stats d-flex justify-content-between align-items-center mb-3">
                                    <div className="bid-count">
                                        <small className="text-muted">{bids.length} Bids</small>
                                    </div>
                                    {user.role === "professional" && post.status === "Open" && !editingBidId && (
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="bid-button"
                                            onClick={toggleBidForm}
                                        >
                                            <FaRegCommentDots className="me-1" /> {showBidForm ? 'Cancel' : 'Place Bid'}
                                        </Button>
                                    )}
                                </div>

                                <hr className="comment-divider" />

                                {/* Bids as Comments Section */}
                                <div className="comments-section">
                                    <h6 className="comments-header mb-3">Bids</h6>

                                    {bids.length === 0 ? (
                                        <p className="text-center text-muted">No bids yet</p>
                                    ) : (
                                        <>
                                            {bids.slice(0, visibleBids).map((bid) => (
                                                <div key={bid._id} className="comment-item">
                                                    <div className="comment-avatar">
                                                        <Image
                                                            src={bid.professionalId?.profilePictureUrl || "https://via.placeholder.com/50"}
                                                            roundedCircle
                                                            alt={bid.professionalId?.name || "Professional"}
                                                            className="comment-user-avatar"
                                                            onClick={() => {
                                                                if (bid.professionalId?._id) {
                                                                    navigate('/professional-profile', {
                                                                        state: { viewedUserId: bid.professionalId._id }
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="comment-content">
                                                        <div className="comment-bubble">
                                                            <div className="comment-header">
                                                                <h6 className="comment-username mb-0" onClick={() => {
                                                                    if (bid.professionalId?._id) {
                                                                        navigate('/professional-profile', {
                                                                            state: { viewedUserId: bid.professionalId._id }
                                                                        });
                                                                    }
                                                                }}
                                                                    style={{ cursor: "pointer" }}>{bid.professionalId?.name || "Professional"}</h6>
                                                                <small className="text-muted">{formatDate(bid.createdAt)}</small>
                                                            </div>
                                                            <p className="comment-text mb-2">{bid.proposal}</p>
                                                            <div className="d-flex justify-content-between flex-wrap">
                                                                <div className="bid-details">
                                                                    <span className="bid-detail">
                                                                        <FaMoneyBillWave className="bid-icon" /> {bid.amount} JD
                                                                    </span>
                                                                    <span className="bid-detail">
                                                                        <FaClock className="bid-icon" /> {bid.estimatedDuration}
                                                                    </span>
                                                                </div>

                                                                {user.id === bid.professionalId?._id && post.status === "Open" && (
                                                                    <div className="bid-actions">
                                                                        <Button
                                                                            variant="link"
                                                                            className="bid-action-btn edit-btn"
                                                                            onClick={() => handleEditBid(bid)}
                                                                            disabled={editingBidId === bid._id}
                                                                        >
                                                                            <FaEdit /> Edit
                                                                        </Button>
                                                                        <Button
                                                                            variant="link"
                                                                            className="bid-action-btn delete-btn"
                                                                            onClick={() => handleDeleteBid(bid._id)}
                                                                        >
                                                                            <FaTrash /> Delete
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Hire Button - Only show if user is homeowner, post is not assigned, and this bid is not hired */}
                                                        {user.role === "homeowner" &&
                                                            user.id === post.homeownerId?._id &&
                                                            post.status !== "Accepted" &&
                                                            !post.assignedProfessionalId &&
                                                            !assignedBidId &&
                                                            bid.professionalId?._id && (
                                                                <div className="hire-button-container">
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size="sm"
                                                                        className="hire-button"
                                                                        onClick={() => handleHire(bid._id, bid.professionalId._id)}
                                                                    >
                                                                        Hire
                                                                    </Button>
                                                                </div>
                                                            )}

                                                        {/* Show "Hired" badge if this professional is hired - visible to all users */}
                                                        {isBidFromAssignedProfessional(bid) && (
                                                            <div className="hired-badge">
                                                                <Badge bg="success">Hired</Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Show More Button */}
                                            {bids.length > visibleBids && (
                                                <div className="text-center mt-3">
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={handleShowMoreBids}
                                                        className="show-more-button"
                                                    >
                                                        Show More Bids
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Bid Form for Professionals */}
                                {showBidForm && user.role === "professional" && (post.status === "Open" || editingBidId) && (
                                    <div className="bid-form-container mb-4">
                                        <hr />
                                        <Form onSubmit={handleSubmitBid}>
                                            <h6 className="mb-3">{editingBidId ? 'Edit Your Bid' : 'Place a Bid'}</h6>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Your Proposal</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    placeholder="Describe your proposal..."
                                                    name="proposal"
                                                    value={bidFormData.proposal}
                                                    onChange={handleBidFormChange}
                                                    required
                                                />
                                            </Form.Group>

                                            <div className="row">
                                                <div className="col-md-6">
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Amount (JD)</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                type="number"
                                                                placeholder="Enter amount"
                                                                name="amount"
                                                                value={bidFormData.amount}
                                                                onChange={handleBidFormChange}
                                                                min="1"
                                                                required
                                                            />
                                                            <InputGroup.Text>JD</InputGroup.Text>
                                                        </InputGroup>
                                                    </Form.Group>
                                                </div>
                                                <div className="col-md-6">
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Estimated Duration</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="e.g., 2 hours, 3 days"
                                                            name="estimatedDuration"
                                                            value={bidFormData.estimatedDuration}
                                                            onChange={handleBidFormChange}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-end">
                                                <Button
                                                    variant="secondary"
                                                    className="me-2"
                                                    onClick={toggleBidForm}
                                                    disabled={submittingBid}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    type="submit"
                                                    disabled={submittingBid}
                                                >
                                                    {submittingBid ? 'Processing...' : editingBidId ? 'Update Bid' : 'Submit Bid'}
                                                    <FaPaperPlane className="ms-1" />
                                                </Button>
                                            </div>
                                        </Form>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this bid? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={processingAction}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDeleteBid} disabled={processingAction}>
                        {processingAction ? 'Deleting...' : 'Delete Bid'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </MasterLayout>
    );
};

export default PostDetails;