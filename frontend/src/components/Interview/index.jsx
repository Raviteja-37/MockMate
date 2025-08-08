// Interview.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useLocation, useNavigate } from 'react-router-dom';
import './index.css';

const Interview = () => {
  const [question, setQuestion] = useState(
    'Click below to get your first question.'
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [resumeText, setResumeText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const navigate = useNavigate();
  const location = useLocation();

  const speak = (text) => {
    if (!window.speechSynthesis) return alert('Text-to-speech not supported.');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const getResumeText = async (id) => {
    try {
      const token = Cookies.get('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        `http://localhost:5001/api/resume/${id}`,
        config
      );
      return res.data.resumeText;
    } catch (error) {
      alert('Failed to load resume.');
      navigate('/dashboard');
      return null;
    }
  };

  const sendAnswerToAI = async (answer) => {
    setIsLoading(true);
    try {
      const token = Cookies.get('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.post(
        'http://localhost:5001/api/resume/interview',
        {
          resumeText,
          userAnswer: answer,
          chatHistory,
        },
        config
      );

      const aiResponse = res.data.feedback;
      setChatHistory((prev) => [...prev, { type: 'ai', text: aiResponse }]);
      setQuestion(aiResponse);

      if (aiResponse.includes('Final Interview Score:')) {
        setFinalScore(aiResponse);
      }
    } catch (error) {
      console.error('Interview error:', error);
      alert('Error during interview.');
    } finally {
      setIsLoading(false);
    }
  };

  const listen = () => {
    if (isListening || isSpeakingRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Web Speech API not supported.');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognitionRef.current = recognition;
    finalTranscriptRef.current = '';

    recognition.onstart = () => {
      console.log('Recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalTranscriptRef.current += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      setUserAnswer(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (e) => {
      console.error('Recognition error:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Recognition ended');
      setIsListening(false);
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        setChatHistory((prev) => [...prev, { type: 'user', text: finalText }]);
        sendAnswerToAI(finalText);
        setUserAnswer('');
      } else {
        console.warn('No final speech detected.');
      }
    };

    recognition.start();
  };

  const handleMainButtonClick = async () => {
    if (!isInitialized) {
      setIsLoading(true);
      const resumeId = location.state?.resumeId;
      if (!resumeId) return alert('No resume found');

      const text = await getResumeText(resumeId);
      if (text) {
        setResumeText(text);
        const intro = 'Welcome to your interview. Tell me about your projects.';
        setChatHistory([{ type: 'ai', text: intro }]);
        setQuestion(intro);
        setIsInitialized(true);
      }
      setIsLoading(false);
    } else {
      listen();
    }
  };

  useEffect(() => {
    if (question && isInitialized && !finalScore) {
      const speakAfterDelay = setTimeout(() => {
        speak(question);
      }, 500);
      return () => clearTimeout(speakAfterDelay);
    }
  }, [question, isInitialized, finalScore]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  return (
    <div className="interview-container">
      <div className="interview-content">
        <h2>Voice-Based Interview</h2>
        {finalScore ? (
          <div className="final-score-box">
            <h3>Final Interview Score</h3>
            <pre>{finalScore}</pre>
            <button
              onClick={() => navigate('/dashboard')}
              className="speech-button"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="chat-area">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.type}`}>
                  <p className="chat-text">
                    <strong>{msg.type === 'ai' ? 'AI:' : 'You:'}</strong>
                  </p>
                  <p className="chat-text">{msg.text}</p>
                </div>
              ))}
              {isListening && (
                <div className="chat-bubble user-interim">
                  <p className="chat-text">
                    <strong>You (Live):</strong> {userAnswer}
                  </p>
                </div>
              )}
              {isLoading && (
                <div className="chat-bubble ai">
                  <p className="chat-text">
                    <strong>AI:</strong> Thinking...
                  </p>
                </div>
              )}
            </div>
            <div className="controls">
              <button
                onClick={handleMainButtonClick}
                disabled={isLoading || isSpeakingRef.current}
                className="speech-button"
              >
                {isInitialized
                  ? isListening
                    ? 'Listening...'
                    : 'Start Speaking'
                  : 'Start Interview'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Interview;
