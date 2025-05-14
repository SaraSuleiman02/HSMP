import mongoose from "mongoose";

const professionalProfileSchema = new mongoose.Schema({
    bio: {
        type: String,
        required: true,
    },
    skills: [{
        type: String,
        required: true,
        enum: [
            "Plumbing",
            "Electrical",
            "Carpentry",
            "Painting",
            "Tiling",
            "HVAC (Heating, Ventilation, and Air Conditioning)",
            "Roofing",
            "Landscaping",
            "Gardening",
            "Appliance Repair",
            "Home Cleaning"
        ]
    }],
    experienceYears: {
        type: Number,
        required: true,
    },
    portfolio: [{
        title: { type: String },
        description: { type: String },
        imageUrl: { type: String }
    }],
    serviceArea: [{
        type: String,
        required: true,
        enum: [
            'Amman', 'Zarqa', 'Irbid', 'Karak', 'Tafilah', 'Madaba', 'Aqaba',
            'Ajloun', 'Ma\'an', 'Balqa', 'Jerash', 'Mafraq', 'Russeifa', 'Salt', 'Wadi Musa'
        ]
    }],
    averageRating: {
        type: Number,
        default: 1,
    },
});

const ProfessionalProfile = mongoose.model('ProfessionalProfile', professionalProfileSchema);
export default ProfessionalProfile;