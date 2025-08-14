import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { FullScreenLoader, ButtonLoader } from '../Loader'; // ✅ import loaders

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resumeId, setResumeId] = useState(null);

  // Separate loaders
  const [isPageLoading, setIsPageLoading] = useState(true); // ✅ For full page loader
  const [isUploadLoading, setIsUploadLoading] = useState(false); // ✅ For upload button
  const [isAnalyzeLoading, setIsAnalyzeLoading] = useState(false); // ✅ For analyze button

  const navigate = useNavigate();

  // ✅ Fetch latest resume every time dashboard loads
  useEffect(() => {
    const fetchLatestResume = async () => {
      const token = Cookies.get('token');
      if (!token) {
        setIsPageLoading(false);
        return;
      }
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/resume/latest`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?._id) {
          setResumeId(res.data._id);
        }
      } catch (err) {
        console.log('No existing resume found.');
      } finally {
        setIsPageLoading(false); // ✅ Remove page loader after fetch
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
    setIsUploadLoading(true);

    try {
      const token = Cookies.get('token');
      if (!token) {
        alert('You must be logged in to upload a resume.');
        return;
      }
      const formData = new FormData();
      formData.append('resumeFile', file);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/resume/upload`,
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
      setAnalysisResult(null);
    } catch (err) {
      console.error(err.response?.data || err);
      alert('File upload failed.');
    } finally {
      setIsUploadLoading(false);
    }
  };

  const onAnalyze = async () => {
    if (!resumeId) {
      alert('No resume found.');
      return;
    }
    setIsAnalyzeLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/resume/${resumeId}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalysisResult(res.data.analysis);
    } catch (err) {
      console.error(err.response?.data || err);
      alert('Analysis failed.');
    } finally {
      setIsAnalyzeLoading(false);
    }
  };

  const onStartInterview = () => {
    navigate('/interview', { state: { resumeId } });
  };

  if (isPageLoading) {
    return <FullScreenLoader />; // ✅ Full page loader
  }

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
        <p>
          Welcome to MockMate! Upload your resume (PDF) below to get started.
        </p>

        {/* Upload Resume */}
        <form onSubmit={onFileUpload} className="upload-form">
          <input
            className="inp"
            type="file"
            name="resumeFile"
            onChange={onFileChange}
          />
          <button
            type="submit"
            className="upload-button"
            disabled={isUploadLoading}
          >
            {isUploadLoading ? (
              <ButtonLoader />
            ) : resumeId ? (
              'Replace Resume'
            ) : (
              'Upload Resume'
            )}
          </button>
        </form>

        {/* Analyze Resume */}
        {resumeId && (
          <button
            onClick={onAnalyze}
            className="analyze-button"
            disabled={isAnalyzeLoading}
          >
            {isAnalyzeLoading ? <ButtonLoader /> : 'Analyze with Last Resume'}
          </button>
        )}

        {/* AI Analysis Result */}
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
