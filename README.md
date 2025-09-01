# Guess the Famous Person 🎭

A fun web application that uses Google's Gemini AI to guess famous people based on user-provided information. The AI makes intelligent guesses and learns from feedback to improve its accuracy.

## Features

- 🤖 **AI-Powered Guessing**: Uses Google Gemini API for intelligent person identification
- 🎯 **Interactive Feedback**: Users can mark guesses as correct or incorrect
- 🔄 **Learning System**: AI learns from incorrect guesses to make better subsequent attempts
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 📱 **Mobile Friendly**: Works perfectly on desktop and mobile devices
- ⚡ **Real-time**: Fast API responses with loading indicators

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Set Environment Variable

**On macOS/Linux:**
```bash
export GEMINI_API_KEY="your_api_key_here"
```

**On Windows:**
```cmd
set GEMINI_API_KEY=your_api_key_here
```

### 4. Run the Application

```bash
python app.py
```

The application will be available at `http://localhost:8000`

## How to Use

1. **Enter Information**: Type information about a famous person in the text area
2. **Submit**: Click "Submit Information" or press Ctrl+Enter
3. **Review Guess**: The AI will make its first guess
4. **Provide Feedback**: Click "Correct" if the guess is right, or "Incorrect" if it's wrong
5. **Continue**: If incorrect, the AI will make another guess based on your feedback
6. **Victory**: When the AI guesses correctly, you'll see a victory message!

## File Structure

- `main.py` - Core logic with Gemini API integration
- `app.py` - FastAPI web server and endpoints
- `index.html` - Main web interface
- `styles.css` - Modern styling and responsive design
- `script.js` - Frontend JavaScript logic
- `requirements.txt` - Python dependencies

## API Endpoints

- `GET /` - Serves the main HTML page
- `POST /api/start-guess` - Starts a new guessing session
- `POST /api/submit-feedback` - Submits feedback for a guess
- `GET /api/session/{session_id}` - Gets session status
- `GET /api/health` - Health check endpoint

## Tips for Better Results

- Provide specific, unique details about the person
- Include notable achievements, works, or characteristics
- The more distinctive the information, the better the AI can guess
- You can start a new game anytime by entering new information

## Troubleshooting

- **API Key Error**: Make sure your `GEMINI_API_KEY` environment variable is set correctly
- **Port Already in Use**: If port 8000 is busy, modify the port in `app.py`
- **Network Issues**: Check your internet connection for API calls

Enjoy guessing famous people! 🎉
