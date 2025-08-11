// controllers/resumeController.js
const Resume = require('../models/resume');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const axios = require('axios');
const pdf = require('pdf-parse');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary using env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Helper to read resume PDF text from Cloudinary URL
 */
const getResumeTextFromFile = async (fileUrl) => {
  try {
    if (typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
      const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(res.data);
      const pdfData = await pdf(buffer);
      return pdfData.text;
    }
    throw new Error('Invalid resume file URL');
  } catch (error) {
    console.error('Error in getResumeTextFromFile:', error);
    return null;
  }
};

/**
 * Upload file buffer to Cloudinary using upload_stream
 */
const uploadFromBuffer = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw', // for PDFs or other files
        folder: `resumes/${userId}`,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Upload or update resume (single resume per user)
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const existingResume = await Resume.findOne({ userId });

    // Upload file buffer to Cloudinary
    const uploadResult = await uploadFromBuffer(req.file.buffer, userId);

    if (existingResume) {
      // Delete old Cloudinary asset if exists
      if (existingResume.publicId) {
        try {
          await cloudinary.uploader.destroy(existingResume.publicId, {
            resource_type: 'raw',
          });
        } catch (err) {
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

    // Create new resume record
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
    return res.status(500).json({ error: 'Error uploading resume' });
  }
};

// Get all resumes for user (optional)
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId });
    res.status(200).json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: 'Error fetching resumes' });
  }
};

// Get latest resume for user
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

// Get resume text by id or latest
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

// Analyze resume text with AI service
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

// Forward interview request to AI service
exports.handleInterview = async (req, res) => {
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
