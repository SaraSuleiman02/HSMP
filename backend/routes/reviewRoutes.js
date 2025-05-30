import express from 'express';
import {
    createReview,
    getAllReviews,
    getReviewByProjectId,
    getProfessionalReviews,
    deleteReview
} from '../controllers/reviewController.js';
import verifyToken from '../middlewares/verifyToken.js';
import authorizePosition from '../middlewares/authorizePosition.js';

const router = express.Router();

router.post('/:projectId', verifyToken, authorizePosition('homeowner'), createReview); // Create a new Review
router.get('/', verifyToken, authorizePosition('admin'), getAllReviews); // Get All Reviews
router.get('/project/:projectId', verifyToken, getReviewByProjectId); // Get a Review by Project ID
router.get('/professional/:id', verifyToken, getProfessionalReviews); // Get all Professional Reviews
router.delete('/:reviewId', verifyToken, authorizePosition('homeowner', 'admin'), deleteReview); // Delete Review by ID

export default router;