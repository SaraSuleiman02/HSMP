import mongoose, { mongo } from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    profilePictureUrl: {
        type: String,
    },
    lastLogin: {
        type: Date,
    },
    otp: {
        type: String,
    },
    otpExpiry: {
        type: Date,
    }
});

// This will hash the password before saving it to the database
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

adminSchema.pre('save', function (next) {
    const encodedName = encodeURIComponent(this.name);

    if (!this.profilePictureUrl) {
        // If no profilePictureUrl set at all
        this.profilePictureUrl = `https://ui-avatars.com/api/?name=${encodedName}&size=128`;
    } else if (this.isModified('name') && this.profilePictureUrl.includes('ui-avatars.com')) {
        // If name changed AND profilePictureUrl is from ui-avatars, regenerate it
        this.profilePictureUrl = `https://ui-avatars.com/api/?name=${encodedName}&size=128`;
    }

    next();
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;