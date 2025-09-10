"""
Business Guessing Game - AI-powered business identification
This game allows users to provide information about a business and the AI tries to guess which business it is.
"""

import google.generativeai as genai
from typing import Optional, Dict, Any, List
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import googlemaps
from config import GEMINI_API_KEY, GOOGLE_MAPS_API_KEY

class BusinessGuesser:
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
        """Start a new business guessing session with user input."""
        self.current_session = {
            'user_input': user_input,
            'guesses': [],
            'incorrect_businesses': [],  # Track businesses that were marked as incorrect
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
    
    def _make_guess(self, context: str, incorrect_businesses: List[str] = None) -> Dict[str, Any]:
        """Make a business guess using Gemini API."""
        if incorrect_businesses is None:
            incorrect_businesses = []
        
        # Build the exclusion list for the prompt
        exclusion_text = ""
        if incorrect_businesses:
            exclusion_text = f"\n\nIMPORTANT: Do NOT guess any of these businesses (they have already been marked as incorrect): {', '.join(incorrect_businesses)}"
        
        prompt = f"""You are an expert at identifying businesses based on descriptions. Based on the following information, guess which business the user is describing.

{context}{exclusion_text}

Please respond with a JSON object containing the following fields:
- name: The business name
- type: The business type (public, private, subsidiary, etc.)
- stock_exchange: The stock exchange where the company is listed (if public, otherwise "N/A")
- ticker: The stock ticker symbol (if public, otherwise "N/A")
- industry: An array of industries the business operates in
- predecessors: An array of predecessor companies (if any, otherwise empty array)
- previous_names: An array of previous company names (if any, otherwise empty array)
- city_founded: The city where the company was founded, entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States")
- year_founded: The year the company was founded
- founders: An array of founder names (if known, otherwise empty array)
- current_headquarters: The current headquarters location, entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States")
- areas_served: An array of geographic areas where the company operates
- chairman: The current chairman (if known, otherwise null)
- ceo: The current CEO (if known, otherwise null)
- products: An array of main products (if any, otherwise empty array)
- services: An array of main services (if any, otherwise empty array)
- subsidiaries: An array of subsidiary companies (if any, otherwise empty array)
- revenue: Annual revenue (if known, otherwise null)
- operating_income: Annual operating income (if known, otherwise null)
- net_income: Annual net income (if known, otherwise null)
- total_assets: Total assets (if known, otherwise null)
- total_equity: Total equity (if known, otherwise null)
- owner: The owner of the company (if known, otherwise null)
- owner_equity_percentage: The owner's equity percentage (if owner known, otherwise null)
- number_of_employees: Number of employees (if known, otherwise null)
- parent: The parent company (if any, otherwise null)
- website: The company's website URL (if known, otherwise null)
- wikipedia_url: Wikipedia URL for the business (if available, otherwise null)
- overview: A concise 50-75 word overview of the business's history, significance, and notable features
- reasoning: Your reasoning for why you think this is the correct business

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
                
                business_data = json.loads(response_text)
                print(f"=== JSON PARSED SUCCESSFULLY ===")
                print(f"Name: {business_data.get('name', 'N/A')}")
                print(f"Type: {business_data.get('type', 'N/A')}")
                print(f"Industry: {business_data.get('industry', 'N/A')}")
                print(f"Founded: {business_data.get('year_founded', 'N/A')}")
                print(f"Headquarters: {business_data.get('current_headquarters', 'N/A')}")
                print(f"Wikipedia URL: {business_data.get('wikipedia_url', 'N/A')}")
                print(f"Reasoning: {business_data.get('reasoning', 'N/A')[:100]}...")
                print("=== END JSON PARSING ===")
                
                # Validate required fields
                if not business_data.get('name'):
                    raise ValueError("Missing required field: name")
                if not business_data.get('reasoning'):
                    raise ValueError("Missing required field: reasoning")
                
                # Add overview if missing
                if not business_data.get('overview'):
                    business_data['overview'] = f"{business_data['name']} is a business in the {business_data.get('industry', 'unknown')} industry."
                
                # If we have a Wikipedia URL, try to extract an image
                image_url = "N/A"
                wikipedia_url = business_data.get('wikipedia_url')
                if wikipedia_url and wikipedia_url.lower() != 'n/a':
                    image_url = self._extract_image_from_url(wikipedia_url)
                
                # Get coordinates for the headquarters
                coordinates = None
                headquarters = business_data.get('current_headquarters')
                if headquarters:
                    headquarters_coords = self._get_place_coordinates(headquarters)
                    if headquarters_coords:
                        coordinates = headquarters_coords
                
                # Build the final response as JSON (matching other games structure)
                final_response = {
                    "name": business_data.get('name'),
                    "type": business_data.get('type'),
                    "stock_exchange": business_data.get('stock_exchange'),
                    "ticker": business_data.get('ticker'),
                    "industry": business_data.get('industry'),
                    "predecessors": business_data.get('predecessors', []),
                    "previous_names": business_data.get('previous_names', []),
                    "city_founded": business_data.get('city_founded'),
                    "year_founded": business_data.get('year_founded'),
                    "founders": business_data.get('founders', []),
                    "current_headquarters": business_data.get('current_headquarters'),
                    "areas_served": business_data.get('areas_served'),
                    "chairman": business_data.get('chairman'),
                    "ceo": business_data.get('ceo'),
                    "products": business_data.get('products', []),
                    "services": business_data.get('services', []),
                    "subsidiaries": business_data.get('subsidiaries', []),
                    "revenue": business_data.get('revenue'),
                    "operating_income": business_data.get('operating_income'),
                    "net_income": business_data.get('net_income'),
                    "total_assets": business_data.get('total_assets'),
                    "total_equity": business_data.get('total_equity'),
                    "owner": business_data.get('owner'),
                    "owner_equity_percentage": business_data.get('owner_equity_percentage'),
                    "number_of_employees": business_data.get('number_of_employees'),
                    "parent": business_data.get('parent'),
                    "website": business_data.get('website'),
                    "wikipedia_url": business_data.get('wikipedia_url'),
                    "reasoning": business_data.get('reasoning'),
                    "overview": business_data.get('overview'),
                    "image_url": image_url if image_url != "N/A" else None,
                    "coordinates": coordinates
                }
                
                return final_response
                
            except json.JSONDecodeError as e:
                # If JSON parsing fails, return a fallback response
                return {
                    "name": "Unable to parse response",
                    "type": None,
                    "stock_exchange": None,
                    "ticker": None,
                    "industry": None,
                    "predecessors": [],
                    "previous_names": [],
                    "city_founded": None,
                    "year_founded": None,
                    "founders": [],
                    "current_headquarters": None,
                    "areas_served": None,
                    "chairman": None,
                    "ceo": None,
                    "products": [],
                    "services": [],
                    "subsidiaries": [],
                    "revenue": None,
                    "operating_income": None,
                    "net_income": None,
                    "total_assets": None,
                    "total_equity": None,
                    "owner": None,
                    "owner_equity_percentage": None,
                    "number_of_employees": None,
                    "parent": None,
                    "website": None,
                    "wikipedia_url": None,
                    "image_url": None,
                    "reasoning": f"Error parsing AI response: {str(e)}",
                    "overview": "There was an error processing the AI response."
                }
                
        except Exception as e:
            return {
                "name": "Error occurred",
                "type": None,
                "stock_exchange": None,
                "ticker": None,
                "industry": None,
                "predecessors": [],
                "previous_names": [],
                "city_founded": None,
                "year_founded": None,
                "founders": [],
                "current_headquarters": None,
                "areas_served": None,
                "chairman": None,
                "ceo": None,
                "products": [],
                "services": [],
                "subsidiaries": [],
                "revenue": None,
                "operating_income": None,
                "net_income": None,
                "total_assets": None,
                "total_equity": None,
                "owner": None,
                "owner_equity_percentage": None,
                "number_of_employees": None,
                "parent": None,
                "website": None,
                "wikipedia_url": None,
                "image_url": None,
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
                'message': 'Congratulations! The business was guessed correctly.'
            }
        else:
            # Add the incorrect business to the list and make another guess
            last_guess = self.current_session['guesses'][-1]
            if isinstance(last_guess, dict) and 'name' in last_guess:
                self.current_session['incorrect_businesses'].append(last_guess['name'])
            
            # Make another guess with the updated context
            new_guess = self._make_guess(
                self.current_session['user_input'], 
                self.current_session['incorrect_businesses']
            )
            self.current_session['guesses'].append(new_guess)
            
            return {
                'session_id': session_id,
                'guess': new_guess,
                'game_over': False,
                'incorrect_businesses': self.current_session['incorrect_businesses']
            }
    
    def get_session_status(self, session_id: int) -> Dict[str, Any]:
        """Get session information."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {"error": "Session not found"}
        
        return {
            'session_id': session_id,
            'user_input': self.current_session['user_input'],
            'guesses': self.current_session['guesses'],
            'incorrect_businesses': self.current_session['incorrect_businesses']
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
                    
                    # Check if it's a reasonable size for a business logo
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w >= 100 and h >= 100:  # Minimum size threshold
                                image_url = src
                                break
                        except ValueError:
                            continue
                    
                    # If no size attributes, check the src for common patterns
                    if not image_url and any(keyword in src.lower() for keyword in ['logo', 'image', 'company', 'business', 'corporate', 'jpg', 'jpeg', 'png']):
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
business_guesser = BusinessGuesser()