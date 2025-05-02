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
            "Pest Control",
            "Appliance Repair",
            "Home Cleaning",
            "Security System Installation",
            "Window & Door Installation",
            "Flooring Installation",
            "Masonry",
            "Drywall Repair",
            "Waterproofing",
            "Garage Door Repair",
            "Pool Maintenance"
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
});

const Project = mongoose.model('Project', projectSchema);
export default Project;