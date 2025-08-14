// Interview.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useLocation, useNavigate } from 'react-router-dom';
import { FullScreenLoader, ButtonLoader } from '../Loader';
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
  const [silenceCountdown, setSilenceCountdown] = useState(0);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const chatAreaRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chatHistory, isListening, isLoading]);

  const speak = (text) => {
    if (!window.speechSynthesis) return alert('Text-to-speech not supported.');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const preferredVoice =
        availableVoices.find((v) => v.name === 'Trinoids en-US') ||
        availableVoices.find((v) => v.name === 'Google US English') ||
        availableVoices[0];

      setSelectedVoice(preferredVoice);
    };

    loadVoices();

    // Some browsers load voices asynchronously, so listen for this event
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const getResumeText = async (id) => {
    try {
      const token = Cookies.get('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/resume/${id}`,
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
        `${import.meta.env.VITE_API_URL}/api/resume/interview`,
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
    recognition.continuous = true;

    recognitionRef.current = recognition;
    finalTranscriptRef.current = '';

    let silenceTimer;
    let countdownInterval;

    const resetSilenceTimer = () => {
      // Clear existing timers
      clearTimeout(silenceTimer);
      clearInterval(countdownInterval);

      // Start 5 second countdown
      let timeLeft = 5;
      setSilenceCountdown(timeLeft);

      countdownInterval = setInterval(() => {
        timeLeft -= 1;
        setSilenceCountdown(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      silenceTimer = setTimeout(() => {
        recognition.stop();
      }, 5000);
    };

    recognition.onstart = () => {
      console.log('Recognition started');
      setIsListening(true);
      resetSilenceTimer();
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

      resetSilenceTimer();
    };

    recognition.onerror = (e) => {
      console.error('Recognition error:', e.error);
      setIsListening(false);
      clearTimeout(silenceTimer);
      clearInterval(countdownInterval);
      setSilenceCountdown(0);
    };

    recognition.onend = () => {
      console.log('Recognition ended');
      setIsListening(false);
      clearTimeout(silenceTimer);
      clearInterval(countdownInterval);
      setSilenceCountdown(0);

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

  const greetings = [
    "Hello! It's great to meet you. Let's start with a brief introduction about yourself.",
    'Hi there! Thanks for joining today. Could you please introduce yourself?',
    "Good to have you here. Why don't you start by telling me a little about yourself?",
    'Welcome! Let’s begin with you introducing yourself.',
    'Thanks for taking the time today. Can you start by sharing a bit about who you are?',
    'Hi! Let’s kick things off with a quick introduction. Tell me about yourself.',
    'Glad you could make it. Could you please introduce yourself to get us started?',
    'Hello! Before we dive in, I’d love for you to tell me a little about yourself.',
    'Great to connect! Let’s start with you giving a brief introduction about your background.',
    'Hi, and thanks for being here. Please start by telling me a bit about yourself.',
  ];

  const getRandomGreeting = () => {
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const handleMainButtonClick = async () => {
    if (!isInitialized) {
      setIsLoading(true);
      const resumeId = location.state?.resumeId;
      if (!resumeId) return alert('No resume found');

      const text = await getResumeText(resumeId);
      if (text) {
        setResumeText(text);
        const intro = getRandomGreeting();
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
      {isLoading && <FullScreenLoader />} {/* Overlay Loader */}
      <div className="interview-content">
        <h2>Voice-Based Interview</h2>
        <div className="voice-selector">
          <select
            id="voiceSelect"
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = voices.find((v) => v.name === e.target.value);
              setSelectedVoice(voice);
            }}
          >
            {voices.map((voice, idx) => (
              <option key={idx} value={voice.name}>
                {voice.name} {voice.lang} {voice.default ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>

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
            <div className="chat-area" ref={chatAreaRef}>
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
            </div>

            <div className="controls">
              <button
                onClick={handleMainButtonClick}
                disabled={isLoading || isSpeakingRef.current}
                className="speech-button"
              >
                {isLoading ? (
                  <ButtonLoader />
                ) : isInitialized ? (
                  isListening ? (
                    'Listening...'
                  ) : (
                    'Start Speaking'
                  )
                ) : (
                  'Start Interview'
                )}
              </button>
              {isListening && silenceCountdown > 0 && (
                <div className="silence-timer">
                  <p>
                    Listening... Auto-stopping in {silenceCountdown} second
                    {silenceCountdown !== 1 ? 's' : ''}.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Interview;
