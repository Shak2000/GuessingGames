class CityGame {
    constructor() {
        this.currentSessionId = null;
        this.mapsApiKey = null;
        this.map = null;
        this.googleMapsScriptLoaded = false;
        this.initializeElements();
        this.attachEventListeners();
        this.loadGoogleMapsScript();
        this.checkForUrlParameters();
    }

    initializeElements() {
        // Input elements
        this.userInput = document.getElementById('userInput');
        this.submitBtn = document.getElementById('submitBtn');
        
        // Game elements
        this.gameSection = document.getElementById('gameSection');
        this.guessText = document.getElementById('guessText');
        this.guessTextReasoning = document.getElementById('guessTextReasoning');
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
            this.correctBtn.addEventListener('click', () => this.submitFeedback(true));
        }
        if (this.incorrectBtn) {
            this.incorrectBtn.addEventListener('click', () => this.submitFeedback(false));
        }
        if (this.dismissErrorBtn) {
            this.dismissErrorBtn.addEventListener('click', () => this.hideError());
        }
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => this.resetGame());
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

    async startNewGame() {
        const inputText = this.userInput.value.trim();
        
        if (!inputText) {
            this.showError('Please enter some information about the city.');
            return;
        }

        // Disable button and show loading
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Thinking...';
        this.showLoading();
        this.hideAllSections();

        try {
            const response = await fetch('/api/start-city-guess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: inputText })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to start game');
            }

            const data = await response.json();
            this.currentSessionId = data.session_id;
            
            // Display the city guess
            this.displayCityGuess(data.guess);
            this.showGameSection();

        } catch (error) {
            this.showError(`Error starting game: ${error.message}`);
        } finally {
            // Re-enable button and hide loading
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Submit Information';
            this.hideLoading();
        }
    }

    async submitFeedback(isCorrect) {
        if (!this.currentSessionId) {
            this.showError('No active game session.');
            return;
        }

        this.showLoading();
        this.hideButtons();

        try {
            const response = await fetch('/api/submit-city-feedback', {
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
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit feedback');
            }

            const data = await response.json();

            if (data.game_over) {
                this.showVictory();
            } else {
                this.displayCityGuess(data.guess);
                this.showButtons();
            }

        } catch (error) {
            this.showError(`Error submitting feedback: ${error.message}`);
            this.showButtons();
        } finally {
            this.hideLoading();
        }
    }

    displayCityGuess(guess) {
        // Safety check
        if (guess === null || guess === undefined) {
            this.showError('No guess data received');
            return;
        }
        
        // Check if this is already a JSON object
        if (typeof guess === 'object' && guess !== null) {
            this.displayJsonCityGuess(guess);
            return;
        }
        
        // Check if this looks like a JSON string
        if (typeof guess === 'string' && guess.trim().startsWith('{') && guess.trim().endsWith('}')) {
            try {
                const data = JSON.parse(guess);
                this.displayJsonCityGuess(data);
                return;
            } catch (e) {
                // JSON parsing failed, fall back to text format
                this.displayTextCityGuess(guess);
                return;
            }
        }
        
        // Not JSON format, use text format
        this.displayTextCityGuess(guess);
    }

    formatNumberWithCommas(number) {
        if (!number || isNaN(number)) return number;
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Conversion functions for measurements
    convertSquareMilesToSquareKilometers(sqMi) {
        if (!sqMi || isNaN(sqMi)) return null;
        return (parseFloat(sqMi) * 2.58999).toFixed(2);
    }

    convertPopulationDensityToMetric(densityPerSqMi) {
        if (!densityPerSqMi || isNaN(densityPerSqMi)) return null;
        return (parseFloat(densityPerSqMi) / 2.58999).toFixed(2);
    }

    convertFeetToMeters(feet) {
        if (!feet || isNaN(feet)) return null;
        return (parseFloat(feet) * 0.3048).toFixed(2);
    }

    displayJsonCityGuess(data) {
        // Extract data from JSON
        const fullName = data.name || 'Unknown';
        // Extract only the city name (before the first comma) for display
        const name = fullName.includes(',') ? fullName.split(',')[0].trim() : fullName;
        const county = data.county || '';
        const parish = data.parish || '';
        const borough = data.borough || '';
        const state = data.state || '';
        const prefecture = data.prefecture || '';
        const province = data.province || '';
        const department = data.department || '';
        const region = data.region || '';
        const territory = data.territory || '';
        const canton = data.canton || '';
        const voivodeship = data.voivodeship || '';
        const autonomousCommunity = data.autonomous_community || '';
        const otherAdminDivision = data.other_administrative_division || '';
        const country = data.country || '';
        const population = data.population || '';
        const latitude = data.latitude || '';
        const longitude = data.longitude || '';
        const areaMi = data.area_mi || '';
        const areaKm = data.area_km || '';
        const populationDensity = data.population_density || '';
        const elevation = data.elevation || '';
        const yearFounded = data.year_founded || '';
        const wikipediaUrl = data.wikipedia_url || '';
        const imageUrl = data.image_url || '';
        const reasoning = data.reasoning || '';
        const overview = data.overview || '';
        const notableAttractions = data.notable_attractions || [];
        const notablePeople = data.notable_people || [];
        const notableEvents = data.notable_events || [];
        const notableBusinesses = data.notable_businesses || [];
        const notableTechnologies = data.notable_technologies || [];
        
        // Build administrative information
        let adminInfo = '';
        const adminDivisions = [];
        
        // Add administrative divisions in the new order from the prompt
        if (county) adminDivisions.push(`<strong>County:</strong> ${county}`);
        if (parish) adminDivisions.push(`<strong>Parish:</strong> ${parish}`);
        if (borough) adminDivisions.push(`<strong>Borough:</strong> ${borough}`);
        if (state) adminDivisions.push(`<strong>State:</strong> ${state}`);
        if (prefecture) adminDivisions.push(`<strong>Prefecture:</strong> ${prefecture}`);
        if (province) adminDivisions.push(`<strong>Province:</strong> ${province}`);
        if (department) adminDivisions.push(`<strong>Department:</strong> ${department}`);
        if (region) adminDivisions.push(`<strong>Region:</strong> ${region}`);
        if (territory) adminDivisions.push(`<strong>Territory:</strong> ${territory}`);
        if (canton) adminDivisions.push(`<strong>Canton:</strong> ${canton}`);
        if (voivodeship) adminDivisions.push(`<strong>Voivodeship:</strong> ${voivodeship}`);
        if (autonomousCommunity) adminDivisions.push(`<strong>Autonomous Community:</strong> ${autonomousCommunity}`);
        if (otherAdminDivision) adminDivisions.push(`<strong>Other:</strong> ${otherAdminDivision}`);
        
        if (adminDivisions.length > 0 || country || population || latitude || longitude || areaMi || areaKm || populationDensity || elevation || yearFounded || wikipediaUrl || (notableAttractions && notableAttractions.length > 0) || (notablePeople && notablePeople.length > 0) || (notableEvents && notableEvents.length > 0) || (notableBusinesses && notableBusinesses.length > 0) || (notableTechnologies && notableTechnologies.length > 0)) {
            adminInfo += '<div class="bio-section">';
            adminInfo += '<h4>City Information:</h4>';
            if (adminDivisions.length > 0) {
                adminInfo += adminDivisions.map(div => `<p>${div}</p>`).join('');
            }
            if (country) adminInfo += `<p><strong>Country:</strong> ${country}</p>`;
            if (population) adminInfo += `<p><strong>Population:</strong> ${this.formatNumberWithCommas(population)}</p>`;
            
            // Display coordinates
            if (latitude && longitude) {
                adminInfo += `<p><strong>Coordinates:</strong> ${latitude}°N, ${longitude}°W</p>`;
            }
            
            // Display area information with conversion
            if (areaMi || areaKm) {
                let areaText = '';
                if (areaMi && areaKm) {
                    areaText = `${areaMi} mi² (${areaKm} km²)`;
                } else if (areaMi) {
                    const convertedKm = this.convertSquareMilesToSquareKilometers(areaMi);
                    areaText = `${areaMi} mi² (${convertedKm} km²)`;
                } else if (areaKm) {
                    areaText = `${areaKm} km²`;
                }
                adminInfo += `<p><strong>Area:</strong> ${areaText}</p>`;
            }
            
            // Display population density with conversion
            if (populationDensity) {
                const convertedDensity = this.convertPopulationDensityToMetric(populationDensity);
                adminInfo += `<p><strong>Population Density:</strong> ${this.formatNumberWithCommas(populationDensity)} people/mi² (${this.formatNumberWithCommas(convertedDensity)} people/km²)</p>`;
            }
            
            // Display elevation with conversion
            if (elevation) {
                const convertedElevation = this.convertFeetToMeters(elevation);
                adminInfo += `<p><strong>Elevation:</strong> ${this.formatNumberWithCommas(elevation)} ft (${convertedElevation} m)</p>`;
            }
            
            if (yearFounded) adminInfo += `<p><strong>Year Founded:</strong> ${yearFounded}</p>`;
            
            // Add notable attractions
            if (notableAttractions && notableAttractions.length > 0) {
                adminInfo += `<p><strong>Notable Attractions:</strong> ${notableAttractions.join(', ')}</p>`;
            }
            
            // Add notable people
            if (notablePeople && notablePeople.length > 0) {
                const clickablePeople = notablePeople.map(person => 
                    `<span class="clickable-name" data-name="${person.trim()}">${person.trim()}</span>`
                ).join(', ');
                adminInfo += `<p><strong>Notable People:</strong> ${clickablePeople}</p>`;
            }
            
            // Add notable events
            if (notableEvents && notableEvents.length > 0) {
                const clickableEvents = notableEvents.map(event => 
                    `<span class="clickable-event" data-event="${event.trim()}">${event.trim()}</span>`
                ).join(', ');
                adminInfo += `<p><strong>Notable Events:</strong> ${clickableEvents}</p>`;
            }
            
            // Add notable businesses
            if (notableBusinesses && notableBusinesses.length > 0) {
                const clickableBusinesses = notableBusinesses.map(business => 
                    `<span class="clickable-business" data-business="${business.trim()}">${business.trim()}</span>`
                ).join(', ');
                adminInfo += `<p><strong>Notable Businesses:</strong> ${clickableBusinesses}</p>`;
            }
            
            // Add notable technologies
            if (notableTechnologies && notableTechnologies.length > 0) {
                const clickableTechnologies = notableTechnologies.map(technology => 
                    `<a href="/invention" class="invention-link" data-invention="${technology.trim()}">${technology.trim()}</a>`
                ).join(', ');
                adminInfo += `<p><strong>Notable Technologies:</strong> ${clickableTechnologies}</p>`;
            }
            
            if (wikipediaUrl) adminInfo += `<p><strong>Wikipedia:</strong> <a href="${wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wikipedia-link">Page</a></p>`;
            
            adminInfo += '</div>';
        }
        
        // Build image HTML if available
        let imageHtml = '';
        if (imageUrl && imageUrl !== null) {
            // Use a CORS proxy for Wikipedia images
            let proxyUrl = '';
            if (imageUrl && imageUrl.includes('upload.wikimedia.org')) {
                // Use images.weserv.nl as a CORS proxy for Wikipedia images
                proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=200&h=200&fit=cover`;
            } else {
                proxyUrl = imageUrl;
            }
            
            imageHtml = `
                <div class="person-image-container">
                    <img src="${proxyUrl}" alt="Photo of ${name}" class="person-image" onerror="this.style.display='none'">
                </div>
            `;
        }
        
        // Build overview section
        let overviewInfo = '';
        if (overview && overview.trim() !== '') {
            overviewInfo = `
                <div class="bio-section overview-section">
                    <div class="overview-header">
                        <h4>Overview:</h4>
                        <button class="voice-btn overview-voice-btn" data-overview-text="${overview.replace(/"/g, '&quot;')}" title="Read overview aloud">
                            🔊
                        </button>
                    </div>
                    <p class="overview-text">${overview}</p>
                </div>
            `;
        }
        
        
        // Display image, name, overview, and city info
        this.guessText.innerHTML = `
            ${imageHtml}
            <div class="name-box">
                <strong>${name}</strong>
            </div>
            ${overviewInfo}
            ${adminInfo}
        `;
        
        // Display reasoning
        this.guessTextReasoning.innerHTML = `
            <div class="reasoning-box">
                ${reasoning}
            </div>
        `;
        
        // Setup clickable names for notable people
        this.setupClickableNames();
        
        // Setup voice button for overview
        this.setupVoiceButton();
        
        // Initialize map if coordinates are available
        const coordinates = data.coordinates;
        console.log('Coordinates data:', coordinates);
        
        if (coordinates && coordinates !== null) {
            try {
                const cityCoords = {
                    lat: coordinates.lat,
                    lng: coordinates.lng
                };
                console.log('City coords:', cityCoords);
                
                // Show the map container
                if (this.mapEl) {
                    console.log('Showing map container');
                    this.mapEl.style.display = 'block';
                    this.mapEl.style.height = '400px';
                    this.mapEl.style.width = '100%';
                    this.mapEl.style.marginTop = '15px';
                    this.mapEl.style.borderRadius = '10px';
                    this.mapEl.style.border = '1px solid #bae6fd';
                }
                
                // Initialize the map
                this.initMap(cityCoords, areaMi);
            } catch (e) {
                // Error parsing coordinates
                console.error('Error initializing map:', e);
            }
        } else {
            console.log('No coordinates available, hiding map');
            // Hide the map container if no coordinates
            if (this.mapEl) {
                this.mapEl.style.display = 'none';
            }
        }
    }

    displayTextCityGuess(guess) {
        // Fallback method for text format
        this.guessText.innerHTML = `
            <div class="name-box">
                <strong>${guess}</strong>
            </div>
        `;
        this.guessTextReasoning.innerHTML = '';
    }

    showGameSection() {
        this.gameSection.classList.remove('hidden');
        this.showButtons();
    }

    showButtons() {
        this.correctBtn.style.display = 'inline-block';
        this.incorrectBtn.style.display = 'inline-block';
    }

    hideButtons() {
        this.correctBtn.style.display = 'none';
        this.incorrectBtn.style.display = 'none';
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
        this.errorSection.classList.remove('hidden');
        this.hideLoading();
    }

    hideError() {
        this.errorSection.classList.add('hidden');
    }

    hideAllSections() {
        this.gameSection.classList.add('hidden');
        this.victorySection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
    }

    resetGame() {
        this.currentSessionId = null;
        this.userInput.value = '';
        this.hideAllSections();
        this.hideLoading();
        this.userInput.focus();
    }

    // Allow starting a new game even during an active session
    startNewGameFromButton() {
        // Reset current session and start fresh
        this.currentSessionId = null;
        this.startNewGame();
    }

    checkForUrlParameters() {
        // Check if there's a city name stored in localStorage from the person game
        const cityFromPerson = localStorage.getItem('citySearchFromPerson');
        
        if (cityFromPerson) {
            // Clear the stored value
            localStorage.removeItem('citySearchFromPerson');
            // Set the input field with the city name
            if (this.userInput) {
                this.userInput.value = cityFromPerson;
                // Automatically start the search after a short delay to ensure everything is loaded
                setTimeout(() => {
                    this.startNewGame();
                }, 500);
            }
        } else {
            // Check if there's a city name stored in localStorage from the invention game
            const cityFromInvention = localStorage.getItem('citySearchFromInvention');
            
            if (cityFromInvention) {
                // Clear the stored value
                localStorage.removeItem('citySearchFromInvention');
                // Set the input field with the city name
                if (this.userInput) {
                    this.userInput.value = cityFromInvention;
                    // Automatically start the search after a short delay to ensure everything is loaded
                    setTimeout(() => {
                        this.startNewGame();
                    }, 500);
                }
            } else {
                // Check if there's a city name stored in localStorage from the event game
                const cityFromEvent = localStorage.getItem('citySearchFromEvent');
                
                if (cityFromEvent) {
                    // Clear the stored value
                    localStorage.removeItem('citySearchFromEvent');
                    // Set the input field with the city name
                    if (this.userInput) {
                        this.userInput.value = cityFromEvent;
                        // Automatically start the search after a short delay to ensure everything is loaded
                        setTimeout(() => {
                            this.startNewGame();
                        }, 500);
                    }
                } else {
                    // Check if there's a city name stored in localStorage from the business game
                    const cityFromBusiness = localStorage.getItem('citySearchFromBusiness');
                    
                    if (cityFromBusiness) {
                        // Clear the stored value
                        localStorage.removeItem('citySearchFromBusiness');
                        // Set the input field with the city name
                        if (this.userInput) {
                            this.userInput.value = cityFromBusiness;
                            // Automatically start the search after a short delay to ensure everything is loaded
                            setTimeout(() => {
                                this.startNewGame();
                            }, 500);
                        }
                    } else {
                        // Check if there's a city name stored in localStorage from the movie game
                        const cityFromMovie = localStorage.getItem('citySearchFromMovie');
                        
                        if (cityFromMovie) {
                            // Clear the stored value
                            localStorage.removeItem('citySearchFromMovie');
                            // Set the input field with the city name
                            if (this.userInput) {
                                this.userInput.value = cityFromMovie;
                                // Automatically start the search after a short delay to ensure everything is loaded
                                setTimeout(() => {
                                    this.startNewGame();
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
                                        this.startNewGame();
                                    }, 500);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    calculateZoomFromArea(areaInSquareMiles) {
        if (!areaInSquareMiles || isNaN(areaInSquareMiles) || areaInSquareMiles <= 0) {
            return 3; // Default zoom if no area data
        }
        
        // Calculate side length of square: 3 * sqrt(area in square miles)
        const sideLengthMiles = 3 * Math.sqrt(parseFloat(areaInSquareMiles));
        
        // Convert miles to degrees (approximate)
        // 1 degree latitude ≈ 69 miles
        // 1 degree longitude ≈ 69 * cos(latitude) miles
        const sideLengthDegrees = sideLengthMiles / 69;
        
        // Calculate zoom level based on the side length
        // Google Maps zoom levels: each level doubles/halves the scale
        // Level 0 shows the whole world (360 degrees)
        // We want our side length to fit nicely in the viewport
        const worldWidth = 360; // degrees
        const targetViewportWidth = sideLengthDegrees;
        
        // Calculate zoom level: log2(worldWidth / targetViewportWidth)
        const zoomLevel = Math.log2(worldWidth / targetViewportWidth);
        
        // Clamp zoom level between reasonable bounds
        return Math.max(1, Math.min(15, Math.round(zoomLevel)));
    }
    
    initMap(cityCoords, areaInSquareMiles = null) {
        console.log('initMap called with coords:', cityCoords);
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

        const mapOptions = {
            zoom: 10,
            center: { lat: 20, lng: 0 },
            mapTypeId: 'terrain'
        };
        this.map = new google.maps.Map(this.mapEl, mapOptions);

        const bounds = new google.maps.LatLngBounds();
        let markerCount = 0;

        if (cityCoords) {
            const cityMarker = new google.maps.Marker({
                position: cityCoords,
                map: this.map,
                title: `City Location`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">C</text>
                        </svg>
                    `)
                }
            });
            bounds.extend(cityMarker.getPosition());
            markerCount++;
        }

        if (markerCount > 0) {
            // If there is only one marker, center on it and zoom out
            this.map.setCenter(bounds.getCenter());
            const zoomLevel = this.calculateZoomFromArea(areaInSquareMiles);
            this.map.setZoom(zoomLevel);
        }
    }

    setupClickableNames() {
        // Add event listeners to all clickable names (people)
        const clickableNames = document.querySelectorAll('.clickable-name');
        clickableNames.forEach(nameElement => {
            nameElement.addEventListener('click', (e) => {
                e.preventDefault();
                const personName = nameElement.getAttribute('data-name');
                if (personName) {
                    // Navigate to the person game with the person's name
                    window.location.href = `/person?search=${encodeURIComponent(personName)}`;
                }
            });
        });

        // Add event listeners to all clickable events
        const clickableEvents = document.querySelectorAll('.clickable-event');
        clickableEvents.forEach(eventElement => {
            eventElement.addEventListener('click', (e) => {
                e.preventDefault();
                const eventName = eventElement.getAttribute('data-event');
                if (eventName) {
                    // Store the event name in localStorage for the event game to use
                    localStorage.setItem('eventSearchFromCity', eventName);
                    // Navigate to the event game
                    window.location.href = '/event';
                }
            });
        });

        // Add event listeners to all clickable businesses
        const clickableBusinesses = document.querySelectorAll('.clickable-business');
        clickableBusinesses.forEach(businessElement => {
            businessElement.addEventListener('click', (e) => {
                e.preventDefault();
                const businessName = businessElement.getAttribute('data-business');
                if (businessName) {
                    // Store the business name in localStorage for the business game to use
                    localStorage.setItem('businessSearchFromCity', businessName);
                    // Navigate to the business game
                    window.location.href = '/business';
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
                    localStorage.setItem('inventionSearchFromCity', inventionName);
                    // Navigate to the invention game
                    window.location.href = '/invention';
                }
            });
        });
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
                    "Read this city overview in a clear and informative way",
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
                    prompt: "Read this city overview in a clear and informative way"
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
    new CityGame();
});