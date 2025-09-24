"""
TV Show Guessing Game - AI-powered TV show identification
This game allows users to provide information about a TV show and the AI tries to guess which TV show it is.
"""

import google.generativeai as genai
from typing import Optional, Dict, Any, List
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import googlemaps
from config import GEMINI_API_KEY, GOOGLE_MAPS_API_KEY

class TVShowGuesser:
    def __init__(self):
        """Initialize the Gemini API client."""
        # Import API key from config file
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
            raise ValueError("Please set your actual Gemini API key in config.py")
        
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        self.gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
        self.current_session = None
    
    def start_new_session(self, user_input: str) -> Dict[str, Any]:
        """Start a new TV show guessing session with user input."""
        self.current_session = {
            'user_input': user_input,
            'guesses': [],
            'incorrect_shows': [],  # Track shows that were marked as incorrect
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
    
    def _make_guess(self, context: str, incorrect_shows: List[str] = None) -> Dict[str, Any]:
        """Make a TV show guess using Gemini API."""
        if incorrect_shows is None:
            incorrect_shows = []
        
        # Build the exclusion list for the prompt
        exclusion_text = ""
        if incorrect_shows:
            exclusion_text = f"\n\nIMPORTANT: Do NOT guess any of these TV shows (they have already been marked as incorrect): {', '.join(incorrect_shows)}"
        
        prompt = f"""You are an expert at identifying TV shows based on descriptions. Based on the following information, guess which TV show the user is describing.

{context}{exclusion_text}

Please respond with a JSON object containing the following fields:
- name: The TV show title
- genre: An array of the show's genres
- imdb_rating: The show's IMDB rating (if known, otherwise null)
- rotten_tomatoes_rating: The show's Rotten Tomatoes rating (if known, otherwise null)
- tv_parental_guidelines_rating: The show's TV Parental Guidelines rating (TV-Y, TV-Y7, TV-G, TV-PG, TV-14, TV-MA, Not Rated)
- created_by: An array of creator names
- written_by: An array of writer names
- starring: An array of main cast member names
- composers: An array of composer names
- country_of_origin: An array of countries where the show was produced
- original_language: An array of languages the show is originally in
- number_of_seasons: The number of seasons
- number_of_episodes: The total number of episodes
- executive_producers: An array of executive producer names
- producers: An array of producer names
- cinematography: An array of cinematographer names
- editors: An array of editor names
- running_time: The average episode running time in minutes
- production_companies: An array of production company names
- network: An array of networks/channels that aired the show
- release_date: The original air date or premiere date
- imdb_url: IMDB URL for the show (if available, otherwise null)
- rotten_tomatoes_url: Rotten Tomatoes URL for the show (if available, otherwise null)
- wikipedia_url: Wikipedia URL for the show (if available, otherwise null)
- people: An array of real-world people who appear as characters in the show, or empty array [] if unknown
- cities: An array of real-world cities where the show takes place, entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States"), or empty array [] if unknown
- events: An array of real-world events where the show takes place, or empty array [] if unknown
- reasoning: Your reasoning for why you think this is the correct TV show
- overview: A concise 50-75 word overview of the show's plot, significance, and notable features

Make sure to return ONLY valid JSON. Do not include any text before or after the JSON object."""

        try:
            response = self.model.generate_content(prompt)
            
            if not response.text:
                raise ValueError("No response from Gemini API")
            
            # Try to parse the JSON response
            try:
                show_data = json.loads(response.text.strip())
            except json.JSONDecodeError as e:
                # If JSON parsing fails, try to extract JSON from the response
                text = response.text.strip()
                if text.startswith('```json'):
                    text = text[7:]
                if text.endswith('```'):
                    text = text[:-3]
                show_data = json.loads(text.strip())
            
            # If we have a Wikipedia URL, try to extract an image
            if show_data.get('wikipedia_url'):
                image_url = self._extract_image_from_url(show_data['wikipedia_url'])
                show_data['image_url'] = image_url if image_url != "N/A" else None
            else:
                show_data['image_url'] = None
            
            # Get coordinates for all cities
            cities_coordinates = []
            cities = show_data.get('cities', [])
            if cities:
                for city in cities:
                    coords = self._get_location_coordinates(city)
                    if coords:
                        cities_coordinates.append({
                            'city': city,
                            'coordinates': coords
                        })
            
            show_data['cities_coordinates'] = cities_coordinates
            
            return show_data
            
        except Exception as e:
            return {
                'error': f'Failed to generate TV show guess: {str(e)}',
                'name': 'Unknown TV Show',
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
                'message': 'Congratulations! The TV show was guessed correctly.'
            }
        else:
            # Add the incorrect show to the list and make another guess
            last_guess = self.current_session['guesses'][-1]
            if isinstance(last_guess, dict) and 'name' in last_guess:
                self.current_session['incorrect_shows'].append(last_guess['name'])
            
            # Make another guess with the updated context
            new_guess = self._make_guess(
                self.current_session['user_input'], 
                self.current_session['incorrect_shows']
            )
            self.current_session['guesses'].append(new_guess)
            
            return {
                'session_id': session_id,
                'guess': new_guess,
                'game_over': False,
                'incorrect_shows': self.current_session['incorrect_shows']
            }
    
    def get_session_status(self, session_id: int) -> Dict[str, Any]:
        """Get session information."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {"error": "Session not found"}
        
        return {
            'session_id': session_id,
            'user_input': self.current_session['user_input'],
            'guesses': self.current_session['guesses'],
            'incorrect_shows': self.current_session['incorrect_shows']
        }
    
    def _extract_image_from_url(self, url: str) -> str:
        """Extract the best image URL from a given webpage URL."""
        try:
            # Add headers to mimic a real browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try to find the main image (usually the first large image or infobox image)
            image_url = None
            
            # For Wikipedia pages, look for infobox images first
            if 'wikipedia.org' in url:
                infobox = soup.find('table', class_='infobox')
                if infobox:
                    img = infobox.find('img')
                    if img and img.get('src'):
                        image_url = img.get('src')
                        # Convert to full URL if it's a relative path
                        if image_url.startswith('//'):
                            image_url = 'https:' + image_url
                        elif image_url.startswith('/'):
                            image_url = urljoin(url, image_url)
                        return image_url
            
            # Look for the first large image in the content
            images = soup.find_all('img')
            for img in images:
                src = img.get('src')
                if src:
                    # Skip small images, icons, and decorative elements
                    width = img.get('width')
                    height = img.get('height')
                    
                    # Check if it's a reasonable size for a TV show poster/image
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w >= 150 and h >= 150:  # Minimum size threshold for TV show images
                                image_url = src
                                break
                        except ValueError:
                            continue
                    
                    # If no size attributes, check the src for common patterns
                    if not image_url and any(keyword in src.lower() for keyword in ['poster', 'show', 'series', 'tv', 'image', 'jpg', 'jpeg', 'png']):
                        image_url = src
                        break
            
            if image_url:
                # Convert to full URL if it's a relative path
                if image_url.startswith('//'):
                    image_url = 'https:' + image_url
                elif image_url.startswith('/'):
                    image_url = urljoin(url, image_url)
                return image_url
            
            return "N/A"
            
        except Exception as e:
            print(f"Error extracting image from {url}: {str(e)}")
            return "N/A"
    
    def _get_location_coordinates(self, location: str) -> Optional[Dict[str, float]]:
        """Get coordinates for a location using Google Maps Geocoding API."""
        try:
            geocode_result = self.gmaps.geocode(location)
            if geocode_result:
                location_data = geocode_result[0]['geometry']['location']
                return {
                    'lat': location_data['lat'],
                    'lng': location_data['lng']
                }
        except Exception as e:
            print(f"Error getting coordinates for {location}: {e}")
        
        return None

# Create a global instance
tvshow_guesser = TVShowGuesser()
