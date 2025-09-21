// Settings page functionality for voice selection
class SettingsManager {
    constructor() {
        this.voiceSelect = document.getElementById('voice-select');
        this.sampleTextInput = document.getElementById('sample-text');
        this.testVoiceBtn = document.getElementById('test-voice-btn');
        this.saveSettingsBtn = document.getElementById('save-settings-btn');
        this.statusMessage = document.getElementById('status-message');
        this.currentVoiceDisplay = document.getElementById('current-voice');
        this.settingsForm = document.getElementById('settings-form');
        
        // Available Gemini TTS voices
        this.voices = [
            { name: 'Achernar', gender: 'Female' },
            { name: 'Achird', gender: 'Male' },
            { name: 'Algenib', gender: 'Male' },
            { name: 'Algieba', gender: 'Male' },
            { name: 'Alnilam', gender: 'Male' },
            { name: 'Aoede', gender: 'Female' },
            { name: 'Autonoe', gender: 'Female' },
            { name: 'Callirrhoe', gender: 'Female' },
            { name: 'Charon', gender: 'Male' },
            { name: 'Despina', gender: 'Female' },
            { name: 'Enceladus', gender: 'Male' },
            { name: 'Erinome', gender: 'Female' },
            { name: 'Fenrir', gender: 'Male' },
            { name: 'Gacrux', gender: 'Male' },
            { name: 'Iapetus', gender: 'Male' },
            { name: 'Kore', gender: 'Female' },
            { name: 'Laomedeia', gender: 'Female' },
            { name: 'Leda', gender: 'Female' },
            { name: 'Orus', gender: 'Male' },
            { name: 'Puck', gender: 'Male' },
            { name: 'Pulcherrima', gender: 'Female' },
            { name: 'Rasalgethi', gender: 'Male' },
            { name: 'Sadachbia', gender: 'Male' },
            { name: 'Sadaltager', gender: 'Male' },
            { name: 'Schedar', gender: 'Female' },
            { name: 'Sulafat', gender: 'Female' },
            { name: 'Umbriel', gender: 'Male' },
            { name: 'Vindemiatrix', gender: 'Female' },
            { name: 'Zephyr', gender: 'Female' },
            { name: 'Zubenelgenubi', gender: 'Male' }
        ];
        
        this.init();
    }
    
    init() {
        this.populateVoiceOptions();
        this.loadCurrentSettings();
        this.attachEventListeners();
    }
    
    populateVoiceOptions() {
        // Clear existing options (except the first placeholder)
        while (this.voiceSelect.children.length > 1) {
            this.voiceSelect.removeChild(this.voiceSelect.lastChild);
        }
        
        // Sort voices by name for better UX
        const sortedVoices = [...this.voices].sort((a, b) => a.name.localeCompare(b.name));
        
        // Add voice options grouped by gender
        const femaleVoices = sortedVoices.filter(v => v.gender === 'Female');
        const maleVoices = sortedVoices.filter(v => v.gender === 'Male');
        
        // Add female voices
        if (femaleVoices.length > 0) {
            const femaleGroup = document.createElement('optgroup');
            femaleGroup.label = 'Female Voices';
            femaleVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.gender})`;
                femaleGroup.appendChild(option);
            });
            this.voiceSelect.appendChild(femaleGroup);
        }
        
        // Add male voices
        if (maleVoices.length > 0) {
            const maleGroup = document.createElement('optgroup');
            maleGroup.label = 'Male Voices';
            maleVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.gender})`;
                maleGroup.appendChild(option);
            });
            this.voiceSelect.appendChild(maleGroup);
        }
    }
    
    attachEventListeners() {
        // Enable/disable buttons based on voice selection
        this.voiceSelect.addEventListener('change', () => {
            const hasSelection = this.voiceSelect.value !== '';
            this.testVoiceBtn.disabled = !hasSelection;
            this.saveSettingsBtn.disabled = !hasSelection;
        });
        
        // Test voice button
        this.testVoiceBtn.addEventListener('click', () => {
            this.testVoice();
        });
        
        // Form submission
        this.settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
    }
    
    async loadCurrentSettings() {
        try {
            const response = await fetch('/api/get-settings', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.voice) {
                    this.voiceSelect.value = data.voice;
                    this.currentVoiceDisplay.textContent = data.voice;
                    
                    // Enable buttons if a voice is selected
                    const hasSelection = this.voiceSelect.value !== '';
                    this.testVoiceBtn.disabled = !hasSelection;
                    this.saveSettingsBtn.disabled = !hasSelection;
                }
            }
        } catch (error) {
            console.error('Error loading current settings:', error);
            this.showMessage('Error loading current settings', 'error');
        }
    }
    
    async testVoice() {
        const selectedVoice = this.voiceSelect.value;
        const sampleText = this.sampleTextInput.value || 'Hello! This is how I sound with the selected voice.';
        
        if (!selectedVoice) {
            this.showMessage('Please select a voice first', 'error');
            return;
        }
        
        try {
            this.testVoiceBtn.disabled = true;
            this.testVoiceBtn.textContent = '🔄 Testing...';
            
            const response = await fetch('/api/test-voice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voice: selectedVoice,
                    text: sampleText
                })
            });
            
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('audio')) {
                    // Handle actual audio response (Gemini TTS)
                    try {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        
                        // Handle audio events
                        audio.onended = () => {
                            URL.revokeObjectURL(audioUrl);
                            this.showMessage('Voice test completed successfully!', 'success');
                        };
                        
                        audio.onerror = () => {
                            URL.revokeObjectURL(audioUrl);
                            this.showMessage('Error playing audio. Please try again.', 'error');
                        };
                        
                        // Show playing message and play audio
                        this.showMessage(`Playing voice sample for ${selectedVoice}...`, 'success');
                        await audio.play();
                        
                    } catch (playError) {
                        console.error('Audio playback error:', playError);
                        this.showMessage('Error playing audio. Your browser may not support audio playback.', 'error');
                    }
                } else {
                    // Handle JSON response (fallback or error response)
                    const data = await response.json();
                    this.showMessage(data.message || 'Voice test completed successfully!', 'success');
                }
            } else {
                // Handle HTTP errors
                let errorMessage = 'Unknown error occurred';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                } catch (parseError) {
                    // If response is not JSON, use status text
                    errorMessage = response.statusText || `HTTP ${response.status} error`;
                }
                
                // Show specific error messages
                if (response.status === 403) {
                    this.showMessage('Permission denied. Please check your Google Cloud setup.', 'error');
                } else if (response.status === 404) {
                    this.showMessage(`Voice "${selectedVoice}" not found. Please try a different voice.`, 'error');
                } else if (response.status === 500 && errorMessage.includes('not installed')) {
                    this.showMessage('Google Cloud TTS library not installed. Please check server setup.', 'error');
                } else if (response.status === 500 && errorMessage.includes('credentials')) {
                    this.showMessage('Google Cloud credentials not configured. Please set up authentication.', 'error');
                } else {
                    this.showMessage(`Error testing voice: ${errorMessage}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error testing voice:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showMessage('Network error. Please check your connection and try again.', 'error');
            } else {
                this.showMessage('Unexpected error occurred. Please try again.', 'error');
            }
        } finally {
            this.testVoiceBtn.disabled = false;
            this.testVoiceBtn.textContent = '🔊 Test Voice';
        }
    }
    
    async saveSettings() {
        const selectedVoice = this.voiceSelect.value;
        
        if (!selectedVoice) {
            this.showMessage('Please select a voice first', 'error');
            return;
        }
        
        try {
            this.saveSettingsBtn.disabled = true;
            this.saveSettingsBtn.textContent = '💾 Saving...';
            
            const response = await fetch('/api/save-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voice: selectedVoice
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentVoiceDisplay.textContent = selectedVoice;
                this.showMessage('Settings saved successfully!', 'success');
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                this.showMessage(`Error saving settings: ${errorData.message}`, 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Error saving settings. Please try again.', 'error');
        } finally {
            this.saveSettingsBtn.disabled = false;
            this.saveSettingsBtn.textContent = '💾 Save Settings';
        }
    }
    
    showMessage(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.statusMessage.style.display = 'none';
        }, 5000);
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});
