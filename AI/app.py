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

@app.route('/', methods=['GET'])
def home():
    return "AI Service is running 🚀", 200


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
    # print("Python AI: Received interview request.") # DEBUG 1
    try:
        data = request.json
        resume_text = data.get("resume_text")
        user_answer = data.get("user_answer")
        chat_history = data.get("chat_history", []) # Get the chat history

        if not resume_text or not user_answer:
            return jsonify({"error": "Missing resume text or user answer"}), 400

        # print("Python AI: Resume and answer received. Building prompt.") # DEBUG 2

        
        prompt = f"""
            You are an AI interviewer for students preparing for placements.
            Your goal is to conduct a complete interview based on the candidate's resume, covering all key areas.

            Resume Text:
            {resume_text}

            User's Latest Answer:
            {user_answer}

            Chat History (previous questions and answers):
            {chat_history}

            Guidelines:
            1. **Cover All Areas**:
                - Technical skills and concepts mentioned in the resume.
                - Projects (ask in-depth follow-up questions).
                - Problem-solving & analytical skills.
                - Behavioral questions (teamwork, leadership, challenges).
                - General aptitude / communication skills.

            2. **Flow**:
                - Start with technical/project-based questions.
                - Then ask behavioral and soft-skill questions.
                - Finally, ask general aptitude/non-technical questions.
                - Avoid repeating topics already covered in chat_history.

            3. **Name Handling**:
                - If the candidate’s name is recognizable in their first answer (introduction), remember it and use their name naturally in all follow-up questions and feedback.

            4. **Ending Criteria**:
                - Stop when you have asked enough questions to cover all important areas from the resume.
                - After coverage is complete, do not ask another question.
                - Instead, give a **Final Report**:
                    - Overall score (0–100)
                    - Section-wise performance
                    - Strengths
                    - Areas for improvement
                    - Suggestions for preparation

            5. **Format**:
                - If continuing:  
                Feedback: <1–2 sentence evaluation of latest answer>  
                Next Question: <the next interview question, using candidate’s name if known>
                - If ending:  
                Final Report: Overall Score: X, Technical: Y, Behavioral: Z, Non-Technical: W, Strengths: ..., Improvements: ..., Suggestions: ...

            Make sure the interview feels realistic and adaptive to the candidate’s resume.
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
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)

