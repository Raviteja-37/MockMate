// controllers/resumeController.js
const Resume = require('../models/resume');
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Helper to decide how to read a resume file:
 * - If fileUrl is an http/https URL (Cloudinary), fetch it via axios and parse buffer
 * - Otherwise assume it's a local path on the server and read from disk
 */
const getResumeTextFromFile = async (fileUrl) => {
  try {
    // Cloudinary / remote url
    if (typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
      const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(res.data);
      const pdfData = await pdf(buffer);
      return pdfData.text;
    }

    // local file path
    const resumePath = path.join(__dirname, '..', fileUrl);
    const dataBuffer = await fsPromises.readFile(resumePath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error in getResumeTextFromFile:', error);
    return null;
  }
};

/**
 * Helper to remove a local file (non-blocking)
 */
const removeLocalFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '..', filePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error deleting local file:', err);
    }
  });
};

/**
 * Upload or update resume:
 * - Uploads incoming multer file (req.file.path) to Cloudinary (resource_type: 'raw' for PDFs)
 * - If user already had a resume, delete old Cloudinary asset (using stored publicId)
 * - Remove local file after upload
 * - Save Cloudinary secure_url and public_id to DB
 */
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const existingResume = await Resume.findOne({ userId });

    // Upload the file to Cloudinary (raw resource_type for PDF)
    // We use file path (multer disk storage). Optionally you can use upload_stream from buffer/memory storage.
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'raw', // for PDFs and other non-image files
      folder: `resumes/${userId}`, // organize by user
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    // Remove local multer file (we no longer need it)
    removeLocalFile(req.file.path);

    if (existingResume) {
      // try to delete old Cloudinary asset (if publicId exists)
      if (existingResume.publicId) {
        try {
          await cloudinary.uploader.destroy(existingResume.publicId, {
            resource_type: 'raw',
          });
        } catch (err) {
          // do not fail the whole request if deletion fails - just log
          console.error('Failed to delete old Cloudinary asset:', err);
        }
      }

      existingResume.filename = req.file.originalname;
      existingResume.fileUrl = uploadResult.secure_url || uploadResult.url;
      existingResume.publicId = uploadResult.public_id;
      existingResume.uploadedAt = new Date();
      await existingResume.save();

      return res.status(200).json({
        message: 'Resume updated successfully!',
        resume: existingResume,
      });
    }

    // create new record
    const newResume = await Resume.create({
      userId,
      filename: req.file.originalname,
      fileUrl: uploadResult.secure_url || uploadResult.url,
      publicId: uploadResult.public_id,
    });

    return res.status(201).json({
      message: 'Resume uploaded successfully!',
      resume: newResume,
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    // If multer saved a local file and something failed before we removed it, try to remove it
    if (req?.file?.path) removeLocalFile(req.file.path);
    return res.status(500).json({ error: 'Error uploading resume' });
  }
};

// Get all resumes (optional)
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId });
    res.status(200).json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: 'Error fetching resumes' });
  }
};

// Get latest resume
exports.getLatestResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.userId }).sort({
      uploadedAt: -1,
    });
    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }
    res.status(200).json(resume);
  } catch (error) {
    console.error('Error fetching latest resume:', error);
    res.status(500).json({ error: 'Error fetching latest resume' });
  }
};

// Get resume text (handles 'latest' or id)
exports.getResume = async (req, res) => {
  try {
    let resume;
    if (req.params.id === 'latest') {
      resume = await Resume.findOne({ userId: req.user.userId }).sort({
        uploadedAt: -1,
      });
    } else {
      resume = await Resume.findById(req.params.id);
    }

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resumeText = await getResumeTextFromFile(resume.fileUrl);
    if (!resumeText) {
      return res.status(500).json({ error: 'Failed to parse resume text.' });
    }

    res.status(200).json({ resumeText });
  } catch (error) {
    console.error('Error fetching resume text:', error);
    res.status(500).json({ error: 'Error fetching resume text.' });
  }
};

// Analyze resume — forwards resume text to AI service
exports.analyzeResume = async (req, res) => {
  try {
    let resume;

    if (req.params.id === 'latest') {
      resume = await Resume.findOne({ userId: req.user.userId }).sort({
        uploadedAt: -1,
      });
    } else {
      resume = await Resume.findById(req.params.id);
    }

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resumeText = await getResumeTextFromFile(resume.fileUrl);
    if (!resumeText) {
      return res.status(500).json({ error: 'Failed to parse resume text.' });
    }

    // forward to AI service
    const aiResponse = await axios.post(
      `${process.env.AI_BASE_URL}/analyze_resume`,
      { resume_text: resumeText }
    );

    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error('Error during AI analysis:', error.response?.data || error);
    res.status(500).json({ error: 'Error during AI analysis.' });
  }
};

// Handle interview — forward to AI service
exports.handleInterview = async (req, res) => {
  console.log('Backend (Node.js): Received interview request from frontend.');
  try {
    const { resumeText, userAnswer, chatHistory } = req.body;
    const aiResponse = await axios.post(
      `${process.env.AI_BASE_URL}/interview`,
      {
        resume_text: resumeText,
        user_answer: userAnswer,
        chat_history: chatHistory,
      }
    );
    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error(
      'Error forwarding interview request:',
      error.response ? error.response.data : error
    );
    res.status(500).json({ error: 'Error processing interview request.' });
  }
};
