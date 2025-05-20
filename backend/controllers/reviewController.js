import Review from '../models/Review.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import ProfessionalProfile from '../models/ProfessionalProfile.js';
import { getConnectedUsers } from '../utils/socket.js';

/**-----------------------------------------
 *  @desc   Create a Review
 *  @route  PUT /api/review/:projectId
 *  @access Private
 *  @role   homeowner
 ------------------------------------------*/
export const createReview = async (req, res) => {
    try {
        const id = req.user.id;
        const { projectId } = req.params;
        const { rating, comment } = req.body;

        // validate required fields
        if (!rating) {
            return res.status(400).json({ message: "Please add rating" });
        }

        // Validate Rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Invalid rating, must be between 1-5" });
        }

        // Check if the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found!" });
        }

        if (project.status !== 'Completed') {
            return res.status(400).json({ message: "Can't add a review unless the project is Completed!" });
        }

        // Check if the professional exists
        const professional = await User.findById(project.assignedProfessionalId);
        if (!professional || professional.role !== 'professional') {
            return res.status(404).json({ message: "Professional not found!" });
        }

        // Check if a review already exists for this project by this user
        const existingReview = await Review.findOne({ projectId, reviewerId: id });
        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this project." });
        }

        // Create the review
        const newReview = new Review({
            projectId,
            reviewerId: id,
            professionalId: project.assignedProfessionalId,
            rating,
            comment,
        });

        await newReview.save();

        // Recalculate average rating
        const allReviews = await Review.find({ professionalId: project.assignedProfessionalId });
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / allReviews.length;

        // Update the professional's profile
        const professionalProfile = await ProfessionalProfile.findById(professional.professionalProfileId);
        if (!professionalProfile) {
            return res.status(404).json({ message: "Profile not found!" });
        }

        professionalProfile.averageRating = averageRating;
        await professionalProfile.save();

        // 🔔 Notify the professional via socket
        const socketId = getConnectedUsers().get(project.assignedProfessionalId.toString());
        if (socketId) {
            req.io.to(socketId).emit('review', {
                message: `You've received a new review for project: ${project.title}`,
                projectId: project._id
            });
        }

        return res.status(201).json({
            message: "Review submitted successfully",
            review: newReview
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc   Get all Review
 *  @route  GET /api/review
 *  @access Private
 *  @role   Admin
 ------------------------------------------*/
export const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('reviewerId', 'name')
            .populate('professionalId', 'name')
            .populate('projectId', 'title');

        return res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**-----------------------------------------
 *  @desc   Get Review by Project ID
 *  @route  GET /api/review/project/:projectId
 *  @access Private
 ------------------------------------------*/
export const getReviewByProjectId = async (req, res) => {
    try {
        const { projectId } = req.params;

        const review = await Review.findOne({ projectId });

        return res.status(200).json(review);
    } catch (error) {
        console.error('Error fetching review by projectId:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


/**-----------------------------------------
 *  @desc   Get all Review for the Professional
 *  @route  GET /api/review/professional/:id
 ------------------------------------------*/
export const getProfessionalReviews = async (req, res) => {
    try {
        const { id } = req.params;

        const reviews = await Review.find({ professionalId: id })
            .populate('reviewerId', 'name profilePictureUrl') // who wrote the review
            .populate('projectId', 'title'); // which project it belongs to

        return res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching professional reviews:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**-----------------------------------------
 *  @desc   Delete a Review by ID
 *  @route  DELETE /api/review/:reviewId
 *  @access Private
 *  @role   Homeowner
 ------------------------------------------*/
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        await review.deleteOne();

        return res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};