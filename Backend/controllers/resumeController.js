// mockmate-backend/controllers/resumeController.js (FINAL & CORRECTED)
const Resume = require('../models/resume');
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');

// Helper function to read and parse the file
const getResumeTextFromFile = async (fileUrl) => {
  try {
    const resumePath = path.join(__dirname, '..', fileUrl);
    const dataBuffer = await fs.readFile(resumePath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error in getResumeTextFromFile:', error);
    return null;
  }
};

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const newResume = new Resume({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      filename: req.file.originalname,
      fileUrl: req.file.path,
    });
    await newResume.save();
    res
      .status(201)
      .json({ message: 'Resume uploaded successfully!', resume: newResume });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Error uploading resume' });
  }
};

exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId });
    res.status(200).json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: 'Error fetching resumes' });
  }
};

exports.getResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    const resumeText = await getResumeTextFromFile(resume.fileUrl);
    if (!resumeText) {
      return res.status(500).json({ error: 'Failed to parse resume text.' });
    }
    res.status(200).json({ resumeText: resumeText });
  } catch (error) {
    console.error('Error fetching resume text:', error);
    res.status(500).json({ error: 'Error fetching resume text.' });
  }
};

exports.analyzeResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
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

// NEW: Endpoint to handle interview requests from the frontend
exports.handleInterview = async (req, res) => {
  console.log('Backend (Node.js): Received interview request from frontend.');
  try {
    // The frontend sends the resume text and the user's answer
    const { resumeText, userAnswer, chatHistory } = req.body;

    // We forward this request to our Python AI service
    const aiResponse = await axios.post('http://localhost:5002/interview', {
      resume_text: resumeText,
      user_answer: userAnswer,
      chat_history: chatHistory,
    });
    // console.error(
    //   'Error forwarding interview request:',
    //   error.response ? error.response.data : error
    // );
    res.status(200).json(aiResponse.data);
  } catch (error) {
    console.error(
      'Error forwarding interview request:',
      error.response ? error.response.data : error
    );
    res.status(500).json({ error: 'Error processing interview request.' });
  }
};
