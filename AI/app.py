# AI/app.py
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

# A simple endpoint to test if the server is running
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message": "Pong! AI service is running."})

# The main endpoint for resume analysis
@app.route('/analyze_resume', methods=['POST'])
def analyze_resume():
    try:
        data = request.json
        resume_text = data.get("resume_text")
        
        if not resume_text:
            return jsonify({"error": "No resume text provided"}), 400

        # Define the prompt for the Gemini AI model
        prompt = f"""
        You are a helpful and detailed resume analysis assistant. Your task is to analyze the provided resume text and provide a score, detailed feedback, and generate relevant interview questions.

        Resume Text:
        {resume_text}

        Please follow these instructions exactly:
        1.  **Resume Score:** Provide a score from 1 to 100 based on the resume's overall quality, clarity, and professionalism.
        2.  **Key Highlights:** Identify the top 3-5 key skills and 1-2 major projects/experiences from the resume.
        3.  **Detailed Feedback:** Provide constructive feedback in bullet points. Include suggestions on how to improve the resume's clarity, impact, and formatting.
        4.  **Interview Questions:** Generate 7 relevant interview questions based on the content of the resume. 3 should be a technical question, and 4 should be behavioral questions.
        
        Format your response as a single, readable string.
        """
        
        # Call the Gemini API
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        # Check if the response contains any content
        if response.text:
            return jsonify({"analysis": response.text})
        else:
            return jsonify({"error": "Failed to generate a response from the AI model."}), 500

    except Exception as e:
        print(f"Error during AI analysis: {e}")
        return jsonify({"error": "An error occurred during the analysis."}), 500

if __name__ == '__main__':
    app.run(port=5002, debug=True)