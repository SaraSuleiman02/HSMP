import React, { useState, useEffect } from 'react';
import { Card, Container, Image, Button, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import ProfileChild from '../child/ProfileChild';
import ProfilePosts from '../child/ProfilePosts';
import profileBg from '../../images/profile-bg.png';
import axiosInstance from '../../axiosConfig';

const HomeOwnerProfileLayer = () => {
  const { user } = useAuth();
  const location = useLocation();
  const viewedUserId = location.state?.viewedUserId || user.id;
  const isOwnProfile = viewedUserId === user.id;
  // State for active tab key
  const [key, setKey] = useState(isOwnProfile ? 'profile' : 'posts');
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    if (!isOwnProfile) {
      fetchUserData(viewedUserId);
    } else {
      setUserData(user);
    }
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const response = await axiosInstance.get(`/user/${userId}`);
      setUserData(response.data);
    } catch (error) {
      toast.error("Error Fetching user data");
    }
  }

  return (
    <div className='padding-small'>
      <Container className="my-1">
        {/* Top Profile Card */}
        <Card className="mb-4">
          <Card.Img
            variant="top"
            src={profileBg}
            style={{ height: '200px', objectFit: 'cover' }}
          />
          <Card.Body className="text-center">
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
            <div>
              {user.role === 'professional' && (
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
              {isOwnProfile && (
                <Tab eventKey="profile" title="Profile">
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
              <ProfilePosts userId={viewedUserId} />
            )}

          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default HomeOwnerProfileLayer;
