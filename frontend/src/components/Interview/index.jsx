import React, { useState, useEffect } from 'react';
import './index.css';

const Interview = () => {
  const [question, setQuestion] = useState(
    'Welcome to your interview. Click the button to get the first question.'
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false); // Better name for tracking initialization

  const speak = (text) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    window.speechSynthesis.speak(speech);
  };

  const listen = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support the Web Speech API.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Listening for your answer...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserAnswer(transcript);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const startInterview = async () => {
    if (isInitialized) return; // Prevent multiple initializations
    setIsLoading(true);
    setResumeText(
      'Ravi is a B.Tech graduate skilled in React.js and Python. He built a project called LifeGPT.'
    );
    setQuestion('Welcome to your interview. Tell me about your projects.');
    speak('Welcome to your interview. Tell me about your projects.');
    setIsLoading(false);
    setIsInitialized(true);
  };

  // This will only run once when component mounts
  useEffect(() => {
    startInterview();
    return () => {
      // Cleanup: cancel any ongoing speech when component unmounts
      window.speechSynthesis.cancel();
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="interview-container">
      <div className="interview-content">
        <h2>Voice-Based Interview</h2>
        <div className="chat-area">
          <div className="chat-bubble ai">
            <p className="chat-text">AI Interviewer:</p>
            <p className="chat-text">{question}</p>
          </div>
          <div className="chat-bubble user">
            <p className="chat-text">Your Answer:</p>
            <p className="chat-text">{userAnswer}</p>
          </div>
        </div>
        <div className="controls">
          <button
            onClick={listen}
            disabled={isListening || isLoading}
            className="speech-button"
          >
            {isListening ? 'Listening...' : 'Start Speaking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Interview;
