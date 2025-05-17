import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import axiosInstance from "../../axiosConfig";
import { Card, Button, Image, Row, Col } from "react-bootstrap";
import "react-toastify/dist/ReactToastify.css";

const ProfileReviews = ({ proId }) => {
    const [reviews, setReviews] = useState([]);
    const [visibleCount, setVisibleCount] = useState(3);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await axiosInstance.get(`/review/professional/${proId}`);
            setReviews(response.data);
        } catch (error) {
            toast.error("Error Fetching Reviews");
        }
    };

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 3);
    };

    // Function to render star ratings
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(
                <span key={i} className="star-icon">
                    {i < rating ? "★" : "☆"}
                </span>
            );
        }
        return stars;
    };

    // Format date to a more readable format
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="reviews-container">
            <ToastContainer />
            {reviews.length === 0 ? (
                <p className="text-center text-muted">No reviews yet</p>
            ) : (
                <>
                    {reviews.slice(0, visibleCount).map(review => (
                        <div key={review._id} className="review-card-wrapper">
                            <Card className="review-card">
                                <div className="profile-image-container">
                                    <Image
                                        src={review.reviewerId.profilePictureUrl || "https://via.placeholder.com/50"}
                                        roundedCircle
                                        className="profile-image"
                                        alt={review.reviewerId.name}
                                    />
                                </div>
                                <Card.Body className="review-card-body">
                                    <div className="review-header">
                                        <h5 className="reviewer-name">{review.reviewerId.name}</h5>
                                        <div className="star-rating">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>
                                    <p className="review-comment">{review.comment}</p>
                                    <div className="review-footer">
                                        <small className="text-muted">
                                            Project: {review.projectId.title} • {formatDate(review.createdAt)}
                                        </small>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    ))}

                    {reviews.length > visibleCount && (
                        <div className="text-center mt-3 mb-4">
                            <Button
                                variant="outline-primary"
                                onClick={handleShowMore}
                            >
                                Show More Reviews
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProfileReviews;