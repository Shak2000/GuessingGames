import google.generativeai as genai
from typing import Optional, Dict, Any
import json
import random
import os
from config import GEMINI_API_KEY

class OddSituationGame:
    def __init__(self):
        """Initialize the Gemini API client and load data files."""
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
            raise ValueError("Please set your actual Gemini API key in config.py")
        
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-image-preview')
        self.current_session = None
        
        # Load data files
        self.people = self._load_file('people.txt')
        self.outfits = self._load_file('outfits.txt')
        self.settings = self._load_file('settings.txt')
    
    def _load_file(self, filename: str) -> list:
        """Load a text file and return a list of lines."""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return [line.strip() for line in f.readlines() if line.strip()]
        except FileNotFoundError:
            print(f"Warning: {filename} not found. Using default data.")
            return []
    
    def start_new_game(self) -> Dict[str, Any]:
        """Start a new odd situation game."""
        # Select random elements
        person = random.choice(self.people) if self.people else "Albert Einstein"
        outfit = random.choice(self.outfits) if self.outfits else "space suit"
        setting = random.choice(self.settings) if self.settings else "on the moon"
        
        # Generate image prompt
        image_prompt = f"A famous person {person} wearing {outfit} {setting}. The image should be clear and recognizable, showing the person in this unusual situation."
        
        try:
            # Generate image using Gemini 2.5 Flash Image Preview
            response = self.model.generate_content([
                image_prompt,
                "Generate a high-quality, realistic image of this scenario. Make sure the person is clearly recognizable and the situation is visually interesting."
            ])
            
            # Extract image URL from response
            if hasattr(response, 'parts') and response.parts:
                for part in response.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        # Convert base64 image data to data URL
                        import base64
                        image_data = base64.b64encode(part.inline_data.data).decode('utf-8')
                        image_url = f"data:image/png;base64,{image_data}"
                        break
                else:
                    # Fallback if no image data found
                    image_url = "https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=No+Image+Generated"
            else:
                image_url = "https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=No+Image+Generated"
            
        except Exception as e:
            print(f"Error generating image: {e}")
            image_url = "https://via.placeholder.com/400x400/EF4444/FFFFFF?text=Image+Generation+Failed"
        
        # Create session
        session_id = random.randint(1000, 9999)
        self.current_session = {
            'session_id': session_id,
            'person': person,
            'outfit': outfit,
            'setting': setting,
            'image_url': image_url,
            'guesses': [],
            'correct': False,
            'revealed': False
        }
        
        return {
            'session_id': session_id,
            'image_url': image_url,
            'game_over': False
        }
    
    def submit_guess(self, session_id: int, guess: str) -> Dict[str, Any]:
        """Submit a guess for the current game."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {'error': 'Invalid session ID'}
        
        guess = guess.strip().lower()
        correct_person = self.current_session['person'].lower()
        
        # Check if guess is correct (allowing for partial matches)
        is_correct = (guess in correct_person or correct_person in guess or 
                     any(word in correct_person for word in guess.split() if len(word) > 2))
        
        # Add guess to history
        self.current_session['guesses'].append({
            'guess': guess,
            'correct': is_correct,
            'timestamp': json.dumps({'timestamp': 'now'})  # Simplified timestamp
        })
        
        if is_correct:
            self.current_session['correct'] = True
        
        return {
            'session_id': session_id,
            'correct': is_correct,
            'game_over': is_correct,
            'total_guesses': len(self.current_session['guesses'])
        }
    
    def reveal_answer(self, session_id: int) -> Dict[str, Any]:
        """Reveal the correct answer."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {'error': 'Invalid session ID'}
        
        self.current_session['revealed'] = True
        
        return {
            'session_id': session_id,
            'correct_person': self.current_session['person'],
            'outfit': self.current_session['outfit'],
            'setting': self.current_session['setting'],
            'full_situation': f"{self.current_session['person']} wearing {self.current_session['outfit']} {self.current_session['setting']}",
            'revealed': True
        }
    
    def get_session_status(self, session_id: int) -> Dict[str, Any]:
        """Get the current status of a session."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {'error': 'Invalid session ID'}
        
        return {
            'session_id': session_id,
            'guesses': self.current_session['guesses'],
            'correct': self.current_session['correct'],
            'revealed': self.current_session['revealed'],
            'can_reveal': len(self.current_session['guesses']) > 0 and not self.current_session['correct']
        }

# Create global instance
odd_game = OddSituationGame()