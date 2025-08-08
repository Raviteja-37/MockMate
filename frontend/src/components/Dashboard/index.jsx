// src/components/Dashboard/index.jsx (UPDATED with Interview Button)
import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom'; // <--- ADD THIS IMPORT
import './index.css'; // Make sure this import is correct

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // <--- Initialize useNavigate

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setAnalysisResult(null); // Clear previous analysis on new file select
    setResumeId(null); // Clear previous resume ID
  };

  const onFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('resumeFile', file);
    setIsLoading(true); // Start loading

    try {
      const token = Cookies.get('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      };
      const res = await axios.post(
        'http://localhost:5001/api/resume/upload',
        formData,
        config
      );
      console.log('File uploaded successfully!', res.data);
      alert('File uploaded successfully!');
      setResumeId(res.data.resume._id); // Save the resume ID
    } catch (err) {
      console.error(err.response ? err.response.data : err);
      alert('File upload failed. Check the console for details.');
    } finally {
      setIsLoading(false); // End loading
    }
  };

  const onAnalyze = async () => {
    if (!resumeId) {
      alert('Please upload a resume first.');
      return;
    }
    setIsLoading(true); // Start loading for analysis

    try {
      const token = Cookies.get('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const res = await axios.post(
        `http://localhost:5001/api/resume/${resumeId}/analyze`,
        {},
        config
      );
      console.log('Analysis successful!', res.data);
      setAnalysisResult(res.data.analysis);
    } catch (err) {
      console.error(err.response ? err.response.data : err);
      alert('Analysis failed. Check the console for details.');
    } finally {
      setIsLoading(false); // End loading
    }
  };

  // New function to handle starting the interview
  const onStartInterview = () => {
    if (resumeId) {
      // Navigate to the interview page, passing the resumeId as state
      navigate('/interview', { state: { resumeId: resumeId } });
    } else {
      alert('Please upload and analyze a resume first to start the interview.');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Background animations - ensure these classes are defined in index.css */}
      <div className="neon-lines"></div>
      <div className="particle-field"></div>
      <div className="light-rays"></div>
      <div className="aurora"></div>
      <div className="glitch-lines"></div>

      <div className="dashboard-content">
        <h2>Dashboard</h2>
        <p>Welcome to MockMate! Upload your resume below to get started.</p>

        <form onSubmit={onFileUpload} className="upload-form">
          <input
            type="file"
            name="resumeFile"
            onChange={onFileChange}
            required
          />
          <button type="submit" className="upload-button" disabled={isLoading}>
            {isLoading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>

        {resumeId &&
          !analysisResult && ( // Show Analyze button only if resumeId exists and analysis not yet done
            <button
              onClick={onAnalyze}
              className="analyze-button"
              disabled={isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
          )}

        {analysisResult && ( // Show analysis and interview button only after analysis is done
          <>
            <div className="analysis-section">
              <h3>AI Analysis Result</h3>
              <pre>{analysisResult}</pre>
            </div>
            <button onClick={onStartInterview} className="analyze-button">
              Start Interview
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
