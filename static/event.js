class EventGame {
    constructor() {
        this.currentSessionId = null;
        
        // Get DOM elements
        this.userInput = document.getElementById('userInput');
        this.submitBtn = document.getElementById('submitBtn');
        this.gameSection = document.getElementById('gameSection');
        this.victorySection = document.getElementById('victorySection');
        this.loadingSection = document.getElementById('loadingSection');
        this.errorSection = document.getElementById('errorSection');
        this.guessText = document.getElementById('guessText');
        this.guessTextOverview = document.getElementById('guessTextOverview');
        this.guessTextReasoning = document.getElementById('guessTextReasoning');
        this.correctBtn = document.getElementById('correctBtn');
        this.incorrectBtn = document.getElementById('incorrectBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.mapEl = document.getElementById('map');
        this.errorText = document.getElementById('errorText');
        this.eventImageContainer = document.getElementById('eventImageContainer');
        this.eventImage = document.getElementById('eventImage');
        
        // Initialize map
        this.map = null;
        
        // Event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.submitBtn.addEventListener('click', () => this.startNewSession());
        this.correctBtn.addEventListener('click', () => this.submitFeedback(true));
        this.incorrectBtn.addEventListener('click', () => this.submitFeedback(false));
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.retryBtn.addEventListener('click', () => this.startNewGame());
        
        // Allow Enter key to submit
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.startNewSession();
            }
        });
    }
    
    async startNewSession() {
        const userInput = this.userInput.value.trim();
        if (!userInput) {
            alert('Please enter some information about the event!');
            return;
        }
        
        this.hideAllSections();
        this.showLoading();
        
        try {
            const response = await fetch('/api/start-event-guess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: userInput }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.currentSessionId = data.session_id;
            
            this.displayJsonGuess(data.guess);
            this.hideLoading();
            this.showGameSection();
            
        } catch (error) {
            console.error('Error starting new session:', error);
            this.showError('Failed to start new session. Please try again.');
        }
    }
    
    async submitFeedback(isCorrect) {
        if (!this.currentSessionId) {
            this.showError('No active session. Please start a new game.');
            return;
        }
        
        this.correctBtn.disabled = true;
        this.incorrectBtn.disabled = true;
        
        try {
            const response = await fetch('/api/submit-event-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.currentSessionId,
                    is_correct: isCorrect
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.correct) {
                this.showVictory();
            } else if (data.new_guess) {
                this.displayJsonGuess(data.new_guess);
            }
            
        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.showError('Failed to submit feedback. Please try again.');
        } finally {
            this.correctBtn.disabled = false;
            this.incorrectBtn.disabled = false;
        }
    }
    
    displayJsonGuess(data) {
        // Extract data from JSON
        const name = data.name || 'Unknown Event';
        const start = data.start;
        const end = data.end;
        const location = data.location;
        const keyFigures = data.key_figures || [];
        const causes = data.causes;
        const keyDevelopments = data.key_developments;
        const results = data.results;
        const wikipediaUrl = data.wikipedia_url;
        const generatedImageUrl = data.image_url;
        const wikipediaImageUrl = data.wikipedia_image_url;
        const coordinates = data.coordinates;
        const reasoning = data.reasoning || '';
        const overview = data.overview || '';
        
        // Display the generated image
        this.displayEventImage(generatedImageUrl, name);
        
        // Build event information
        let eventInfo = '';
        if (start || end || location || keyFigures.length > 0 || causes || keyDevelopments || results || wikipediaUrl) {
            eventInfo += '<div class="bio-section">';
            eventInfo += '<h4>Event Information:</h4>';
            if (start) eventInfo += `<p><strong>Start Date:</strong> ${start}</p>`;
            if (end) eventInfo += `<p><strong>End Date:</strong> ${end}</p>`;
            if (location) eventInfo += `<p><strong>Location:</strong> ${location}</p>`;
            
            if (keyFigures.length > 0) {
                eventInfo += `<p><strong>Key Figures:</strong> ${keyFigures.join(', ')}</p>`;
            }
            
            if (causes) eventInfo += `<p><strong>Causes:</strong> ${causes}</p>`;
            if (keyDevelopments) eventInfo += `<p><strong>Key Developments:</strong> ${keyDevelopments}</p>`;
            if (results) eventInfo += `<p><strong>Results:</strong> ${results}</p>`;
            
            if (wikipediaUrl) {
                eventInfo += `<p><strong>Wikipedia:</strong> <a href="${wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wikipedia-link">Page</a></p>`;
            }
            eventInfo += '</div>';
        }
        
        
        // Build overview section
        let overviewInfo = '';
        if (overview && overview.trim() !== '') {
            overviewInfo = `
                <div class="bio-section overview-section">
                    <h4>Overview:</h4>
                    <p>${overview}</p>
                </div>
            `;
        }
        
        // Display name, overview, and event info
        this.guessText.innerHTML = `
            <div class="name-box">
                <strong>${name}</strong>
            </div>
            ${overviewInfo}
            ${eventInfo}
        `;
        
        // Hide the separate overview section since we're including it in the main content
        this.guessTextOverview.style.display = 'none';
        
        // Display reasoning
        this.guessTextReasoning.innerHTML = `
            <div class="reasoning-box">
                ${reasoning}
            </div>
        `;
        
        // Initialize map if coordinates are available
        if (coordinates && coordinates !== null) {
            try {
                const eventCoords = {
                    lat: coordinates.lat,
                    lng: coordinates.lng
                };
                
                // Show the map container
                if (this.mapEl) {
                    this.mapEl.style.display = 'block';
                    this.mapEl.style.height = '400px';
                    this.mapEl.style.width = '100%';
                    this.mapEl.style.marginTop = '15px';
                    this.mapEl.style.borderRadius = '10px';
                    this.mapEl.style.border = '1px solid #bae6fd';
                }
                
                // Initialize the map with location context
                this.initMap(eventCoords, location);
            } catch (e) {
                // Error parsing coordinates
                console.error('Error initializing map:', e);
            }
        } else {
            // Hide the map container if no coordinates
            if (this.mapEl) {
                this.mapEl.style.display = 'none';
            }
        }
    }
    
    displayEventImage(imageUrl, eventName) {
        if (imageUrl && imageUrl !== null && imageUrl.toLowerCase() !== 'n/a' && 
            !imageUrl.includes('placeholder.com') && !imageUrl.includes('Parse+Error')) {
            // Show the image container and set the image source
            this.eventImageContainer.style.display = 'block';
            this.eventImage.src = imageUrl;
            this.eventImage.alt = `Illustration of ${eventName}`;
            
            // Handle image load success
            this.eventImage.onload = () => {
                console.log('Event image loaded successfully');
            };
            
            // Handle image load error
            this.eventImage.onerror = () => {
                console.log('Event image failed to load, hiding container');
                this.eventImageContainer.style.display = 'none';
            };
        } else {
            // Hide the image container if no valid image URL
            this.eventImageContainer.style.display = 'none';
        }
    }
    
    initMap(eventCoords, location = null) {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            if (this.mapEl) {
                this.mapEl.innerHTML = '<p class="text-center text-red-500">Map could not be loaded.</p>';
            }
            return;
        }

        if (!this.mapEl) {
            return;
        }

        // Determine appropriate zoom level based on location type
        let zoomLevel = 10; // Default zoom for cities
        
        if (location) {
            const locationLower = location.toLowerCase();
            
            // Check for continents
            if (locationLower.includes('continent') || 
                locationLower.includes('north america') || 
                locationLower.includes('south america') || 
                locationLower.includes('europe') || 
                locationLower.includes('asia') || 
                locationLower.includes('africa') || 
                locationLower.includes('australia') || 
                locationLower.includes('antarctica')) {
                zoomLevel = 3;
            }
            // Check for countries
            else if (locationLower.includes('country') || 
                     locationLower.includes('nation') || 
                     locationLower.includes('united states') || 
                     locationLower.includes('canada') || 
                     locationLower.includes('china') || 
                     locationLower.includes('russia') || 
                     locationLower.includes('brazil') || 
                     locationLower.includes('australia') || 
                     locationLower.includes('india')) {
                zoomLevel = 5;
            }
            // Check for states/provinces/regions
            else if (locationLower.includes('state') || 
                     locationLower.includes('province') || 
                     locationLower.includes('region') || 
                     locationLower.includes('territory') || 
                     locationLower.includes('county')) {
                zoomLevel = 7;
            }
            // Default to city level
            else {
                zoomLevel = 10;
            }
        }

        const mapOptions = {
            zoom: zoomLevel,
            center: eventCoords,
            mapTypeId: 'terrain'
        };
        this.map = new google.maps.Map(this.mapEl, mapOptions);

        // Add marker for the event location
        const eventMarker = new google.maps.Marker({
            position: eventCoords,
            map: this.map,
            title: 'Event Location',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#DC2626" stroke="white" stroke-width="2"/>
                        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">E</text>
                    </svg>
                `)
            }
        });
    }
    
    showGameSection() {
        this.gameSection.classList.remove('hidden');
    }
    
    showVictory() {
        this.hideAllSections();
        this.victorySection.classList.remove('hidden');
    }
    
    showLoading() {
        this.loadingSection.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loadingSection.classList.add('hidden');
    }
    
    showError(message) {
        this.errorText.textContent = message;
        this.hideAllSections();
        this.errorSection.classList.remove('hidden');
    }
    
    hideAllSections() {
        this.gameSection.classList.add('hidden');
        this.victorySection.classList.add('hidden');
        this.loadingSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
    }
    
    startNewGame() {
        this.hideAllSections();
        this.hideLoading();
        this.userInput.focus();
        this.userInput.value = '';
        this.currentSessionId = null;
        // Hide the event image container
        if (this.eventImageContainer) {
            this.eventImageContainer.style.display = 'none';
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EventGame();
});