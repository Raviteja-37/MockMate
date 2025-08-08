import os
import google.generativeai as genai
from flask import Flask, jsonify, request
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Configure the Gemini API with your key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__)

# The main endpoint for resume analysis
@app.route('/analyze_resume', methods=['POST'])
def analyze_resume():
    try:
        data = request.json
        resume_text = data.get("resume_text")
        
        if not resume_text:
            return jsonify({"error": "No resume text provided"}), 400

        prompt = f"""
        You are a helpful resume analysis assistant. Your task is to analyze the provided resume text and provide a score, detailed feedback, and generate relevant interview questions.

        Resume Text:
        {resume_text}

        Please follow these instructions exactly:
        1.  **Resume Score:** Provide a score from 1 to 100.
        2.  **Key Highlights:** Identify the top 3-5 key skills and 1-2 major projects/experiences.
        3.  **Detailed Feedback:** Provide constructive feedback in bullet points.
        4.  **Interview Questions:** Generate 3 relevant interview questions based on the resume.

        Format your response as a single, readable string.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        if response.text:
            return jsonify({"analysis": response.text})
        else:
            return jsonify({"error": "Failed to generate a response from the AI model."}), 500

    except Exception as e:
        print(f"Error during AI analysis: {e}")
        return jsonify({"error": "An error occurred during the analysis."}), 500

# The new endpoint for the voice-based interview
@app.route('/interview', methods=['POST'])
def interview():
    print("Python AI: Received interview request.") # DEBUG 1
    try:
        data = request.json
        resume_text = data.get("resume_text")
        user_answer = data.get("user_answer")
        chat_history = data.get("chat_history", []) # Get the chat history

        if not resume_text or not user_answer:
            return jsonify({"error": "Missing resume text or user answer"}), 400

        print("Python AI: Resume and answer received. Building prompt.") # DEBUG 2
        prompt = f"""
        You are an AI interviewer. Your role is to ask the user a single interview question based on their resume and then evaluate their answer.

        Resume Text:
        {resume_text}

        User's Answer:
        {user_answer}
        
        Chat History:
        {chat_history}

        Based on the resume and the user's answer, please do the following:
        1.  **Evaluation:** Provide brief, constructive feedback on the user's answer.
        2.  **Next Question:** Ask a single, follow-up interview question that is either a technical, behavioral, or situational question. Make sure the question is relevant to the resume.

        Format your response as a single, readable string.
        """
        
        # Call the Gemini API
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("Python AI: Sending request to Gemini API...")  # DEBUG 3
        response = model.generate_content(prompt)
        print("Python AI: Received response from Gemini API.")  # DEBUG 4
        
        if response.text:
            return jsonify({"feedback": response.text})
        else:
            return jsonify({"error": "Failed to generate a response from the AI model."}), 500

    except Exception as e:
        print(f"Error during AI interview: {e}")
        return jsonify({"error": "An error occurred during the interview."}), 500

if __name__ == '__main__':
    app.run(port=5002, debug=True)
