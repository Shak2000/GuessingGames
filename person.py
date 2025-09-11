import google.generativeai as genai
from typing import Optional, Dict, Any
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import googlemaps
from config import GEMINI_API_KEY, GOOGLE_MAPS_API_KEY

class FamousPersonGuesser:
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
            exclusion_text = f"\n\nIMPORTANT: Do NOT guess any of these people (they have already been marked as incorrect): {', '.join(incorrect_names)}"
        
        prompt = f"""
        Based on the following information, guess who the famous person is. Source biographical information from Wikipedia.
        
        Return the information as a JSON object with the following keys:
        - 'name': The person's full name
        - 'date_of_birth': The person's date of birth, or null if unknown
        - 'place_of_birth': The person's place of birth (city, administrative division, country (e.g., "Dallas, Texas, United States")), or null if unknown
        - 'place_of_residence': The person's place of residence (city, administrative division, country (e.g., "Dallas, Texas, United States")), or null if dead or unknown
        - 'date_of_death': The person's date of death, or null if still alive
        - 'place_of_death': The person's place of death (city, administrative division, country (e.g., "Dallas, Texas, United States")), or null if still alive
        - 'place_of_burial': The person's place of burial (city, administrative division, country (e.g., "Dallas, Texas, United States")), or null if still alive or unknown
        - 'parents': An array of strings with parent names, or empty array [] if unknown
        - 'siblings': An array of strings with sibling names, or empty array [] if unknown
        - 'spouse': An array of strings with spouse names, or empty array [] if unknown
        - 'children': An array of strings with children names, or empty array [] if unknown
        - 'wikipedia_url': Wikipedia URL for this person, or null if not found
        - 'reasoning': Brief explanation of why you think this is the correct person based on the information provided
        - 'overview': A brief overview of the person's life in 50 to 75 words.
        
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
                print(f"Parents: {data.get('parents', [])}")
                print(f"Siblings: {data.get('siblings', [])}")
                print(f"Spouse: {data.get('spouse', '')}")
                print(f"Children: {data.get('children', [])}")
                print("=== END JSON PARSING ===")
                
                # Extract data from JSON
                name = data.get('name', 'Unknown')
                date_of_birth = data.get('date_of_birth')
                place_of_birth = data.get('place_of_birth')
                date_of_death = data.get('date_of_death')
                place_of_death = data.get('place_of_death')
                place_of_residence = data.get('place_of_residence')
                place_of_burial = data.get('place_of_burial')
                parents = data.get('parents', [])
                siblings = data.get('siblings', [])
                spouse = data.get('spouse', [])
                children = data.get('children', [])
                wikipedia_url = data.get('wikipedia_url')
                reasoning = data.get('reasoning', '')
                overview = data.get('overview', '')
                
                # Convert arrays to strings for display
                parents_str = ', '.join(parents) if parents else 'N/A'
                siblings_str = ', '.join(siblings) if siblings else 'N/A'
                spouse_str = ', '.join(spouse) if spouse else 'N/A'
                children_str = ', '.join(children) if children else 'N/A'
                
            except json.JSONDecodeError as e:
                print(f"=== JSON PARSING ERROR ===")
                print(f"Error: {e}")
                print(f"Raw response: {guess_text}")
                print("=== END JSON ERROR ===")
                # Fallback to old format parsing
                return self._parse_old_format(guess_text, context, incorrect_names)
            
            # If we have a Wikipedia URL, try to extract an image
            image_url = "N/A"
            if wikipedia_url and wikipedia_url.lower() != 'n/a':
                image_url = self._extract_image_from_url(wikipedia_url)
            
            # Get coordinates for places
            coordinates = {}
            if place_of_birth and place_of_birth.lower() != 'n/a':
                birth_coords = self._get_place_coordinates(place_of_birth)
                if birth_coords:
                    coordinates['birthplace'] = birth_coords
            
            if place_of_death and place_of_death.lower() not in ['n/a', 'alive', 'still alive']:
                death_coords = self._get_place_coordinates(place_of_death)
                if death_coords:
                    coordinates['deathplace'] = death_coords
            
            if place_of_residence and place_of_residence.lower() not in ['n/a', 'null', 'unknown']:
                residence_coords = self._get_place_coordinates(place_of_residence)
                if residence_coords:
                    coordinates['residence'] = residence_coords
            
            if place_of_burial and place_of_burial.lower() not in ['n/a', 'null', 'unknown']:
                burial_coords = self._get_place_coordinates(place_of_burial)
                if burial_coords:
                    coordinates['burial'] = burial_coords
            
            # Build the final response as JSON
            final_response = {
                "name": name,
                "overview": overview,
                "date_of_birth": date_of_birth,
                "place_of_birth": place_of_birth,
                "birthplace_area_mi": data.get('birthplace_area_mi'),
                "date_of_death": date_of_death,
                "place_of_death": place_of_death,
                "deathplace_area_mi": data.get('deathplace_area_mi'),
                "place_of_residence": place_of_residence,
                "place_of_burial": place_of_burial,
                "parents": parents,
                "siblings": siblings,
                "spouse": spouse,
                "children": children,
                "wikipedia_url": wikipedia_url,
                "reasoning": reasoning,
                "image_url": image_url if image_url != "N/A" else None,
                "coordinates": coordinates if coordinates else None
            }

            return final_response
        except Exception as e:
            return f"Error making guess: {str(e)}"
    
    def _parse_old_format(self, guess_text: str, context: str, incorrect_names: list) -> str:
        """Fallback method to parse the old text format if JSON parsing fails."""
        lines = guess_text.split('\n')
        # This is a simplified fallback - you can expand it if needed
        return guess_text
    
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
                    
                    # Check if it's a reasonable size for a person's photo
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w >= 100 and h >= 100:  # Minimum size threshold
                                image_url = src
                                break
                        except ValueError:
                            continue
                    
                    # If no size attributes, check the src for common patterns
                    if not image_url and any(keyword in src.lower() for keyword in ['photo', 'portrait', 'image', 'jpg', 'jpeg', 'png']):
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
guesser = FamousPersonGuesser()
