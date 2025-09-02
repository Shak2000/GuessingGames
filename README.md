# Guess the Famous Person 🎭

A fun web application that uses Google's Gemini AI to guess famous people based on user-provided information. The AI makes intelligent guesses with detailed explanations and learns from feedback to improve its accuracy.

## Features

- 🤖 **AI-Powered Guessing**: Uses Google Gemini 1.5 Flash API for intelligent person identification
- 🎯 **Interactive Feedback**: Users can mark guesses as correct or incorrect
- 🔄 **Learning System**: AI learns from incorrect guesses to make better subsequent attempts
- 💭 **Detailed Explanations**: Each guess includes both the person's name and reasoning
- 📸 **Automatic Image Extraction**: Beautiful Soup extracts person photos from Wikipedia pages
- 📊 **Comprehensive Biographical Data**: Birth/death dates, places, and Wikipedia links
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations and separate display boxes
- 📱 **Mobile Friendly**: Works perfectly on desktop and mobile devices
- ⚡ **Real-time**: Fast API responses with loading indicators and button states
- 🔧 **Clean Architecture**: Proper FastAPI static file serving and organized project structure

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Configure API Key

**Option A: Using config.py (Recommended)**
1. Edit the `config.py` file
2. Replace `"your_gemini_api_key_here"` with your actual API key:
   ```python
   GEMINI_API_KEY = "your_actual_api_key_here"
   ```

**Option B: Using Environment Variables**
```bash
# On macOS/Linux
export GEMINI_API_KEY="your_api_key_here"

# On Windows
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
3. **Review Guess**: The AI will display its guess with:
   - **Person's Photo**: Automatically extracted from Wikipedia (if available)
   - **Name Box**: The person's name in a blue gradient box
   - **Biographical Information**: Birth/death dates, places, and Wikipedia link
   - **Explanation Box**: The AI's reasoning in a gray box below
4. **Provide Feedback**: Click "Correct" if the guess is right, or "Incorrect" if it's wrong
5. **Continue**: If incorrect, the AI will make another guess with improved context
6. **Victory**: When the AI guesses correctly, you'll see a victory message!
7. **New Game**: Start fresh anytime by entering new information

## File Structure

```
FirstAPI/
├── main.py              # Core logic with Gemini API integration
├── app.py               # FastAPI web server and endpoints
├── config.py            # API key configuration
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── .gitignore          # Git ignore rules
└── static/             # Frontend files
    ├── index.html      # Main web interface
    ├── styles.css      # Modern styling and responsive design
    └── script.js       # Frontend JavaScript logic
```

### Key Files:
- **`main.py`** - Core game logic with Gemini API integration, image extraction, and session management
- **`app.py`** - FastAPI web server with proper static file serving
- **`config.py`** - API key configuration (excluded from version control)
- **`requirements.txt`** - Python dependencies including Beautiful Soup and requests
- **`static/`** - All frontend files organized in a dedicated directory

## API Endpoints

- `GET /` - Serves the main HTML page
- `POST /api/start-guess` - Starts a new guessing session
- `POST /api/submit-feedback` - Submits feedback for a guess
- `GET /api/session/{session_id}` - Gets session status
- `GET /api/health` - Health check endpoint
- `GET /static/*` - Serves static files (CSS, JS, images)
- `GET /favicon.ico` - Serves favicon
- `GET /.well-known/appspecific/com.chrome.devtools.json` - Chrome DevTools config

## Tips for Better Results

- **Be Specific**: Provide unique details about the person
- **Include Achievements**: Mention notable works, awards, or characteristics
- **Add Context**: Include time periods, locations, or fields of work
- **Be Distinctive**: The more unique the information, the better the AI can guess
- **Try Different Angles**: If the first guess is wrong, the AI learns and improves
- **Start Fresh**: You can begin a new game anytime with different information

## Recent Updates

- ✅ **Automatic Image Extraction**: Beautiful Soup extracts person photos from Wikipedia pages
- ✅ **Comprehensive Biographical Data**: Birth/death dates, places, and Wikipedia links
- ✅ **Enhanced AI Responses**: Now includes both name and detailed reasoning
- ✅ **Improved UI**: Separate display boxes for name, biographical info, and explanation
- ✅ **Better File Organization**: Static files moved to dedicated `/static` directory
- ✅ **Updated Gemini Model**: Using `gemini-1.5-flash` for better performance
- ✅ **Configuration Management**: API key stored in `config.py` with `.gitignore` protection
- ✅ **Enhanced User Experience**: Button states, loading indicators, and error handling
- ✅ **Smart Image Display**: CORS proxy support for Wikipedia images with beautiful styling

## Troubleshooting

- **API Key Error**: Make sure your API key is set in `config.py` or as an environment variable
- **Port Already in Use**: If port 8000 is busy, modify the port in `app.py`
- **Network Issues**: Check your internet connection for API calls
- **Static Files Not Loading**: Ensure the `/static` directory exists and contains all frontend files
- **Model Errors**: The app now uses `gemini-1.5-flash` - ensure your API key has access to this model
- **Image Loading Issues**: Images are fetched from Wikipedia using Beautiful Soup - check your internet connection
- **Dependency Issues**: Make sure to install all requirements: `pip install -r requirements.txt`
- **CORS Issues**: Wikipedia images use a CORS proxy (images.weserv.nl) for proper display

## Technology Stack

### **Backend:**
- **FastAPI**: Modern Python web framework for API endpoints
- **Google Gemini 1.5 Flash**: AI model for person identification and reasoning
- **Beautiful Soup 4**: HTML parsing for image extraction from Wikipedia
- **Requests**: HTTP library for web scraping

### **Frontend:**
- **Vanilla JavaScript**: Interactive game logic and API communication
- **CSS3**: Modern styling with gradients, animations, and responsive design
- **HTML5**: Semantic markup with accessibility features

### **Image Processing:**
- **Wikipedia Integration**: Automatic extraction of person photos from Wikipedia pages
- **CORS Proxy**: Uses images.weserv.nl for cross-origin image loading
- **Smart Filtering**: Size and content-based image selection

## Security Notes

- **API Key Protection**: The `config.py` file is included in `.gitignore` to prevent accidental commits
- **Environment Variables**: Alternative method for API key storage without hardcoding
- **Static File Serving**: Proper FastAPI static file mounting for security and performance
- **Web Scraping**: Respectful scraping with proper headers and rate limiting

Enjoy guessing famous people! 🎉
