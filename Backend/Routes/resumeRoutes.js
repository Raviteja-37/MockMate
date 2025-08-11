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

// Upload resume — protect first, then multer, then controller
router.post(
  '/upload',
  protect,
  upload.single('resumeFile'),
  resumeController.uploadResume
);

// Other routes
router.get('/', protect, resumeController.getResumes);
router.get('/latest', protect, resumeController.getLatestResume);
router.get('/:id', protect, resumeController.getResume);
router.post('/:id/analyze', protect, resumeController.analyzeResume);
router.post('/interview', protect, resumeController.handleInterview);

module.exports = router;
