import express from 'express';
import {
    createProject,
    getAllProjects,
    getProjectById,
    getHomeownerProjects,
    getProfessionalProjects,
    hireProfessional,
    updateProjectById,
    startProject,
    endProject,
    deleteProjectById,
} from '../controllers/projectController.js';
import upload from '../middlewares/photoUpload.js';
import verifyToken from '../middlewares/verifyToken.js'
import authorizePosition from '../middlewares/authorizePosition.js';

const router = express.Router();

router.post('/', verifyToken, authorizePosition('homeowner'),upload.array("images"), createProject); // Create a Project Post
router.get('/', verifyToken, authorizePosition('admin'), getAllProjects); // Get All Projects
router.get('/homeowner', verifyToken, authorizePosition('homeowner'), getHomeownerProjects); // Get all homeowner Projects
router.get('/professional', verifyToken, authorizePosition('professional'), getProfessionalProjects); // Get all Profesional Projects
router.get('/:id', verifyToken, getProjectById); // Get a Project by ID
router.put('/hireProfessional/:id', verifyToken, authorizePosition('homeowner'), hireProfessional); // Hire a Professional
router.put('/:id', verifyToken, authorizePosition('homeowner'), upload.array("images"), updateProjectById); // Update a project by ID
router.put('/start/:id', verifyToken, authorizePosition('professional'), startProject); // Start a project by ID
router.put('/end/:id', verifyToken, authorizePosition('professional'), endProject); // End a project by ID
router.delete('/:id', verifyToken, authorizePosition('admin','homeowner'), deleteProjectById); // Delete a project by ID



export default router;