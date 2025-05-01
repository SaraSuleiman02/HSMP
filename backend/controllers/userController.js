import User from '../models/User.js';
import fs from "fs";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import helpers from "../utils/helpers.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

/**-----------------------------------------
 *  @desc Add a new user
 * @route POST /api/user
 * @access Public
 * @role Admin, User
 ------------------------------------------*/
export const addUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, address } = req.body;

        // validate equired fields 
        if (!name || !email || !password || !role || !phone || !address) {
            return res.status(400).json({ message: "Please Fill all required fields" });
        }

        // validate email format
        if (!helpers.validateEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // validate phone format
        if (!helpers.validatePhone(phone)) {
            return res.status(400).json({ message: "Invalid phone number format" });
        }

        // validate password strength
        if (!helpers.validatePassword(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character" });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Handle profile picture upload
        let profilePictureUrl = null;
        if (req.file) {
            try {
                profilePictureUrl = await uploadToCloudinary(req.file.path);
                // Delete the local file after uploading
                fs.unlinkSync(req.file.path);
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                return res.status(500).json({ message: "Failed to upload profile picture" });
            }
        }

        const isActive = role === 'homeowner';
        // convert email to lowercase
        const lowerCaseEmail = email.toLowerCase();

        const newUser = new User({
            name,
            email: lowerCaseEmail,
            password,
            role,
            phone,
            address,
            profilePictureUrl,
            isActive
        });

        await newUser.save();
        // Return the user without password
        const { password: _, ...userWithoutPassword } = newUser.toObject();
        return res.status(201).json({
            message: "User added successfully",
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 * @desc Signin 
 * @route POST /api/user/signin
 * @access Private
 * @role User
 ------------------------------------------*/
export const signin = async (req, res) => {
    const { email, password } = req.body;
    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ message: 'Please fill all required fields' });
    }
    // Validate email format
    if (!helpers.validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // convert email to lowercase
    const lowerCaseEmail = email.toLowerCase();

    try {
        // Try finding the user in Users
        let user = await User.findOne({ email: lowerCaseEmail });
        let role = '';

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } else {
            role = user.role;
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // Token payload
        const payload = {
            id: user._id,
            role: role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(200).json({
            message: 'Login successful',
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**-----------------------------------------
 * @desc Get all Users
 * @route GET /api/user
 * @access Private
 * @role Admin
 ------------------------------------------*/
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 * @desc Get a single user
 * @route GET /api/user/:id
 * @access Public
 * @role  Admin, User
 ------------------------------------------*/
export const getUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 * @desc Update User Password
 * @route PUT /api/user/update-password/:id
 * @access Private
 * @role User
 ------------------------------------------*/
export const updateUserPassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword, confirmPassword } = req.body;

    // Check if both fields are provided
    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Please provide both new password and confirm password" });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    // Validate password strength
    if (!helpers.validatePassword(newPassword)) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character"
        });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }

        user.password = newPassword; // hashing will happen automatically in pre-save

        await user.save();

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error('Password update error:', error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**-----------------------------------------
 * @desc Update a User
 * @route PUT /api/user/:id
 * @access Public
 * @role Admin, User
 ------------------------------------------*/
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    console.log(req.body);

    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Update only the fields that are provided
    if (name) user.name = name;
    if (email) {
        if (!helpers.validateEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        user.email = email.toLowerCase();
    }
    if (phone) {
        if (!helpers.validatePhone(phone)) {
            return res.status(400).json({ message: "Invalid phone number format" });
        }
        user.phone = phone;
    }
    if (address) user.address = address;

    try {
        let profilePictureUrl = user.profilePictureUrl;

        if (req.file) {
            try {
                profilePictureUrl = await uploadToCloudinary(req.file.path);
                fs.unlinkSync(req.file.path);  // Clean up the file after uploading
            } catch (error) {
                return res.status(500).json({ message: "Failed to upload profile picture" });
            }
        }

        // If a new profile picture URL exists, update it
        if (profilePictureUrl !== user.profilePictureUrl) {
            user.profilePictureUrl = profilePictureUrl;
        }

        await user.save();
        return res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 * @desc Delete a User
 * @route DELETE /api/user/:id
 * @access Private
 * @role Admin
 ------------------------------------------*/
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}