import express from 'express';
import {
    addUser,
    signin,
    getAllUsers,
    getUser,
    sendOTP,
    confirmOTP,
    updateUserPassword,
    updateUser,
    toggleUserActivation,
    deleteUser,
    professionalPay,
} from '../controllers/userController.js';
import upload from '../middlewares/photoUpload.js';
import verifyToken from '../middlewares/verifyToken.js';
import authorizePosition from '../middlewares/authorizePosition.js';

const router = express.Router();

router.post(
    '/',
    upload.fields([
        { name: 'profilePic', maxCount: 1 },
        { name: 'portfolioImages' } // this allows multiple portfolio images
    ]),
    addUser
); // Add a User
router.post('/signin', signin); // Sign in a User
router.get('/', verifyToken, getAllUsers); //Get all Users
router.post('/professional-payment', verifyToken, authorizePosition('professional'), professionalPay); // Add payment for professionl
router.get('/:id', verifyToken, getUser); // Get a User by ID
router.post('/sendOTP', sendOTP); // Send OTP for re-setting password
router.post('/confirmOTP', confirmOTP); // Confirm OTP
router.put('/update-password', updateUserPassword); // Update User password by ID
router.put('/:id', verifyToken, upload.single('profilePic'), updateUser); // Update a User by ID
router.put('/activate/:id', verifyToken, authorizePosition('admin'), toggleUserActivation); // Activate/ De-Activate User by ID
router.delete('/:id', verifyToken, authorizePosition('admin'), deleteUser); // Delete A User by ID



export default router;