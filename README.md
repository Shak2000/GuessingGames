# Multi-Game App 🎮

A modern web platform featuring multiple interactive games powered by AI. Choose from our collection of engaging games including the famous person guessing game with Google Gemini AI integration. The platform offers intelligent gameplay with detailed explanations, learning systems, and rich multimedia experiences.

## Features

### Platform Features
- 🎮 **Multi-Game Platform**: Choose from 5 interactive games in one unified platform
- 🧭 **Easy Navigation**: Seamless navigation between games with persistent toolbar
- 🔗 **Cross-Game Linking**: Clickable links between related content across all games
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations and consistent styling
- 🖼️ **Custom Branding**: Custom favicon support with multiple format compatibility
- 📱 **Mobile Friendly**: Fully responsive design that works perfectly on all devices

### Guess the Famous Person Game
- 🤖 **AI-Powered Guessing**: Uses Google Gemini 2.5 Flash Lite API for intelligent person identification (cutoff: January 2024)
- 🎯 **Interactive Feedback**: Users can mark guesses as correct or incorrect
- 🔄 **Learning System**: AI learns from incorrect guesses to make better subsequent attempts
- 💭 **Detailed Explanations**: Each guess includes both the person's name and reasoning
- 📝 **Concise Overview**: 50-75 word summary of each person's life and achievements displayed in a styled yellow box
- 📸 **Automatic Image Extraction**: Beautiful Soup extracts person photos from Wikipedia pages
- 📊 **Comprehensive Biographical Data**: Birth/death dates, places, and Wikipedia links
- 👨‍👩‍👧‍👦 **Interactive Family Tree**: Displays parents, siblings, spouses, and children with clickable names for navigation
- 🔗 **Multiple Spouse Support**: Properly handles and displays people with multiple marriages individually
- 🗺️ **Interactive Maps**: Google Maps JavaScript API shows birth and death locations with custom markers
- ⚡ **Real-time**: Fast API responses with loading indicators and button states
- 🔧 **Clean Architecture**: Proper FastAPI static file serving and organized project structure
- 📋 **JSON Format**: Structured data exchange between frontend and backend for reliable parsing

### Guess the City Game
- 🤖 **AI-Powered Guessing**: Uses Google Gemini 2.5 Flash Lite API for intelligent city identification
- 🎯 **Interactive Feedback**: Users can mark guesses as correct or incorrect
- 🔄 **Learning System**: AI learns from incorrect guesses to make better subsequent attempts
- 💭 **Detailed Explanations**: Each guess includes both the city's name and reasoning
- 📝 **Concise Overview**: 50-75 word summary of each city's history and significance
- 🏛️ **Administrative Information**: County, parish, borough, state, prefecture, province, department, region, territory, canton, voivodeship, autonomous community, and other administrative divisions
- 📅 **Founding Information**: Year founded when available
- 👥 **Population Data**: City population when available
- 📸 **Automatic Image Extraction**: Beautiful Soup automatically extracts city photos from Wikipedia pages using the same proven method as the famous person game
- 🔗 **Wikipedia Integration**: Direct links to city Wikipedia pages
- ⚡ **Real-time**: Fast API responses with loading indicators and button states
- 🔧 **Clean Architecture**: Proper FastAPI static file serving and organized project structure
- 📋 **JSON Format**: Structured data exchange between frontend and backend for reliable parsing

### Guess the Historical Event Game
- 🤖 **AI-Powered Guessing**: Uses Google Gemini 2.5 Flash Lite API for intelligent historical event identification
- 🎯 **Interactive Feedback**: Users can mark guesses as correct or incorrect
- 🔄 **Learning System**: AI learns from incorrect guesses to make better subsequent attempts
- 💭 **Detailed Explanations**: Each guess includes both the event name and reasoning
- 📝 **Comprehensive Event Data**: Complete JSON information including dates, locations, key figures, causes, developments, and results
- 🏙️ **Key Cities**: AI identifies and displays key cities involved in historical events as clickable links ✨ **NEW**
- 📸 **Enhanced AI Image Generation**: Uses Gemini 2.5 Flash Image Preview with complete event context for historically accurate visual representations
- 🗺️ **Interactive Maps**: Google Maps integration showing event locations with custom markers
- 🏛️ **Rich Context**: Event overview, key figures, causes, developments, and outcomes
- 🔗 **Wikipedia Integration**: Direct links to event Wikipedia pages with automatic image extraction
- ⚡ **Real-time**: Fast API responses with loading indicators and button states
- 🔧 **Clean Architecture**: Proper FastAPI static file serving and organized project structure
- 📋 **JSON Format**: Structured data exchange between frontend and backend for reliable parsing

### Odd Situation Game
- 🎨 **AI-Generated Images**: Uses Google Gemini 2.5 Flash Image Preview to create unique visual scenarios
- 🎭 **Random Outfits**: Combines famous people with unusual outfits from a curated list
- 🌍 **Unique Settings**: Places characters in unexpected locations and situations
- 🎯 **Guess & Reveal**: Players guess the famous person, then reveal the answer with detailed information
- 📝 **Comprehensive Data**: Complete biographical information including birth/death dates, achievements, and Wikipedia links
- 📸 **Automatic Image Extraction**: Beautiful Soup extracts person photos from Wikipedia pages
- 🔄 **Session Management**: Tracks game progress and maintains state throughout the session
- ⚡ **Real-time**: Fast API responses with loading indicators and button states
- 🔧 **Clean Architecture**: Proper FastAPI static file serving and organized project structure
- 📋 **JSON Format**: Structured data exchange between frontend and backend for reliable parsing

### Guess the Business Game
- 🤖 **AI-Powered Guessing**: Uses Google Gemini 2.5 Flash Lite API for intelligent business identification
- 🎯 **Interactive Feedback**: Users can mark guesses as correct or incorrect
- 🔄 **Learning System**: AI learns from incorrect guesses to make better subsequent attempts
- 💭 **Detailed Explanations**: Each guess includes both the business name and reasoning
- 📝 **Comprehensive Business Data**: Complete JSON information including founding details, financial data, leadership, products/services, and company history
- 📸 **Automatic Logo Extraction**: Beautiful Soup extracts business logos from Wikipedia pages
- 🗺️ **Interactive Maps**: Google Maps integration showing business headquarters and locations
- 💰 **Financial Information**: Revenue, market cap, employee count, and other business metrics when available
- 👔 **Leadership Details**: CEO, founders, and key executives information
- 🏢 **Company Overview**: Industry, products/services, and business model descriptions
- 🔗 **Wikipedia Integration**: Direct links to business Wikipedia pages with automatic image extraction
- ⚡ **Real-time**: Fast API responses with loading indicators and button states
- 🔧 **Clean Architecture**: Proper FastAPI static file serving and organized project structure
- 📋 **JSON Format**: Structured data exchange between frontend and backend for reliable parsing

## Cross-Game Linking System

The platform features an innovative cross-game linking system that allows seamless navigation between related content across all games:

### 🔗 **How Cross-Game Links Work**
- **Clickable Content**: Related items (people, events, businesses, cities) are displayed as clickable links
- **Automatic Navigation**: Clicking a link automatically navigates to the relevant game
- **Auto-Search**: The target game automatically searches for the clicked item
- **Visual Distinction**: Different colored links for different content types

### 🎯 **Available Cross-Game Links**

#### **From Person Game:**
- **Cities**: Click birth/death locations to search in City Game
- **Events**: Click historical events to search in Event Game  
- **Businesses**: Click business affiliations to search in Business Game

#### **From City Game:**
- **People**: Click notable residents to search in Person Game
- **Events**: Click historical events to search in Event Game ✨ **NEW**
- **Businesses**: Click notable businesses to search in Business Game ✨ **NEW**

#### **From Event Game:**
- **People**: Click key figures to search in Person Game
- **Cities**: Click key cities to search in City Game ✨ **NEW**

#### **From Business Game:**
- **People**: Click founders/CEOs to search in Person Game
- **Cities**: Click headquarters locations to search in City Game

### 🎨 **Visual Design**
- **People Links**: Blue color (`#2563eb`) with hover effects
- **Event Links**: Red color (`#dc2626`) with hover effects  
- **Business Links**: Green color (`#059669`) with hover effects
- **City Links**: Green color (`#059669`) with hover effects

### 🔧 **Technical Implementation**
- **localStorage**: Stores search terms for seamless game transitions
- **URL Parameters**: Fallback method for direct game-to-game navigation
- **Automatic Detection**: Games detect incoming searches and auto-populate input fields
- **Session Management**: Maintains game state across navigation

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

## How to Use

### Getting Started
1. **Choose a Game**: Visit the home page and select from available games using the game selection cards
2. **Navigate**: Use the navigation toolbar at the top to switch between games anytime
3. **Play**: Each game has its own unique interface and rules
4. **Explore Cross-Game Links**: Click on related content (people, events, businesses, cities) to seamlessly navigate between games

### Guess the Famous Person Game
1. **Enter Information**: Type information about a famous person in the text area
2. **Submit**: Click "Submit Information" or press Ctrl+Enter
3. **Review Guess**: The AI will display its guess with:
   - **Person's Photo**: Automatically extracted from Wikipedia (if available)
   - **Name Box**: The person's name in a blue gradient box
   - **Overview Box**: A concise 50-75 word summary of the person's life in a yellow styled box
   - **Biographical Information**: Birth/death dates, places, and Wikipedia link in a styled box
   - **Interactive Family Tree**: Parents, siblings, spouses, and children with clickable names for exploration
   - **Interactive Map**: Google Maps showing birth and death locations with custom markers
   - **Explanation Box**: The AI's reasoning in a gray box below
4. **Provide Feedback**: Click "Correct" if the guess is right, or "Incorrect" if it's wrong
5. **Continue**: If incorrect, the AI will make another guess with improved context
6. **Explore Family Tree**: Click any family member's name to start a new search for that person
7. **Victory**: When the AI guesses correctly, you'll see a victory message!
8. **New Game**: Start fresh anytime by entering new information

### Guess the City Game
1. **Enter Information**: Type information about a city in the text area
2. **Submit**: Click "Submit Information" or press Ctrl+Enter
3. **Review Guess**: The AI will display its guess with:
   - **City's Photo**: Automatically extracted from Wikipedia using Beautiful Soup (if available)
   - **Name Box**: The city's name in a blue gradient box
   - **Overview Box**: A concise 50-75 word summary of the city's history and significance
   - **Administrative Information**: County, parish, borough, state, prefecture, province, department, region, territory, canton, voivodeship, autonomous community, and other administrative divisions
   - **Population Information**: City population when available
   - **Founding Information**: Year founded when available
   - **Notable People**: Clickable blue links to search famous residents in Person Game
   - **Notable Events**: Clickable red links to search historical events in Event Game ✨ **NEW**
   - **Notable Businesses**: Clickable green links to search companies in Business Game ✨ **NEW**
   - **Wikipedia Link**: Direct link to the city's Wikipedia page
   - **Explanation Box**: The AI's reasoning in a gray box below
4. **Provide Feedback**: Click "Correct" if the guess is right, or "Incorrect" if it's wrong
5. **Continue**: If incorrect, the AI will make another guess with improved context
6. **Explore Related Content**: Click any notable person, event, or business to automatically search in the respective game
7. **Victory**: When the AI guesses correctly, you'll see a victory message!
8. **New Game**: Start fresh anytime by entering new information

### Guess the Historical Event Game
1. **Enter Information**: Type information about a historical event in the text area
2. **Submit**: Click "Submit Information" or press Ctrl+Enter
3. **Review Guess**: The AI will display its guess with:
   - **AI-Generated Image**: Historically accurate visual representation created by Gemini 2.5 Flash Image Preview using complete event context
   - **Name Box**: The event's name in a blue gradient box
   - **Overview Box**: A concise 50-75 word summary of the event's significance and key details
   - **Comprehensive Event Data**: Complete information including start/end dates, location, key figures, causes, developments, and results
   - **Key Cities**: Clickable green links to cities involved in the event ✨ **NEW**
   - **Interactive Map**: Google Maps showing the event location with custom markers
   - **Wikipedia Link**: Direct link to the event's Wikipedia page with automatic image extraction
   - **Explanation Box**: The AI's reasoning in a gray box below
4. **Provide Feedback**: Click "Correct" if the guess is right, or "Incorrect" if it's wrong
5. **Continue**: If incorrect, the AI will make another guess with improved context
6. **Explore Key Cities**: Click any key city name to automatically search for that city in the City Game
7. **Victory**: When the AI guesses correctly, you'll see a victory message!
8. **New Game**: Start fresh anytime by entering new information

### Odd Situation Game
1. **Start Game**: Click "Start New Game" to begin
2. **View Scenario**: The AI will generate a unique scenario showing a famous person in an unusual outfit and setting
3. **Make Your Guess**: Type your guess of who the famous person is in the text area
4. **Submit Guess**: Click "Submit Guess" to see if you're correct
5. **Review Result**: The game will show:
   - **Your Guess**: What you guessed
   - **Correct Answer**: The actual famous person
   - **Person's Photo**: Automatically extracted from Wikipedia (if available)
   - **Biographical Information**: Birth/death dates, places, and Wikipedia link
   - **Overview**: A concise summary of the person's life and achievements
6. **New Scenario**: Click "Start New Game" to get a completely new scenario with a different person, outfit, and setting
7. **Explore**: Each game session creates unique combinations of people, outfits, and settings

### Guess the Business Game
1. **Enter Information**: Type information about a business in the text area
2. **Submit**: Click "Submit Information" or press Ctrl+Enter
3. **Review Guess**: The AI will display its guess with:
   - **Business Logo**: Automatically extracted from Wikipedia (if available)
   - **Name Box**: The business's name in a blue gradient box
   - **Overview Box**: A concise 50-75 word summary of the business's history and significance
   - **Comprehensive Business Data**: Complete information including founding details, financial data, leadership, products/services, and company history
   - **Interactive Map**: Google Maps showing business headquarters and locations
   - **Financial Information**: Revenue, market cap, employee count, and other business metrics when available
   - **Leadership Details**: CEO, founders, and key executives information
   - **Wikipedia Link**: Direct link to the business's Wikipedia page
   - **Explanation Box**: The AI's reasoning in a gray box below
4. **Provide Feedback**: Click "Correct" if the guess is right, or "Incorrect" if it's wrong
5. **Continue**: If incorrect, the AI will make another guess with improved context
6. **Victory**: When the AI guesses correctly, you'll see a victory message!
7. **New Game**: Start fresh anytime by entering new information

## File Structure

```
FirstAPI/
├── app.py               # Main FastAPI application with multi-game routing
├── person.py            # Guess the Famous Person game logic with Gemini AI integration
├── city.py              # Guess the City game logic with Gemini AI integration
├── event.py             # Guess the Historical Event game logic with enhanced AI image generation
├── odd.py               # Odd Situation Game logic with AI-generated scenarios
├── business.py          # Guess the Business game logic with Gemini AI integration
├── config.py            # API key configuration
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── .gitignore          # Git ignore rules
├── people.txt          # Famous people data for Odd Situation Game
├── outfits.txt         # Outfit data for Odd Situation Game
├── settings.txt        # Setting data for Odd Situation Game
└── static/             # Frontend files
    ├── index.html      # Home page with game selection
    ├── person.html     # Guess the Famous Person game interface
    ├── city.html       # Guess the City game interface
    ├── event.html      # Guess the Historical Event game interface
    ├── odd.html        # Odd Situation Game interface
    ├── business.html   # Guess the Business game interface
    ├── styles.css      # Modern styling and responsive design
    ├── script.js       # General app utilities and shared functionality
    ├── toolbar.js      # Navigation toolbar functionality
    ├── person.js       # Famous Person game specific JavaScript logic
    ├── city.js         # City guessing game specific JavaScript logic
    ├── event.js        # Historical Event game specific JavaScript logic
    ├── odd.js          # Odd Situation Game specific JavaScript logic
    ├── business.js     # Business guessing game specific JavaScript logic
    ├── favicon.ico     # App favicon (ICO format)
    └── favicon.png     # App favicon (PNG format)
```

### Key Files:
- **`app.py`** - Main FastAPI application with multi-game routing and API endpoints
- **`person.py`** - Guess the Famous Person game logic with Gemini AI integration, JSON response format, overview generation, image extraction, and session management
- **`city.py`** - Guess the City game logic with Gemini AI integration, JSON response format, and session management
- **`event.py`** - Guess the Historical Event game logic with enhanced AI image generation using complete event context
- **`odd.py`** - Odd Situation Game logic with AI-generated scenarios, random outfit/setting combinations, and session management
- **`business.py`** - Guess the Business game logic with Gemini AI integration, comprehensive business data, financial information, and session management
- **`config.py`** - API key configuration (excluded from version control)
- **`requirements.txt`** - Python dependencies including Beautiful Soup, requests, and Google Maps client
- **`people.txt`** - Famous people data file for Odd Situation Game scenarios
- **`outfits.txt`** - Outfit data file for Odd Situation Game scenarios
- **`settings.txt`** - Setting data file for Odd Situation Game scenarios
- **`static/index.html`** - Home page with game selection grid
- **`static/person.html`** - Guess the Famous Person game interface
- **`static/city.html`** - Guess the City game interface
- **`static/event.html`** - Guess the Historical Event game interface
- **`static/odd.html`** - Odd Situation Game interface
- **`static/business.html`** - Guess the Business game interface
- **`static/toolbar.js`** - Navigation toolbar functionality and active state management
- **`static/script.js`** - General app utilities and shared functionality for all games
- **`static/person.js`** - Famous Person game specific JavaScript logic and UI interactions
- **`static/city.js`** - City guessing game specific JavaScript logic and UI interactions
- **`static/event.js`** - Historical Event game specific JavaScript logic and UI interactions
- **`static/odd.js`** - Odd Situation Game specific JavaScript logic and UI interactions
- **`static/business.js`** - Business guessing game specific JavaScript logic and UI interactions
- **`static/`** - All frontend files organized in a dedicated directory

## API Endpoints

### Core Platform Endpoints
- `GET /` - Serves the home page with game selection
- `GET /person` - Serves the Guess the Famous Person game page
- `GET /city` - Serves the Guess the City game page
- `GET /odd` - Serves the Odd Situation Game page
- `GET /event` - Serves the Guess the Historical Event game page
- `GET /business` - Serves the Guess the Business game page
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

## Tips for Better Results

- **Be Specific**: Provide unique details about the person
- **Include Achievements**: Mention notable works, awards, or characteristics
- **Add Context**: Include time periods, locations, or fields of work
- **Be Distinctive**: The more unique the information, the better the AI can guess
- **Try Different Angles**: If the first guess is wrong, the AI learns and improves
- **Explore Family Trees**: Click on family member names to discover related famous people
- **Start Fresh**: You can begin a new game anytime with different information

## Recent Updates

### Key Cities Feature Enhancement (Latest)
- 🏙️ **Event Game Key Cities**: Added key cities functionality to the historical event guessing game
- 🎯 **AI-Powered City Identification**: AI now identifies and displays key cities involved in historical events
- 🔗 **Clickable City Links**: Key cities are displayed as clickable green links that automatically search in City Game
- 🗺️ **Cross-Game Navigation**: Seamless navigation from event details to city information
- 📝 **Comprehensive Data**: Cities include full administrative divisions and country names for accurate identification
- 🎨 **Visual Design**: Consistent green styling matching other city-related links
- 🔄 **Auto-Search**: Clicking a key city automatically populates and searches in the City Game

### Cross-Game Linking Enhancement
- 🔗 **Enhanced City Game Links**: Added clickable links for events and businesses in the city-guessing game
- 🎯 **Event Links**: Notable events in city results are now clickable red links that automatically search in Event Game
- 🏢 **Business Links**: Notable businesses in city results are now clickable green links that automatically search in Business Game
- 🎨 **Visual Design**: Consistent color-coded linking system across all games
- 🔄 **Seamless Navigation**: Users can now explore related content across all 5 games with automatic search functionality
- 📱 **Responsive Design**: Cross-game links work perfectly on all devices and screen sizes
- 🧠 **Smart Detection**: Games automatically detect incoming searches from other games and populate input fields

### New Games Added
- 🎪 **Odd Situation Game**: Brand new game where players guess famous people in unusual outfits and settings
  - 🎨 **AI-Generated Scenarios**: Uses Gemini 2.5 Flash Image Preview to create unique visual scenarios
  - 🎭 **Random Combinations**: Combines famous people with random outfits and settings from curated data files
  - 📝 **Data Files**: Added `people.txt`, `outfits.txt`, and `settings.txt` for scenario generation
  - 🎯 **Guess & Reveal**: Players make guesses then reveal the correct answer with full biographical information
  - 🔄 **Session Management**: Complete session tracking and state management
- 🏢 **Business Guessing Game**: New game for identifying businesses based on user-provided information
  - 🤖 **AI-Powered Identification**: Uses Gemini 2.5 Flash Lite for intelligent business identification
  - 💰 **Financial Data**: Comprehensive business information including revenue, market cap, employee count
  - 👔 **Leadership Information**: CEO, founders, and key executives details
  - 🏢 **Company Details**: Industry, products/services, founding information, and business model
  - 📸 **Logo Extraction**: Automatic business logo extraction from Wikipedia pages
  - 🗺️ **Interactive Maps**: Google Maps integration showing business headquarters and locations
- 🧭 **Enhanced Navigation**: Updated navigation toolbar to include all 5 games with active state indicators
- 📁 **File Organization**: Added new game files (`odd.py`, `business.py`, `odd.html`, `business.html`, `odd.js`, `business.js`)
- 🔗 **API Endpoints**: New REST endpoints for both games with complete session management

### Enhanced Event Game Image Generation
- 🖼️ **Complete Context Image Generation**: Event guessing game now provides complete JSON event data to Gemini 2.5 Flash Image Preview for historically accurate visual representations
- 📊 **Rich Event Context**: Image generation now includes event name, location, time period, key figures, and comprehensive overview for better visual accuracy
- 🎨 **Enhanced Visual Quality**: AI-generated images are more historically accurate and contextually relevant due to the comprehensive event information provided
- 🔧 **Improved Architecture**: Modified `_generate_event_image` method to accept complete event data instead of just event names
- 📝 **Better Prompts**: Enhanced image generation prompts with detailed historical context for superior educational value

### JavaScript Architecture Reorganization
- 📁 **Modular JavaScript Structure**: Separated game-specific code from general app utilities
- 🎭 **person.js**: Contains the complete FamousPersonGame class with all game-specific logic
- 🛠️ **script.js**: New general utilities file with shared functionality for all games
- 🔧 **AppUtils Object**: Common functions for loading states, error handling, and API requests
- ⌨️ **Shared Keyboard Shortcuts**: Universal keyboard shortcuts (Escape to dismiss errors)
- 🎯 **Game-Specific Organization**: Each game can now have its own JavaScript file while sharing common utilities
- 🚀 **Ready for Expansion**: Clean foundation for adding new games with their own JavaScript modules

### Platform Transformation
- 🎮 **Multi-Game Platform**: Transformed from single game to multi-game platform with unified navigation
- 🏠 **Home Page**: New game selection interface with feature cards and descriptions
- 🧭 **Navigation Toolbar**: Persistent navigation across all games with active state indicators
- 🏙️ **City Guessing Game**: Complete implementation of city identification game with AI
- 📁 **File Restructuring**: Reorganized files to support multiple games (person.py, city.py, etc.)
- 🔗 **Routing System**: Enhanced FastAPI routing for multiple game pages
- 🎨 **Consistent UI**: Unified design system across all games and pages

### Game Enhancements
- ✅ **Concise Person Overview**: 50-75 word life summary displayed in a styled yellow box between name and biographical info
- ✅ **Custom Favicon Support**: App now displays a custom favicon in browser tabs with both ICO and PNG format support
- ✅ **Interactive Family Tree Navigation**: All family members (parents, siblings, spouses, children) are clickable for seamless exploration
- ✅ **Multiple Spouse Support**: Properly handles people with multiple marriages as individual clickable items
- ✅ **JSON Response Format**: Backend now returns structured JSON objects for reliable data parsing
- ✅ **Enhanced Family Information**: Parents, siblings, spouses, and children shown in styled information boxes
- ✅ **Interactive Google Maps**: JavaScript API integration with custom birth/death location markers
- ✅ **Automatic Image Extraction**: Beautiful Soup extracts person photos from Wikipedia pages
- ✅ **Comprehensive Biographical Data**: Birth/death dates, places, and Wikipedia links
- ✅ **Enhanced AI Responses**: Now includes both name and detailed reasoning
- ✅ **Improved UI**: Separate display boxes for name, biographical info, family info, map, and explanation
- ✅ **Better File Organization**: Static files moved to dedicated `/static` directory
- ✅ **Updated Gemini Model**: Using `gemini-2.5-flash-lite` for better performance
- ✅ **Configuration Management**: API keys stored in `config.py` with `.gitignore` protection
- ✅ **Enhanced User Experience**: Button states, loading indicators, and error handling
- ✅ **Smart Image Display**: CORS proxy support for Wikipedia images with beautiful styling
- ✅ **Geocoding Integration**: Automatic conversion of place names to map coordinates
- ✅ **Map Features**: Interactive zoom, pan, custom markers, and smart bounds fitting
- ✅ **Robust Error Handling**: Comprehensive safety checks and fallback mechanisms
- ✅ **Cache-Busting**: Version parameters ensure latest JavaScript files are loaded

## Troubleshooting

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

## Technology Stack

### **Backend:**
- **FastAPI**: Modern Python web framework with multi-game routing and API endpoints
- **Modular Architecture**: Separate game logic modules (person.py, city.py, event.py) for scalability
- **Google Gemini 2.5 Flash Lite**: AI model for person/city/event identification, overview generation, and reasoning with JSON response format
- **Google Gemini 2.5 Flash Image Preview**: AI image generation with complete event context for historically accurate visual representations
- **Beautiful Soup 4**: HTML parsing for image extraction from Wikipedia
- **Requests**: HTTP library for web scraping
- **Google Maps Python Client**: Geocoding API integration for address-to-coordinates conversion
- **JSON Processing**: Structured data handling with markdown code block parsing
- **Session Management**: Individual session tracking for each game

### **Frontend:**
- **Modular JavaScript Architecture**: 
  - `script.js` - General app utilities and shared functionality
  - `person.js` - Famous Person game specific logic and UI interactions
- **Multi-Page Architecture**: Separate HTML pages for each game with shared navigation
- **Google Maps JavaScript API**: Interactive maps with custom markers and bounds
- **CSS3**: Modern styling with gradients, animations, and responsive design
- **HTML5**: Semantic markup with accessibility features
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
