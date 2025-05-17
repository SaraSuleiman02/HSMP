import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import axiosInstance from "../../axiosConfig";
import { Card, Button } from "react-bootstrap";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

const ProfileProjects = ({ proId }) => {
    const [posts, setPosts] = useState([]);
    const [visibleCount, setVisibleCount] = useState(3);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await axiosInstance.get(`/project/professional/${proId}`);
            setPosts(response.data.projects.reverse()); // reverse to show latest first
        } catch (error) {
            toast.error("Error Fetching Posts");
        }
    };

    const getBadgeColor = (status) => {
        switch (status) {
            case "Open":
                return "bg-secondary";
            case "Assigned":
                return "bg-warning text-dark";
            case "In Progress":
                return "bg-info text-dark";
            case "Completed":
                return "bg-success";
            default:
                return "bg-dark";
        }
    };

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 3);
    };

    return (
        <div>
            <ToastContainer />
            <h4 className="mb-3">HSMP Clients projects</h4>
            {posts.slice(0, visibleCount).map(post => (
                <Card key={post._id} className="mb-3">
                    <Card.Body>
                        <div className="d-flex flex-wrap">
                            {/* First Column: Carousel */}
                            <div className="w-25 me-3">
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
                                                    className="img-fluid rounded"
                                                    style={{ maxHeight: "200px", objectFit: "cover" }}
                                                />
                                            </div>
                                        ))}
                                    </Carousel>
                                ) : (
                                    <p>No images</p>
                                )}
                            </div>

                            {/* Second Column: Project Details */}
                            <div className="flex-grow-1">
                                <h5>{post.title}</h5>
                                <p>{post.description}</p>
                                <p><strong>Category:</strong> {post.category}</p>
                                <p><strong>Budget:</strong> {post.budget.min} - {post.budget.max} JD</p>
                                <p><strong>Home Owner:</strong> {post.homeownerId?.name || "Unassigned"}</p>
                            </div>

                            {/* Third Column: Status Badge */}
                            <div className="ms-3 d-flex align-items-start">
                                <span className={`badge ${getBadgeColor(post.status)} fs-6`}>
                                    {post.status}
                                </span>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            ))}

            {visibleCount < posts.length && (
                <div className="text-center">
                    <Button onClick={handleShowMore} variant="outline-primary">
                        Show More
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ProfileProjects;