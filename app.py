from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
from person import guesser
from city import city_guesser
from odd import odd_game
from event import event_guesser
from business import business_guesser
from invention import invention_guesser
from movie import movie_guesser
from settings import settings_manager

app = FastAPI(title="Multi-Game App", version="1.0.0")

# TTS Helper Functions
async def generate_tts_audio(text: str, voice: str, prompt: str = "Say the following in a natural way") -> bytes:
    """
    Generate TTS audio using Gemini TTS.
    
    Args:
        text: Text to synthesize
        voice: Voice name to use
        prompt: Prompt for controlling speech style
        
    Returns:
        Audio content as bytes
        
    Raises:
        HTTPException: If TTS generation fails
    """
    try:
        from google.cloud import texttospeech
    except ImportError:
        raise HTTPException(
            status_code=500, 
            detail="Google Cloud Text-to-Speech library not installed. Run: pip install google-cloud-texttospeech>=2.29.0"
        )
    
    # Validate voice
    if not settings_manager.is_valid_voice(voice):
        raise HTTPException(status_code=400, detail=f"Invalid voice: {voice}")
    
    # Initialize client
    try:
        client = texttospeech.TextToSpeechClient()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize Google Cloud TTS client. Please ensure your credentials are set up correctly. Error: {str(e)}"
        )
    
    # Set up synthesis input
    synthesis_input = texttospeech.SynthesisInput(
        text=text,
        prompt=prompt
    )
    
    # Configure voice parameters
    voice_params = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name=voice,
        model_name="gemini-2.5-flash-preview-tts"
    )
    
    # Configure audio output
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )
    
    # Perform synthesis
    try:
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice_params,
            audio_config=audio_config
        )
        return response.audio_content
    except Exception as e:
        error_message = str(e)
        if "PERMISSION_DENIED" in error_message:
            raise HTTPException(
                status_code=403,
                detail="Permission denied. Please ensure your Google Cloud project has the Text-to-Speech API enabled and you have the required permissions."
            )
        elif "NOT_FOUND" in error_message:
            raise HTTPException(
                status_code=404,
                detail=f"Voice '{voice}' not found or not available in the Gemini TTS model."
            )
        elif "INVALID_ARGUMENT" in error_message:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid request parameters. Please check the voice name and text content."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Text-to-Speech synthesis failed: {error_message}"
            )

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/favicon.ico")
async def get_favicon():
    return FileResponse("static/favicon.ico", media_type="image/x-icon")

@app.get("/favicon.png")
async def get_favicon_png():
    return FileResponse("static/favicon.png", media_type="image/png")

@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def get_chrome_devtools_config():
    """Handle Chrome DevTools configuration request to prevent 404 logs."""
    return {"message": "Chrome DevTools configuration not available"}

class UserInput(BaseModel):
    text: str

class Feedback(BaseModel):
    session_id: int
    is_correct: bool

class CityInput(BaseModel):
    text: str

class CityFeedback(BaseModel):
    session_id: int
    is_correct: bool

class OddGuess(BaseModel):
    session_id: int
    guess: str

class OddReveal(BaseModel):
    session_id: int

class EventInput(BaseModel):
    text: str

class EventFeedback(BaseModel):
    session_id: int
    is_correct: bool

class BusinessInput(BaseModel):
    text: str

class BusinessFeedback(BaseModel):
    session_id: int
    is_correct: bool

class InventionInput(BaseModel):
    text: str

class InventionFeedback(BaseModel):
    session_id: int
    is_correct: bool

class MovieInput(BaseModel):
    text: str

class MovieFeedback(BaseModel):
    session_id: int
    is_correct: bool

class VoiceSettings(BaseModel):
    voice: str

class VoiceTestRequest(BaseModel):
    voice: str
    text: str

class TTSRequest(BaseModel):
    voice: str
    text: str
    prompt: Optional[str] = "Say the following in a natural way"

@app.get("/")
async def read_index():
    """Serve the home page."""
    return FileResponse("static/index.html")

@app.get("/person")
async def read_person_game():
    """Serve the Guess the Famous Person game page."""
    return FileResponse("static/person.html")

@app.get("/city")
async def read_city():
    """Serve the Guess the City game page."""
    return FileResponse("static/city.html")

@app.get("/odd")
async def read_odd():
    """Serve the Odd Situation Game page."""
    return FileResponse("static/odd.html")

@app.get("/event")
async def read_event():
    """Serve the Guess the Event game page."""
    return FileResponse("static/event.html")

@app.get("/business")
async def read_business():
    """Serve the Guess the Business game page."""
    return FileResponse("static/business.html")

@app.get("/invention")
async def read_invention():
    """Serve the Guess the Invention game page."""
    return FileResponse("static/invention.html")

@app.get("/movie")
async def read_movie():
    """Serve the Guess the Movie game page."""
    return FileResponse("static/movie.html")

@app.get("/settings")
async def read_settings():
    """Serve the Settings page."""
    return FileResponse("static/settings.html")

@app.post("/api/start-guess")
async def start_guess(user_input: UserInput):
    """Start a new guessing session with user input."""
    try:
        if not user_input.text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty")
        
        result = guesser.start_new_session(user_input.text.strip())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting guess: {str(e)}")

@app.post("/api/submit-feedback")
async def submit_feedback(feedback: Feedback):
    """Submit feedback for the current guess."""
    try:
        result = guesser.submit_feedback(feedback.session_id, feedback.is_correct)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting feedback: {str(e)}")

@app.get("/api/session/{session_id}")
async def get_session_status(session_id: int):
    """Get the current status of a session."""
    try:
        result = guesser.get_session_status(session_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting session status: {str(e)}")

# City Guessing Game API Routes
@app.post("/api/start-city-guess")
async def start_city_guess(user_input: CityInput):
    """Start a new city guessing session."""
    try:
        if not user_input.text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty")
        
        result = city_guesser.start_new_session(user_input.text.strip())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting city guess: {str(e)}")

@app.post("/api/submit-city-feedback")
async def submit_city_feedback(feedback: CityFeedback):
    """Submit feedback for the current city guess."""
    try:
        result = city_guesser.submit_feedback(feedback.session_id, feedback.is_correct)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting city feedback: {str(e)}")

@app.get("/api/city-session/{session_id}")
async def get_city_session(session_id: int):
    """Get city guessing session information."""
    try:
        result = city_guesser.get_session(session_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting city session: {str(e)}")

# Odd Situation Game API Routes
@app.post("/api/start-odd-game")
async def start_odd_game():
    """Start a new odd situation game."""
    try:
        result = odd_game.start_new_game()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting odd game: {str(e)}")

@app.post("/api/submit-odd-guess")
async def submit_odd_guess(guess: OddGuess):
    """Submit a guess for the odd situation game."""
    try:
        result = odd_game.submit_guess(guess.session_id, guess.guess)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting odd guess: {str(e)}")

@app.post("/api/reveal-odd-answer")
async def reveal_odd_answer(reveal: OddReveal):
    """Reveal the answer for the odd situation game."""
    try:
        result = odd_game.reveal_answer(reveal.session_id)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error revealing odd answer: {str(e)}")

@app.get("/api/odd-session/{session_id}")
async def get_odd_session(session_id: int):
    """Get odd situation game session information."""
    try:
        result = odd_game.get_session_status(session_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting odd session: {str(e)}")

# Event Guessing Game API Routes
@app.post("/api/start-event-guess")
async def start_event_guess(user_input: EventInput):
    """Start a new event guessing session."""
    try:
        if not user_input.text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty")
        
        result = event_guesser.start_new_session(user_input.text.strip())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting event guess: {str(e)}")

@app.post("/api/submit-event-feedback")
async def submit_event_feedback(feedback: EventFeedback):
    """Submit feedback for the current event guess."""
    try:
        result = event_guesser.submit_feedback(feedback.session_id, feedback.is_correct)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting event feedback: {str(e)}")

@app.get("/api/event-session/{session_id}")
async def get_event_session(session_id: int):
    """Get event guessing session information."""
    try:
        result = event_guesser.get_session_status(session_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting event session: {str(e)}")

# Business Guessing Game API Routes
@app.post("/api/start-business-guess")
async def start_business_guess(user_input: BusinessInput):
    """Start a new business guessing session."""
    try:
        if not user_input.text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty")
        
        result = business_guesser.start_new_session(user_input.text.strip())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting business guess: {str(e)}")

@app.post("/api/submit-business-feedback")
async def submit_business_feedback(feedback: BusinessFeedback):
    """Submit feedback for the current business guess."""
    try:
        result = business_guesser.submit_feedback(feedback.session_id, feedback.is_correct)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting business feedback: {str(e)}")

@app.get("/api/business-session/{session_id}")
async def get_business_session(session_id: int):
    """Get business guessing session information."""
    try:
        result = business_guesser.get_session_status(session_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting business session: {str(e)}")

# Invention Guessing Game API Routes
@app.post("/api/start-invention-guess")
async def start_invention_guess(user_input: InventionInput):
    """Start a new invention guessing session."""
    try:
        if not user_input.text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty")
        
        result = invention_guesser.start_new_session(user_input.text.strip())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting invention guess: {str(e)}")

@app.post("/api/submit-invention-feedback")
async def submit_invention_feedback(feedback: InventionFeedback):
    """Submit feedback for the current invention guess."""
    try:
        result = invention_guesser.submit_feedback(feedback.session_id, feedback.is_correct)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting invention feedback: {str(e)}")

@app.get("/api/invention-session/{session_id}")
async def get_invention_session(session_id: int):
    """Get invention guessing session information."""
    try:
        result = invention_guesser.get_session_status(session_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting invention session: {str(e)}")

# Movie Guessing Game API Routes
@app.post("/api/start-movie-guess")
async def start_movie_guess(user_input: MovieInput):
    """Start a new movie guessing session."""
    try:
        if not user_input.text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty")
        
        result = movie_guesser.start_new_session(user_input.text.strip())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting movie guess: {str(e)}")

@app.post("/api/submit-movie-feedback")
async def submit_movie_feedback(feedback: MovieFeedback):
    """Submit feedback for the current movie guess."""
    try:
        result = movie_guesser.submit_feedback(feedback.session_id, feedback.is_correct)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting movie feedback: {str(e)}")

@app.get("/api/movie-session/{session_id}")
async def get_movie_session(session_id: int):
    """Get movie guessing session information."""
    try:
        result = movie_guesser.get_session_status(session_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting movie session: {str(e)}")

# Settings API Routes
@app.get("/api/get-settings")
async def get_user_settings(request: Request, response: Response):
    """Get current user settings."""
    try:
        # Get user ID from request
        user_id = settings_manager.get_user_id_from_request(request)
        
        # Set user ID cookie if not exists
        if not request.cookies.get('user_id'):
            response.set_cookie(key="user_id", value=user_id, max_age=30*24*60*60)  # 30 days
        
        # Load user settings
        user_settings = settings_manager.load_user_settings(user_id)
        
        return {
            "voice": user_settings.get("voice"),
            "language_code": user_settings.get("language_code"),
            "available_voices": settings_manager.get_available_voices()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting settings: {str(e)}")

@app.post("/api/save-settings")
async def save_user_settings(voice_settings: VoiceSettings, request: Request, response: Response):
    """Save user voice settings."""
    try:
        # Validate voice
        if not settings_manager.is_valid_voice(voice_settings.voice):
            raise HTTPException(status_code=400, detail=f"Invalid voice: {voice_settings.voice}")
        
        # Get user ID from request
        user_id = settings_manager.get_user_id_from_request(request)
        
        # Set user ID cookie if not exists
        if not request.cookies.get('user_id'):
            response.set_cookie(key="user_id", value=user_id, max_age=30*24*60*60)  # 30 days
        
        # Update voice setting
        success = settings_manager.update_voice_setting(user_id, voice_settings.voice)
        
        if success:
            return {"message": "Settings saved successfully", "voice": voice_settings.voice}
        else:
            raise HTTPException(status_code=500, detail="Failed to save settings")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving settings: {str(e)}")

@app.post("/api/test-voice")
async def test_voice(voice_test: VoiceTestRequest, request: Request):
    """Test a voice by generating sample audio using Gemini TTS."""
    try:
        # Create a friendly prompt for testing
        prompt = "Say the following in a friendly and natural way"
        
        # Generate audio using the helper function
        audio_content = await generate_tts_audio(
            text=voice_test.text,
            voice=voice_test.voice,
            prompt=prompt
        )
        
        # Return the audio content
        return Response(
            content=audio_content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename={voice_test.voice}_test.mp3",
                "Cache-Control": "no-cache"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during voice testing: {str(e)}")

@app.post("/api/generate-tts")
async def generate_tts(tts_request: TTSRequest, request: Request):
    """Generate TTS audio with custom prompt using Gemini TTS."""
    try:
        # Get user ID for voice preference if not specified
        user_id = settings_manager.get_user_id_from_request(request)
        voice = tts_request.voice or settings_manager.get_user_voice(user_id)
        
        # Generate audio using the helper function
        audio_content = await generate_tts_audio(
            text=tts_request.text,
            voice=voice,
            prompt=tts_request.prompt
        )
        
        # Return the audio content
        return Response(
            content=audio_content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=tts_output.mp3",
                "Cache-Control": "no-cache"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during TTS generation: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Guess the Famous Person API is running"}

@app.get("/api/maps-key")
async def get_maps_key():
    """Get Google Maps API key for frontend use."""
    from config import GOOGLE_MAPS_API_KEY
    return {"maps_key": GOOGLE_MAPS_API_KEY}

@app.get("/api/test-maps")
async def test_maps():
    """Test Google Maps API key by making a simple request."""
    try:
        import googlemaps
        from config import GOOGLE_MAPS_API_KEY
        
        gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
        # Test with a simple geocoding request
        result = gmaps.geocode("New York, NY")
        
        if result:
            return {
                "status": "success", 
                "message": "Google Maps API key is working",
                "test_result": "Geocoding successful"
            }
        else:
            return {
                "status": "error", 
                "message": "Google Maps API key test failed - no results"
            }
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Google Maps API key test failed: {str(e)}"
        }

@app.get("/api/test-static-map")
async def test_static_map():
    """Test Google Maps Static API by making a direct request."""
    try:
        import requests
        from config import GOOGLE_MAPS_API_KEY
        
        test_url = f"https://maps.googleapis.com/maps/api/staticmap?center=40.7128,-74.0060&zoom=10&size=100x100&maptype=roadmap&key={GOOGLE_MAPS_API_KEY}"
        response = requests.get(test_url)
        
        if response.status_code == 200:
            return {
                "status": "success", 
                "message": "Google Maps Static API is working",
                "content_type": response.headers.get('content-type'),
                "content_length": len(response.content)
            }
        else:
            return {
                "status": "error", 
                "message": f"Google Maps Static API failed with status {response.status_code}",
                "response_text": response.text[:500]  # First 500 chars
            }
    except Exception as e:
        return {"status": "error", "message": f"Google Maps Static API test failed: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
