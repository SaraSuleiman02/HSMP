import mongoose from "mongoose";

const bidSchema = mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    professionalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    proposal: {
        type: String,
    },
    estimatedDuration: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Submitted', 'Accepted'],
        default: 'Submitted',
    },
},{ timestamps: true });

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;