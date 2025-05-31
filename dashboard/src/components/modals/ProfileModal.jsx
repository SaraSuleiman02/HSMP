import React, { useState, useEffect } from 'react';
import { Modal, Table } from 'react-bootstrap';
import axiosInstance from '../../axiosConfig';
import { toast } from 'react-toastify';

const ProfileModal = ({ show, profileId, onClose }) => {
    const [profile, setProfile] = useState({});

    useEffect(() => {
        if (show && profileId) {
            fetchProfile();
        }
    }, [show, profileId]);

    const fetchProfile = async () => {
        try {
            const res = await axiosInstance.get(`/profile/${profileId._id}`);
            setProfile(res.data);
        } catch (error) {
            console.error('Error fetching Professionals Profile:', error);
            toast.error('Failed to fetch Professionals Profile');
        }
    };

    return (
        <Modal show={show} onHide={onClose} size="lg" scrollable centered>
            <Modal.Header closeButton>
                <Modal.Title>Profile Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p><strong>Bio:</strong> {profile.bio}</p>
                <p><strong>Skills:</strong> {Array.isArray(profile.skills) ? profile.skills.join(', ') : ''}</p>
                <p><strong>Experience Years:</strong> {profile.experienceYears} years</p>
                <p><strong>Service Area:</strong> {Array.isArray(profile.serviceArea) ? profile.serviceArea.join(', ') : ''}</p>
                <p><strong>Average Rating:</strong> {profile.averageRating}</p>

                {Array.isArray(profile.portfolio) && profile.portfolio.length > 0 && (
                    <>
                        <h5 className="mt-4">Portfolio</h5>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Image</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profile.portfolio.map((item) => (
                                    <tr key={item._id}>
                                        <td>{item.title}</td>
                                        <td>{item.description}</td>
                                        <td>
                                            <img src={item.imageUrl} alt={item.title} width="100" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default ProfileModal;