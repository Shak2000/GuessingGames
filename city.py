"""
City Guessing Game - AI-powered city identification
This game allows users to provide information about a city and the AI tries to guess which city it is.
"""

import google.generativeai as genai
from typing import Optional, Dict, Any, List
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from config import GEMINI_API_KEY

class CityGuesser:
    def __init__(self):
        """Initialize the Gemini API client."""
        # Import API key from config file
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
            raise ValueError("Please set your actual Gemini API key in config.py")
        
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        self.current_session = None
    
    def start_new_session(self, user_input: str) -> Dict[str, Any]:
        """Start a new city guessing session with user input."""
        self.current_session = {
            'user_input': user_input,
            'guesses': [],
            'incorrect_cities': [],  # Track cities that were marked as incorrect
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
    
    def _make_guess(self, context: str, incorrect_cities: List[str] = None) -> Dict[str, Any]:
        """Make a city guess using Gemini API."""
        if incorrect_cities is None:
            incorrect_cities = []
        
        # Build the exclusion list for the prompt
        exclusion_text = ""
        if incorrect_cities:
            exclusion_text = f"\n\nIMPORTANT: Do NOT guess any of these cities (they have already been marked as incorrect): {', '.join(incorrect_cities)}"
        
        prompt = f"""You are an expert at identifying cities based on descriptions. Based on the following information, guess which city the user is describing.

{context}{exclusion_text}

Please respond with a JSON object containing the following fields:
- name: The city name
- county: County (if applicable, otherwise null)
- parish: Parish (if applicable, otherwise null)
- borough: Borough (if applicable, otherwise null)
- state: State (if applicable, otherwise null)
- prefecture: Prefecture (if applicable, otherwise null)
- province: Province (if applicable, otherwise null)
- department: Department (if applicable, otherwise null)
- region: Region (if applicable, otherwise null)
- territory: Territory (if applicable, otherwise null)
- canton: Canton (if applicable, otherwise null)
- voivodeship: Voivodeship (if applicable, otherwise null)
- autonomous_community: Autonomous community (if applicable, otherwise null)
- other_administrative_division: Other administrative division (if applicable, otherwise null)
- country: The country where the city is located
- population: The population of the city (if known, otherwise null)
- year_founded: Year the city was founded (if known, otherwise null)
- wikipedia_url: Wikipedia URL for the city (if available, otherwise null)
- image: URL to an image of the city (if available, otherwise null)
- reasoning: Your reasoning for why you think this is the correct city
- overview: A concise 50-75 word overview of the city's history, significance, and notable features

Make sure to return ONLY valid JSON. Do not include any text before or after the JSON object."""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Try to parse the JSON response
            try:
                # Remove any markdown code blocks if present
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                city_data = json.loads(response_text)
                
                # Validate required fields
                if not city_data.get('name'):
                    raise ValueError("Missing required field: name")
                if not city_data.get('country'):
                    raise ValueError("Missing required field: country")
                if not city_data.get('reasoning'):
                    raise ValueError("Missing required field: reasoning")
                
                # Add overview if missing
                if not city_data.get('overview'):
                    city_data['overview'] = f"{city_data['name']} is a city in {city_data['country']}."
                
                return city_data
                
            except json.JSONDecodeError as e:
                # If JSON parsing fails, return a fallback response
                return {
                    "name": "Unable to parse response",
                    "county": None,
                    "parish": None,
                    "borough": None,
                    "state": None,
                    "prefecture": None,
                    "province": None,
                    "department": None,
                    "region": None,
                    "territory": None,
                    "canton": None,
                    "voivodeship": None,
                    "autonomous_community": None,
                    "other_administrative_division": None,
                    "country": "Unknown",
                    "population": None,
                    "year_founded": None,
                    "wikipedia_url": None,
                    "image": None,
                    "reasoning": f"Error parsing AI response: {str(e)}",
                    "overview": "There was an error processing the AI response."
                }
                
        except Exception as e:
            return {
                "name": "Error occurred",
                "county": None,
                "parish": None,
                "borough": None,
                "state": None,
                "prefecture": None,
                "province": None,
                "department": None,
                "region": None,
                "territory": None,
                "canton": None,
                "voivodeship": None,
                "autonomous_community": None,
                "other_administrative_division": None,
                "country": "Unknown",
                "population": None,
                "year_founded": None,
                "wikipedia_url": None,
                "image": None,
                "reasoning": f"Error making guess: {str(e)}",
                "overview": "There was an error processing your request."
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
                'message': 'Congratulations! The city was guessed correctly.'
            }
        else:
            # Add the incorrect city to the list and make another guess
            last_guess = self.current_session['guesses'][-1]
            if isinstance(last_guess, dict) and 'name' in last_guess:
                self.current_session['incorrect_cities'].append(last_guess['name'])
            
            # Make another guess with the updated context
            new_guess = self._make_guess(
                self.current_session['user_input'], 
                self.current_session['incorrect_cities']
            )
            self.current_session['guesses'].append(new_guess)
            
            return {
                'session_id': session_id,
                'guess': new_guess,
                'game_over': False,
                'incorrect_cities': self.current_session['incorrect_cities']
            }
    
    def get_session(self, session_id: int) -> Dict[str, Any]:
        """Get session information."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {"error": "Session not found"}
        
        return {
            'session_id': session_id,
            'user_input': self.current_session['user_input'],
            'guesses': self.current_session['guesses'],
            'incorrect_cities': self.current_session['incorrect_cities']
        }

# Create a global instance for the API to use
city_guesser = CityGuesser()