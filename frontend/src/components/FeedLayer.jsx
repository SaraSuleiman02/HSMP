import React, { useState, useEffect, useRef } from "react";
import { Card, Image, Form, Accordion, Badge, Modal, Button, Row, Col } from 'react-bootstrap';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import axiosInstance from "../axiosConfig";
import { FaRegCommentDots, FaFilter, FaUpload, FaTrash, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

const FeedLayer = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [visibleCount, setVisibleCount] = useState(3);
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [showAddPostModal, setShowAddPostModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    // New post form state
    const [newPost, setNewPost] = useState({
        title: "",
        description: "",
        category: "",
        address: {
            street: "",
            city: ""
        },
        budget: {
            min: "",
            max: "",
            type: "Fixed"
        },
        deadline: "",
        images: []
    });

    // Preview images
    const [previewImages, setPreviewImages] = useState([]);

    // Filter states
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedCities, setSelectedCities] = useState([]);

    const categories = [
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
        "Home Cleaning"
    ];

    const cities = [
        'Amman', 'Zarqa', 'Irbid', 'Karak', 'Tafilah', 'Madaba',
        'Aqaba', 'Ajloun', 'Ma\'an', 'Balqa', 'Jerash', 'Mafraq',
        'Russeifa', 'Salt', 'Wadi Musa'
    ];

    const statuses = ["Open", "Assigned", "In Progress", "Completed"];

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        filterPosts();
    }, [posts, selectedCategories, selectedStatuses, selectedCities]);

    const fetchPosts = async () => {
        try {
            const response = await axiosInstance.get('/project');

            // Sort posts from newest to oldest
            const sortedPosts = response.data.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            setPosts(sortedPosts);
        } catch (error) {
            toast.error("Error fetching posts!");
        }
    };

    const filterPosts = () => {
        let result = [...posts];

        // Filter by categories if any are selected
        if (selectedCategories.length > 0) {
            result = result.filter(post => selectedCategories.includes(post.category));
        }

        // Filter by statuses if any are selected
        if (selectedStatuses.length > 0) {
            result = result.filter(post => selectedStatuses.includes(post.status));
        }

        // Filter by cities if any are selected
        if (selectedCities.length > 0) {
            result = result.filter(post =>
                post.address && selectedCities.includes(post.address.city)
            );
        }

        setFilteredPosts(result);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleStatusChange = (status) => {
        setSelectedStatuses(prev => {
            if (prev.includes(status)) {
                return prev.filter(s => s !== status);
            } else {
                return [...prev, status];
            }
        });
    };

    const handleCityChange = (city) => {
        setSelectedCities(prev => {
            if (prev.includes(city)) {
                return prev.filter(c => c !== city);
            } else {
                return [...prev, city];
            }
        });
    };

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 3);
    };

    const handleAddNewPost = () => {
        setShowAddPostModal(true);
    };

    const handleCloseModal = () => {
        setShowAddPostModal(false);
        resetNewPostForm();
    };

    const resetNewPostForm = () => {
        setNewPost({
            title: "",
            description: "",
            category: "",
            address: {
                street: "",
                city: ""
            },
            budget: {
                min: "",
                max: "",
                type: "Fixed"
            },
            deadline: "",
            images: []
        });
        setPreviewImages([]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setNewPost(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setNewPost(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        // Create preview URLs for the selected images
        const newPreviewImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setPreviewImages(prev => [...prev, ...newPreviewImages]);
        setNewPost(prev => ({
            ...prev,
            images: [...prev.images, ...files]
        }));
    };

    const handleRemoveImage = (index) => {
        // Revoke the object URL to avoid memory leaks
        URL.revokeObjectURL(previewImages[index].preview);

        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setNewPost(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmitPost = async (e) => {
        e.preventDefault();

        // Validate form
        if (!newPost.title || !newPost.description || !newPost.category ||
            !newPost.address.city || !newPost.budget.min || !newPost.budget.max || !newPost.deadline) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            // Create FormData object for file upload
            const formData = new FormData();
            formData.append('title', newPost.title);
            formData.append('description', newPost.description);
            formData.append('category', newPost.category);
            formData.append('address[street]', newPost.address.street);
            formData.append('address[city]', newPost.address.city);
            formData.append('budget[min]', newPost.budget.min);
            formData.append('budget[max]', newPost.budget.max);
            formData.append('budget[type]', newPost.budget.type);
            formData.append('deadline', newPost.deadline);

            // Append each image file
            newPost.images.forEach(image => {
                formData.append('images', image);
            });

            // Submit the form
            await axiosInstance.post('/project', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Post created successfully!");
            handleCloseModal();

            // Re-fetch posts to update the feed
            await fetchPosts();

        } catch (error) {
            console.error("Error creating post:", error);
            toast.error(error.response?.data?.message || "Error creating post");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedStatuses([]);
        setSelectedCities([]);
    };

    const displayPosts = filteredPosts.slice(0, visibleCount);

    return (
        <div className="feed-big-container">
            <div className="feed-container padding-medium">
                <div className="d-flex flex-column flex-md-row">
                    {/* Filter Sidebar */}
                    <div className={`filter-sidebar ${showFilters ? 'show' : 'hide'}`}>
                        <div className="filter-header d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0"><FaFilter className="me-2" /> Filters</h5>
                            <button
                                className="btn btn-sm btn-outline-secondary d-md-none"
                                onClick={toggleFilters}
                            >
                                {showFilters ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        <Accordion defaultActiveKey={[]} alwaysOpen>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>Category</Accordion.Header>
                                <Accordion.Body>
                                    {categories.map((category, index) => (
                                        <Form.Check
                                            key={index}
                                            type="checkbox"
                                            id={`category-${index}`}
                                            label={category}
                                            checked={selectedCategories.includes(category)}
                                            onChange={() => handleCategoryChange(category)}
                                            className="mb-2"
                                        />
                                    ))}
                                </Accordion.Body>
                            </Accordion.Item>
                            <Accordion.Item eventKey="1">
                                <Accordion.Header>Status</Accordion.Header>
                                <Accordion.Body>
                                    {statuses.map((status, index) => (
                                        <Form.Check
                                            key={index}
                                            type="checkbox"
                                            id={`status-${index}`}
                                            label={status}
                                            checked={selectedStatuses.includes(status)}
                                            onChange={() => handleStatusChange(status)}
                                            className="mb-2"
                                        />
                                    ))}
                                </Accordion.Body>
                            </Accordion.Item>
                            <Accordion.Item eventKey="2">
                                <Accordion.Header>City</Accordion.Header>
                                <Accordion.Body>
                                    {cities.map((city, index) => (
                                        <Form.Check
                                            key={index}
                                            type="checkbox"
                                            id={`city-${index}`}
                                            label={city}
                                            checked={selectedCities.includes(city)}
                                            onChange={() => handleCityChange(city)}
                                            className="mb-2"
                                        />
                                    ))}
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>

                        <div className="mt-3">
                            <button
                                className="btn btn-sm btn-outline-danger w-100"
                                onClick={clearFilters}
                            >
                                Clear All Filters
                            </button>
                        </div>

                        <div className="filter-summary mt-3">
                            <p className="mb-1"><strong>Active Filters:</strong></p>
                            <div className="d-flex flex-wrap gap-1">
                                {selectedCategories.map((category, index) => (
                                    <Badge
                                        key={`cat-${index}`}
                                        bg="primary"
                                        className="filter-badge"
                                        onClick={() => handleCategoryChange(category)}
                                    >
                                        {category} ×
                                    </Badge>
                                ))}
                                {selectedStatuses.map((status, index) => (
                                    <Badge
                                        key={`stat-${index}`}
                                        bg="secondary"
                                        className="filter-badge"
                                        onClick={() => handleStatusChange(status)}
                                    >
                                        {status} ×
                                    </Badge>
                                ))}
                                {selectedCities.map((city, index) => (
                                    <Badge
                                        key={`city-${index}`}
                                        bg="info"
                                        className="filter-badge"
                                        onClick={() => handleCityChange(city)}
                                    >
                                        <FaMapMarkerAlt className="me-1" /> {city} ×
                                    </Badge>
                                ))}
                                {selectedCategories.length === 0 && selectedStatuses.length === 0 && selectedCities.length === 0 && (
                                    <span className="text-muted">None</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Filter Toggle */}
                    <div className="d-md-none filter-toggle-container mb-3">
                        <button
                            className="btn btn-outline-primary w-100"
                            onClick={toggleFilters}
                        >
                            <FaFilter className="me-2" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {/* Posts Container */}
                    <div className="posts-container">
                        <ToastContainer />
                        {user.role === "homeowner" && (
                            <div
                                className="button cta-button align-self-end mb-3"
                                onClick={handleAddNewPost}>
                                + Add New Post
                            </div>
                        )}

                        {displayPosts.length === 0 ? (
                            <div className="no-posts-message">
                                <p>No posts match your filter criteria.</p>
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                {displayPosts.map(post => (
                                    <Card key={post._id} className="mb-4 post-card">
                                        <Card.Body>
                                            <div className="row">
                                                {/* Project Details Column */}
                                                <div className="col-md-8">
                                                    <div className="d-flex gap-2 mb-3">
                                                        <Image
                                                            src={post.homeownerId?.profilePictureUrl || "https://via.placeholder.com/70"}
                                                            roundedCircle
                                                            alt={post.homeownerId?.name || "User"}
                                                            className="user-avatar"
                                                            onClick={() => navigate('/profile', { state: { viewedUserId: post.homeownerId?._id } })}
                                                        />
                                                        <div className="d-flex flex-column mt-2">
                                                            <h5 className="mb-0 user-name" onClick={() => navigate('/profile', { state: { viewedUserId: post.homeownerId?._id } })}>
                                                                {post.homeownerId?.name || "User"}
                                                            </h5>
                                                            <small>{post.createdAt ? formatDate(post.createdAt) : ""}</small>
                                                        </div>
                                                        <div className="ms-auto">
                                                            <Badge bg={
                                                                post.status === "Open" ? "success" :
                                                                    post.status === "Assigned" ? "primary" :
                                                                        post.status === "In Progress" ? "warning" :
                                                                            post.status === "Completed" ? "secondary" : "info"
                                                            }>
                                                                {post.status || "Open"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <h5 className="mb-2">{post.title}</h5>
                                                    <p><strong>Category:</strong> {post.category}</p>
                                                    <p><strong>Description:</strong> {post.description}</p>
                                                    <p><strong>Budget:</strong> {post.budget?.min} - {post.budget?.max} JD</p>
                                                    <p>
                                                        <strong>Location:</strong> {post.address?.city}
                                                        {post.address?.street && `, ${post.address.street}`}
                                                    </p>
                                                    <p><strong>Deadline:</strong> {post.deadline ? formatDate(post.deadline) : "Not specified"}</p>
                                                </div>

                                                {/* Carousel Column */}
                                                <div className="col-md-4 mb-3">
                                                    {post.images?.length > 0 ? (
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
                                                    ) : (
                                                        <p className="text-center text-muted">No images</p>
                                                    )}
                                                </div>
                                            </div>

                                            <hr />

                                            {/* Bids */}
                                            <div className="d-flex justify-content-around flex-wrap">
                                                {user.role === "professional" && post.status === "Open" && (
                                                    <small className="text-muted d-flex align-items-center gap-1 action-link" onClick={() => navigate('/post-details', { state: { postId: post._id } })}>
                                                        <FaRegCommentDots /> Bid
                                                    </small>
                                                )}
                                                <small className="text-muted action-link" onClick={() => navigate('/post-details', { state: { postId: post._id } })}>View Details</small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}

                                {filteredPosts.length > visibleCount && (
                                    <div className="text-center mt-3 mb-4">
                                        <div
                                            className="button cta-button"
                                            onClick={handleShowMore}
                                        >
                                            Show More
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Add New Post Modal */}
            <Modal
                show={showAddPostModal}
                onHide={handleCloseModal}
                size="lg"
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Create New Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmitPost}>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={newPost.title}
                                onChange={handleInputChange}
                                placeholder="Enter a title for your project"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                name="category"
                                value={newPost.category}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={newPost.description}
                                onChange={handleInputChange}
                                placeholder="Describe your project in detail"
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Street Address</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="address.street"
                                        value={newPost.address.street}
                                        onChange={handleInputChange}
                                        placeholder="Enter street address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Select
                                        name="address.city"
                                        value={newPost.address.city}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select a city</option>
                                        {cities.map((city, index) => (
                                            <option key={index} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Minimum Budget (JD)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="budget.min"
                                        value={newPost.budget.min}
                                        onChange={handleInputChange}
                                        placeholder="Min"
                                        min="0"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Maximum Budget (JD)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="budget.max"
                                        value={newPost.budget.max}
                                        onChange={handleInputChange}
                                        placeholder="Max"
                                        min="0"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Deadline</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type="date"
                                            name="deadline"
                                            value={newPost.deadline}
                                            onChange={handleInputChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                        <FaCalendarAlt className="calendar-icon" />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Images</Form.Label>
                            <div className="image-upload-container">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                />
                                <Button
                                    variant="outline-primary"
                                    onClick={() => fileInputRef.current.click()}
                                    className="upload-btn"
                                >
                                    <FaUpload className="me-2" /> Upload Images
                                </Button>

                                {previewImages.length > 0 && (
                                    <div className="image-previews mt-3">
                                        <Row>
                                            {previewImages.map((image, index) => (
                                                <Col key={index} xs={6} md={4} lg={3} className="mb-3">
                                                    <div className="preview-image-container">
                                                        <img
                                                            src={image.preview}
                                                            alt={`Preview ${index}`}
                                                            className="preview-image"
                                                        />
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            className="remove-image-btn"
                                                            onClick={() => handleRemoveImage(index)}
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                )}
                            </div>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmitPost}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Post'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FeedLayer;