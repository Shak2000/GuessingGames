from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
from person import guesser
from city import city_guesser
from odd import odd_game
from event import event_guesser

app = FastAPI(title="Multi-Game App", version="1.0.0")

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
