"""
Movie Guessing Game - AI-powered movie identification
This game allows users to provide information about a movie and the AI tries to guess which movie it is.
"""

import google.generativeai as genai
from typing import Optional, Dict, Any, List
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from config import GEMINI_API_KEY

class MovieGuesser:
    def __init__(self):
        """Initialize the Gemini API client."""
        # Import API key from config file
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
            raise ValueError("Please set your actual Gemini API key in config.py")
        
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        self.current_session = None
    
    def start_new_session(self, user_input: str) -> Dict[str, Any]:
        """Start a new movie guessing session with user input."""
        self.current_session = {
            'user_input': user_input,
            'guesses': [],
            'incorrect_movies': [],  # Track movies that were marked as incorrect
            'session_id': len(str(hash(user_input + str(len(user_input)))))
        }
        
        # Make the first guess
        first_guess = self._make_guess(user_input)
        self.current_session['guesses'].append(first_guess)
        
        return {
            'session_id': self.current_session['session_id'],
            'guess': first_guess,
            'is_correct': None,
            'game_over': False
        }
    
    def _make_guess(self, context: str, incorrect_movies: List[str] = None) -> Dict[str, Any]:
        """Make a movie guess using Gemini API."""
        if incorrect_movies is None:
            incorrect_movies = []
        
        # Build the exclusion list for the prompt
        exclusion_text = ""
        if incorrect_movies:
            exclusion_text = f"\n\nIMPORTANT: Do NOT guess any of these movies (they have already been marked as incorrect): {', '.join(incorrect_movies)}"
        
        prompt = f"""You are an expert at identifying movies based on descriptions. Based on the following information, guess which movie the user is describing.

{context}{exclusion_text}

Please respond with a JSON object containing the following fields:
- name: The movie title
- directed_by: An array of director names
- screenplay_by: An array of screenwriter names
- story_by: An array of story writer names (if different from screenplay, otherwise empty array)
- based_on: What the movie is based on (book, true story, original script, etc.)
- produced_by: An array of producer names
- starring: An array of main cast member names
- cinematography: An array of cinematographer names
- edited_by: An array of editor names
- music_by: An array of composer names
- production_company: An array of production company names
- distributed_by: An array of distributor names
- release_dates: An object with country as key and release date as value (e.g., {{"United States": "2023-07-21", "United Kingdom": "2023-07-28"}})
- running_time: The movie's running time in minutes
- country: An array of countries where the movie was produced
- language: An array of languages the movie is in
- budget: The movie's budget (if known, otherwise null)
- box_office: The movie's box office gross (if known, otherwise null)
- wikipedia_url: Wikipedia URL for the movie (if available, otherwise null)
- reasoning: Your reasoning for why you think this is the correct movie
- overview: A concise 50-75 word overview of the movie's plot, significance, and notable features

Make sure to return ONLY valid JSON. Do not include any text before or after the JSON object."""

        try:
            response = self.model.generate_content(prompt)
            
            if not response.text:
                raise ValueError("No response from Gemini API")
            
            # Try to parse the JSON response
            try:
                movie_data = json.loads(response.text.strip())
            except json.JSONDecodeError as e:
                # If JSON parsing fails, try to extract JSON from the response
                text = response.text.strip()
                if text.startswith('```json'):
                    text = text[7:]
                if text.endswith('```'):
                    text = text[:-3]
                movie_data = json.loads(text.strip())
            
            return movie_data
            
        except Exception as e:
            return {
                'error': f'Failed to generate movie guess: {str(e)}',
                'name': 'Unknown Movie',
                'reasoning': 'Unable to process the request due to an error.'
            }
    
    def submit_feedback(self, session_id: int, is_correct: bool) -> Dict[str, Any]:
        """Submit feedback for a guess and get the next guess if incorrect."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {"error": "Session not found"}
        
        if is_correct:
            # Game is over, user confirmed the guess was correct
            return {
                'session_id': session_id,
                'game_over': True,
                'message': 'Congratulations! The movie was guessed correctly.'
            }
        else:
            # Add the incorrect movie to the list and make another guess
            last_guess = self.current_session['guesses'][-1]
            if isinstance(last_guess, dict) and 'name' in last_guess:
                self.current_session['incorrect_movies'].append(last_guess['name'])
            
            # Make another guess with the updated context
            new_guess = self._make_guess(
                self.current_session['user_input'], 
                self.current_session['incorrect_movies']
            )
            self.current_session['guesses'].append(new_guess)
            
            return {
                'session_id': session_id,
                'guess': new_guess,
                'game_over': False,
                'incorrect_movies': self.current_session['incorrect_movies']
            }
    
    def get_session_status(self, session_id: int) -> Dict[str, Any]:
        """Get session information."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {"error": "Session not found"}
        
        return {
            'session_id': session_id,
            'user_input': self.current_session['user_input'],
            'guesses': self.current_session['guesses'],
            'incorrect_movies': self.current_session['incorrect_movies']
        }

# Create a global instance
movie_guesser = MovieGuesser()