import Bid from '../models/Bid.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { getConnectedUsers } from '../utils/socket.js';

/**-----------------------------------------
 *  @desc   Create a Bid
 *  @route  PUT /api/bid/:projectId
 *  @access Private
 *  @role   professional
 ------------------------------------------*/
export const createBid = async (req, res) => {
    try {
        const { projectId } = req.params;
        const id = req.user.id;
        const { amount, proposal, estimatedDuration } = req.body;

        // validate required fields
        if (!amount) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        // check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // check if the user exists and is a professional
        const user = await User.findById(id);
        if (!user || user.role !== 'professional') {
            return res.status(404).json({ message: "User not found or not a professional" });
        }

        // check for existing bid from the same professional for this project
        const existingBid = await Bid.findOne({ projectId, professionalId: id });
        if (existingBid) {
            return res.status(400).json({ message: "You have already placed a bid for this project" });
        }

        const newBid = new Bid({
            projectId,
            professionalId: id,
            amount,
            proposal,
            estimatedDuration
        });

        await newBid.save();

        const socketId = getConnectedUsers().get(project.homeownerId.toString());
        if (socketId) {
            req.io.to(socketId).emit('bid', {
                message: `You've received a bid for project: ${project.title}`,
                projectId: project._id
            });
        }

        return res.status(201).json({
            message: "Bid added successfully!",
            newBid
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc   Get all bids grouped by project
 *  @route  GET /api/bids
 *  @access Public
 *  @role Admin, homeowner, professional
 ------------------------------------------*/
export const getAllBidsGroupedByProject = async (req, res) => {
    try {
        const groupedBids = await Bid.aggregate([
            {
                $group: {
                    _id: "$projectId",
                    bids: { $push: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "projects",
                    localField: "_id",
                    foreignField: "_id",
                    as: "project"
                }
            },
            {
                $unwind: "$project"
            },
            {
                $project: {
                    _id: 0,
                    projectId: "$_id",
                    projectTitle: "$project.title",
                    bids: 1
                }
            }
        ]);

        return res.status(200).json(groupedBids);
    } catch (error) {
        console.error("Error fetching grouped bids:", error);
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc   Get all bids for a specific project
 *  @route  GET /api/bid/project/:projectId
 *  @access Public
 *  @role Admin, homeowner, professional
 ------------------------------------------*/
export const getBidsByProjectId = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const bids = await Bid.find({ projectId })

            .populate('professionalId', 'name profilePictureUrl')
            .sort({ createdAt: -1 }); // Most recent first

        return res.status(200).json(bids);
    } catch (error) {
        console.error("Error fetching bids by project:", error);
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc   Update a Bid by ID
 *  @route  PUT /api/bid/:bidId
 *  @access Private 
 *  @role   Professional
 ------------------------------------------*/
export const updateBidById = async (req, res) => {
    try {
        const { bidId } = req.params;
        const updates = req.body;
        const userId = req.user.id;

        // Find bid and validate ownership
        const bid = await Bid.findById(bidId);
        if (!bid) {
            return res.status(404).json({ message: "Bid not found" });
        }

        if (bid.status === "Accepted") {
            return res.status(409).json({ message: "Bid already accepted, can't edit!" });
        }

        if (bid.professionalId.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to update this bid" });
        }

        // Define updatable fields
        const updatableFields = ["amount", "proposal", "estimatedDuration"];

        updatableFields.forEach(field => {
            if (updates[field] !== undefined) {
                bid[field] = updates[field];
            }
        });

        await bid.save();

        return res.status(200).json({
            message: "Bid updated successfully!",
            bid
        });

    } catch (error) {
        console.error("Error updating bid:", error);
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc   Delete a Bid by ID
 *  @route  DELETE /api/bid/:bidId
 *  @access Private 
 *  @role   Professional
 ------------------------------------------*/
export const deleteBidById = async (req, res) => {
    try {
        const { bidId } = req.params;
        const userId = req.user.id;

        // Find bid and validate ownership
        const bid = await Bid.findById(bidId);
        if (!bid) {
            return res.status(404).json({ message: "Bid not found" });
        }

        if (bid.status === 'Accepted') {
            return res.status(404).json({ message: "The bid can't be deleted, it's Accepted!" });
        }

        await bid.deleteOne();
        res.status(200).json({ message: 'Bid deleted successfully' })
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}