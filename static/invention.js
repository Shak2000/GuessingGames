class InventionGame {
    constructor() {
        this.currentSessionId = null;
        this.mapsApiKey = null;
        this.map = null;
        this.googleMapsScriptLoaded = false;
        this.initializeElements();
        this.attachEventListeners();
        this.loadGoogleMapsScript();
    }

    initializeElements() {
        // Input elements
        this.userInput = document.getElementById('userInput');
        this.submitBtn = document.getElementById('submitBtn');
        
        // Game elements
        this.gameSection = document.getElementById('gameSection');
        this.guessText = document.getElementById('guessText');
        this.guessTextOverview = document.getElementById('guessTextOverview');
        this.guessTextReasoning = document.getElementById('guessTextReasoning');
        this.inventionImageContainer = document.getElementById('inventionImageContainer');
        this.inventionImage = document.getElementById('inventionImage');
        this.mapEl = document.getElementById('map');
        this.correctBtn = document.getElementById('correctBtn');
        this.incorrectBtn = document.getElementById('incorrectBtn');
        
        // Other sections
        this.victorySection = document.getElementById('victorySection');
        this.loadingSection = document.getElementById('loadingSection');
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.dismissErrorBtn = document.getElementById('dismissErrorBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
    }

    attachEventListeners() {
        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', () => {
                this.startNewGameFromButton();
            });
        }

        if (this.correctBtn) {
            this.correctBtn.addEventListener('click', () => {
                this.submitFeedback(true);
            });
        }

        if (this.incorrectBtn) {
            this.incorrectBtn.addEventListener('click', () => {
                this.submitFeedback(false);
            });
        }

        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => {
                this.startNewGame();
            });
        }

        if (this.dismissErrorBtn) {
            this.dismissErrorBtn.addEventListener('click', () => {
                this.hideError();
            });
        }

        // Allow Enter key to submit, Shift+Enter for new line
        if (this.userInput) {
            this.userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent default new line behavior
                    this.startNewGameFromButton();
                }
                // Shift+Enter allows default behavior (new line)
            });
        }
    }

    async startNewGameFromButton() {
        const userInput = this.userInput.value.trim();
        
        if (!userInput) {
            this.showError('Please enter some information about an invention!');
            return;
        }

        // Disable button and show loading
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Thinking...';
        this.hideAllSections();
        this.showLoading();

        try {
            const response = await fetch('/api/start-invention-guess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: userInput })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            this.currentSessionId = data.session_id;
            this.displayGuess(data.guess);
            this.hideLoading();
            this.showGameSection();

        } catch (error) {
            console.error('Error starting game:', error);
            this.showError('Failed to start the game. Please try again.');
        } finally {
            // Re-enable button and hide loading
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Submit Information';
            this.hideLoading();
        }
    }

    async submitFeedback(isCorrect) {
        if (!this.currentSessionId) {
            return;
        }

        // Disable feedback buttons during processing
        this.correctBtn.disabled = true;
        this.incorrectBtn.disabled = true;
        this.showLoading();

        try {
            const response = await fetch('/api/submit-invention-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.currentSessionId,
                    is_correct: isCorrect
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            if (data.game_over) {
                this.showVictory();
            } else {
                this.displayGuess(data.guess);
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.showError('Failed to submit feedback. Please try again.');
        } finally {
            // Re-enable feedback buttons and hide loading
            this.correctBtn.disabled = false;
            this.incorrectBtn.disabled = false;
            this.hideLoading();
        }
    }

    async loadGoogleMapsScript() {
        if (this.googleMapsScriptLoaded) {
            console.log('Google Maps script already loaded');
            return;
        }
        
        console.log('Loading Google Maps script...');
        try {
            const response = await fetch('/api/maps-key');
            if (!response.ok) {
                throw new Error('Could not fetch Google Maps API key.');
            }
            const data = await response.json();
            this.mapsApiKey = data.maps_key;
            console.log('Got API key, loading script...');

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.mapsApiKey}`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            this.googleMapsScriptLoaded = true;
            console.log('Google Maps script added to DOM');
        } catch (error) {
            console.error('Failed to load Google Maps script:', error);
        }
    }

    displayGuess(guess) {
        if (typeof guess === 'string') {
            // Handle old text format
            this.guessText.innerHTML = `<div class="name-box"><strong>${guess}</strong></div>`;
            this.guessTextOverview.style.display = 'none';
            this.guessTextReasoning.style.display = 'none';
        } else if (typeof guess === 'object' && guess !== null) {
            const name = guess.name || 'Unknown Invention';
            const year = guess.year_invented;
            const place = guess.place_invented;
            const inventors = guess.inventors || [];
            const materials = guess.materials_used || [];
            const previous = guess.previous_inventions || [];
            const later = guess.later_inventions || [];
            const consumerUses = guess.consumer_uses || [];
            const commercialUses = guess.commercial_uses || [];
            const institutionalUses = guess.institutional_uses || [];
            const businesses = guess.businesses || [];
            const designHubs = guess.design_hubs || [];
            const manufacturingHubs = guess.manufacturing_hubs || [];
            const events = guess.historical_events || [];
            const wikipediaUrl = guess.wikipedia_url;
            const reasoning = guess.reasoning;
            const overview = guess.overview;
            
            // Basic Information
            let basicInfo = '';
            if (year) basicInfo += `<p><strong>Year Invented:</strong> ${year}</p>`;
            if (place) basicInfo += `<p><strong>Place Invented:</strong> ${place}</p>`;
            if (inventors.length > 0) basicInfo += `<p><strong>Inventors:</strong> ${inventors.join(', ')}</p>`;
            if (wikipediaUrl) {
                basicInfo += `<p><strong>Wikipedia:</strong> <a href="${wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wikipedia-link">Page</a></p>`;
            }
            
            // Technical Information
            let technicalInfo = '';
            if (materials.length > 0) technicalInfo += `<p><strong>Materials Used:</strong> ${materials.join(', ')}</p>`;
            if (previous.length > 0) technicalInfo += `<p><strong>Previous Inventions:</strong> ${previous.join(', ')}</p>`;
            if (later.length > 0) technicalInfo += `<p><strong>Later Inventions:</strong> ${later.join(', ')}</p>`;
            
            // Uses
            let usesInfo = '';
            if (consumerUses.length > 0) usesInfo += `<p><strong>Consumer Uses:</strong> ${consumerUses.join(', ')}</p>`;
            if (commercialUses.length > 0) usesInfo += `<p><strong>Commercial Uses:</strong> ${commercialUses.join(', ')}</p>`;
            if (institutionalUses.length > 0) usesInfo += `<p><strong>Institutional Uses:</strong> ${institutionalUses.join(', ')}</p>`;
            
            // This Invention and the World
            let worldInfo = '';
            if (businesses.length > 0) worldInfo += `<p><strong>Businesses:</strong> ${businesses.join(', ')}</p>`;
            if (designHubs.length > 0) worldInfo += `<p><strong>Design Hubs:</strong> ${designHubs.join(', ')}</p>`;
            if (manufacturingHubs.length > 0) worldInfo += `<p><strong>Manufacturing Hubs:</strong> ${manufacturingHubs.join(', ')}</p>`;
            if (events.length > 0) worldInfo += `<p><strong>Historical Events:</strong> ${events.join(', ')}</p>`;
            
            // Build the complete invention info with categories
            let inventionInfo = '';
            if (basicInfo) {
                inventionInfo += '<div class="bio-section">';
                inventionInfo += '<h4>Basic Information:</h4>';
                inventionInfo += basicInfo;
                inventionInfo += '</div>';
            }
            
            if (technicalInfo) {
                inventionInfo += '<div class="bio-section">';
                inventionInfo += '<h4>Technical Information:</h4>';
                inventionInfo += technicalInfo;
                inventionInfo += '</div>';
            }
            
            if (usesInfo) {
                inventionInfo += '<div class="bio-section">';
                inventionInfo += '<h4>Uses:</h4>';
                inventionInfo += usesInfo;
                inventionInfo += '</div>';
            }
            
            if (worldInfo) {
                inventionInfo += '<div class="bio-section">';
                inventionInfo += '<h4>This Invention and the World:</h4>';
                inventionInfo += worldInfo;
                inventionInfo += '</div>';
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
            
            // Display name, overview, and invention info
            this.guessText.innerHTML = `
                <div class="name-box">
                    <strong>${name}</strong>
                </div>
                ${overviewInfo}
                ${inventionInfo}
            `;
            
            // Hide the separate overview section since we're including it in the main content
            this.guessTextOverview.style.display = 'none';
            
            // Display reasoning
            this.guessTextReasoning.innerHTML = `
                <div class="reasoning-box">
                    ${reasoning || ''}
                </div>
            `;
            
            // Display image
            this.displayInventionImage(guess.image_url, name);
            
            // Initialize map if coordinates are available
            const coordinates = guess.coordinates;
            const city = guess.city;
            if (coordinates && coordinates !== null) {
                try {
                    const inventionCoords = {
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
                    
                    // Initialize the map with city context (preferred) or place fallback
                    this.initMap(inventionCoords, city || place);
                } catch (e) {
                    // Error parsing coordinates
                    console.error('Error initializing map:', e);
                    if (this.mapEl) {
                        this.mapEl.style.display = 'none';
                    }
                }
            } else {
                // Hide the map container if no coordinates
                if (this.mapEl) {
                    this.mapEl.style.display = 'none';
                }
            }
        } else {
            this.guessText.innerHTML = '<div class="name-box"><strong>No guess available</strong></div>';
            this.guessTextOverview.style.display = 'none';
            this.guessTextReasoning.style.display = 'none';
            // Hide map
            if (this.mapEl) {
                this.mapEl.style.display = 'none';
            }
        }
    }

    displayInventionImage(imageUrl, inventionName) {
        if (imageUrl && imageUrl !== null && imageUrl.toLowerCase() !== 'n/a' && 
            !imageUrl.includes('placeholder.com') && !imageUrl.includes('Parse+Error')) {
            // Show the image container and set the image source
            this.inventionImageContainer.style.display = 'block';
            this.inventionImage.src = imageUrl;
            this.inventionImage.alt = `Illustration of ${inventionName}`;
            
            // Handle image load success
            this.inventionImage.onload = () => {
                console.log('Invention image loaded successfully');
            };
            
            // Handle image load error
            this.inventionImage.onerror = () => {
                console.log('Invention image failed to load, hiding container');
                this.inventionImageContainer.style.display = 'none';
            };
        } else {
            // Hide the image container if no valid image URL
            this.inventionImageContainer.style.display = 'none';
        }
    }

    initMap(inventionCoords, location = null) {
        console.log('initMap called with coords:', inventionCoords);
        console.log('Google Maps available:', typeof google !== 'undefined' && typeof google.maps !== 'undefined');
        
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.log('Google Maps not available, showing error message');
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
            center: inventionCoords,
            mapTypeId: 'terrain'
        };
        this.map = new google.maps.Map(this.mapEl, mapOptions);

        // Add marker for the invention location
        const markerTitle = location ? `Invention Location: ${location}` : 'Invention Location';
        const inventionMarker = new google.maps.Marker({
            position: inventionCoords,
            map: this.map,
            title: markerTitle,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#059669" stroke="white" stroke-width="2"/>
                        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">I</text>
                    </svg>
                `)
            }
        });
    }

    showGameSection() {
        this.hideAllSections();
        this.gameSection.classList.remove('hidden');
    }

    hideAllSections() {
        this.gameSection.classList.add('hidden');
        this.victorySection.classList.add('hidden');
        this.loadingSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
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
        this.errorMessage.textContent = message;
        this.hideAllSections();
        this.errorSection.classList.remove('hidden');
    }

    hideError() {
        this.errorSection.classList.add('hidden');
    }

    startNewGame() {
        this.currentSessionId = null;
        this.userInput.value = '';
        this.hideAllSections();
        this.guessText.innerHTML = '';
        this.guessTextOverview.style.display = 'none';
        this.guessTextReasoning.innerHTML = '';
        this.inventionImageContainer.style.display = 'none';
        if (this.mapEl) {
            this.mapEl.style.display = 'none';
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InventionGame();
});