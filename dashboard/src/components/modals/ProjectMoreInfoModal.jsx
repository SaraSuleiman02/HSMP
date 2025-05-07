import React from 'react';
import { Modal, Carousel } from 'react-bootstrap';

const ProjectMoreInfoModal = ({ show, project, onClose }) => {
    return (
        <>
            <style>
                {`
          .carousel-control-prev-icon,
          .carousel-control-next-icon {
            background-image: none;
          }

          .carousel-control-prev::after,
          .carousel-control-next::after {
            content: '';
            color: black;
            font-size: 2rem;
            font-weight: bold;
          }

          .carousel-control-prev::after {
            content: '‹';
          }

          .carousel-control-next::after {
            content: '›';
          }

          .carousel-item img {
            max-height: 400px;
            object-fit: contain;
            width: 100%;
          }
        `}
            </style>

            <Modal show={show} onHide={onClose} size="lg" scrollable centered>
                <Modal.Header closeButton>
                    <Modal.Title>Project Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p><strong>Title:</strong> {project.title}</p>
                    <p><strong>Description:</strong> {project.description}</p>
                    <p><strong>Budget:</strong> {project.budget.min} - {project.budget.max}</p>
                    <p><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
                    <p><strong>Assigned Professional:</strong> {project.assignedProfessionalId?.name || '—'}</p>

                    <h5 className="mt-4">Images</h5>
                    {Array.isArray(project.images) && project.images.length > 0 ? (
                        project.images.length === 1 ? (
                            <img
                                src={project.images[0]}
                                alt="Project"
                                className="img-fluid"
                                style={{ maxHeight: '400px', objectFit: 'contain', width: '100%' }}
                            />
                        ) : (
                            <Carousel>
                                {project.images.map((image, index) => (
                                    <Carousel.Item key={index}>
                                        <img
                                            src={image}
                                            alt={`Project image ${index + 1}`}
                                            className="d-block w-100"
                                        />
                                    </Carousel.Item>
                                ))}
                            </Carousel>
                        )
                    ) : (
                        <p>No Images uploaded</p>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default ProjectMoreInfoModal;