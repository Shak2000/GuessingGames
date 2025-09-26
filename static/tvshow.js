class TVShowGame {
    constructor() {
        this.userInput = document.getElementById('userInput');
        this.submitBtn = document.getElementById('submitBtn');
        this.gameSection = document.getElementById('gameSection');
        this.victorySection = document.getElementById('victorySection');
        this.loadingSection = document.getElementById('loadingSection');
        this.errorSection = document.getElementById('errorSection');
        this.guessText = document.getElementById('guessText');
        this.guessTextOverview = document.getElementById('guessTextOverview');
        this.guessTextReasoning = document.getElementById('guessTextReasoning');
        
        // TV show image elements
        this.showImageContainer = document.getElementById('showImageContainer');
        this.showImage = document.getElementById('showImage');
        this.correctBtn = document.getElementById('correctBtn');
        this.incorrectBtn = document.getElementById('incorrectBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.dismissErrorBtn = document.getElementById('dismissErrorBtn');
        this.errorMessage = document.getElementById('errorMessage');
        
        // TV show details sections
        this.basicInfoSection = document.getElementById('basicInfoSection');
        this.basicInfoContent = document.getElementById('basicInfoContent');
        this.castCrewSection = document.getElementById('castCrewSection');
        this.castCrewContent = document.getElementById('castCrewContent');
        this.productionSection = document.getElementById('productionSection');
        this.productionContent = document.getElementById('productionContent');
        this.networkSection = document.getElementById('networkSection');
        this.networkContent = document.getElementById('networkContent');
        this.moreInfoSection = document.getElementById('moreInfoSection');
        this.moreInfoContent = document.getElementById('moreInfoContent');
        this.inspirationSection = document.getElementById('inspirationSection');
        this.inspirationContent = document.getElementById('inspirationContent');
        
        this.currentSessionId = null;
        this.mapsApiKey = null;
        this.map = null;
        this.googleMapsScriptLoaded = false;
        this.mapEl = document.getElementById('map');
        
        this.initializeEventListeners();
        this.loadGoogleMapsScript();
    }

    initializeEventListeners() {
        this.submitBtn.addEventListener('click', () => this.startNewGameFromButton());
        this.correctBtn.addEventListener('click', () => this.submitFeedback(true));
        this.incorrectBtn.addEventListener('click', () => this.submitFeedback(false));
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.dismissErrorBtn.addEventListener('click', () => this.hideError());
        
        // Allow Enter key to submit
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default new line behavior
                this.startNewGameFromButton();
            }
            // Shift+Enter allows default behavior (new line)
        });
    }

    hideAllSections() {
        this.gameSection.classList.add('hidden');
        this.victorySection.classList.add('hidden');
        this.loadingSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
    }

    showGameSection() {
        this.gameSection.classList.remove('hidden');
    }

    showVictorySection() {
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
        this.errorSection.classList.remove('hidden');
    }

    hideError() {
        this.errorSection.classList.add('hidden');
    }

    startNewGame() {
        this.hideAllSections();
        this.userInput.value = '';
        this.currentSessionId = null;
        this.userInput.focus();
        // Hide the map
        if (this.mapEl) {
            this.mapEl.style.display = 'none';
        }
    }

    async startNewGameFromButton() {
        const inputText = this.userInput.value.trim();
        
        if (!inputText) {
            this.showError('Please enter some information about the TV show.');
            return;
        }

        // Disable button and show loading
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Thinking...';
        this.hideAllSections();
        this.showLoading();

        try {
            const response = await fetch('/api/start-tvshow-guess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: inputText }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.currentSessionId = data.session_id;
            
            this.hideLoading();
            this.displayGuess(data.guess);
            this.showGameSection();

        } catch (error) {
            console.error('Error starting TV show game:', error);
            this.hideLoading();
            this.showError(`Failed to start game: ${error.message}`);
        } finally {
            // Re-enable button and hide loading
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Submit Information';
        }
    }

    displayGuess(guess) {
        if (guess.error) {
            this.showError(guess.error);
            return;
        }

        // Display TV show image if available
        if (guess.image_url) {
            // Use a CORS proxy for Wikipedia images
            let proxyUrl = '';
            if (guess.image_url.includes('upload.wikimedia.org')) {
                // Use images.weserv.nl as a CORS proxy for Wikipedia images (no size limits)
                proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(guess.image_url)}`;
            } else {
                proxyUrl = guess.image_url;
            }
            
            this.showImage.src = proxyUrl;
            this.showImageContainer.style.display = 'block';
        } else {
            this.showImageContainer.style.display = 'none';
        }

        // Display main guess and overview
        let overviewInfo = '';
        if (guess.overview) {
            overviewInfo = `
                <div class="bio-section overview-section">
                    <div class="overview-header">
                        <h4>Overview:</h4>
                        <button class="voice-btn overview-voice-btn" data-overview-text="${guess.overview.replace(/"/g, '&quot;')}" title="Read overview aloud">
                            🔊
                        </button>
                    </div>
                    <p class="overview-text">${guess.overview}</p>
                </div>
            `;
        }

        this.guessText.innerHTML = `
            <div class="name-box">${guess.name}</div>
            ${overviewInfo}
        `;
        
        // Hide the separate overview section since we're including it in the main content
        this.guessTextOverview.style.display = 'none';

        // Display reasoning
        if (guess.reasoning) {
            this.guessTextReasoning.innerHTML = `<div class="reasoning-box">${guess.reasoning}</div>`;
        }

        // Setup voice button for overview
        this.setupVoiceButton();

        // Display detailed information
        this.displayTVShowDetails(guess);
    }

    formatClickablePersonList(persons) {
        if (!persons || persons.length === 0) return '';
        
        return persons.map(person => 
            `<span class="clickable-person" data-person="${person.trim()}">${person.trim()}</span>`
        ).join(', ');
    }

    formatClickableBusinessList(businesses) {
        if (!businesses || businesses.length === 0) return '';
        
        return businesses.map(business => 
            `<span class="clickable-business" data-business="${business.trim()}">${business.trim()}</span>`
        ).join(', ');
    }

    formatClickableCityList(cities) {
        if (!cities || cities.length === 0) return '';
        
        return cities.map(city => 
            `<span class="clickable-city" data-city="${city.trim()}">${city.trim()}</span>`
        ).join(', ');
    }

    formatClickableEventList(events) {
        if (!events || events.length === 0) return '';
        
        return events.map(event => 
            `<span class="clickable-event" data-event="${event.trim()}">${event.trim()}</span>`
        ).join(', ');
    }

    displayTVShowDetails(show) {
        // Basic Information
        let basicInfo = '';
        // Add ratings at the top of basic information
        if (show.imdb_rating) basicInfo += `<p><strong>IMDb Rating:</strong> ${show.imdb_rating}/10</p>`;
        if (show.rotten_tomatoes_rating) basicInfo += `<p><strong>Rotten Tomatoes:</strong> ${show.rotten_tomatoes_rating}%</p>`;
        if (show.tv_parental_guidelines_rating) basicInfo += `<p><strong>TV Parental Guidelines:</strong> ${show.tv_parental_guidelines_rating}</p>`;
        if (show.genre && show.genre.length > 0) basicInfo += `<p><strong>Genre:</strong> ${show.genre.join(', ')}</p>`;
        if (show.number_of_seasons) basicInfo += `<p><strong>Number of Seasons:</strong> ${show.number_of_seasons}</p>`;
        if (show.number_of_episodes) basicInfo += `<p><strong>Number of Episodes:</strong> ${show.number_of_episodes}</p>`;
        if (show.running_time) basicInfo += `<p><strong>Episode Runtime:</strong> ${show.running_time} minutes</p>`;
        if (show.country_of_origin && show.country_of_origin.length > 0) basicInfo += `<p><strong>Country of Origin:</strong> ${show.country_of_origin.join(', ')}</p>`;
        if (show.original_language && show.original_language.length > 0) basicInfo += `<p><strong>Original Language:</strong> ${show.original_language.join(', ')}</p>`;
        
        if (basicInfo) {
            this.basicInfoContent.innerHTML = basicInfo;
            this.basicInfoSection.classList.remove('hidden');
        }

        // Cast & Crew
        let castCrew = '';
        if (show.starring && show.starring.length > 0) castCrew += `<p><strong>Starring:</strong> ${this.formatClickablePersonList(show.starring)}</p>`;
        if (show.created_by && show.created_by.length > 0) castCrew += `<p><strong>Created by:</strong> ${this.formatClickablePersonList(show.created_by)}</p>`;
        if (show.written_by && show.written_by.length > 0) castCrew += `<p><strong>Written by:</strong> ${this.formatClickablePersonList(show.written_by)}</p>`;
        if (show.cinematography && show.cinematography.length > 0) castCrew += `<p><strong>Cinematography:</strong> ${this.formatClickablePersonList(show.cinematography)}</p>`;
        if (show.editors && show.editors.length > 0) castCrew += `<p><strong>Editors:</strong> ${this.formatClickablePersonList(show.editors)}</p>`;
        if (show.composers && show.composers.length > 0) castCrew += `<p><strong>Composers:</strong> ${this.formatClickablePersonList(show.composers)}</p>`;
        
        if (castCrew) {
            this.castCrewContent.innerHTML = castCrew;
            this.castCrewSection.classList.remove('hidden');
        }

        // Production
        let production = '';
        if (show.executive_producers && show.executive_producers.length > 0) production += `<p><strong>Executive Producers:</strong> ${this.formatClickablePersonList(show.executive_producers)}</p>`;
        if (show.producers && show.producers.length > 0) production += `<p><strong>Producers:</strong> ${this.formatClickablePersonList(show.producers)}</p>`;
        if (show.production_companies && show.production_companies.length > 0) production += `<p><strong>Production Companies:</strong> ${this.formatClickableBusinessList(show.production_companies)}</p>`;
        
        if (production) {
            this.productionContent.innerHTML = production;
            this.productionSection.classList.remove('hidden');
        }

        // Network & Release
        let network = '';
        if (show.network && show.network.length > 0) network += `<p><strong>Network:</strong> ${show.network.join(', ')}</p>`;
        if (show.release_date) network += `<p><strong>Release Date:</strong> ${show.release_date}</p>`;
        
        if (network) {
            this.networkContent.innerHTML = network;
            this.networkSection.classList.remove('hidden');
        }

        // More Information
        let moreInfo = '';
        if (show.imdb_url) {
            moreInfo += `<p><strong>IMDb:</strong> <a href="${show.imdb_url}" target="_blank" rel="noopener noreferrer">View on IMDb</a></p>`;
        }
        if (show.rotten_tomatoes_url) {
            moreInfo += `<p><strong>Rotten Tomatoes:</strong> <a href="${show.rotten_tomatoes_url}" target="_blank" rel="noopener noreferrer">View on Rotten Tomatoes</a></p>`;
        }
        if (show.wikipedia_url) {
            moreInfo += `<p><strong>Wikipedia:</strong> <a href="${show.wikipedia_url}" target="_blank" rel="noopener noreferrer">View on Wikipedia</a></p>`;
        }
        
        if (moreInfo) {
            this.moreInfoContent.innerHTML = moreInfo;
            this.moreInfoSection.classList.remove('hidden');
        }

        // Inspiration
        let inspiration = '';
        if (show.people && show.people.length > 0) {
            inspiration += `<p><strong>Real-World People:</strong> ${this.formatClickablePersonList(show.people)}</p>`;
        }
        if (show.cities && show.cities.length > 0) {
            inspiration += `<p><strong>Real-World Cities:</strong> ${this.formatClickableCityList(show.cities)}</p>`;
        }
        if (show.events && show.events.length > 0) {
            inspiration += `<p><strong>Real-World Events:</strong> ${this.formatClickableEventList(show.events)}</p>`;
        }
        
        if (inspiration) {
            this.inspirationContent.innerHTML = inspiration;
            this.inspirationSection.classList.remove('hidden');
        }

        // Set up clickable person, business, city, and event links
        this.setupClickablePersonLinks();
        this.setupClickableBusinessLinks();
        this.setupClickableCityLinks();
        this.setupClickableEventLinks();
        
        // Initialize map if cities are available
        this.initializeMap(show);
    }

    setupClickablePersonLinks() {
        // Add event listeners to all clickable person links
        const clickablePersons = document.querySelectorAll('.clickable-person');
        clickablePersons.forEach(personElement => {
            personElement.addEventListener('click', (e) => {
                e.preventDefault();
                const personName = personElement.getAttribute('data-person');
                
                // Navigate to person game with pre-filled name
                if (personName) {
                    window.location.href = `/person?search=${encodeURIComponent(personName)}`;
                }
            });
        });
    }

    setupClickableBusinessLinks() {
        // Add event listeners to all clickable business links
        const clickableBusinesses = document.querySelectorAll('.clickable-business');
        clickableBusinesses.forEach(businessElement => {
            businessElement.addEventListener('click', (e) => {
                e.preventDefault();
                const businessName = businessElement.getAttribute('data-business');
                if (businessName) {
                    // Store the business name in localStorage for the business game to use
                    localStorage.setItem('businessSearchFromTVShow', businessName);
                    // Navigate to the business game
                    window.location.href = '/business';
                }
            });
        });
    }

    setupClickableCityLinks() {
        // Add event listeners to all clickable city links
        const clickableCities = document.querySelectorAll('.clickable-city');
        clickableCities.forEach(cityElement => {
            cityElement.addEventListener('click', (e) => {
                e.preventDefault();
                const cityName = cityElement.getAttribute('data-city');
                if (cityName) {
                    // Store the city name in localStorage for the city game to use
                    localStorage.setItem('citySearchFromTVShow', cityName);
                    // Navigate to the city game
                    window.location.href = '/city';
                }
            });
        });
    }

    setupClickableEventLinks() {
        // Add event listeners to all clickable event links
        const clickableEvents = document.querySelectorAll('.clickable-event');
        clickableEvents.forEach(eventElement => {
            eventElement.addEventListener('click', (e) => {
                e.preventDefault();
                const eventName = eventElement.getAttribute('data-event');
                if (eventName) {
                    // Store the event name in localStorage for the event game to use
                    localStorage.setItem('eventSearchFromTVShow', eventName);
                    // Navigate to the event game
                    window.location.href = '/event';
                }
            });
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

    initializeMap(show) {
        const citiesCoordinates = show.cities_coordinates || [];
        
        if (citiesCoordinates.length > 0) {
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
                
                // Initialize the map with multiple cities
                this.initMapWithMultipleCities(citiesCoordinates);
            } catch (e) {
                console.error('Error initializing map:', e);
                if (this.mapEl) {
                    this.mapEl.style.display = 'none';
                }
            }
        } else {
            // Hide the map container if no cities
            if (this.mapEl) {
                this.mapEl.style.display = 'none';
            }
        }
    }

    initMapWithMultipleCities(citiesCoordinates) {
        console.log('initMapWithMultipleCities called with cities:', citiesCoordinates);
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

        // Calculate center point from all city coordinates
        const bounds = new google.maps.LatLngBounds();
        let centerLat = 0, centerLng = 0;
        
        citiesCoordinates.forEach(cityData => {
            const coords = cityData.coordinates;
            bounds.extend(new google.maps.LatLng(coords.lat, coords.lng));
            centerLat += coords.lat;
            centerLng += coords.lng;
        });
        
        centerLat /= citiesCoordinates.length;
        centerLng /= citiesCoordinates.length;

        const mapOptions = {
            zoom: 8,
            center: { lat: centerLat, lng: centerLng },
            mapTypeId: 'terrain'
        };
        this.map = new google.maps.Map(this.mapEl, mapOptions);

        // Add markers for each city
        citiesCoordinates.forEach((cityData, index) => {
            const coords = cityData.coordinates;
            const cityName = cityData.city;
            
            const markerTitle = `TV Show Location: ${cityName}`;
            const cityMarker = new google.maps.Marker({
                position: coords,
                map: this.map,
                title: markerTitle,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#DC2626" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">T</text>
                        </svg>
                    `)
                }
            });
        });

        // Fit map to show all markers if there are multiple cities
        if (citiesCoordinates.length > 1) {
            this.map.fitBounds(bounds);
        }
    }

    async submitFeedback(isCorrect) {
        if (!this.currentSessionId) {
            return;
        }

        // Disable buttons and show loading
        this.correctBtn.disabled = true;
        this.incorrectBtn.disabled = true;
        this.showLoading();

        try {
            const response = await fetch('/api/submit-tvshow-feedback', {
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
            
            if (data.error) {
                throw new Error(data.error);
            }

            this.hideLoading();

            if (data.game_over) {
                this.showVictorySection();
            } else {
                // Display new guess
                this.displayGuess(data.guess);
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.hideLoading();
            this.showError(`Failed to submit feedback: ${error.message}`);
        } finally {
            // Re-enable buttons
            this.correctBtn.disabled = false;
            this.incorrectBtn.disabled = false;
        }
    }

    setupVoiceButton() {
        // Add event listener to the overview voice button
        const voiceBtn = document.querySelector('.overview-voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Try to get text from data attribute first
                let overviewText = voiceBtn.getAttribute('data-overview-text');
                
                // If that fails, try to get text from the overview text element
                if (!overviewText) {
                    const overviewTextElement = document.querySelector('.overview-text');
                    overviewText = overviewTextElement ? overviewTextElement.textContent : null;
                }
                
                console.log('Voice button clicked, overview text:', overviewText);
                
                if (overviewText && overviewText.trim()) {
                    this.readOverview(overviewText);
                } else {
                    console.error('No overview text found');
                    this.showVoiceError('No overview text available');
                }
            });
        }
    }

    async readOverview(overviewText) {
        try {
            console.log('ReadOverview called with text:', overviewText);
            
            // Find the overview voice button and disable it
            const voiceBtn = document.querySelector('.overview-voice-btn');
            if (voiceBtn) {
                voiceBtn.disabled = true;
                voiceBtn.textContent = '🔄';
                voiceBtn.title = 'Reading overview...';
            }

            // Validate input
            if (!overviewText || typeof overviewText !== 'string') {
                throw new Error('Invalid overview text provided');
            }

            // Clean the overview text (remove HTML entities, extra spaces, etc.)
            const cleanText = overviewText
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();

            console.log('Cleaned text:', cleanText);
            console.log('Text length:', cleanText.length);

            // Validate cleaned text
            if (!cleanText || cleanText.length === 0) {
                throw new Error('Overview text is empty after cleaning');
            }

            // Use the audio manager for TTS
            if (window.audioManager) {
                await window.audioManager.playTTS(
                    cleanText,
                    null,
                    "Read this TV show overview in a clear and informative way",
                    {
                        onStart: () => {
                            console.log('TTS started');
                        },
                        onSuccess: () => {
                            this.resetVoiceButton();
                        },
                        onError: (error) => {
                            this.resetVoiceButton();
                            this.showVoiceError(`Error: ${error.message}`);
                        }
                    }
                );
            } else {
                // Fallback to direct TTS request
                const requestData = {
                    text: cleanText,
                    prompt: "Read this TV show overview in a clear and informative way"
                };
                
                console.log('Sending TTS request:', requestData);

                const response = await fetch('/api/generate-tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    
                    if (contentType && contentType.includes('audio')) {
                        // Handle audio response
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        
                        // Handle audio events
                        audio.onended = () => {
                            URL.revokeObjectURL(audioUrl);
                            this.resetVoiceButton();
                        };
                        
                        audio.onerror = () => {
                            URL.revokeObjectURL(audioUrl);
                            this.resetVoiceButton();
                            this.showVoiceError('Error playing audio');
                        };
                        
                        // Play the audio
                        await audio.play();
                    } else {
                        // Handle non-audio response
                        this.resetVoiceButton();
                        this.showVoiceError('TTS not properly configured');
                    }
                } else {
                    console.error('TTS request failed with status:', response.status);
                    this.resetVoiceButton();
                    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                    console.error('Error response data:', errorData);
                    this.showVoiceError(errorData.detail || 'Failed to generate audio');
                }
            }
        } catch (error) {
            console.error('Error reading overview:', error);
            this.resetVoiceButton();
            this.showVoiceError(`Error reading overview: ${error.message}`);
        }
    }

    resetVoiceButton() {
        const voiceBtn = document.querySelector('.overview-voice-btn');
        if (voiceBtn) {
            voiceBtn.disabled = false;
            voiceBtn.textContent = '🔊';
            voiceBtn.title = 'Read overview aloud';
        }
    }

    showVoiceError(message) {
        // Show a temporary error message
        const voiceBtn = document.querySelector('.overview-voice-btn');
        if (voiceBtn) {
            const originalText = voiceBtn.textContent;
            voiceBtn.textContent = '❌';
            voiceBtn.title = message;
            
            setTimeout(() => {
                voiceBtn.textContent = originalText;
                voiceBtn.title = 'Read overview aloud';
            }, 3000);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TVShowGame();
});
