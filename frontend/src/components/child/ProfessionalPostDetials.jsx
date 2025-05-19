import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge, Carousel, Card, Spinner } from 'react-bootstrap';
import axiosInstance from '../../axiosConfig';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, FaTools, FaUser, FaClock, FaUpload, FaCheck, FaPlay, FaStop, FaTrash } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const ProfessionalPostDetials = ({ show, handleClose, project: initialProject, onProjectDeleted }) => {
    const { user } = useAuth();
    const [project, setProject] = useState(initialProject);
    const [photoAfter, setPhotoAfter] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [bid, setBid] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const isOwnProfile = project?.assignedProfessionalId?._id === user?.id;
    const isHomeownerOwnPost = user?.role === "homeowner" && project?.homeownerId?._id === user?.id;
    const canStartProject = isOwnProfile && project?.status === "Assigned" && !project?.startTime;
    const canEndProject = isOwnProfile && project?.status === "In Progress" && !project?.endTime;
    const canUploadAfterImage = isOwnProfile && (project?.status === "In Progress" || project?.status === "Completed") && !project?.photoAfter;

    // Reset state when modal closes
    useEffect(() => {
        if (!show) {
            setPhotoAfter(null);
            setPhotoPreview(null);
        }
    }, [show]);

    // Fetch project and bid data when modal opens
    useEffect(() => {
        if (show && project?._id) {
            fetchProject();
        }
    }, [show, project?._id]);

    // Fetch bid when project data is updated
    useEffect(() => {
        if (show && project?.bidId) {
            fetchBid();
        }
    }, [show, project?.bidId]);

    const fetchProject = async () => {
        try {
            const response = await axiosInstance.get(`/project/${project._id}`);
            setProject(response.data);
        } catch (error) {
            console.error("Error fetching project:", error);
            toast.error("Error fetching project details");
        }
    };

    const fetchBid = async () => {
        try {
            const response = await axiosInstance.get(`/bid/${project.bidId}`);
            setBid(response.data);
        } catch (error) {
            console.error("Error fetching bid:", error);
            toast.error("Error fetching bid details");
        }
    };

    const startProject = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.put(`/project/start/${project._id}`);
            toast.success("Project started successfully");
            await fetchProject(); // Re-fetch project after action
        } catch (error) {
            console.error("Error starting project:", error);
            toast.error(error.response?.data?.message || "Failed to start project");
        } finally {
            setLoading(false);
        }
    };

    const uploadAfterImage = async () => {
        if (!photoAfter) {
            toast.warning("Please select an image to upload");
            return;
        }

        setUploadLoading(true);

        const formData = new FormData();
        formData.append('photoAfter', photoAfter);

        try {
            console.log("Uploading after photo for project:", project._id);
            const response = await axiosInstance.put(`/project/photo-after/${project._id}`, formData);
            toast.success("After photo uploaded successfully");
            setPhotoAfter(null);
            setPhotoPreview(null);
            await fetchProject(); // Refresh project
        } catch (error) {
            console.error("Error response:", error.response);
            toast.error(error.response?.data?.message || "Failed to upload after photo");
        } finally {
            setUploadLoading(false);
        }
    };

    const endProject = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.put(`/project/end/${project._id}`);
            toast.success("Project completed successfully");
            await fetchProject(); // Re-fetch project after action
        } catch (error) {
            console.error("Error completing project:", error);
            toast.error(error.response?.data?.message || "Failed to complete project");
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteProject = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this deletion!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteProject();
            }
        });
    };

    const deleteProject = async () => {
        setDeleteLoading(true);
        try {
            await axiosInstance.delete(`/project/${project._id}`);

            Swal.fire(
                'Deleted!',
                'Your project has been deleted.',
                'success'
            );

            if (onProjectDeleted) {
                onProjectDeleted(project._id);
            }
            handleClose();
        } catch (error) {
            console.error("Error deleting project:", error);
            Swal.fire(
                'Error!',
                error.response?.data?.message || "Failed to delete project",
                'error'
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.warning("Image size should be less than 5MB");
                return;
            }

            setPhotoAfter(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateDuration = () => {
        if (!project?.startTime || !project?.endTime) return "Not completed";

        const start = new Date(project.startTime);
        const end = new Date(project.endTime);
        const durationMs = end - start;

        // Convert to days, hours, minutes
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        let durationText = "";
        if (days > 0) durationText += `${days} day${days > 1 ? 's' : ''} `;
        if (hours > 0) durationText += `${hours} hour${hours > 1 ? 's' : ''} `;
        if (minutes > 0) durationText += `${minutes} minute${minutes > 1 ? 's' : ''}`;

        return durationText || "Less than a minute";
    };

    const getBadgeColor = (status) => {
        switch (status) {
            case "Open":
                return "secondary";
            case "Assigned":
                return "warning";
            case "In Progress":
                return "info";
            case "Completed":
                return "success";
            default:
                return "dark";
        }
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Project Details
                        {project?.status && (
                            <Badge bg={getBadgeColor(project.status)} className="ms-2">
                                {project.status}
                            </Badge>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Section 1: Project Details */}
                    <Card className="mb-3">
                        <Card.Header className="bg-blue text-white">
                            <h5 className="mb-0 text-white">Project Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <h4>{project?.title}</h4>
                                    <p>{project?.description}</p>

                                    <div className="d-flex align-items-center mb-2 fs-6">
                                        <FaTools className="me-2 text-primary" />
                                        <span><strong>Category:</strong> {project?.category}</span>
                                    </div>

                                    <div className="d-flex align-items-center mb-2 fs-6">
                                        <FaMoneyBillWave className="me-2 text-success" />
                                        <span><strong>Budget:</strong> {project?.budget?.min} - {project?.budget?.max} JD</span>
                                    </div>

                                    <div className="d-flex align-items-center mb-2 fs-6">
                                        <FaCalendarAlt className="me-2 text-danger" />
                                        <span><strong>Deadline:</strong> {formatDate(project?.deadline)}</span>
                                    </div>

                                    <div className="d-flex align-items-center mb-2 fs-6">
                                        <FaMapMarkerAlt className="me-2 text-info" />
                                        <span><strong>Location:</strong> {project?.address?.street}, {project?.address?.city}</span>
                                    </div>

                                    <div className="d-flex align-items-center mb-2 fs-6">
                                        <FaUser className="me-2 text-secondary" />
                                        <span><strong>Homeowner:</strong> {project?.homeownerId?.name}</span>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    {project?.images && project.images.length > 0 ? (
                                        <div className="project-images-carousel">
                                            <Carousel
                                                interval={5000}
                                                controls={true}
                                                indicators={true}
                                            >
                                                {project.images.map((img, index) => (
                                                    <Carousel.Item key={index}>
                                                        <img
                                                            src={img}
                                                            alt={`Project ${index + 1}`}
                                                            style={{ height: "250px", objectFit: "cover" }}
                                                            className="w-100 rounded"
                                                        />
                                                    </Carousel.Item>
                                                ))}
                                            </Carousel>
                                        </div>
                                    ) : (
                                        <div className="text-center p-5 bg-light rounded">
                                            <p className="mb-0">No images available</p>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Section 2: Bid Details (if exists) */}
                    {bid && (
                        <Card className="mb-3">
                            <Card.Header className="bg-orange text-white">
                                <h5 className="mb-0 text-white">Bid Details</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={12}>
                                        <div className="d-flex align-items-center mb-2 fs-6">
                                            <FaMoneyBillWave className="me-2 text-success" />
                                            <span><strong>Bid Amount:</strong> {bid.amount} JD</span>
                                        </div>

                                        <div className="d-flex align-items-center mb-2 fs-6">
                                            <FaClock className="me-2 text-warning" />
                                            <span><strong>Estimated Duration:</strong> {bid.estimatedDuration}</span>
                                        </div>

                                        <div className="mb-3">
                                            <strong>Proposal:</strong>
                                            <p className="mt-1">{bid.proposal}</p>
                                        </div>

                                        <div className="d-flex align-items-center fs-6">
                                            <FaCalendarAlt className="me-2 text-secondary" />
                                            <span><strong>Submitted:</strong> {formatDate(bid.createdAt)}</span>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Section 3: Project Duration and After Photos (if applicable) */}
                    {(project?.startTime || project?.photoAfter) && (
                        <Card className="mb-3">
                            <Card.Header className="bg-success">
                                <h5 className="mb-0 text-white">Project Progress</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    {project?.startTime && (
                                        <Col md={project?.photoAfter ? 6 : 12}>
                                            <div className="d-flex align-items-center mb-2 fs-6">
                                                <FaPlay className="me-2 text-success" />
                                                <span><strong>Started:</strong> {formatDate(project.startTime)}</span>
                                            </div>

                                            {project?.endTime && (
                                                <>
                                                    <div className="d-flex align-items-center mb-2 fs-6">
                                                        <FaStop className="me-2 text-danger" />
                                                        <span><strong>Completed:</strong> {formatDate(project.endTime)}</span>
                                                    </div>

                                                    <div className="d-flex align-items-center mb-2 fs-6">
                                                        <FaClock className="me-2 text-primary" />
                                                        <span><strong>Duration:</strong> {calculateDuration()}</span>
                                                    </div>
                                                </>
                                            )}
                                        </Col>
                                    )}

                                    {project?.photoAfter && (
                                        <Col md={project?.startTime ? 6 : 12}>
                                            <h6 className="mb-2">After Completion</h6>
                                            <img
                                                src={project.photoAfter}
                                                alt="After completion"
                                                className="img-fluid rounded"
                                                style={{ maxHeight: "200px", objectFit: "cover" }}
                                            />
                                        </Col>
                                    )}
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Professional Actions Section (conditionally rendered) */}
                    {isOwnProfile && (
                        <Card>
                            <Card.Header className="bg-gradient">
                                <h5 className="mb-0 text-white">Professional Actions</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    {/* Start Project Button */}
                                    {canStartProject && (
                                        <Col md={12} className="mb-3">
                                            <Button
                                                variant="success"
                                                onClick={startProject}
                                                disabled={loading}
                                                className="w-100"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                        Starting Project...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaPlay className="me-2" /> Start Project
                                                    </>
                                                )}
                                            </Button>
                                        </Col>
                                    )}

                                    {/* Upload After Image */}
                                    {canUploadAfterImage && (
                                        <Col md={12} className="mb-3">
                                            <Form.Group>
                                                <Form.Label><strong>Upload After Completion Photo</strong></Form.Label>
                                                <div className="d-flex">
                                                    <Form.Control
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handlePhotoChange}
                                                        disabled={uploadLoading}
                                                        className="me-2"
                                                    />
                                                    <Button
                                                        variant="primary"
                                                        onClick={uploadAfterImage}
                                                        disabled={!photoAfter || uploadLoading}
                                                    >
                                                        {uploadLoading ? (
                                                            <Spinner as="span" animation="border" size="sm" />
                                                        ) : (
                                                            <FaUpload />
                                                        )}
                                                    </Button>
                                                </div>

                                                {photoPreview && (
                                                    <div className="mt-2">
                                                        <p className="mb-1">Preview:</p>
                                                        <img
                                                            src={photoPreview}
                                                            alt="Preview"
                                                            className="img-thumbnail"
                                                            style={{ maxHeight: "150px" }}
                                                        />
                                                    </div>
                                                )}
                                            </Form.Group>
                                        </Col>
                                    )}

                                    {/* End Project Button */}
                                    {canEndProject && (
                                        <Col md={12}>
                                            <Button
                                                variant="danger"
                                                onClick={endProject}
                                                disabled={loading}
                                                className="w-100"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                                                        Completing Project...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCheck className="me-2" /> Complete Project
                                                    </>
                                                )}
                                            </Button>
                                        </Col>
                                    )}

                                    {/* No Actions Available Message */}
                                    {!canStartProject && !canEndProject && !canUploadAfterImage && (
                                        <Col md={12}>
                                            <div className="text-center p-3 bg-light rounded">
                                                <p className="mb-0">No actions available for this project at its current stage.</p>
                                            </div>
                                        </Col>
                                    )}
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    {isHomeownerOwnPost && (
                        <Button
                            variant="danger"
                            onClick={confirmDeleteProject}
                            disabled={deleteLoading}
                        >
                            <FaTrash className="me-2" /> Delete Project
                        </Button>
                    )}
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ProfessionalPostDetials;