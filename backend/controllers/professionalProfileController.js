import ProfessionalProfile from "../models/ProfessionalProfile.js";
import User from "../models/User.js";
import fs from "fs";
import { uploadToCloudinary } from "../utils/cloudinary.js";

/**-----------------------------------------
 *  @desc Add a new professional profile
 * @route POST /api/profile
 * @access Private
 * @role   Professional
 ------------------------------------------*/
export const addProfile = async (req, res) => {
    try {
        const { bio, skills, experienceYears, serviceArea } = req.body;
        const userId = req.user.id;

        if (!bio || !skills || !experienceYears || !serviceArea) {
            return res.status(400).json({ message: "Please fill all required fields!" });
        }

        const user = await User.findById(userId);
        if (!user || user.role !== 'professional') {
            return res.status(403).json({ message: "User not authorized" });
        }

        const titles = Array.isArray(req.body.portfolioTitles) ? req.body.portfolioTitles : [req.body.portfolioTitles];
        const descriptions = Array.isArray(req.body.portfolioDescriptions) ? req.body.portfolioDescriptions : [req.body.portfolioDescriptions];
        const files = req.files;

        const portfolio = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const title = titles[i] || "";
            const description = descriptions[i] || "";

            const imageUrl = await uploadToCloudinary(file.path);
            fs.unlinkSync(file.path); // delete temp file

            portfolio.push({
                title,
                description,
                imageUrl
            });
        }

        const newProfile = new ProfessionalProfile({
            bio,
            skills,
            experienceYears,
            serviceArea,
            portfolio
        });

        const createdProfile = await newProfile.save();
        user.professionalProfileId = createdProfile._id;
        await user.save();

        res.status(201).json({
            message: "Profile added successfully!",
            createdProfile
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

/**-----------------------------------------
 *  @desc Get professional profile by ID
 * @route GET /api/profile/:id
 * @access Public
 * @role   Admin, Professional
 ------------------------------------------*/
export const getProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const profile = await ProfessionalProfile.findById(id);
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        return res.status(200).json(profile);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

/**-----------------------------------------
 *  @desc Update a portfolio item
 *  @route PUT /api/profile/portfolio/:profileId/:itemId
 *  @access Private
 *  @role Professional
 ------------------------------------------*/
export const updatePortfolioItem = async (req, res) => {
    try {
        const { profileId, itemId } = req.params;
        const { title, description } = req.body;

        const profile = await ProfessionalProfile.findById(profileId);
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        const item = profile.portfolio.id(itemId);
        if (!item) return res.status(404).json({ message: "Portfolio item not found" });

        // Update fields if provided
        if (title) item.title = title;
        if (description) item.description = description;

        // If a new image was uploaded
        if (req.file) {
            const imageUrl = await uploadToCloudinary(req.file.path);
            fs.unlinkSync(req.file.path);
            item.imageUrl = imageUrl;
        }

        await profile.save();

        return res.status(200).json({
            message: "Portfolio item updated successfully",
            updatedItem: item
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc Delete a portfolio item
 *  @route DELETE /api/profile/portfolio/:profileId/:itemId
 *  @access Private
 *  @role   Professional
 ------------------------------------------*/
export const deletePortfolioItem = async (req, res) => {
    try {
        const { profileId, itemId } = req.params;

        const profile = await ProfessionalProfile.findById(profileId);
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        const item = profile.portfolio.id(itemId);
        if (!item) return res.status(404).json({ message: "Portfolio item not found" });

        item.deleteOne(); // remove the item
        await profile.save();

        return res.status(200).json({ message: "Portfolio item deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**-----------------------------------------
 *  @desc Update professional profile
 *  @route PUT /api/profile/:profileId
 *  @access Private
 *  @role Professional
 ------------------------------------------*/
export const updateProfile = async (req, res) => {
    try {
        const { profileId } = req.params;
        const updates = req.body;

        // Validate that the profile exists
        const profile = await ProfessionalProfile.findById(profileId);
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Only update fields provided in the request
        const updatableFields = [
            "bio",
            "skills",
            "experienceYears",
            "hourlyRate",
            "serviceArea"
        ];

        updatableFields.forEach(field => {
            if (updates[field] !== undefined) {
                profile[field] = updates[field];
            }
        });

        await profile.save();

        return res.status(200).json({
            message: "Profile updated successfully!",
            profile
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: error.message });
    }
};
