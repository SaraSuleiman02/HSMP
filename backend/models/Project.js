import mongoose from "mongoose";

const projectSchema = mongoose.Schema({
    homeownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    category: {
        type: String,
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
            "Home Cleaning",
        ],
    },
    address: {
        street: {
            type: String,
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
    budget: {
        min: {
            type: Number,
        },
        max: {
            type: Number,
        },
        type: {
            type: String,
            enum: ['Fixed', 'Hourly']
        }
    },
    deadline: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['Open', 'Assigned', 'In Progress', 'Completed'],
        default: 'Open'
    },
    assignedProfessionalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    images: [{
        type: String,
    }],
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;