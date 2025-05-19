import Project from "../models/Project.js";
import User from "../models/User.js";
import Bid from "../models/Bid.js";
import fs from "fs";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { getConnectedUsers } from '../utils/socket.js';

/**-----------------------------------------
 *  @desc    Create a new project
 *  @route   POST /api/project
 *  @access  Private
 *  @role    Homeowner
 ------------------------------------------*/
export const createProject = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            address,
            budget,
            deadline
        } = req.body;

        const homeownerId = req.user.id;

        // Check if the User exists
        const homeowner = await User.findById(homeownerId);
        if (!homeowner || homeowner.role !== 'homeowner') {
            return res.status(400).json({ message: "User not found or not authorized" });
        }

        // Validate required fields
        if (!title || !address || !address.city) {
            return res.status(400).json({ message: "Title and city are required" });
        }

        // Check files and upload them
        const files = req.files || [];
        const images = [];

        for (const file of files) {
            const imageUrl = await uploadToCloudinary(file.path);
            fs.unlinkSync(file.path); // delete temp file
            images.push(imageUrl);
        }

        const newProject = new Project({
            homeownerId,
            title,
            description,
            category,
            address: {
                street: address?.street || '',
                city: address.city,
                country: address?.country || 'Jordan'
            },
            budget: {
                min: budget?.min,
                max: budget?.max,
                type: budget?.type
            },
            deadline,
            images,
        });

        await newProject.save();

        res.status(201).json({
            message: "Project created successfully",
            project: newProject
        });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**-----------------------------------------
 *  @desc    Get all Projects
 *  @route   GET /api/project
 *  @access  Private
 *  @role    Admin
 ------------------------------------------*/
export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('homeownerId', 'name profilePictureUrl')
            .populate('assignedProfessionalId', 'name')
            .populate('bidId');

        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**-----------------------------------------
 *  @desc    Get a Project by ID
 *  @route   GET /api/project/:projectId
 *  @access  Public
 *  @role    Admin, Homeowner, Professional
 ------------------------------------------*/
export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId)
            .populate('homeownerId', 'name profilePictureUrl')
            .populate('assignedProfessionalId', 'name');

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.status(200).json(project);
    } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**-----------------------------------------
 *  @desc    Get all homeowner Projects
 *  @route   GET /api/project/homeowner/:id
 *  @access  Private
 *  @role    Homeowner
 ------------------------------------------*/
export const getHomeownerProjects = async (req, res) => {
    try {
        const { id } = req.params;

        const projects = await Project.find({ homeownerId: id })
            .populate('homeownerId', 'name')
            .populate('assignedProfessionalId', 'name');

        res.status(200).json({ projects });
    } catch (error) {
        console.error("Error fetching homeowner projects:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**-----------------------------------------
 *  @desc    Get all professional Projects
 *  @route   GET /api/project/professional/:id
 ------------------------------------------*/
export const getProfessionalProjects = async (req, res) => {
    try {
        const { id } = req.params;

        const projects = await Project.find({ assignedProfessionalId: id })
            .populate('homeownerId', 'name')
            .populate('assignedProfessionalId', 'name');

        res.status(200).json({ projects });
    } catch (error) {
        console.error("Error fetching professional projects:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**-----------------------------------------
 *  @desc    Get all professionals and how many times they were assigned to a project
 *  @route   GET /api/project/professionals/assignment-count
 *  @access  Private
 *  @role    Admin
 ------------------------------------------*/
export const getProfessionalsWithAssignmentCount = async (req, res) => {
    try {
        const professionals = await User.aggregate([
            {
                $match: { role: "professional" }
            },
            {
                $lookup: {
                    from: "projects",
                    localField: "_id",
                    foreignField: "assignedProfessionalId",
                    as: "assignedProjects"
                }
            },
            {
                $project: {
                    name: 1,
                    assignmentCount: { $size: "$assignedProjects" }
                }
            }
        ]);

        res.status(200).json(professionals);
    } catch (error) {
        console.error("Error fetching professional assignment counts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**-----------------------------------------
 *  @desc    Hire a Professional
 *  @route   PUT /api/project/hireProfessional/:id
 *  @access  Private
 *  @role    homeowner
 ------------------------------------------*/
export const hireProfessional = async (req, res) => {
    try {
        const { id } = req.params;
        const { bidId } = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.status !== 'Open') {
            return res.status(400).json({ message: 'A projessional Already been hired!' });
        }

        // Check if the Bid exists
        const bid = await Bid.findById(bidId);
        if (!bid) {
            return res.status(404).json({ message: "Bid not found!" });
        }

        // Check if the professional exists
        const professional = await User.findById(bid.professionalId);
        if (!professional || professional.role !== 'professional') {
            return res.status(404).json({ message: "Professional not found!" });
        }

        project.bidId = bidId;
        project.assignedProfessionalId = bid.professionalId;
        project.status = 'Assigned';
        await project.save();

        bid.status = "Accepted";
        bid.save();

        const socketId = getConnectedUsers().get(bid.professionalId.toString());
        if (socketId) {
            req.io.to(socketId).emit('hired', {
                message: `You've been hired for project: ${project.title}`,
                projectId: project._id
            });
        }

        res.status(200).json({ message: 'Professional hired successfully', project });
    } catch (error) {
        console.error('Error hiring professional:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**-----------------------------------------
 *  @desc   Update project
 *  @route  PUT /api/project/:id
 *  @access Private
 *  @role   homeowner
 ------------------------------------------*/
export const updateProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Handle image removal
        const imagesToRemove = updates.imagesToRemove
            ? JSON.parse(updates.imagesToRemove)
            : [];

        if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
            project.images = project.images.filter(img => !imagesToRemove.includes(img));
        }

        // Handle new image uploads
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imageUrl = await uploadToCloudinary(file.path);
                fs.unlinkSync(file.path);
                project.images.push(imageUrl); // Append, don’t replace
            }
        }

        // Only update other fields provided
        const updatableFields = [
            'title',
            'description',
            'budget',
            'address',
            'deadline',
            'category'
        ];

        updatableFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (['budget', 'address'].includes(field) && typeof updates[field] === 'string') {
                    project[field] = JSON.parse(updates[field]);
                } else {
                    project[field] = updates[field];
                }
            }
        });

        await project.save();

        return res.status(200).json({
            message: 'Project updated successfully!',
            project,
        });

    } catch (error) {
        console.error('Error updating project:', error);
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc   Start project
 *  @route  PUT /api/project/start/:id
 *  @access Private
 *  @role   professional
 ------------------------------------------*/
export const startProject = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found!" });
        }

        project.status = "In Progress";
        project.startTime = new Date();
        await project.save();

        return res.status(200).json({ message: "Project Started successfully!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

/**-----------------------------------------
 *  @desc   Upload Photo after
 *  @route  PUT /api/project/photo-after/:id
 *  @access Private
 *  @role   professional
 ------------------------------------------*/
export const uploadPhotoAfter = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found!" });
        }

        let photoAfterUrl = null;
        if (req.file) {
            try {
                photoAfterUrl = await uploadToCloudinary(req.file.path);
                fs.unlinkSync(req.file.path);  // Clean up the file after uploading
            } catch (error) {
                return res.status(500).json({ message: "Failed to upload photo after" });
            }
        }
        project.photoAfter = photoAfterUrl;
        await project.save();

        return res.status(200).json({ message: "Photo Added successfully!" , project});
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

/**-----------------------------------------
 *  @desc   End project
 *  @route  PUT /api/project/end/:id
 *  @access Private
 *  @role   professional
 ------------------------------------------*/
export const endProject = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found!" });
        }

        // Check if project has started
        if (!project.startTime) {
            return res.status(400).json({ message: "Project has not started yet!" });
        }

        project.status = "Completed";
        project.endTime = new Date();

        // Calculate the timer in minutes
        const durationMs = project.endTime - project.startTime;
        const durationMinutes = Math.floor(durationMs / (1000 * 60)); // convert to minutes
        project.duration = durationMinutes;

        await project.save();

        return res.status(200).json({
            message: "Project ended successfully!",
            duration: durationMinutes
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc    Delete a project by ID
 *  @route   DELETE /api/project/:id
 *  @access  Private
 *  @role    homeowner
 ------------------------------------------*/
export const deleteProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.status !== 'Open') {
            return res.status(403).json({ message: 'Only open projects can be deleted' });
        }

        // Delete all bids associated with this project
        await Bid.deleteMany({ projectId: id });

        // Delete the project itself
        await project.deleteOne();

        res.status(200).json({ message: 'Project and associated bids deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Server error' });
    }
};