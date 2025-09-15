import google.generativeai as genai
from typing import Optional, Dict, Any
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import googlemaps
from config import GEMINI_API_KEY, GOOGLE_MAPS_API_KEY

class InventionGuesser:
    def __init__(self):
        """Initialize the Gemini API client."""
        # Import API key from config file
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
            raise ValueError("Please set your actual Gemini API key in config.py")
        
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        self.image_model = genai.GenerativeModel('gemini-2.5-flash-image-preview')
        self.gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
        self.current_session = None
    
    def start_new_session(self, user_input: str) -> Dict[str, Any]:
        """Start a new guessing session with user input."""
        self.current_session = {
            'user_input': user_input,
            'guesses': [],
            'incorrect_names': [],  # Track names that were marked as incorrect
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
    
    def _make_guess(self, context: str, incorrect_names: list = None) -> str:
        """Make a guess using Gemini API."""
        if incorrect_names is None:
            incorrect_names = []
        
        # Build the exclusion list for the prompt
        exclusion_text = ""
        if incorrect_names:
            exclusion_text = f"\n\nIMPORTANT: Do NOT guess any of these inventions (they have already been marked as incorrect): {', '.join(incorrect_names)}"
        
        prompt = f"""
        Based on the following information, guess what invention the user is describing. Source information from Wikipedia and other reliable sources.
        
        Return the information as a JSON object with the following keys:
        - 'name': The invention's name
        - 'year_invented': The year the invention was invented, or null if unknown
        - 'place_invented': The place where the invention was invented, or null if unknown
        - 'inventors': An array of strings with inventor names, or empty array [] if unknown
        - 'materials_used': An array of strings with materials used in the invention, or empty array [] if unknown
        - 'previous_inventions': An array of strings with names of previous inventions it relied on, or empty array [] if unknown
        - 'later_inventions': An array of strings with names of later inventions it enabled, or empty array [] if unknown
        - 'consumer_uses': An array of strings with consumer uses of the invention, or empty array [] if unknown
        - 'commercial_uses': An array of strings with commercial uses of the invention, or empty array [] if unknown
        - 'institutional_uses': An array of strings with institutional (government, military, education, scientific, nonprofit, etc.) uses of the invention, or empty array [] if unknown
        - 'businesses': An array of strings with names of businesses that produce this invention, or empty array [] if unknown
        - 'design_hubs': An array of strings with names of cities where the invention is or was historically designed, entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States"), or empty array [] if unknown
        - 'manufacturing_hubs': An array of strings with names of cities where the invention is or was historically manufactured, entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States"), or empty array [] if unknown
        - 'historical_events': An array of strings with names of historical events where this invention was used, or empty array [] if unknown
        - 'wikipedia_url': Wikipedia URL for this invention, or null if not found
        - 'reasoning': Brief explanation of why you think this is the correct invention based on the information provided
        - 'overview': A brief overview of the invention in 50 to 75 words.
        - 'city': A modern-day city that is located near the geographic center of the invention (if known, otherwise null), entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States")
        
        Information: {context}{exclusion_text}
        
        If you're not sure, make your best guess based on the information provided and explain your reasoning.
        """
        
        try:
            response = self.model.generate_content(prompt)
            guess_text = response.text.strip()
            print(f"=== GEMINI RESPONSE DEBUG ===")
            print(f"Full response: {guess_text}")
            print(f"Response length: {len(guess_text)}")
            print("=== END GEMINI RESPONSE ===")
            
            # Parse JSON response - handle markdown code blocks
            import json
            try:
                # Strip markdown code blocks if present
                cleaned_text = guess_text.strip()
                if cleaned_text.startswith('```json'):
                    cleaned_text = cleaned_text[7:]  # Remove ```json
                if cleaned_text.startswith('```'):
                    cleaned_text = cleaned_text[3:]   # Remove ```
                if cleaned_text.endswith('```'):
                    cleaned_text = cleaned_text[:-3]  # Remove trailing ```
                cleaned_text = cleaned_text.strip()
                
                data = json.loads(cleaned_text)
                print(f"=== JSON PARSED SUCCESSFULLY ===")
                print(f"Name: {data.get('name', 'N/A')}")
                print(f"Inventors: {data.get('inventors', [])}")
                print(f"Materials: {data.get('materials_used', [])}")
                print("=== END JSON PARSING ===")
                
                # Extract data from JSON
                name = data.get('name', 'Unknown')
                year_invented = data.get('year_invented')
                place_invented = data.get('place_invented')
                inventors = data.get('inventors', [])
                materials_used = data.get('materials_used', [])
                previous_inventions = data.get('previous_inventions', [])
                later_inventions = data.get('later_inventions', [])
                consumer_uses = data.get('consumer_uses', [])
                commercial_uses = data.get('commercial_uses', [])
                institutional_uses = data.get('institutional_uses', [])
                businesses = data.get('businesses', [])
                design_hubs = data.get('design_hubs', [])
                manufacturing_hubs = data.get('manufacturing_hubs', [])
                historical_events = data.get('historical_events', [])
                wikipedia_url = data.get('wikipedia_url')
                reasoning = data.get('reasoning', '')
                overview = data.get('overview', '')
                
                # Convert arrays to strings for display
                inventors_str = ', '.join(inventors) if inventors else 'N/A'
                materials_str = ', '.join(materials_used) if materials_used else 'N/A'
                previous_str = ', '.join(previous_inventions) if previous_inventions else 'N/A'
                later_str = ', '.join(later_inventions) if later_inventions else 'N/A'
                businesses_str = ', '.join(businesses) if businesses else 'N/A'
                events_str = ', '.join(historical_events) if historical_events else 'N/A'
                
            except json.JSONDecodeError as e:
                print(f"=== JSON PARSING ERROR ===")
                print(f"Error: {e}")
                print(f"Raw response: {guess_text}")
                print("=== END JSON ERROR ===")
                # Fallback to old format parsing
                return self._parse_old_format(guess_text, context, incorrect_names)
            
            # Generate image using Gemini 2.5 Flash Image Preview
            generated_image_url = self._generate_invention_image(name)
            
            # Get Wikipedia image if URL is available (as fallback)
            wikipedia_image_url = "N/A"
            if wikipedia_url and wikipedia_url.lower() != 'n/a':
                wikipedia_image_url = self._extract_wikimedia_image(wikipedia_url)
            
            # Get coordinates for the city if available (preferred for map centering)
            coordinates = None
            city = data.get('city')
            if city:
                coordinates = self._get_location_coordinates(city)
            elif place_invented:
                # Fallback to place_invented if city is not available
                coordinates = self._get_location_coordinates(place_invented)
            
            # Build the final response as JSON
            final_response = {
                "name": name,
                "overview": overview,
                "year_invented": year_invented,
                "place_invented": place_invented,
                "inventors": inventors,
                "materials_used": materials_used,
                "previous_inventions": previous_inventions,
                "later_inventions": later_inventions,
                "consumer_uses": consumer_uses,
                "commercial_uses": commercial_uses,
                "institutional_uses": institutional_uses,
                "businesses": businesses,
                "design_hubs": design_hubs,
                "manufacturing_hubs": manufacturing_hubs,
                "historical_events": historical_events,
                "wikipedia_url": wikipedia_url,
                "reasoning": reasoning,
                "image_url": generated_image_url,
                "wikipedia_image_url": wikipedia_image_url,
                "city": city,
                "coordinates": coordinates
            }

            return final_response
        except Exception as e:
            return f"Error making guess: {str(e)}"
    
    def _parse_old_format(self, guess_text: str, context: str, incorrect_names: list) -> str:
        """Fallback method to parse the old text format if JSON parsing fails."""
        lines = guess_text.split('\n')
        # This is a simplified fallback - you can expand it if needed
        return guess_text
    
    def _extract_wikimedia_image(self, url: str) -> str:
        """Extract the best Wikimedia image URL from a given webpage URL."""
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
                    
                    # Check if it's a reasonable size for an invention's image
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w >= 100 and h >= 100:  # Minimum size threshold
                                image_url = src
                                break
                        except ValueError:
                            continue
                    
                    # If no size attributes, check the src for common patterns
                    if not image_url and any(keyword in src.lower() for keyword in ['photo', 'image', 'jpg', 'jpeg', 'png', 'invention', 'device']):
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
    
    def _generate_invention_image(self, invention_name: str) -> str:
        """Generate an image for the invention using Gemini 2.5 Flash Image Preview."""
        if not invention_name or invention_name.strip() == '':
            return "https://via.placeholder.com/400x400/059669/FFFFFF?text=No+Invention+Name"
        
        try:
            # Create a descriptive prompt for the invention
            image_prompt = f"Create a technical illustration or artistic representation of the invention: {invention_name}. The image should be technically accurate, visually compelling, and capture the essence of this important invention. Make it suitable for educational purposes."
            
            # Generate image using Gemini 2.5 Flash Image Preview
            response = self.image_model.generate_content([
                image_prompt,
                "Generate a high-quality, technically accurate image that represents this invention. The image should be clear, detailed, and appropriate for educational use."
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
                    return "https://via.placeholder.com/400x400/059669/FFFFFF?text=No+Image+Generated"
            else:
                return "https://via.placeholder.com/400x400/059669/FFFFFF?text=No+Image+Generated"
            
        except Exception as e:
            print(f"Error generating image for invention '{invention_name}': {e}")
            return "https://via.placeholder.com/400x400/EF4444/FFFFFF?text=Image+Generation+Failed"
    
    def submit_feedback(self, session_id: int, is_correct: bool) -> Dict[str, Any]:
        """Submit feedback for the current guess and make next guess if incorrect."""
        try:
            if not self.current_session or self.current_session['session_id'] != session_id:
                return {'error': 'Invalid session'}
            
            # Update the last guess with feedback
            if self.current_session['guesses']:
                # Get the last guess and handle feedback
                last_guess = self.current_session['guesses'][-1]
                
                # Handle different guess formats
                if isinstance(last_guess, str):
                    # Old text format - wrap in dictionary
                    self.current_session['guesses'][-1] = {
                        'guess': last_guess,
                        'is_correct': is_correct
                    }
                    guess_data = last_guess
                elif isinstance(last_guess, dict):
                    # Check if it's already wrapped (has 'guess' key) or direct JSON object
                    if 'guess' in last_guess:
                        # Already wrapped format
                        last_guess['is_correct'] = is_correct
                        guess_data = last_guess['guess']
                    else:
                        # Direct JSON object - wrap it
                        self.current_session['guesses'][-1] = {
                            'guess': last_guess,
                            'is_correct': is_correct
                        }
                        guess_data = last_guess
                
                # If incorrect, add the name to the incorrect list
                if not is_correct:
                    incorrect_name = None
                    
                    # Handle JSON object format
                    if isinstance(guess_data, dict):
                        incorrect_name = guess_data.get('name')
                    # Handle text format with NAME: prefix
                    elif isinstance(guess_data, str) and 'NAME:' in guess_data:
                        lines = guess_data.split('\n')
                        for line in lines:
                            if line.startswith('NAME:'):
                                incorrect_name = line.replace('NAME:', '').strip()
                                break
                    
                    # Add to incorrect names list if we found a name
                    if incorrect_name and incorrect_name not in self.current_session['incorrect_names']:
                        self.current_session['incorrect_names'].append(incorrect_name)
            
            if is_correct:
                # Game won!
                return {
                    'session_id': session_id,
                    'guess': None,
                    'is_correct': True,
                    'game_over': True,
                    'message': 'Congratulations! I guessed correctly!'
                }
            else:
                # Make another guess
                # Build context from original input and previous incorrect guesses
                context = self.current_session['user_input']
                incorrect_guess_names = []
                for g in self.current_session['guesses']:
                    if isinstance(g, dict) and g.get('is_correct') == False:
                        guess_data = g['guess']
                        # Extract name from guess data
                        if isinstance(guess_data, dict):
                            name = guess_data.get('name', 'Unknown')
                            incorrect_guess_names.append(name)
                        elif isinstance(guess_data, str):
                            # Handle old text format
                            if 'NAME:' in guess_data:
                                lines = guess_data.split('\n')
                                for line in lines:
                                    if line.startswith('NAME:'):
                                        name = line.replace('NAME:', '').strip()
                                        incorrect_guess_names.append(name)
                                        break
                            else:
                                incorrect_guess_names.append(guess_data)
                    elif isinstance(g, str):
                        # Handle old format where guesses were just strings
                        incorrect_guess_names.append(g)
                
                if incorrect_guess_names:
                    context += f" (Previous incorrect guesses: {', '.join(incorrect_guess_names)})"
                
                new_guess = self._make_guess(context, self.current_session['incorrect_names'])
                self.current_session['guesses'].append(new_guess)
                
                return {
                    'session_id': session_id,
                    'guess': new_guess,
                    'is_correct': None,
                    'game_over': False
                }
        except Exception as e:
            print(f"Error in submit_feedback: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'error': f'Error processing feedback: {str(e)}'}
    
    def get_session_status(self, session_id: int) -> Dict[str, Any]:
        """Get the current status of a session."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {'error': 'Invalid session'}
        
        return {
            'session_id': session_id,
            'user_input': self.current_session['user_input'],
            'guesses': self.current_session['guesses'],
            'total_guesses': len(self.current_session['guesses'])
        }

# Global instance
invention_guesser = InventionGuesser()