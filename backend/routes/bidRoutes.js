import express from 'express';
import {
    createBid,
    getAllBidsGroupedByProject,
    getBidsByProjectId,
    updateBidById,
    deleteBidById
} from '../controllers/bidController.js';
import verifyToken from '../middlewares/verifyToken.js';
import authorizePosition from '../middlewares/authorizePosition.js';

const router = express.Router();

router.post('/:projectId', verifyToken, authorizePosition('professional'), createBid); // Create new Bid
router.get('/', verifyToken, getAllBidsGroupedByProject);
router.get('/project/:projectId', verifyToken, getBidsByProjectId); // Get all Bids by Project ID
router.put('/:bidId', verifyToken, authorizePosition('professional'), updateBidById); // Update a Bid by ID
router.delete('/:bidId', verifyToken, authorizePosition('professional', 'admin'), deleteBidById); // Delete a Bid by ID

export default router;