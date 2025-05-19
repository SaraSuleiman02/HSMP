import express from 'express';
import {
    createProject,
    getAllProjects,
    getProjectById,
    getHomeownerProjects,
    getProfessionalProjects,
    getProfessionalsWithAssignmentCount,
    hireProfessional,
    updateProjectById,
    startProject,
    uploadPhotoAfter,
    endProject,
    deleteProjectById,
} from '../controllers/projectController.js';
import upload from '../middlewares/photoUpload.js';
import verifyToken from '../middlewares/verifyToken.js'
import authorizePosition from '../middlewares/authorizePosition.js';

const router = express.Router();

router.post('/', verifyToken, authorizePosition('homeowner'),upload.array("images"), createProject); // Create a Project Post
router.get('/', verifyToken, getAllProjects); // Get All Projects
router.get('/:projectId', verifyToken, getProjectById); // Get a project by ID
router.get('/homeowner/:id', verifyToken, getHomeownerProjects); // Get all homeowner Projects
router.get('/professional/:id', verifyToken, getProfessionalProjects); // Get all Profesional Projects
router.get('/professionals/assignment-count', verifyToken, authorizePosition('admin'), getProfessionalsWithAssignmentCount); // Get all Professionals with assignment count
router.put('/hireProfessional/:id', verifyToken, authorizePosition('homeowner'), hireProfessional); // Hire a Professional
router.put('/:id', verifyToken, authorizePosition('homeowner'), upload.array("images"), updateProjectById); // Update a project by ID
router.put('/start/:id', verifyToken, authorizePosition('professional'), startProject); // Start a project by ID
router.put('/photo-after/:id', verifyToken, authorizePosition('professional'), upload.single("photoAfter"), uploadPhotoAfter); // Upload photo after for a project by ID
router.put('/end/:id', verifyToken, authorizePosition('professional'), endProject); // End a project by ID
router.delete('/:id', verifyToken, authorizePosition('admin','homeowner'), deleteProjectById); // Delete a project by ID



export default router;