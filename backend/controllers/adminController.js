import Admin from '../models/Admin.js';
import fs from "fs";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import helpers from "../utils/helpers.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { transporter } from '../utils/nodemailer.js';

/**-----------------------------------------
 *  @desc Add a new admin
 * @route POST /api/admin
 * @access Private
 * @role Admin
 ------------------------------------------*/
export const addAdmin = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // validate equired fields 
        if (!name || !email || !password || !phone) {
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

        // Check if the admin already exists
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
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

        // convert email to lowercase
        const lowerCaseEmail = email.toLowerCase();

        const newAdmin = new Admin({
            name,
            email: lowerCaseEmail,
            password,
            phone,
            profilePictureUrl,
        });

        await newAdmin.save();
        // Return the admin without password
        const { password: _, ...adminWithoutPassword } = newAdmin.toObject();
        return res.status(201).json({
            message: "Admin added successfully",
            admin: adminWithoutPassword
        });

    } catch (error) {
        console.error('Error adding admin:', error);
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 * @desc Signin 
 * @route POST /api/admin/signin
 * @access Private
 * @role Admin
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
        // Try finding the admin in Admins
        let admin = await Admin.findOne({ email: lowerCaseEmail });
        let role = '';

        if (!admin) {
            return res.status(404).json({ message: 'admin not found' });
        } else {
            role = 'admin';
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        admin.lastLogin = Date.now();

        await admin.save();

        // Token payload
        const payload = {
            id: admin._id,
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
 * @desc Get a single admin
 * @route GET /api/admin/:id
 * @access Private
 * @role  Admin
 ------------------------------------------*/
export const getAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const admin = await Admin.findById(id).select("-password");
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        return res.status(200).json(admin);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 * @desc Send OTP for resetting Password
 * @route POST /api/admin/sendOTP
 ------------------------------------------*/
export const sendOTP = async (req, res) => {
    const { email } = req.body;
    const lowercaseEmail = email.toLowerCase();
    const admin = await Admin.findOne({ email: lowercaseEmail });

    if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
    }

    // Generate OTP (6-digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration time (3 minutes from now)
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 3);

    // Save OTP and expiry time in the database
    admin.otp = otp;
    admin.otpExpiry = otpExpiry;
    await admin.save();

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
 * @route POST /api/admin/confirmOTP
 ------------------------------------------*/
export const confirmOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const lowercaseEmail = email.toLowerCase();
        const admin = await Admin.findOne({ email: lowercaseEmail });

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (admin.otp !== otp || new Date() > admin.otpExpiry) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        res.status(200).json({ message: "OTP correct!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 * @desc Update Admin Password
 * @route PUT /api/admin/update-password
 ------------------------------------------*/
export const updateAdminPassword = async (req, res) => {
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
        const admin = await Admin.findOne({ email: lowercaseEmail });
    
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        admin.password = newPassword; // hashing will happen automatically in pre-save

        await admin.save();

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error('Password update error:', error);
        return res.status(500).json({ message: "Server error" });
    }
};

/**-----------------------------------------
 * @desc Update an Admin
 * @route PUT /api/admin/:id
 * @access Private
 * @role Admin
 ------------------------------------------*/
export const updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    console.log(req.body);

    const admin = await Admin.findById(id);
    if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
    }

    // Update only the fields that are provided
    if (name) admin.name = name;
    if (email) {
        if (!helpers.validateEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        admin.email = email.toLowerCase();
    }
    if (phone) {
        if (!helpers.validatePhone(phone)) {
            return res.status(400).json({ message: "Invalid phone number format" });
        }
        admin.phone = phone;
    }

    try {
        let profilePictureUrl = admin.profilePictureUrl;

        if (req.file) {
            try {
                profilePictureUrl = await uploadToCloudinary(req.file.path);
                fs.unlinkSync(req.file.path);  // Clean up the file after uploading
            } catch (error) {
                return res.status(500).json({ message: "Failed to upload profile picture" });
            }
        }

        // If a new profile picture URL exists, update it
        if (profilePictureUrl !== admin.profilePictureUrl) {
            admin.profilePictureUrl = profilePictureUrl;
        }

        await admin.save();
        return res.status(200).json({ message: "Admin updated successfully", admin });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};