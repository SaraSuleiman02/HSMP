import mongoose, { mongo } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema ({
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
    role: {
        type: String,
        enum: ['homeowner', 'professional'],
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        street: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            enum: ['Amman', 'Zarqa', 'Irbid', 'Karak', 'Tafilah', 'Madaba', 'Aqaba', 'Ajloun', 'Ma\'an', 'Balqa', 'Jerash', 'Mafraq', 'Russeifa', 'Salt', 'Wadi Musa'],
            required: true,
        },
        country: {
            type: String, 
            default: 'Jordan'
        }
    },
    profilePictureUrl: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    lastLogin: {
        type: Date,
    },
    // professionalProfileId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'ProfessionalProfile',
    // }

});

// This will hash the password before saving it to the database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.pre('save', function (next) {
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

const User = mongoose.model('User', userSchema);
export default User;