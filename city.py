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
import googlemaps
from config import GEMINI_API_KEY, GOOGLE_MAPS_API_KEY

class CityGuesser:
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
- name: The city name, including administrative divisions and country, separated by commas (e.g., "Dallas, Texas, United States")
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
- latitude: The latitude of the city (if known, otherwise null)
- longitude: The longitude of the city (if known, otherwise null)
- area_mi: The total area of the city (land and water) in square miles (if known, otherwise null)
- population_density: The population density of the city in people per square mile (if known, otherwise null)
- elevation: The elevation of the city in feet (if known, otherwise null)
- year_founded: Year the city was founded (if known, otherwise null)
- notable_attractions: An array of strings with names of notable attractions within the city, or empty array [] if unknown
- notable_people: An array of strings with names of notable residents of the city (past and present), or empty array [] if unknown
- notable_events: An array of strings with names of notable historical events within the city, or empty array [] if unknown
- notable_businesses: An array of strings with names of notable businesses founded or headquartered in the city, or empty array [] if unknown
- wikipedia_url: Wikipedia URL for the city (if available, otherwise null)
- reasoning: Your reasoning for why you think this is the correct city
- overview: A concise 50-75 word overview of the city's history, significance, and notable features

Make sure to return ONLY valid JSON. Do not include any text before or after the JSON object."""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            print(f"=== GEMINI RESPONSE DEBUG ===")
            print(f"Full response: {response_text}")
            print(f"Response length: {len(response_text)}")
            print("=== END GEMINI RESPONSE ===")
            
            # Try to parse the JSON response
            try:
                # Remove any markdown code blocks if present
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                city_data = json.loads(response_text)
                print(f"=== JSON PARSED SUCCESSFULLY ===")
                print(f"Name: {city_data.get('name', 'N/A')}")
                print(f"Country: {city_data.get('country', 'N/A')}")
                print(f"State/Province: {city_data.get('state', city_data.get('province', 'N/A'))}")
                print(f"Population: {city_data.get('population', 'N/A')}")
                print(f"Year Founded: {city_data.get('year_founded', 'N/A')}")
                print(f"Wikipedia URL: {city_data.get('wikipedia_url', 'N/A')}")
                print(f"Reasoning: {city_data.get('reasoning', 'N/A')[:100]}...")
                print("=== END JSON PARSING ===")
                
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
                
                # If we have a Wikipedia URL, try to extract an image
                image_url = "N/A"
                wikipedia_url = city_data.get('wikipedia_url')
                if wikipedia_url and wikipedia_url.lower() != 'n/a':
                    image_url = self._extract_image_from_url(wikipedia_url)
                
                # Get coordinates for the city
                coordinates = None
                city_name = city_data.get('name')
                if city_name:
                    # The name field now includes geographical context (e.g., "Portland, Oregon, United States")
                    # Use it directly for coordinate search
                    city_coords = self._get_place_coordinates(city_name)
                    if city_coords:
                        coordinates = city_coords
                
                # Build the final response as JSON (matching person game structure)
                final_response = {
                    "name": city_data.get('name'),
                    "county": city_data.get('county'),
                    "parish": city_data.get('parish'),
                    "borough": city_data.get('borough'),
                    "state": city_data.get('state'),
                    "prefecture": city_data.get('prefecture'),
                    "province": city_data.get('province'),
                    "department": city_data.get('department'),
                    "region": city_data.get('region'),
                    "territory": city_data.get('territory'),
                    "canton": city_data.get('canton'),
                    "voivodeship": city_data.get('voivodeship'),
                    "autonomous_community": city_data.get('autonomous_community'),
                    "other_administrative_division": city_data.get('other_administrative_division'),
                    "country": city_data.get('country'),
                    "population": city_data.get('population'),
                    "latitude": city_data.get('latitude'),
                    "longitude": city_data.get('longitude'),
                    "area_mi": city_data.get('area_mi'),
                    "area_km": city_data.get('area_km'),
                    "population_density": city_data.get('population_density'),
                    "elevation": city_data.get('elevation'),
                    "year_founded": city_data.get('year_founded'),
                    "notable_attractions": city_data.get('notable_attractions', []),
                    "notable_people": city_data.get('notable_people', []),
                    "notable_events": city_data.get('notable_events', []),
                    "notable_businesses": city_data.get('notable_businesses', []),
                    "wikipedia_url": city_data.get('wikipedia_url'),
                    "reasoning": city_data.get('reasoning'),
                    "overview": city_data.get('overview'),
                    "image_url": image_url if image_url != "N/A" else None,
                    "coordinates": coordinates
                }
                
                return final_response
                
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
                    "latitude": None,
                    "longitude": None,
                    "area_mi": None,
                    "area_km": None,
                    "population_density": None,
                    "elevation": None,
                    "year_founded": None,
                    "notable_attractions": [],
                    "notable_people": [],
                    "notable_events": [],
                    "notable_businesses": [],
                    "wikipedia_url": None,
                    "image_url": None,
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
                "latitude": None,
                "longitude": None,
                "area_mi": None,
                "area_km": None,
                "population_density": None,
                "elevation": None,
                "year_founded": None,
                "notable_attractions": [],
                "notable_people": [],
                "notable_events": [],
                "notable_businesses": [],
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
                    
                    # Check if it's a reasonable size for a city photo
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w >= 100 and h >= 100:  # Minimum size threshold
                                image_url = src
                                break
                        except ValueError:
                            continue
                    
                    # If no size attributes, check the src for common patterns
                    if not image_url and any(keyword in src.lower() for keyword in ['photo', 'image', 'skyline', 'view', 'city', 'downtown', 'center', 'jpg', 'jpeg', 'png']):
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
    
    def _get_place_coordinates(self, place_name: str) -> Optional[Dict[str, float]]:
        """Get coordinates for a place using Google Maps Geocoding API."""
        try:
            if not place_name or place_name.lower() in ['n/a', 'unknown', '']:
                return None
            
            # Use Google Maps Geocoding API
            geocode_result = self.gmaps.geocode(place_name)
            
            if geocode_result:
                location = geocode_result[0]['geometry']['location']
                return {
                    'lat': location['lat'],
                    'lng': location['lng']
                }
            return None
            
        except Exception as e:
            print(f"Error getting coordinates for {place_name}: {str(e)}")
            return None

# Create a global instance for the API to use
city_guesser = CityGuesser()