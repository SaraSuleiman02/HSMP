import React, { useState, useEffect } from 'react';
import { Modal, Table } from 'react-bootstrap';
import axiosInstance from '../../axiosConfig';
import { toast } from 'react-toastify';

const ProjectBidsModal = ({ show, projectId, onClose }) => {
    const [projectBids, setProjectBids] = useState([]);

    useEffect(() => {
        if (show && projectId) {
            fetchProjectBids();
        }
    }, [show, projectId]);

    const fetchProjectBids = async () => {
        try {
            const res = await axiosInstance.get(`/bid/project/${projectId}`);
            setProjectBids(res.data);
        } catch (error) {
            console.error('Error fetching Project Bids:', error);
            toast.error('Failed to fetch Project Bids');
        }
    };

    return (
        <Modal show={show} onHide={onClose} size="lg" scrollable centered>
            <Modal.Header closeButton>
                <Modal.Title>Project Bids</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {Array.isArray(projectBids) && projectBids.length > 0 && (
                    <>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Professional</th>
                                    <th>Amount</th>
                                    <th>Proposal</th>
                                    <th>Estimated Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectBids.map((bid) => (
                                    <tr key={bid._id}>
                                        <td>{bid.professionalId?.name || '—'}</td>
                                        <td>{bid.amount} JD</td>
                                        <td>{bid.proposal}</td>
                                        <td>{bid.estimatedDuration}</td>
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

export default ProjectBidsModal;