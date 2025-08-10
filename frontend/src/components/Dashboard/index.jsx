// src/components/Dashboard/index.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import './index.css';

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch latest resume every time dashboard loads
  useEffect(() => {
    const fetchLatestResume = async () => {
      const token = Cookies.get('token');
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5001/api/resume/latest', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?._id) {
          setResumeId(res.data._id);
        }
      } catch (err) {
        console.log('No existing resume found.');
      }
    };
    fetchLatestResume();
  }, []);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('resumeFile', file);
    setIsLoading(true);

    try {
      const token = Cookies.get('token');
      if (!token) {
        alert('You must be logged in to upload a resume.');
        return;
      }
      const res = await axios.post(
        'http://localhost:5001/api/resume/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('File uploaded successfully!');
      setResumeId(res.data.resume._id);
      setAnalysisResult(null); // Reset so you can re-analyze
    } catch (err) {
      console.error(err.response?.data || err);
      alert('File upload failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const onAnalyze = async () => {
    if (!resumeId) {
      alert('No resume found.');
      return;
    }
    setIsLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      const res = await axios.post(
        `http://localhost:5001/api/resume/${resumeId}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalysisResult(res.data.analysis);
    } catch (err) {
      console.error(err.response?.data || err);
      alert('Analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const onStartInterview = () => {
    navigate('/interview', { state: { resumeId } });
  };

  return (
    <div className="dashboard-container">
      {/* Background animations */}
      <div className="neon-lines"></div>
      <div className="particle-field"></div>
      <div className="light-rays"></div>
      <div className="aurora"></div>
      <div className="glitch-lines"></div>

      <div className="dashboard-content">
        <h2>Dashboard</h2>
        <p>Welcome to MockMate! Upload your resume below to get started.</p>

        {/* Always show upload */}
        <form onSubmit={onFileUpload} className="upload-form">
          <input type="file" name="resumeFile" onChange={onFileChange} />
          <button type="submit" className="upload-button" disabled={isLoading}>
            {isLoading
              ? 'Uploading...'
              : resumeId
              ? 'Replace Resume'
              : 'Upload Resume'}
          </button>
        </form>

        {/* Show Analyze if a resume exists */}
        {resumeId && (
          <button
            onClick={onAnalyze}
            className="analyze-button"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze with Last Resume'}
          </button>
        )}

        {/* After analysis */}
        {analysisResult && (
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
