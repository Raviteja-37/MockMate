const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const resumeController = require('../controllers/resumeController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Upload resume
router.post(
  '/upload',
  upload.single('resumeFile'),
  protect,
  resumeController.uploadResume
);

// Get all resumes
router.get('/', protect, resumeController.getResumes);

// Get latest resume
router.get('/latest', protect, resumeController.getLatestResume);

// Get resume text (supports both :id and "latest")
router.get('/:id', protect, resumeController.getResume);

// Analyze resume (supports both :id and "latest")
router.post('/:id/analyze', protect, resumeController.analyzeResume);

// Start interview
router.post('/interview', protect, resumeController.handleInterview);

module.exports = router;
