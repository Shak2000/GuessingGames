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
import re
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
- ticker: An array of the company's stock ticker symbols (if public, otherwise empty array)
- industry: An array of industries the business operates in
- predecessors: An array of predecessor companies (if any, otherwise empty array)
- previous_names: An array of previous company names (if any, otherwise empty array)
- city_founded: The city where the company was founded, entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States")
- year_founded: The year the company was founded
- founders: An array of founder names (if known, otherwise empty array)
- current_headquarters: The current headquarters location, entered with the administrative division and country, separated by commas (e.g., "Dallas, Texas, United States")
- areas_served: An array of geographic areas where the company operates
- number_of_locations: The number of locations the company has
- current_status: Extant or Defunct (if known, otherwise null)
- year_defunct: The year the company went out of business (if defunct and known, otherwise null)
- fate: The fate of the company (if defunct and known, otherwise null)
- successors: The successor companies (if defunct and known, otherwise null)
- chairman: The current chairman (if known, otherwise null)
- ceo: The current CEO (if known, otherwise null)
- products: An array of main products (if any, otherwise empty array)
- services: An array of main services (if any, otherwise empty array)
- technologies: An array of main technologies (if any, otherwise empty array), specifically the type rather than brand name (e.g., smartphone, not iPhone)
- subsidiaries: An array of subsidiary companies (if any, otherwise empty array)
- owner: The owner of the company (if known, otherwise null)
- owner_equity_percentage: The owner's equity percentage (if owner known, otherwise null)
- number_of_employees: Number of employees (if known, otherwise null)
- parent: The parent company (if any, otherwise null)
- website: The company's website URL (if known, otherwise null)
- business_insider_markets: markets.businessinsider.com URL for the business (if available, otherwise null) - used for stock price data
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
                
                # Get coordinates for founding city and headquarters
                coordinates = {}
                founding_city = business_data.get('city_founded')
                if founding_city and founding_city.lower() != 'n/a':
                    founding_coords = self._get_place_coordinates(founding_city)
                    if founding_coords:
                        coordinates['founding'] = founding_coords
                
                headquarters = business_data.get('current_headquarters')
                if headquarters and headquarters.lower() != 'n/a':
                    headquarters_coords = self._get_place_coordinates(headquarters)
                    if headquarters_coords:
                        coordinates['headquarters'] = headquarters_coords
                
                # Get financial data from Business Insider (stock price), CNBC (market cap), and Macrotrends for publicly traded companies
                ticker = business_data.get('ticker')
                company_name = business_data.get('name')
                macrotrends_data = {}
                business_insider_data = {}
                cnbc_market_cap = None
                if ticker and company_name:
                    # Check if ticker is valid (not empty)
                    is_valid_ticker = False
                    if isinstance(ticker, list):
                        is_valid_ticker = len(ticker) > 0
                    elif isinstance(ticker, str):
                        is_valid_ticker = len(ticker.strip()) > 0
                    
                    if is_valid_ticker:
                        # Get stock price from Business Insider
                        first_ticker = ticker[0] if isinstance(ticker, list) else ticker
                        business_insider_data = self._scrape_business_insider_data(first_ticker)
                        
                        # Get market cap from CNBC
                        cnbc_market_cap = self._scrape_cnbc_market_cap(first_ticker)
                        
                        # Get other financial data from Macrotrends
                        macrotrends_data = self._scrape_macrotrends_financial_data(ticker, company_name)
                
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
                    "number_of_locations": business_data.get('number_of_locations'),
                    "current_status": business_data.get('current_status'),
                    "year_defunct": business_data.get('year_defunct'),
                    "fate": business_data.get('fate'),
                    "successors": business_data.get('successors'),
                    "chairman": business_data.get('chairman'),
                    "ceo": business_data.get('ceo'),
                    "products": business_data.get('products', []),
                    "services": business_data.get('services', []),
                    "technologies": business_data.get('technologies', []),
                    "subsidiaries": business_data.get('subsidiaries', []),
                    "stock_price": business_insider_data.get('stock_price'),
                    "market_cap": cnbc_market_cap,
                    "revenue": macrotrends_data.get('revenue'),
                    "operating_income": macrotrends_data.get('operating_income'),
                    "net_income": macrotrends_data.get('net_income'),
                    "total_assets": macrotrends_data.get('total_assets'),
                    "total_equity": macrotrends_data.get('total_equity'),
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
                    "technologies": [],
                    "subsidiaries": [],
                    "stock_price": None,
                    "market_cap": None,
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
                "technologies": [],
                "subsidiaries": [],
                "stock_price": None,
                "market_cap": None,
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
                    
                    # Accept any image with size attributes as potentially valid
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            # Remove pixel limits - accept any reasonably sized image
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
    
    def _scrape_macrotrends_financial_data(self, ticker, company_name: str) -> Dict[str, Optional[str]]:
        """Scrape financial data from Macrotrends for a given ticker and company name."""
        # Handle ticker as either string or array
        if isinstance(ticker, list):
            if not ticker or len(ticker) == 0:
                return {
                    'revenue': None,
                    'operating_income': None,
                    'net_income': None,
                    'total_assets': None,
                    'total_equity': None
                }
            # Use the first ticker for financial data
            ticker = ticker[0]
        
        if not ticker or len(ticker.strip()) == 0:
            return {
                'revenue': None,
                'operating_income': None,
                'net_income': None,
                'total_assets': None,
                'total_equity': None
            }
        
        # Convert company name to URL format (spaces to dashes, lowercase)
        name_formatted = company_name.lower().replace(' ', '-').replace('.', '').replace(',', '')
        
        financial_data = {
            'revenue': None,
            'operating_income': None,
            'net_income': None,
            'total_assets': None,
            'total_equity': None
        }
        
        # URLs for different financial metrics in priority order: net income, total equity, revenue, total assets, operating income
        urls = {
            'net_income': f"https://macrotrends.net/stocks/charts/{ticker}/{name_formatted}/net-income",
            'total_equity': f"https://macrotrends.net/stocks/charts/{ticker}/{name_formatted}/total-share-holder-equity",
            'revenue': f"https://macrotrends.net/stocks/charts/{ticker}/{name_formatted}/revenue",
            'total_assets': f"https://macrotrends.net/stocks/charts/{ticker}/{name_formatted}/total-assets",
            'operating_income': f"https://macrotrends.net/stocks/charts/{ticker}/{name_formatted}/operating-income"
        }
        
        for metric, url in urls.items():
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for the financial data in various possible locations
                value = self._extract_financial_value(soup, metric)
                if value:
                    financial_data[metric] = value
                    
            except Exception as e:
                print(f"Error scraping {metric} for {ticker}: {str(e)}")
                continue
        
        return financial_data
    
    def _scrape_cnbc_market_cap(self, ticker: str) -> Optional[str]:
        """Scrape market cap from CNBC."""
        if not ticker or len(ticker.strip()) == 0:
            return None
        
        # Convert ticker to uppercase for CNBC URL
        ticker_upper = ticker.upper()
        url = f"https://www.cnbc.com/quotes/{ticker_upper}"
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for market cap data using the specific CNBC HTML structure
            market_cap = None
            
            # Method 1: Look for the specific CNBC structure: <li class="Summary-stat">
            summary_stats = soup.find_all('li', class_='Summary-stat')
            for stat in summary_stats:
                # Look for the Market Cap label
                label = stat.find('span', class_='Summary-label')
                if label and 'Market Cap' in label.get_text():
                    # Get the corresponding value
                    value = stat.find('span', class_='Summary-value')
                    if value:
                        market_cap_text = value.get_text().strip()
                        # Add $ prefix if not already present
                        if market_cap_text and not market_cap_text.startswith('$'):
                            market_cap = f"${market_cap_text}"
                        else:
                            market_cap = market_cap_text
                        print(f"Found market cap via CNBC Summary-stat structure: {market_cap}")
                        break
            
            # Method 2: Fallback - Look for any span with "Market Cap" text and find nearby Summary-value
            if not market_cap:
                market_cap_labels = soup.find_all('span', string=re.compile(r'Market Cap', re.IGNORECASE))
                for label in market_cap_labels:
                    # Look for Summary-value span in the same parent or nearby
                    parent = label.parent
                    if parent:
                        value_span = parent.find('span', class_='Summary-value')
                        if value_span:
                            market_cap_text = value_span.get_text().strip()
                            if market_cap_text and not market_cap_text.startswith('$'):
                                market_cap = f"${market_cap_text}"
                            else:
                                market_cap = market_cap_text
                            print(f"Found market cap via Summary-value fallback: {market_cap}")
                            break
            
            # Method 3: General fallback - Look for text containing "Market Cap" and extract nearby values
            if not market_cap:
                page_text = soup.get_text()
                market_cap_pattern = re.search(r'Market Cap[^:]*:?\s*\$?([0-9,.]+[BTMK]?)', page_text, re.IGNORECASE)
                if market_cap_pattern:
                    market_cap_value = market_cap_pattern.group(1)
                    print(f"Found market cap via text search on CNBC: {market_cap_value}")
                    market_cap = f"${market_cap_value}" if not market_cap_value.startswith('$') else market_cap_value
            
            print(f"CNBC market cap scraping result for {ticker}: {market_cap}")
            return market_cap
            
        except Exception as e:
            print(f"Error scraping CNBC market cap for {ticker}: {str(e)}")
            return None

    def _scrape_business_insider_data(self, ticker: str) -> Dict[str, Optional[str]]:
        """Scrape stock price from Business Insider (market cap now comes from CNBC)."""
        if not ticker or len(ticker.strip()) == 0:
            return {'stock_price': None}
        
        # Convert ticker to lowercase for Business Insider URL
        ticker_lower = ticker.lower()
        url = f"https://markets.businessinsider.com/stocks/{ticker_lower}-stock"
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract stock price from span with class "price-section__current-value"
            stock_price = None
            price_span = soup.find('span', class_='price-section__current-value')
            if price_span:
                stock_price_text = price_span.get_text().strip()
                # Add $ prefix if not already present
                if stock_price_text and not stock_price_text.startswith('$'):
                    stock_price = f"${stock_price_text}"
                else:
                    stock_price = stock_price_text
            
            # Note: Market cap is now sourced from CNBC, not Business Insider
            
            # Debug output
            print(f"Business Insider scraping results for {ticker}:")
            print(f"  Stock Price: {stock_price}")
            
            return {
                'stock_price': stock_price
            }
            
        except Exception as e:
            print(f"Error scraping Business Insider data for {ticker}: {str(e)}")
            return {'stock_price': None}

    def _extract_financial_value(self, soup: BeautifulSoup, metric: str) -> Optional[str]:
        """Extract financial value from Macrotrends page."""
        try:
            # Look for different patterns that might contain the financial data
            
            # Pattern 1: Look for text containing "for the twelve months ending" or "for the quarter ending"
            time_periods = {
                'revenue': 'for the twelve months ending',
                'operating_income': 'for the twelve months ending', 
                'net_income': 'for the twelve months ending',
                'total_assets': 'for the quarter ending',
                'total_equity': 'for the quarter ending'
            }
            
            time_period = time_periods.get(metric, 'for the twelve months ending')
            
            # Find elements containing the time period text
            elements = soup.find_all(text=re.compile(time_period, re.IGNORECASE))
            
            for element in elements:
                # Look for the parent element and then search for financial values
                parent = element.parent
                if parent:
                    # Look for text containing $ and B or M
                    financial_text = parent.find(text=re.compile(r'\$[\d,]+\.?\d*[BM]'))
                    if financial_text:
                        return financial_text.strip()
                    
                    # Also check siblings
                    for sibling in parent.find_next_siblings():
                        financial_text = sibling.find(text=re.compile(r'\$[\d,]+\.?\d*[BM]'))
                        if financial_text:
                            return financial_text.strip()
            
            # Pattern 2: Look for any element containing financial data pattern
            financial_elements = soup.find_all(text=re.compile(r'\$[\d,]+\.?\d*[BM]'))
            if financial_elements:
                # Return the first match
                return financial_elements[0].strip()
            
            # Pattern 3: Look for specific table cells or divs that might contain the data
            tables = soup.find_all('table')
            for table in tables:
                cells = table.find_all(['td', 'th'])
                for cell in cells:
                    text = cell.get_text().strip()
                    if re.search(r'\$[\d,]+\.?\d*[BM]', text):
                        return text
            
            return None
            
        except Exception as e:
            print(f"Error extracting financial value for {metric}: {str(e)}")
            return None

# Create a global instance for the API to use
business_guesser = BusinessGuesser()