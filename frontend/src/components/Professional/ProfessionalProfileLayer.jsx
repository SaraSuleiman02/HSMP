import React, { useState, useEffect } from 'react';
import { Card, Container, Image, Button, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import ProfileChild from '../child/ProfileChild';
import ProfileReviews from '../child/ProfileReviews.jsx';
import ProfileProjects from '../child/ProfileProjects';
import profileBg from '../../images/profile-bg.png';
import axiosInstance from '../../axiosConfig';

const ProfessionalProfileLayer = () => {
    const { user } = useAuth();
    const location = useLocation();
    const viewedUserId = location.state?.viewedUserId || user.id;
    const isOwnProfile = viewedUserId === user.id;
    // State for active tab key
    const [key, setKey] = useState(isOwnProfile ? 'profile' : 'projects');
    const [userData, setUserData] = useState([]);
    const [proProfileData, setProProfileData] = useState([]);

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

    return (
        <div className='padding-small'>
            <Container className="my-5">
                {/* Top Profile Card */}
                <Card className="mb-4">
                    <Card.Img
                        variant="top"
                        src={profileBg}
                        style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <Card.Body className="text-center d-flex flex-column">
                        <div className="position-relative" style={{ marginTop: '-75px' }}>
                            <Image
                                src={userData.profilePictureUrl}
                                roundedCircle
                                className="border border-white border-5"
                                style={{ width: '150px', height: '150px', objectFit: 'cover', backgroundColor: '#f8f9fa' }}
                            />
                        </div>
                        <div className='d-flex justify-content-center gap-2'>
                            <Card.Title className="mt-3 mb-3">{userData.name || "User"}</Card.Title>
                            <Card.Text className="text-muted mt-3">({userData.role || ""})</Card.Text>
                        </div>
                        <Card.Text className='align-self-center' style={{maxWidth: "500px"}}>{proProfileData.bio}</Card.Text>

                        <hr />

                        <div className='mt-3 d-flex justify-content-around flex-wrap'>
                            <div className='d-felx felx-column' style={{ maxWidth: "200px"}}>
                                <h5>Skills</h5>
                                <p>{proProfileData.skills?.join(', ')}</p>
                            </div>
                            <div className='d-felx felx-column' style={{ maxWidth: "200px"}}>
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
                                    <Button variant="primary" className="me-2">Chat</Button>
                                </span>
                            )}
                        </div>
                    </Card.Body>
                </Card>

                {/* Bottom Tabbed Card */}
                <Card>
                    <Card.Header>
                        <Tabs
                            id="profile-tabs"
                            activeKey={key}
                            onSelect={(k) => setKey(k)}
                            className=" d-flex justify-content-center"
                        >
                            <Tab eventKey="profile" title="Profile">
                                {/* Profile Tab Content */}
                            </Tab>
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
        </div>
    );
};

export default ProfessionalProfileLayer;
