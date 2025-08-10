const Resume = require('../models/resume');
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');

// Helper to extract text from a PDF file
const getResumeTextFromFile = async (fileUrl) => {
  try {
    const resumePath = path.join(__dirname, '..', fileUrl);
    const dataBuffer = await fsPromises.readFile(resumePath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error in getResumeTextFromFile:', error);
    return null;
  }
};

// ✅ Upload or update resume
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const existingResume = await Resume.findOne({ userId });

    if (existingResume) {
      // Delete old file
      const oldFilePath = path.join(__dirname, '..', existingResume.fileUrl);
      fs.unlink(oldFilePath, (err) => {
        if (err) console.error('Error deleting old resume:', err);
      });

      // Update record
      existingResume.filename = req.file.originalname;
      existingResume.fileUrl = req.file.path;
      existingResume.uploadedAt = new Date();
      await existingResume.save();

      return res.status(200).json({
        message: 'Resume updated successfully!',
        resume: existingResume,
      });
    }

    // Create new record if none exists
    const newResume = await Resume.create({
      userId,
      filename: req.file.originalname,
      fileUrl: req.file.path,
    });

    res.status(201).json({
      message: 'Resume uploaded successfully!',
      resume: newResume,
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Error uploading resume' });
  }
};

// ✅ Get all resumes for user
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId });
    res.status(200).json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: 'Error fetching resumes' });
  }
};

// ✅ Get latest resume
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

// ✅ Get resume text
exports.getResume = async (req, res) => {
  try {
    let resume;

    if (req.params.id === 'latest') {
      // Special case: get latest resume
      resume = await Resume.findOne({ userId: req.user.userId }).sort({
        uploadedAt: -1,
      });
    } else {
      // Normal case: find by ObjectId
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

// ✅ Analyze resume
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
    const aiResponse = await axios.post(
      'http://localhost:5002/analyze_resume',
      { resume_text: resumeText }
    );

    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error('Error during AI analysis:', error);
    res.status(500).json({ error: 'Error during AI analysis.' });
  }
};

// ✅ Handle interview
exports.handleInterview = async (req, res) => {
  console.log('Backend (Node.js): Received interview request from frontend.');
  try {
    const { resumeText, userAnswer, chatHistory } = req.body;
    const aiResponse = await axios.post('http://localhost:5002/interview', {
      resume_text: resumeText,
      user_answer: userAnswer,
      chat_history: chatHistory,
    });
    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error(
      'Error forwarding interview request:',
      error.response ? error.response.data : error
    );
    res.status(500).json({ error: 'Error processing interview request.' });
  }
};
