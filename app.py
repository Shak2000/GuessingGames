from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
from person import guesser
from game2 import game2_logic

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

class Game2Input(BaseModel):
    text: str

class Game2Action(BaseModel):
    session_id: int
    action: str

@app.get("/")
async def read_index():
    """Serve the home page."""
    return FileResponse("static/index.html")

@app.get("/person")
async def read_person_game():
    """Serve the Guess the Famous Person game page."""
    return FileResponse("static/person.html")

@app.get("/game2")
async def read_game2():
    """Serve the Game 2 page."""
    return FileResponse("static/game2.html")

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

# Game 2 API Routes
@app.post("/api/game2/start")
async def start_game2(user_input: Game2Input):
    """Start a new Game 2 session."""
    try:
        if not user_input.text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty")
        
        result = game2_logic.start_new_session(user_input.text.strip())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting Game 2: {str(e)}")

@app.post("/api/game2/action")
async def process_game2_action(action_data: Game2Action):
    """Process an action in Game 2."""
    try:
        result = game2_logic.process_action(action_data.session_id, action_data.action)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing Game 2 action: {str(e)}")

@app.get("/api/game2/session/{session_id}")
async def get_game2_session(session_id: int):
    """Get Game 2 session information."""
    try:
        result = game2_logic.get_session(session_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting Game 2 session: {str(e)}")

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
