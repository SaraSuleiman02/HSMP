import express from 'express';
import {
    addAdmin,
    signin,
    getAdmin,
    sendOTP,
    confirmOTP,
    updateAdminPassword,
    updateAdmin,
} from '../controllers/adminController.js';
import upload from '../middlewares/photoUpload.js';
import verifyToken from '../middlewares/verifyToken.js';
import authorizePosition from '../middlewares/authorizePosition.js';

const router = express.Router();

router.post('/', upload.single('profilePic'), addAdmin); // Add a new Admin
router.post('/signin', signin); // Sign in an Admin
router.get('/:id',verifyToken, authorizePosition('admin'), getAdmin); // Get an Admin by ID
router.post('/sendOTP', sendOTP); // Send OTP for re-setting password
router.post('/confirmOTP', confirmOTP); // Confirm OTP
router.put('/update-password', updateAdminPassword); // Update Admin password by ID
router.put('/:id',verifyToken, authorizePosition('admin'), upload.single('profilePic'), updateAdmin); // Update an Admin by ID


export default router;