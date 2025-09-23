# AI Knowledge Games App 🎮

A modern web platform featuring multiple interactive games powered by AI. Choose from our collection of engaging games including the famous person guessing game with Google Gemini AI integration. The platform offers intelligent gameplay with detailed explanations, learning systems, and rich multimedia experiences.

## Features

### Platform Features
- 🎮 **Multi-Game Platform**: Choose from 8 interactive games in one unified platform
- 🧭 **Easy Navigation**: Seamless navigation between games with persistent toolbar
- 🔗 **Cross-Game Linking**: Clickable links between related content across all games
- 📱 **Mobile Friendly**: Fully responsive design that works perfectly on all devices

### Games
- 🎭 **Guess the Famous Person**
- 🏙️ **Guess the City**
- 🎪 **Odd Situation Game**
- 📅 **Guess the Event**
- 🏢 **Guess the Business**
- 🔧 **Guess the Invention**
- 🎬 **Guess the Movie**
- 📺 **Guess the TV Show**

### AI-Powered API Features
- 🤖 **AI-Powered Guessing** Uses Google Gemini 2.5 Flash Lite API for intelligent entity identification (cutoff: January 2024)
- 🎯 **Interactive Feedback**: Users can mark guesses as correct or incorrect
- 🔄 **Learning System**: AI learns from incorrect guesses to make better subsequent attempts
- 📸 **Enhanced AI Image Generation**: Uses Gemini 2.5 Flash Image Preview with complete context for visual representations of events, inventions, and odd situations

### API Features
- 📸 **Automatic Image Extraction**: Beautiful Soup extracts person photos from Wikipedia pages
- 💰 **Real-time Financial Data**: Beautiful Soup extracts business information from trustworthy websites
- 🗺️ **Interactive Maps**: Google Maps JavaScript API shows birth and death locations with custom markers
- ⚡ **Real-time**: FastAPI responses with loading indicators and button states
- 🎤 **Text-to-Speech Integration**: Google Cloud Text-to-Speech with Gemini 2.5 Flash Preview TTS model, featuring 30 voice options for reading AI-generated overviews

### Other Features
- 🔄 **Session Management**: Tracks game progress and maintains state throughout the session
- 📋 **JSON Format**: Structured data exchange between frontend and backend for reliable parsing
- 🔗 **Wikipedia Integration**: Direct links to relevant Wikipedia pages

### Cross-Game Linking System
- **Clickable Content**: Related items (people, events, businesses, cities, technologies) are displayed as clickable links
- **Automatic Navigation**: Clicking a link automatically navigates to the relevant game
- **Auto-Search**: The target game automatically searches for the clicked item
- **Visual Distinction**: Different colored links for different content types

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get API Keys

**Google Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

**Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (for interactive maps)
   - **Geocoding API** (for address to coordinates conversion)
4. Create credentials → API Key
5. Copy the API key

### 3. Configure API Keys

**Using config.py (Recommended)**
1. Edit the `config.py` file
2. Replace the placeholder values with your actual API keys:
   ```python
   GEMINI_API_KEY = "your_actual_gemini_api_key_here"
   GOOGLE_MAPS_API_KEY = "your_actual_google_maps_api_key_here"
   ```

**Using Environment Variables**
```bash
# On macOS/Linux
export GEMINI_API_KEY="your_gemini_api_key_here"
export GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"

# On Windows
set GEMINI_API_KEY=your_gemini_api_key_here
set GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 4. Run the Application

```bash
python app.py
```

The application will be available at `http://localhost:8000`

## File Structure

```
FirstAPI/
├── app.py               # Main FastAPI application with multi-game routing and TTS endpoints
├── person.py            # Guess the Famous Person game logic with Gemini AI integration
├── city.py              # Guess the City game logic with Gemini AI integration
├── event.py             # Guess the Historical Event game logic with enhanced AI image generation
├── odd.py               # Odd Situation Game logic with AI-generated scenarios
├── business.py          # Guess the Business game logic with Gemini AI integration
├── movie.py             # Guess the Movie game logic with Gemini AI integration
├── invention.py         # Guess the Invention game logic with Gemini AI integration
├── tvshow.py            # Guess the TV Show game logic with Gemini AI integration
├── settings.py          # Voice settings and user preference management
├── config.py            # API key configuration
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── GEMINI_TTS_SETUP.md # Comprehensive TTS setup guide
├── people.txt          # Famous people data for Odd Situation Game
├── outfits.txt         # Outfit data for Odd Situation Game
├── settings.txt        # Setting data for Odd Situation Game
├── user_settings/      # Directory for storing user voice preferences
└── static/             # Frontend files
    ├── index.html      # Home page with game selection
    ├── person.html     # Guess the Famous Person game interface
    ├── city.html       # Guess the City game interface
    ├── event.html      # Guess the Historical Event game interface
    ├── odd.html        # Odd Situation Game interface
    ├── business.html   # Guess the Business game interface
    ├── movie.html      # Guess the Movie game interface
    ├── invention.html  # Guess the Invention game interface
    ├── tvshow.html     # Guess the TV Show game interface
    ├── settings.html   # Voice settings and preferences interface
    ├── styles.css      # Modern styling and responsive design
    ├── script.js       # General app utilities and shared functionality
    ├── toolbar.js      # Navigation toolbar functionality
    ├── audio-manager.js # Optimized audio management with caching and TTS integration
    ├── person.js       # Famous Person game specific JavaScript logic
    ├── city.js         # City guessing game specific JavaScript logic
    ├── event.js        # Historical Event game specific JavaScript logic
    ├── odd.js          # Odd Situation Game specific JavaScript logic
    ├── business.js     # Business guessing game specific JavaScript logic
    ├── movie.js        # Movie guessing game specific JavaScript logic
    ├── invention.js    # Invention guessing game specific JavaScript logic
    ├── tvshow.js       # TV Show guessing game specific JavaScript logic
    ├── settings.js     # Voice settings interface and testing functionality
    ├── favicon.ico     # App favicon (ICO format)
    └── favicon.png     # App favicon (PNG format)
```

### Key Files:
- **`app.py`** - Main FastAPI application with multi-game routing, API endpoints, and TTS integration
- **`person.py`** - Guess the Famous Person game logic with Gemini AI integration, JSON response format, overview generation, image extraction, and session management
- **`city.py`** - Guess the City game logic with Gemini AI integration, JSON response format, and session management
- **`event.py`** - Guess the Historical Event game logic with enhanced AI image generation using complete event context
- **`odd.py`** - Odd Situation Game logic with AI-generated scenarios, random outfit/setting combinations, and session management
- **`business.py`** - Guess the Business game logic with Gemini AI integration, comprehensive business data, financial information, and session management
- **`movie.py`** - Guess the Movie game logic with Gemini AI integration, comprehensive movie data, cast/crew information, production details, and session management
- **`invention.py`** - Guess the Invention game logic with Gemini AI integration, comprehensive technology data, inventor information, and session management
- **`tvshow.py`** - Guess the TV Show game logic with Gemini AI integration, comprehensive TV show data, cast information, and session management
- **`settings.py`** - Voice settings and user preference management with 30 Gemini TTS voices support
- **`config.py`** - API key configuration (excluded from version control)
- **`requirements.txt`** - Python dependencies including Beautiful Soup, requests, Google Maps client, and TTS libraries
- **`GEMINI_TTS_SETUP.md`** - Comprehensive setup guide for Google Cloud Text-to-Speech with Gemini TTS
- **`people.txt`** - Famous people data file for Odd Situation Game scenarios
- **`outfits.txt`** - Outfit data file for Odd Situation Game scenarios
- **`settings.txt`** - Setting data file for Odd Situation Game scenarios
- **`user_settings/`** - Directory for storing individual user voice preferences and settings
- **`static/index.html`** - Home page with game selection grid
- **`static/person.html`** - Guess the Famous Person game interface
- **`static/city.html`** - Guess the City game interface
- **`static/event.html`** - Guess the Historical Event game interface
- **`static/odd.html`** - Odd Situation Game interface
- **`static/business.html`** - Guess the Business game interface
- **`static/movie.html`** - Guess the Movie game interface
- **`static/invention.html`** - Guess the Invention game interface
- **`static/tvshow.html`** - Guess the TV Show game interface
- **`static/settings.html`** - Voice settings and preferences interface with voice testing
- **`static/toolbar.js`** - Navigation toolbar functionality and active state management
- **`static/script.js`** - General app utilities and shared functionality for all games
- **`static/audio-manager.js`** - Optimized audio management class with intelligent caching, TTS integration, and error handling
- **`static/person.js`** - Famous Person game specific JavaScript logic and UI interactions
- **`static/city.js`** - City guessing game specific JavaScript logic and UI interactions
- **`static/event.js`** - Historical Event game specific JavaScript logic and UI interactions
- **`static/odd.js`** - Odd Situation Game specific JavaScript logic and UI interactions
- **`static/business.js`** - Business guessing game specific JavaScript logic and UI interactions
- **`static/movie.js`** - Movie guessing game specific JavaScript logic and UI interactions
- **`static/invention.js`** - Invention guessing game specific JavaScript logic and UI interactions
- **`static/tvshow.js`** - TV Show guessing game specific JavaScript logic and UI interactions
- **`static/settings.js`** - Voice settings interface with voice testing, selection, and preference management
- **`static/`** - All frontend files organized in a dedicated directory

## API Endpoints

### Core Platform Endpoints
- `GET /` - Serves the home page with game selection
- `GET /person` - Serves the Guess the Famous Person game page
- `GET /city` - Serves the Guess the City game page
- `GET /odd` - Serves the Odd Situation Game page
- `GET /event` - Serves the Guess the Historical Event game page
- `GET /business` - Serves the Guess the Business game page
- `GET /movie` - Serves the Guess the Movie game page
- `GET /invention` - Serves the Guess the Invention game page
- `GET /tvshow` - Serves the Guess the TV Show game page
- `GET /settings` - Serves the voice settings and preferences page
- `GET /api/health` - Health check endpoint
- `GET /static/*` - Serves static files (CSS, JS, images, favicons)
- `GET /favicon.ico` - Serves app favicon (ICO format)
- `GET /favicon.png` - Serves app favicon (PNG format)
- `GET /.well-known/appspecific/com.chrome.devtools.json` - Chrome DevTools config

### Guess the Famous Person Game
- `POST /api/start-guess` - Starts a new guessing session
- `POST /api/submit-feedback` - Submits feedback for a guess
- `GET /api/session/{session_id}` - Gets session status
- `GET /api/maps-key` - Securely serves Google Maps API key to frontend
- `GET /api/test-maps` - Tests Google Maps API key functionality
- `GET /api/test-static-map` - Tests Google Maps Static API (for debugging)

### Guess the City Game
- `POST /api/start-city-guess` - Starts a new city guessing session
- `POST /api/submit-city-feedback` - Submits feedback for a city guess
- `GET /api/city-session/{session_id}` - Gets city guessing session information

### Guess the Historical Event Game
- `POST /api/start-event-guess` - Starts a new event guessing session
- `POST /api/submit-event-feedback` - Submits feedback for an event guess
- `GET /api/event-session/{session_id}` - Gets event guessing session information

### Odd Situation Game
- `POST /api/start-odd-game` - Starts a new odd situation game session
- `POST /api/submit-odd-guess` - Submits a guess for the odd situation
- `POST /api/reveal-odd-answer` - Reveals the correct answer for the odd situation
- `GET /api/odd-session/{session_id}` - Gets odd situation game session information

### Guess the Business Game
- `POST /api/start-business-guess` - Starts a new business guessing session
- `POST /api/submit-business-feedback` - Submits feedback for a business guess
- `GET /api/business-session/{session_id}` - Gets business guessing session information

### Guess the Movie Game
- `POST /api/start-movie-guess` - Starts a new movie guessing session
- `POST /api/submit-movie-feedback` - Submits feedback for a movie guess
- `GET /api/movie-session/{session_id}` - Gets movie guessing session information

### Guess the Invention Game
- `POST /api/start-invention-guess` - Starts a new invention guessing session
- `POST /api/submit-invention-feedback` - Submits feedback for an invention guess
- `GET /api/invention-session/{session_id}` - Gets invention guessing session information

### Guess the TV Show Game
- `POST /api/start-tvshow-guess` - Starts a new TV show guessing session
- `POST /api/submit-tvshow-feedback` - Submits feedback for a TV show guess
- `GET /api/tvshow-session/{session_id}` - Gets TV show guessing session information

### Voice & Text-to-Speech Features
- `POST /api/generate-tts` - Generates TTS audio with custom prompts using Gemini TTS
- `POST /api/test-voice` - Tests a specific voice with sample text
- `POST /api/save-settings` - Saves user voice preferences and settings
- `GET /api/get-settings` - Retrieves user voice preferences and settings

## Tips for Better Results

- **Be Specific**: Provide unique details about the person
- **Include Achievements**: Mention notable works, awards, or characteristics
- **Add Context**: Include time periods, locations, or fields of work
- **Be Distinctive**: The more unique the information, the better the AI can guess
- **Try Different Angles**: If the first guess is wrong, the AI learns and improves
- **Explore Family Trees**: Click on family member names to discover related famous people
- **Start Fresh**: You can begin a new game anytime with different information
- **Voice Settings**: Visit the settings page to customize your preferred voice for overview reading
- **Test Voices**: Use the voice testing feature to find the perfect voice for your experience

## Troubleshooting

### General Issues
- **API Key Error**: Make sure both Gemini and Google Maps API keys are set in `config.py` or as environment variables
- **Google Maps Not Loading**: Ensure you have enabled "Maps JavaScript API" and "Geocoding API" in Google Cloud Console
- **Port Already in Use**: If port 8000 is busy, modify the port in `app.py`
- **Network Issues**: Check your internet connection for API calls
- **Static Files Not Loading**: Ensure the `/static` directory exists and contains all frontend files
- **Model Errors**: The app now uses `gemini-2.5-flash-lite` - ensure your API key has access to this model
- **Image Loading Issues**: Images are fetched from Wikipedia using Beautiful Soup - check your internet connection
- **Dependency Issues**: Make sure to install all requirements: `pip install -r requirements.txt`
- **CORS Issues**: Wikipedia images use a CORS proxy (images.weserv.nl) for proper display
- **Map Display Issues**: Check browser console for Google Maps API errors and verify API key restrictions
- **Billing Issues**: Google Maps APIs require billing to be enabled even for free tier usage

### Text-to-Speech Issues
- **TTS Not Working**: Ensure Google Cloud Text-to-Speech API is enabled and `google-cloud-texttospeech>=2.29.0` is installed
- **Voice Not Found**: Verify you're using a valid Gemini TTS voice name and the correct model `gemini-2.5-flash-preview-tts`
- **Permission Denied**: Check that your Google Cloud service account has the `Cloud Text-to-Speech User` role
- **Audio Not Playing**: Verify browser audio permissions and check that audio files are being generated (MP3 format)
- **TTS Credentials**: Set up Google Cloud credentials correctly - see `GEMINI_TTS_SETUP.md` for detailed instructions
- **Voice Settings Not Saving**: Ensure the `user_settings/` directory exists and has write permissions
- **Caching Issues**: Clear browser cache if experiencing outdated audio playback
- **Audio Quality**: Ensure stable internet connection for optimal TTS generation and playback

## Technology Stack

### **Backend:**
- **FastAPI**: Modern Python web framework with multi-game routing and API endpoints
- **Modular Architecture**: Separate game logic modules (person.py, city.py, event.py, tvshow.py, etc.) for scalability
- **Google Gemini 2.5 Flash Lite**: AI model for entity identification, overview generation, and reasoning with JSON response format
- **Google Gemini 2.5 Flash Image Preview**: AI image generation with complete context for historically accurate visual representations
- **Google Cloud Text-to-Speech**: Gemini 2.5 Flash Preview TTS model with 30 voice options for natural speech synthesis
- **Beautiful Soup 4**: HTML parsing for image extraction from Wikipedia
- **Requests**: HTTP library for web scraping
- **Google Maps Python Client**: Geocoding API integration for address-to-coordinates conversion
- **JSON Processing**: Structured data handling with markdown code block parsing
- **Session Management**: Individual session tracking for each game
- **Voice Settings Management**: User preference persistence with file-based storage

### **Frontend:**
- **Modular JavaScript Architecture**: 
  - `script.js` - General app utilities and shared functionality
  - `audio-manager.js` - Centralized TTS audio management with intelligent caching
  - Individual game-specific JavaScript modules for each game type
- **Multi-Page Architecture**: Separate HTML pages for each game with shared navigation
- **Google Maps JavaScript API**: Interactive maps with custom markers and bounds
- **Advanced Audio Management**: Optimized TTS integration with caching, error handling, and playback controls
- **Settings Interface**: Comprehensive voice preference management with real-time testing
- **CSS3**: Modern styling with gradients, animations, and responsive design
- **HTML5**: Semantic markup with accessibility features and audio support
- **JSON Parsing**: Robust handling of both JSON objects and JSON strings with fallback mechanisms

### **Platform Features:**
- **Navigation System**: Persistent toolbar with active state indicators across all pages
- **Game Selection**: Home page with feature cards and game descriptions
- **Unified Design**: Consistent UI/UX across all games and platform pages
- **Extensible Framework**: Ready for additional games with minimal configuration

### **Image Processing:**
- **Wikipedia Integration**: Automatic extraction of person photos from Wikipedia pages
- **CORS Proxy**: Uses images.weserv.nl for cross-origin image loading
- **Smart Filtering**: Size and content-based image selection

### **Maps Integration:**
- **Google Maps JavaScript API**: Interactive maps with zoom, pan, and custom markers
- **Google Geocoding API**: Converts place names to latitude/longitude coordinates
- **Custom Markers**: Green "B" markers for birthplaces, red "D" markers for deathplaces
- **Smart Bounds**: Automatically fits map view to show all relevant locations

## Security Notes

- **API Key Protection**: The `config.py` file is included in `.gitignore` to prevent accidental commits
- **Environment Variables**: Alternative method for API key storage without hardcoding
- **Static File Serving**: Proper FastAPI static file mounting for security and performance
- **Web Scraping**: Respectful scraping with proper headers and rate limiting
- **Secure API Key Serving**: Google Maps API key is served through backend endpoint to prevent exposure
- **CORS Handling**: Proper cross-origin resource sharing configuration for external APIs
- **Input Validation**: Comprehensive type checking and null safety in frontend JavaScript
- **Error Handling**: Graceful fallback mechanisms for API failures and parsing errors

Enjoy guessing famous people! 🎉
