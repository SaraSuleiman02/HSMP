import User from '../models/User.js';
import ProfessionalProfile from '../models/ProfessionalProfile.js';
import fs from "fs";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import helpers from "../utils/helpers.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { transporter } from '../utils/nodemailer.js';
import Stripe from 'stripe';

// Stripe Secret Key
const stripe = Stripe(process.env.STRIPE_SECRET);

/**-----------------------------------------
 *  @desc Add a new user
 * @route POST /api/user
 * @access Public
 * @role Admin, User
 ------------------------------------------*/
export const addUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, address, bio, skills, experienceYears, serviceArea, portfolioTitles, portfolioDescriptions } = req.body;
        const skillsArray = Array.isArray(skills)
            ? skills
            : skills?.split(',').map(s => s.trim());

        // Validate required user fields
        if (!name || !email || !password || !role || !phone || !address) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        if (!helpers.validateEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (!helpers.validatePhone(phone)) {
            return res.status(400).json({ message: "Invalid phone number format" });
        }

        if (!helpers.validatePassword(password)) {
            return res.status(400).json({ message: "Weak password format" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        let profilePictureUrl = null;
        if (req.files?.profilePic?.[0]) {
            profilePictureUrl = await uploadToCloudinary(req.files.profilePic[0].path);
            fs.unlinkSync(req.files.profilePic[0].path);
        }

        const isActive = role === 'homeowner';
        const lowerCaseEmail = email.toLowerCase();

        // Create user object
        const user = new User({
            name,
            email: lowerCaseEmail,
            password,
            role,
            phone,
            address,
            profilePictureUrl,
            isActive
        });

        // If professional, create the profile
        if (role === 'professional') {
            if (!bio || !skillsArray || !experienceYears || !serviceArea) {
                return res.status(400).json({ message: "Missing professional profile fields" });
            }

            const titles = Array.isArray(portfolioTitles) ? portfolioTitles : [portfolioTitles];
            const descriptions = Array.isArray(portfolioDescriptions) ? portfolioDescriptions : [portfolioDescriptions];
            const files = req.files?.portfolioImages || [];

            const portfolio = [];

            for (let i = 0; i < files.length; i++) {
                const imageUrl = await uploadToCloudinary(files[i].path);
                fs.unlinkSync(files[i].path);

                portfolio.push({
                    title: titles[i] || "",
                    description: descriptions[i] || "",
                    imageUrl
                });
            }

            const newProfile = new ProfessionalProfile({
                bio,
                skills: skillsArray,
                experienceYears,
                serviceArea,
                portfolio
            });

            const createdProfile = await newProfile.save();
            user.professionalProfileId = createdProfile._id;
        }

        await user.save();

        const { password: _, ...userWithoutPassword } = user.toObject();

        return res.status(201).json({
            message: "User added successfully",
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({ message: "Server error: " + error.message });
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

        user.lastLogin = Date.now();

        await user.save();

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
 ------------------------------------------*/
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").populate("professionalProfileId");
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
 * @desc Send OTP for resetting Password
 * @route POST /api/user/sendOTP
 ------------------------------------------*/
export const sendOTP = async (req, res) => {
    const { email } = req.body;
    const lowercaseEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowercaseEmail });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP (6-digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration time (3 minutes from now)
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 3);

    // Save OTP and expiry time in the database
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP via email
    const mailOptions = {
        from: `"HSMP.JO" <${process.env.EMAIL_USER}>`,
        to: lowercaseEmail,
        subject: 'Password Reset OTP',
        text: `Your OTP for resetting your password is: ${otp}. This OTP is valid for 10 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP email:', error);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
};

/**-----------------------------------------
 * @desc Confirm OTP
 * @route POST /api/user/confirmOTP
 ------------------------------------------*/
export const confirmOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const lowercaseEmail = email.toLowerCase();
        const user = await User.findOne({ email: lowercaseEmail });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.otp !== otp || new Date() > user.otpExpiry) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        res.status(200).json({ message: "OTP correct!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 * @desc Update User Password
 * @route PUT /api/user/update-password
 ------------------------------------------*/
export const updateUserPassword = async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

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
        const lowercaseEmail = email.toLowerCase();
        const user = await User.findOne({ email: lowercaseEmail });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
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

/**
 * -----------------------------------------
 * @desc    Activate/ De-activate a User
 * @route   PUT /api/user/activate/:id
 * @access  Private
 * @role    Admin
-----------------------------------------*/
export const toggleUserActivation = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isActive = !user.isActive;
        await user.save();

        const lowercaseEmail = user.email.toLowerCase();
        const Activated = user.isActive ? "Activated" : "Deactivated";

        const mailOptions = {
            from: `"HSMP.JO" <${process.env.EMAIL_USER}>`,
            to: lowercaseEmail,
            subject: Activated,
            text: `Your Account has been ${Activated}, now you ${Activated === 'Activated' ? 'can' : 'can\'t'} login to your account!`
        };
        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully!`,
            user,
        });
    } catch (error) {
        console.error('Error toggling user activation:', error);
        return res.status(500).json({ message: "Server error. Please try again later." });
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

/**-----------------------------------------
 * @desc Add Payment for the Professional
 * @route POST /api/user/professional-payment
 * @access Private
 * @role Professional
 ------------------------------------------*/
export const professionalPay = async (req, res) => {
    const { amount } = req.body;
    const  id  = req.user.id;

    try {
        const professional = await User.findById(id);
        if (!professional) {
            return res.status(404).json({ message: "Profesional not found!" });
        }

        if (professional.professionalPaid) {
            return res.status(400).json({ message: "Professional already Paid!" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
        });

        professional.professionalPaid = true;
        professional.save();

        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}