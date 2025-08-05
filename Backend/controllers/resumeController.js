// controllers/resumeController.js
const Resume = require('../models/resume');
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs').promises;

exports.uploadResume = async (req, res) => {
  try {
    console.log('Controller sees userId as:', req.user.userId);
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // The file path is available in req.file.path from multer
    const newResume = new Resume({
      userId: req.user.userId, // This comes from our authMiddleware!
      filename: req.file.originalname,
      fileUrl: req.file.path, // We'll save the local path for now
    });

    await newResume.save();
    res
      .status(201)
      .json({ message: 'Resume uploaded successfully!', resume: newResume });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error uploading resume' });
  }
};

exports.getResumes = async (req, res) => {
  try {
    // Find all resumes that match the authenticated user's ID
    const resumes = await Resume.find({ userId: req.user.userId });

    // Send the found resumes back to the client
    res.status(200).json(resumes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching resumes' });
  }
};

exports.analyzeResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Read the resume file from the local filesystem
    const resumeText = await fs.readFile(resume.fileUrl, 'utf-8');

    // Make a POST request to your Python AI service
    // Make a POST request to your Python AI service
    const aiResponse = await axios.post(
      'http://localhost:5002/analyze_resume',
      {
        resume_text: resumeText,
      }
    );

    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error('Error during AI analysis:', error);
    res.status(500).json({ error: 'Error during AI analysis.' });
  }
};

// exports.analyzeResume = (req, res) => {
//   res.send('Endpoint is working!');
// };
