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
    activateUser,
    deleteUser
} from '../controllers/userController.js';
import upload from '../middlewares/photoUpload.js';
import verifyToken from '../middlewares/verifyToken.js';
import authorizePosition from '../middlewares/authorizePosition.js';

const router = express.Router();

router.post('/', upload.single('profilePic'), addUser); // Add a new User
router.post('/signin', signin); // Sign in a User
router.get('/',verifyToken, authorizePosition('admin'), getAllUsers); //Get all Users
router.get('/:id',verifyToken, getUser); // Get a User by ID
router.post('/sendOTP', sendOTP); // Send OTP for re-setting password
router.post('/confirmOTP', confirmOTP); // Confirm OTP
router.put('/update-password', updateUserPassword); // Update User password by ID
router.put('/:id',verifyToken, upload.single('profilePic'), updateUser); // Update a User by ID
router.put('/activate/:id', verifyToken, authorizePosition('admin'), activateUser); // Activate User by ID
router.delete('/:id',verifyToken, authorizePosition('admin'), deleteUser); // Delete A User by ID



export default router;