import express from 'express';
import {
    addProfile,
    getProfile,
    updatePortfolioItem,
    deletePortfolioItem,
    updateProfile
} from '../controllers/professionalProfileController.js';
import upload from '../middlewares/photoUpload.js';
import verifyToken from '../middlewares/verifyToken.js';
import authorizePosition from '../middlewares/authorizePosition.js';


const router = express.Router();

router.post('/',verifyToken, authorizePosition('professional'), upload.array("portfolioImages"), addProfile); // Add a Professional Profile
router.get('/:id', verifyToken, getProfile); // Get a Profile by ID
router.put('/portfolio/:profileId/:itemId', verifyToken, authorizePosition('professional'), upload.single('image'), updatePortfolioItem); // Update a Profile item by ID
router.delete('/portfolio/:profileId/:itemId', verifyToken, authorizePosition('professional'), deletePortfolioItem); // Delete a Profile item by ID
router.put('/:profileId', verifyToken, authorizePosition('professional'), updateProfile); // Update a profile by ID



export default router;