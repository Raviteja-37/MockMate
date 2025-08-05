// routes/resumeRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const resumeController = require('../controllers/resumeController');

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be stored in the 'uploads' directory
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate a unique filename by adding the current timestamp
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

// @route   POST /api/resume/upload
// @desc    Upload a new resume file
// @access  Private
router.post(
  '/upload',
  upload.single('resumeFile'),
  protect,
  resumeController.uploadResume
);
// We'll add the GET route here later
// router.get('/', protect, resumeController.getResumes);

router.get('/', protect, resumeController.getResumes);

// @route   POST /api/resume/:id/analyze
// @desc    Trigger AI analysis for a specific resume
// @access  Private
router.post('/:id/analyze', protect, resumeController.analyzeResume);

module.exports = router;
