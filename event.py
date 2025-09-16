import google.generativeai as genai
from typing import Optional, Dict, Any
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import googlemaps
from config import GEMINI_API_KEY, GOOGLE_MAPS_API_KEY

class EventGuesser:
    def __init__(self):
        """Initialize the Gemini API client."""
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        self.image_model = genai.GenerativeModel('gemini-2.5-flash-image-preview')
        self.gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
        self.current_session = None
    
    def start_new_session(self, user_input: str) -> Dict[str, Any]:
        """Start a new event guessing session with user input."""
        self.current_session = {
            'user_input': user_input,
            'guesses': [],
            'incorrect_events': [],  # Track events that were marked as incorrect
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
    
    def _make_guess(self, context: str, incorrect_events: list = None) -> str:
        """Make an event guess using Gemini API."""
        if incorrect_events is None:
            incorrect_events = []
        
        # Build the exclusion list for the prompt
        exclusion_text = ""
        if incorrect_events:
            exclusion_text = f"\n\nIMPORTANT: Do NOT guess any of these events (they have already been marked as incorrect): {', '.join(incorrect_events)}"
        
        prompt = f"""You are an expert at identifying historical events based on descriptions. Based on the following information, guess which event the user is describing.

{context}{exclusion_text}

Please respond with a JSON object containing the following fields:
- name: The event name
- start: Start date of the event (if known, otherwise null)
- end: End date of the event (if known, otherwise null)
- location: The primary location where the event took place (if known, otherwise null)
- key_cities: An array of key cities involved in the event (if known, otherwise empty array), entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States")
- key_figures: An array of key figures involved in the event (if known, otherwise empty array)
- key_technologies: An array of key technologies used in the event (if known, otherwise empty array)
- causes: The main causes or triggers of the event (if known, otherwise null), answered as a complete sentence
- key_developments: Key developments or phases of the event (if known, otherwise null), answered as a complete sentence
- results: The main results or outcomes of the event (if known, otherwise null), answered as a complete sentence
- wikipedia_url: Wikipedia URL for the event (if available, otherwise null)
- reasoning: Your reasoning for why you think this is the correct event
- overview: A concise 50-75 word overview of the event's significance and key details
- city: A modern-day city that is located near the geographic center of the event (if known, otherwise null), entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States")

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
                if response_text.startswith('```'):
                    response_text = response_text[3:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                event_data = json.loads(response_text)
                print(f"=== JSON PARSED SUCCESSFULLY ===")
                print(f"Name: {event_data.get('name', 'N/A')}")
                print(f"Start: {event_data.get('start', 'N/A')}")
                print(f"End: {event_data.get('end', 'N/A')}")
                print(f"Location: {event_data.get('location', 'N/A')}")
                print(f"Key Figures: {event_data.get('key_figures', [])}")
                print(f"Causes: {event_data.get('causes', 'N/A')}")
                print(f"Results: {event_data.get('results', 'N/A')}")
                print(f"Wikipedia URL: {event_data.get('wikipedia_url', 'N/A')}")
                print(f"Reasoning: {event_data.get('reasoning', 'N/A')[:100]}...")
                print("=== END JSON PARSING ===")
                
                # Generate image using Gemini 2.5 Flash Image Preview
                generated_image_url = self._generate_event_image(event_data.get('name', ''))
                
                # Get Wikipedia image if URL is available (as fallback)
                wikipedia_image_url = "N/A"
                if event_data.get('wikipedia_url') and event_data['wikipedia_url'].lower() != 'n/a':
                    wikipedia_image_url = self._extract_image_from_url(event_data['wikipedia_url'])
                
                # Get coordinates for the city if available (preferred for map centering)
                coordinates = None
                if event_data.get('city'):
                    coordinates = self._get_location_coordinates(event_data['city'])
                elif event_data.get('location'):
                    # Fallback to location if city is not available
                    coordinates = self._get_location_coordinates(event_data['location'])
                
                # Add images and coordinates to the response
                event_data['image_url'] = generated_image_url
                event_data['wikipedia_image_url'] = wikipedia_image_url
                event_data['coordinates'] = coordinates
                
                # Ensure key_technologies is included in the response
                if 'key_technologies' not in event_data:
                    event_data['key_technologies'] = []
                
                return event_data
                
            except json.JSONDecodeError as e:
                # If JSON parsing fails, return a fallback response
                print(f"=== JSON PARSING FAILED ===")
                print(f"Error: {str(e)}")
                print(f"Cleaned response text: {response_text}")
                print("=== END JSON PARSING ERROR ===")
                return {
                    'name': 'Unable to parse response',
                    'start': None,
                    'end': None,
                    'location': None,
                    'key_cities': [],
                    'key_figures': [],
                    'key_technologies': [],
                    'causes': None,
                    'key_developments': None,
                    'results': None,
                    'wikipedia_url': None,
                    'reasoning': f'Failed to parse AI response as valid JSON. Error: {str(e)}',
                    'overview': 'The AI response could not be properly parsed.',
                    'image_url': "https://via.placeholder.com/400x400/EF4444/FFFFFF?text=Parse+Error",
                    'wikipedia_image_url': None,
                    'coordinates': None,
                    'city': None
                }
                
        except Exception as e:
            return {
                'name': 'Error occurred',
                'start': None,
                'end': None,
                'location': None,
                'key_cities': [],
                'key_figures': [],
                'key_technologies': [],
                'causes': None,
                'key_developments': None,
                'results': None,
                'wikipedia_url': None,
                'reasoning': f'An error occurred while processing the request: {str(e)}',
                'overview': 'An error occurred while trying to identify the event.',
                'image_url': None,
                'coordinates': None,
                'city': None
            }
    
    def _get_wikipedia_image(self, wikipedia_url: str) -> Optional[str]:
        """Get the main image from a Wikipedia page."""
        try:
            response = requests.get(wikipedia_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for the main infobox image
            infobox = soup.find('table', class_='infobox')
            if infobox:
                img_tag = infobox.find('img')
                if img_tag and img_tag.get('src'):
                    img_src = img_tag['src']
                    if img_src.startswith('//'):
                        img_src = 'https:' + img_src
                    elif img_src.startswith('/'):
                        img_src = 'https://en.wikipedia.org' + img_src
                    return img_src
            
            # Fallback: look for any image in the article
            img_tag = soup.find('img', {'src': lambda x: x and 'upload.wikimedia.org' in x})
            if img_tag and img_tag.get('src'):
                img_src = img_tag['src']
                if img_src.startswith('//'):
                    img_src = 'https:' + img_src
                elif img_src.startswith('/'):
                    img_src = 'https://en.wikipedia.org' + img_src
                return img_src
                
        except Exception as e:
            print(f"Error getting Wikipedia image: {e}")
        
        return None
    
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
    
    def submit_feedback(self, session_id: int, is_correct: bool) -> Dict[str, Any]:
        """Submit feedback for the current guess."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {'error': 'Invalid session ID'}
        
        if is_correct:
            # Game is won
            self.current_session['game_over'] = True
            return {
                'session_id': session_id,
                'correct': True,
                'game_over': True,
                'message': 'Congratulations! You guessed correctly!'
            }
        else:
            # Add current guess to incorrect list and make a new guess
            current_guess = self.current_session['guesses'][-1]
            if current_guess.get('name'):
                self.current_session['incorrect_events'].append(current_guess['name'])
            
            # Make a new guess with the updated context
            new_guess = self._make_guess(
                self.current_session['user_input'], 
                self.current_session['incorrect_events']
            )
            self.current_session['guesses'].append(new_guess)
            
            return {
                'session_id': session_id,
                'correct': False,
                'game_over': False,
                'new_guess': new_guess
            }
    
    def get_session_status(self, session_id: int) -> Dict[str, Any]:
        """Get the current status of a session."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {'error': 'Invalid session ID'}
        
        return {
            'session_id': session_id,
            'user_input': self.current_session['user_input'],
            'guesses': self.current_session['guesses'],
            'incorrect_events': self.current_session['incorrect_events'],
            'game_over': self.current_session.get('game_over', False)
        }
    
    def _generate_event_image(self, event_name: str) -> str:
        """Generate an image for the event using Gemini 2.5 Flash Image Preview."""
        if not event_name or event_name.strip() == '':
            return "https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=No+Event+Name"
        
        try:
            # Create a descriptive prompt for the event
            image_prompt = f"Create a historical illustration or artistic representation of the event: {event_name}. The image should be historically accurate, visually compelling, and capture the essence of this significant historical event. Make it suitable for educational purposes."
            
            # Generate image using Gemini 2.5 Flash Image Preview
            response = self.image_model.generate_content([
                image_prompt,
                "Generate a high-quality, historically accurate image that represents this event. The image should be clear, detailed, and appropriate for educational use."
            ])
            
            # Extract image URL from response
            if hasattr(response, 'parts') and response.parts:
                for part in response.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        # Convert base64 image data to data URL
                        import base64
                        image_data = base64.b64encode(part.inline_data.data).decode('utf-8')
                        image_url = f"data:image/png;base64,{image_data}"
                        return image_url
                else:
                    # Fallback if no image data found
                    return "https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=No+Image+Generated"
            else:
                return "https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=No+Image+Generated"
            
        except Exception as e:
            print(f"Error generating image for event '{event_name}': {e}")
            return "https://via.placeholder.com/400x400/EF4444/FFFFFF?text=Image+Generation+Failed"
    
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
                    
                    # Check if it's a reasonable size for an event photo
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w >= 100 and h >= 100:  # Minimum size threshold
                                image_url = src
                                break
                        except ValueError:
                            continue
                    
                    # If no size attributes, check the src for common patterns
                    if not image_url and any(keyword in src.lower() for keyword in ['photo', 'image', 'event', 'battle', 'war', 'meeting', 'conference', 'jpg', 'jpeg', 'png']):
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

# Create global instance
event_guesser = EventGuesser()