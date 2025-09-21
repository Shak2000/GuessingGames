"""
Settings management for user preferences including voice selection for Gemini TTS.
Handles user-specific settings storage and retrieval.
"""

import os
import json
import uuid
from typing import Dict, Optional, Any
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserSettingsManager:
    """Manages user-specific settings including voice preferences for Gemini TTS."""
    
    def __init__(self, settings_dir: str = "user_settings"):
        """
        Initialize the settings manager.
        
        Args:
            settings_dir: Directory where user settings files will be stored
        """
        self.settings_dir = settings_dir
        self.ensure_settings_directory()
        
        # Available Gemini TTS voices
        self.available_voices = [
            'Achernar', 'Achird', 'Algenib', 'Algieba', 'Alnilam', 'Aoede',
            'Autonoe', 'Callirrhoe', 'Charon', 'Despina', 'Enceladus', 'Erinome',
            'Fenrir', 'Gacrux', 'Iapetus', 'Kore', 'Laomedeia', 'Leda',
            'Orus', 'Puck', 'Pulcherrima', 'Rasalgethi', 'Sadachbia', 'Sadaltager',
            'Schedar', 'Sulafat', 'Umbriel', 'Vindemiatrix', 'Zephyr', 'Zubenelgenubi'
        ]
        
        # Default settings
        self.default_settings = {
            'voice': 'Zephyr',  # Default to Zephyr voice
            'language_code': 'en-US',
            'created_at': None,
            'updated_at': None
        }
    
    def ensure_settings_directory(self) -> None:
        """Ensure the settings directory exists."""
        try:
            os.makedirs(self.settings_dir, exist_ok=True)
            logger.info(f"Settings directory ensured: {self.settings_dir}")
        except Exception as e:
            logger.error(f"Error creating settings directory: {e}")
            raise
    
    def get_user_id_from_request(self, request) -> str:
        """
        Get or generate user ID from request.
        For now, we'll use a simple session-based approach.
        In production, this should be tied to proper user authentication.
        
        Args:
            request: FastAPI request object
            
        Returns:
            User ID string
        """
        # Check if user has a session ID in cookies
        user_id = None
        if hasattr(request, 'cookies'):
            user_id = request.cookies.get('user_id')
        
        # If no user ID found, generate a new one
        if not user_id:
            user_id = str(uuid.uuid4())
            logger.info(f"Generated new user ID: {user_id}")
        
        return user_id
    
    def get_settings_file_path(self, user_id: str) -> str:
        """
        Get the path to the user's settings file.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Path to the user's settings file
        """
        return os.path.join(self.settings_dir, f"user_{user_id}.json")
    
    def load_user_settings(self, user_id: str) -> Dict[str, Any]:
        """
        Load user settings from file.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Dictionary containing user settings
        """
        settings_file = self.get_settings_file_path(user_id)
        
        try:
            if os.path.exists(settings_file):
                with open(settings_file, 'r', encoding='utf-8') as f:
                    settings = json.load(f)
                    
                # Validate voice is still available
                if settings.get('voice') not in self.available_voices:
                    logger.warning(f"User {user_id} has invalid voice: {settings.get('voice')}")
                    settings['voice'] = self.default_settings['voice']
                    
                return settings
            else:
                logger.info(f"No settings file found for user {user_id}, using defaults")
                return self.default_settings.copy()
                
        except Exception as e:
            logger.error(f"Error loading settings for user {user_id}: {e}")
            return self.default_settings.copy()
    
    def save_user_settings(self, user_id: str, settings: Dict[str, Any]) -> bool:
        """
        Save user settings to file.
        
        Args:
            user_id: Unique user identifier
            settings: Dictionary containing user settings
            
        Returns:
            True if settings were saved successfully, False otherwise
        """
        settings_file = self.get_settings_file_path(user_id)
        
        try:
            # Validate voice
            if 'voice' in settings and settings['voice'] not in self.available_voices:
                logger.error(f"Invalid voice selection: {settings['voice']}")
                return False
            
            # Update timestamps
            current_time = datetime.now().isoformat()
            if 'created_at' not in settings or settings['created_at'] is None:
                settings['created_at'] = current_time
            settings['updated_at'] = current_time
            
            # Ensure language_code is set
            if 'language_code' not in settings:
                settings['language_code'] = self.default_settings['language_code']
            
            # Save to file
            with open(settings_file, 'w', encoding='utf-8') as f:
                json.dump(settings, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Settings saved for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving settings for user {user_id}: {e}")
            return False
    
    def update_voice_setting(self, user_id: str, voice: str) -> bool:
        """
        Update only the voice setting for a user.
        
        Args:
            user_id: Unique user identifier
            voice: Voice name to set
            
        Returns:
            True if voice was updated successfully, False otherwise
        """
        if voice not in self.available_voices:
            logger.error(f"Invalid voice selection: {voice}")
            return False
        
        # Load current settings
        current_settings = self.load_user_settings(user_id)
        
        # Update voice
        current_settings['voice'] = voice
        
        # Save updated settings
        return self.save_user_settings(user_id, current_settings)
    
    def get_user_voice(self, user_id: str) -> str:
        """
        Get the user's selected voice.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Voice name string
        """
        settings = self.load_user_settings(user_id)
        return settings.get('voice', self.default_settings['voice'])
    
    def get_user_language_code(self, user_id: str) -> str:
        """
        Get the user's language code.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Language code string
        """
        settings = self.load_user_settings(user_id)
        return settings.get('language_code', self.default_settings['language_code'])
    
    def is_valid_voice(self, voice: str) -> bool:
        """
        Check if a voice name is valid.
        
        Args:
            voice: Voice name to validate
            
        Returns:
            True if voice is valid, False otherwise
        """
        return voice in self.available_voices
    
    def get_available_voices(self) -> list:
        """
        Get list of available voices.
        
        Returns:
            List of available voice names
        """
        return self.available_voices.copy()
    
    def delete_user_settings(self, user_id: str) -> bool:
        """
        Delete a user's settings file.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            True if settings were deleted successfully, False otherwise
        """
        settings_file = self.get_settings_file_path(user_id)
        
        try:
            if os.path.exists(settings_file):
                os.remove(settings_file)
                logger.info(f"Settings deleted for user {user_id}")
                return True
            else:
                logger.info(f"No settings file to delete for user {user_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error deleting settings for user {user_id}: {e}")
            return False

# Global settings manager instance
settings_manager = UserSettingsManager()
