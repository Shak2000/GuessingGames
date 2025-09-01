import google.generativeai as genai
from typing import Optional, Dict, Any
import json
from config import GEMINI_API_KEY

class FamousPersonGuesser:
    def __init__(self):
        """Initialize the Gemini API client."""
        # Import API key from config file
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
            raise ValueError("Please set your actual Gemini API key in config.py")
        
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        self.current_session = None
    
    def start_new_session(self, user_input: str) -> Dict[str, Any]:
        """Start a new guessing session with user input."""
        self.current_session = {
            'user_input': user_input,
            'guesses': [],
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
    
    def _make_guess(self, context: str) -> str:
        """Make a guess using Gemini API."""
        prompt = f"""
        Based on the following information, guess who the famous person is.
        
        Please respond in this exact format:
        NAME: [Person's full name]
        REASONING: [Brief explanation of why you think this is the correct person based on the information provided]
        
        Information: {context}
        
        If you're not sure, make your best guess based on the information provided and explain your reasoning.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Error making guess: {str(e)}"
    
    def submit_feedback(self, session_id: int, is_correct: bool) -> Dict[str, Any]:
        """Submit feedback for the current guess and make next guess if incorrect."""
        if not self.current_session or self.current_session['session_id'] != session_id:
            return {'error': 'Invalid session'}
        
        # Update the last guess with feedback
        if self.current_session['guesses']:
            # Convert the last guess to a dictionary if it's a string
            last_guess = self.current_session['guesses'][-1]
            if isinstance(last_guess, str):
                self.current_session['guesses'][-1] = {
                    'guess': last_guess,
                    'is_correct': is_correct
                }
            else:
                self.current_session['guesses'][-1]['is_correct'] = is_correct
        
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
            incorrect_guesses = []
            for g in self.current_session['guesses']:
                if isinstance(g, dict) and g.get('is_correct') == False:
                    incorrect_guesses.append(g['guess'])
                elif isinstance(g, str):
                    # Handle old format where guesses were just strings
                    incorrect_guesses.append(g)
            
            if incorrect_guesses:
                context += f" (Previous incorrect guesses: {', '.join(incorrect_guesses)})"
            
            new_guess = self._make_guess(context)
            self.current_session['guesses'].append(new_guess)
            
            return {
                'session_id': session_id,
                'guess': new_guess,
                'is_correct': None,
                'game_over': False
            }
    
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
