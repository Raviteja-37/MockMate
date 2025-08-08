// mockmate-backend/routes/resumeRoutes.js (FINAL & CORRECTED)
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

router.post(
  '/upload',
  upload.single('resumeFile'),
  protect,
  resumeController.uploadResume
);
router.get('/', protect, resumeController.getResumes);
router.get('/:id', protect, resumeController.getResume);
router.post('/:id/analyze', protect, resumeController.analyzeResume);

// NEW: Protected route for the voice interview
router.post('/interview', protect, resumeController.handleInterview);

module.exports = router;
