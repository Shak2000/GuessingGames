class EventGame {
    constructor() {
        this.currentSessionId = null;
        this.mapsApiKey = null;
        this.map = null;
        this.googleMapsScriptLoaded = false;
        
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
        
        // Event listeners
        this.setupEventListeners();
        
        // Load Google Maps script
        this.loadGoogleMapsScript();
        
        // Check for URL parameters
        this.checkForUrlParameters();
    }
    
    setupEventListeners() {
        this.submitBtn.addEventListener('click', () => this.startNewSession());
        this.correctBtn.addEventListener('click', () => this.submitFeedback(true));
        this.incorrectBtn.addEventListener('click', () => this.submitFeedback(false));
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.retryBtn.addEventListener('click', () => this.startNewGame());
        
        // Allow Enter key to submit, Shift+Enter for new line
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default new line behavior
                this.startNewSession();
            }
            // Shift+Enter allows default behavior (new line)
        });
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
    
    async startNewSession() {
        const userInput = this.userInput.value.trim();
        if (!userInput) {
            alert('Please enter some information about the event!');
            return;
        }
        
        // Disable button and show loading
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Thinking...';
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
        } finally {
            // Re-enable button and hide loading
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Submit Information';
            this.hideLoading();
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
        const city = data.city;
        const keyFigures = data.key_figures || [];
        const keyCities = data.key_cities || [];
        const keyTechnologies = data.key_technologies || [];
        const causes = data.causes;
        const keyDevelopments = data.key_developments;
        const results = data.results;
        const wikipediaUrl = data.wikipedia_url;
        const generatedImageUrl = data.image_url;
        const wikipediaImageUrl = data.wikipedia_image_url;
        const coordinates = data.coordinates;
        const cityCoordinates = data.city_coordinates || [];
        const reasoning = data.reasoning || '';
        const overview = data.overview || '';
        
        // Display the generated image
        this.displayEventImage(generatedImageUrl, name);
        
        // Build event information
        let eventInfo = '';
        if (start || end || location || keyFigures.length > 0 || keyCities.length > 0 || keyTechnologies.length > 0 || causes || keyDevelopments || results || wikipediaUrl) {
            eventInfo += '<div class="bio-section">';
            eventInfo += '<h4>Event Information:</h4>';
            if (start) eventInfo += `<p><strong>Start Date:</strong> ${start}</p>`;
            if (end) eventInfo += `<p><strong>End Date:</strong> ${end}</p>`;
            if (location) eventInfo += `<p><strong>Location:</strong> ${location}</p>`;
            
            if (keyFigures.length > 0) {
                const clickableFigures = keyFigures.map(figure => 
                    `<span class="clickable-figure" data-figure="${figure.trim()}">${figure.trim()}</span>`
                ).join(', ');
                eventInfo += `<p><strong>Key Figures:</strong> ${clickableFigures}</p>`;
            }
            
            if (keyCities.length > 0) {
                const clickableCities = keyCities.map(city => 
                    `<span class="clickable-city" data-city="${city.trim()}">${city.trim()}</span>`
                ).join(', ');
                eventInfo += `<p><strong>Key Cities:</strong> ${clickableCities}</p>`;
            }
            
            if (keyTechnologies.length > 0) {
                const clickableTechnologies = keyTechnologies.map(technology => 
                    `<a href="/invention" class="invention-link" data-invention="${technology.trim()}">${technology.trim()}</a>`
                ).join(', ');
                eventInfo += `<p><strong>Key Technologies:</strong> ${clickableTechnologies}</p>`;
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
        
        // Setup clickable city and figure links
        this.setupClickableLinks();
        
        // Initialize map if coordinates are available
        if ((cityCoordinates && cityCoordinates.length > 0) || (coordinates && coordinates !== null)) {
            try {
                // Show the map container
                if (this.mapEl) {
                    this.mapEl.style.display = 'block';
                    this.mapEl.style.height = '400px';
                    this.mapEl.style.width = '100%';
                    this.mapEl.style.marginTop = '15px';
                    this.mapEl.style.borderRadius = '10px';
                    this.mapEl.style.border = '1px solid #bae6fd';
                }
                
                // Initialize the map with multiple cities or fallback to single location
                if (cityCoordinates && cityCoordinates.length > 0) {
                    this.initMapWithMultipleCities(cityCoordinates, location);
                } else if (coordinates && coordinates !== null) {
                    const eventCoords = {
                        lat: coordinates.lat,
                        lng: coordinates.lng
                    };
                    this.initMap(eventCoords, city || location);
                }
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
        console.log('initMap called with coords:', eventCoords);
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
            center: eventCoords,
            mapTypeId: 'terrain'
        };
        this.map = new google.maps.Map(this.mapEl, mapOptions);

        // Add marker for the event location
        const markerTitle = location ? `Event Location: ${location}` : 'Event Location';
        const eventMarker = new google.maps.Marker({
            position: eventCoords,
            map: this.map,
            title: markerTitle,
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
    
    initMapWithMultipleCities(cityCoordinates, location = null) {
        console.log('initMapWithMultipleCities called with cities:', cityCoordinates);
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

        // Determine appropriate zoom level based on number of cities and location type
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

        // Calculate center point from all city coordinates
        const bounds = new google.maps.LatLngBounds();
        let centerLat = 0, centerLng = 0;
        
        cityCoordinates.forEach(cityData => {
            const coords = cityData.coordinates;
            bounds.extend(new google.maps.LatLng(coords.lat, coords.lng));
            centerLat += coords.lat;
            centerLng += coords.lng;
        });
        
        centerLat /= cityCoordinates.length;
        centerLng /= cityCoordinates.length;

        const mapOptions = {
            zoom: zoomLevel,
            center: { lat: centerLat, lng: centerLng },
            mapTypeId: 'terrain'
        };
        this.map = new google.maps.Map(this.mapEl, mapOptions);

        // Add markers for each city
        cityCoordinates.forEach((cityData, index) => {
            const coords = cityData.coordinates;
            const cityName = cityData.city;
            
            const markerTitle = `Key City: ${cityName}`;
            const cityMarker = new google.maps.Marker({
                position: coords,
                map: this.map,
                title: markerTitle,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">C</text>
                        </svg>
                    `)
                }
            });
        });

        // Fit map to show all markers if there are multiple cities
        if (cityCoordinates.length > 1) {
            this.map.fitBounds(bounds);
        }
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

    checkForUrlParameters() {
        // Check if there's an event name stored in localStorage from the person game
        const eventFromPerson = localStorage.getItem('eventSearchFromPerson');
        
        if (eventFromPerson) {
            // Clear the stored value
            localStorage.removeItem('eventSearchFromPerson');
            // Set the input field with the event name
            if (this.userInput) {
                this.userInput.value = eventFromPerson;
                // Automatically start the search after a short delay to ensure everything is loaded
                setTimeout(() => {
                    this.startNewSession();
                }, 500);
            }
        } else {
            // Check if there's an event name stored in localStorage from the invention game
            const eventFromInvention = localStorage.getItem('eventSearchFromInvention');
            
            if (eventFromInvention) {
                // Clear the stored value
                localStorage.removeItem('eventSearchFromInvention');
                // Set the input field with the event name
                if (this.userInput) {
                    this.userInput.value = eventFromInvention;
                    // Automatically start the search after a short delay to ensure everything is loaded
                    setTimeout(() => {
                        this.startNewSession();
                    }, 500);
                }
            } else {
                // Check if there's an event name stored in localStorage from the city game
                const eventFromCity = localStorage.getItem('eventSearchFromCity');
                
                if (eventFromCity) {
                    // Clear the stored value
                    localStorage.removeItem('eventSearchFromCity');
                    // Set the input field with the event name
                    if (this.userInput) {
                        this.userInput.value = eventFromCity;
                        // Automatically start the search after a short delay to ensure everything is loaded
                        setTimeout(() => {
                            this.startNewSession();
                        }, 500);
                    }
                } else {
                    // Check if there's an event name stored in localStorage from the movie game
                    const eventFromMovie = localStorage.getItem('eventSearchFromMovie');
                    
                    if (eventFromMovie) {
                        // Clear the stored value
                        localStorage.removeItem('eventSearchFromMovie');
                        // Set the input field with the event name
                        if (this.userInput) {
                            this.userInput.value = eventFromMovie;
                            // Automatically start the search after a short delay to ensure everything is loaded
                            setTimeout(() => {
                                this.startNewSession();
                            }, 500);
                        }
                    } else {
                        // Fallback: Check if there's a 'search' parameter in the URL
                        const urlParams = new URLSearchParams(window.location.search);
                        const searchParam = urlParams.get('search');
                        
                        if (searchParam) {
                            // Set the input field with the search parameter
                            if (this.userInput) {
                                this.userInput.value = searchParam;
                                // Automatically start the search after a short delay to ensure everything is loaded
                                setTimeout(() => {
                                    this.startNewSession();
                                }, 500);
                            }
                        }
                    }
                }
            }
        }
    }
    
    setupClickableLinks() {
        // Add event listeners to all clickable city links
        const clickableCities = document.querySelectorAll('.clickable-city');
        clickableCities.forEach(cityElement => {
            cityElement.addEventListener('click', (e) => {
                e.preventDefault();
                const cityName = cityElement.getAttribute('data-city');
                if (cityName) {
                    // Store the city name in localStorage for the city game to use
                    localStorage.setItem('citySearchFromEvent', cityName);
                    // Navigate to the city game
                    window.location.href = '/city';
                }
            });
        });

        // Add event listeners to all clickable figure links
        const clickableFigures = document.querySelectorAll('.clickable-figure');
        clickableFigures.forEach(figureElement => {
            figureElement.addEventListener('click', (e) => {
                e.preventDefault();
                const figureName = figureElement.getAttribute('data-figure');
                if (figureName) {
                    // Store the figure name in localStorage for the person game to use
                    localStorage.setItem('personSearchFromEvent', figureName);
                    // Navigate to the person game
                    window.location.href = '/person';
                }
            });
        });

        // Add event listeners to all invention links
        const inventionLinks = document.querySelectorAll('.invention-link');
        inventionLinks.forEach(linkElement => {
            linkElement.addEventListener('click', (e) => {
                e.preventDefault();
                const inventionName = linkElement.getAttribute('data-invention');
                if (inventionName) {
                    // Store the invention name in localStorage for the invention game to use
                    localStorage.setItem('inventionSearchFromEvent', inventionName);
                    // Navigate to the invention game
                    window.location.href = '/invention';
                }
            });
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EventGame();
});