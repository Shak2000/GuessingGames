class FamousPersonGame {
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
        this.guessTextFamily = document.getElementById('guessTextFamily');
        this.guessTextReasoning = document.getElementById('guessTextReasoning');
        this.mapEl = document.getElementById('map');
        this.correctBtn = document.getElementById('correctBtn');
        this.incorrectBtn = document.getElementById('incorrectBtn');
        
        // Family elements
        this.parentsSection = document.getElementById('parentsSection');
        this.parentsList = document.getElementById('parentsList');
        this.siblingsSection = document.getElementById('siblingsSection');
        this.siblingsList = document.getElementById('siblingsList');
        this.spouseSection = document.getElementById('spouseSection');
        this.spouseList = document.getElementById('spouseList');
        this.childrenSection = document.getElementById('childrenSection');
        this.childrenList = document.getElementById('childrenList');
        
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
        if (this.googleMapsScriptLoaded) return;
        
        try {
            const response = await fetch('/api/maps-key');
            if (!response.ok) {
                throw new Error('Could not fetch Google Maps API key.');
            }
            const data = await response.json();
            this.mapsApiKey = data.maps_key;

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.mapsApiKey}`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            this.googleMapsScriptLoaded = true;
        } catch (error) {
            // Failed to load Google Maps script
        }
    }

    async startNewGame() {
        const inputText = this.userInput.value.trim();
        
        if (!inputText) {
            this.showError('Please enter some information about the famous person.');
            return;
        }

        // Disable button and show loading
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Thinking...';
        this.showLoading();
        this.hideAllSections();

        try {
            const response = await fetch('/api/start-guess', {
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
            
            // Debug: Check what we're receiving
            if (typeof data.guess === 'string') {
                // If it's a string, try to parse it
                try {
                    const parsedGuess = JSON.parse(data.guess);
                    this.displayGuess(parsedGuess);
                } catch (e) {
                    this.displayGuess(data.guess);
                }
            } else {
                this.displayGuess(data.guess);
            }
            
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
            const response = await fetch('/api/submit-feedback', {
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
                // Debug: Check what we're receiving
                if (typeof data.guess === 'string') {
                    // If it's a string, try to parse it
                    try {
                        const parsedGuess = JSON.parse(data.guess);
                        this.displayGuess(parsedGuess);
                    } catch (e) {
                        this.displayGuess(data.guess);
                    }
                } else {
                    this.displayGuess(data.guess);
                }
                this.showButtons();
            }

        } catch (error) {
            this.showError(`Error submitting feedback: ${error.message}`);
            this.showButtons();
        } finally {
            this.hideLoading();
        }
    }

    displayGuess(guess) {
        // Safety check
        if (guess === null || guess === undefined) {
            this.showError('No guess data received');
            return;
        }
        
        // Check if this is already a JSON object (like the good solution)
        if (typeof guess === 'object' && guess !== null) {
            this.displayJsonGuess(guess);
            return;
        }
        
        // Check if this looks like a JSON string
        if (typeof guess === 'string' && guess.trim().startsWith('{') && guess.trim().endsWith('}')) {
            try {
                const data = JSON.parse(guess);
                this.displayJsonGuess(data);
                return;
            } catch (e) {
                // JSON parsing failed, fall back to old format
                this.displayGuessOldFormat(guess);
                return;
            }
        }
        
        // Not JSON format, use old format
        this.displayGuessOldFormat(guess);
    }

    displayJsonGuess(data) {
        // Extract data from JSON
        const name = data.name || 'Unknown';
        const dateOfBirth = data.date_of_birth;
        const placeOfBirth = data.place_of_birth;
        const dateOfDeath = data.date_of_death;
        const placeOfDeath = data.place_of_death;
        const placeOfResidence = data.place_of_residence;
        const placeOfBurial = data.place_of_burial;
        const parents = data.parents || [];
        const siblings = data.siblings || [];
        const spouse = data.spouse || [];
        const children = data.children || [];
        const businesses = data.businesses || [];
        const events = data.events || [];
        const imageUrl = data.image_url;
        const wikipediaUrl = data.wikipedia_url;
        const coordinates = data.coordinates;
        const birthplaceAreaMi = data.birthplace_area_mi;
        const deathplaceAreaMi = data.deathplace_area_mi;
        console.log('Person game area data:', { birthplaceAreaMi, deathplaceAreaMi });
        const reasoning = data.reasoning || '';
        const overview = data.overview || '';
        
        // Build biographical information
        let bioInfo = '';
        if (dateOfBirth || placeOfBirth || dateOfDeath || placeOfDeath || placeOfResidence || placeOfBurial || wikipediaUrl) {
            bioInfo += '<div class="bio-section">';
            bioInfo += '<h4>Biographical Information:</h4>';
            if (dateOfBirth) bioInfo += `<p><strong>Born:</strong> ${dateOfBirth}</p>`;
            if (placeOfBirth) bioInfo += `<p><strong>Birthplace:</strong> <a href="/city" class="city-link" data-city="${placeOfBirth}">${placeOfBirth}</a></p>`;
            // Only show death information if the person is actually deceased
            if (dateOfDeath && dateOfDeath !== null && dateOfDeath.toLowerCase() !== 'n/a') {
                bioInfo += `<p><strong>Died:</strong> ${dateOfDeath}</p>`;
            }
            if (placeOfDeath && placeOfDeath !== null && placeOfDeath.toLowerCase() !== 'n/a') {
                bioInfo += `<p><strong>Place of Death:</strong> <a href="/city" class="city-link" data-city="${placeOfDeath}">${placeOfDeath}</a></p>`;
            }
            // Show place of residence if available and person is alive (not deceased)
            if (placeOfResidence && placeOfResidence !== null && placeOfResidence.toLowerCase() !== 'n/a' && placeOfResidence.toLowerCase() !== 'null' && placeOfResidence.toLowerCase() !== 'unknown' && (!dateOfDeath || dateOfDeath.toLowerCase() === 'n/a' || dateOfDeath.toLowerCase() === 'alive' || dateOfDeath.toLowerCase() === 'still alive')) {
                bioInfo += `<p><strong>Place of Residence:</strong> <a href="/city" class="city-link" data-city="${placeOfResidence}">${placeOfResidence}</a></p>`;
            }
            // Show place of burial if available and person is deceased
            if (placeOfBurial && placeOfBurial !== null && placeOfBurial.toLowerCase() !== 'n/a' && placeOfBurial.toLowerCase() !== 'null' && placeOfBurial.toLowerCase() !== 'unknown' && dateOfDeath && dateOfDeath.toLowerCase() !== 'n/a' && dateOfDeath.toLowerCase() !== 'alive' && dateOfDeath.toLowerCase() !== 'still alive') {
                bioInfo += `<p><strong>Place of Burial:</strong> <a href="/city" class="city-link" data-city="${placeOfBurial}">${placeOfBurial}</a></p>`;
            }
            // Add Wikipedia link if available
            if (wikipediaUrl && wikipediaUrl !== null) {
                bioInfo += `<p><strong>Wikipedia:</strong> <a href="${wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wikipedia-link">Page</a></p>`;
            }
            bioInfo += '</div>';
        }
        
        // Build family information
        let familyInfo = '';
        if ((parents && parents.length > 0) || (siblings && siblings.length > 0) || (spouse && (Array.isArray(spouse) ? spouse.length > 0 : spouse !== '')) || (children && children.length > 0)) {
            familyInfo += '<div class="bio-section">';
            familyInfo += '<h4>Family Information:</h4>';
            if (parents && parents.length > 0) {
                const clickableParents = parents.map(parent => 
                    `<span class="clickable-name" data-name="${parent.trim()}">${parent.trim()}</span>`
                ).join(', ');
                familyInfo += `<p><strong>Parents:</strong> ${clickableParents}</p>`;
            }
            if (siblings && siblings.length > 0) {
                const clickableSiblings = siblings.map(sibling => 
                    `<span class="clickable-name" data-name="${sibling.trim()}">${sibling.trim()}</span>`
                ).join(', ');
                familyInfo += `<p><strong>Siblings:</strong> ${clickableSiblings}</p>`;
            }
            if (spouse && (Array.isArray(spouse) ? spouse.length > 0 : spouse !== '')) {
                // Handle both array format (new) and string format (old)
                let spouses;
                if (Array.isArray(spouse)) {
                    spouses = spouse;
                } else {
                    // Handle multiple spouses in string format (split by comma if multiple)
                    spouses = spouse.includes(',') ? spouse.split(',').map(s => s.trim()) : [spouse.trim()];
                }
                const clickableSpouses = spouses.map(spouseItem => 
                    `<span class="clickable-name" data-name="${spouseItem.trim()}">${spouseItem.trim()}</span>`
                ).join(', ');
                familyInfo += `<p><strong>Spouse:</strong> ${clickableSpouses}</p>`;
            }
            if (children && children.length > 0) {
                const clickableChildren = children.map(child => 
                    `<span class="clickable-name" data-name="${child.trim()}">${child.trim()}</span>`
                ).join(', ');
                familyInfo += `<p><strong>Children:</strong> ${clickableChildren}</p>`;
            }
            familyInfo += '</div>';
        }
        
        // Build businesses information
        let businessesInfo = '';
        if (businesses && businesses.length > 0) {
            businessesInfo += '<div class="bio-section">';
            businessesInfo += '<h4>Businesses:</h4>';
            const clickableBusinesses = businesses.map(business => 
                `<a href="/business" class="business-link" data-business="${business.trim()}">${business.trim()}</a>`
            ).join(', ');
            businessesInfo += `<p>${clickableBusinesses}</p>`;
            businessesInfo += '</div>';
        }
        
        // Build events information
        let eventsInfo = '';
        if (events && events.length > 0) {
            eventsInfo += '<div class="bio-section">';
            eventsInfo += '<h4>Events:</h4>';
            const clickableEvents = events.map(event => 
                `<a href="/event" class="event-link" data-event="${event.trim()}">${event.trim()}</a>`
            ).join(', ');
            eventsInfo += `<p>${clickableEvents}</p>`;
            eventsInfo += '</div>';
        }
        
        // Hide the old family sections since we're using the new approach
        this.guessTextFamily.classList.add('hidden');
        
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
                    <h4>Overview:</h4>
                    <p>${overview}</p>
                </div>
            `;
        }
        
        // Display image, name, overview, biographical info, family info, businesses, and events in the first element
        this.guessText.innerHTML = `
            ${imageHtml}
            <div class="name-box">
                <strong>${name}</strong>
            </div>
            ${overviewInfo}
            ${bioInfo}
            ${familyInfo}
            ${businessesInfo}
            ${eventsInfo}
        `;
        
        // Hide the separate overview section since we're including it in the main content
        const guessTextOverview = document.getElementById('guessTextOverview');
        guessTextOverview.style.display = 'none';
        
        // Add event listeners for clickable parent names
        this.setupClickableNames();
        
        // Add event listeners for city links
        this.setupCityLinks();
        
        // Add event listeners for business links
        this.setupBusinessLinks();
        
        // Add event listeners for event links
        this.setupEventLinks();
        
        // Initialize map if coordinates are available
        if (coordinates && coordinates !== null) {
            try {
                const birthCoords = coordinates.birthplace ? {
                    lat: coordinates.birthplace.lat,
                    lng: coordinates.birthplace.lng
                } : null;
                const deathCoords = coordinates.deathplace ? {
                    lat: coordinates.deathplace.lat,
                    lng: coordinates.deathplace.lng
                } : null;
                const residenceCoords = coordinates.residence && (!dateOfDeath || dateOfDeath.toLowerCase() === 'n/a' || dateOfDeath.toLowerCase() === 'alive' || dateOfDeath.toLowerCase() === 'still alive') ? {
                    lat: coordinates.residence.lat,
                    lng: coordinates.residence.lng
                } : null;
                const burialCoords = coordinates.burial && dateOfDeath && dateOfDeath.toLowerCase() !== 'n/a' && dateOfDeath.toLowerCase() !== 'alive' && dateOfDeath.toLowerCase() !== 'still alive' ? {
                    lat: coordinates.burial.lat,
                    lng: coordinates.burial.lng
                } : null;
                
                // Show the map container
                if (this.mapEl) {
                    this.mapEl.style.display = 'block';
                    this.mapEl.style.height = '400px';
                    this.mapEl.style.width = '100%';
                    this.mapEl.style.marginTop = '15px';
                    this.mapEl.style.borderRadius = '10px';
                    this.mapEl.style.border = '1px solid #bae6fd';
                }
                
                // Initialize the map
                this.initMap(birthCoords, deathCoords, residenceCoords, burialCoords);
            } catch (e) {
                // Error parsing coordinates
            }
        } else {
            // Hide the map container if no coordinates
            if (this.mapEl) {
                this.mapEl.style.display = 'none';
            }
        }
        
        // Display reasoning in the second element
        this.guessTextReasoning.innerHTML = `
            <div class="reasoning-box">
                ${reasoning}
            </div>
        `;
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

    initMap(birthCoords, deathCoords, residenceCoords = null, burialCoords = null) {
        console.log('initMap called with coords:', { birthCoords, deathCoords, residenceCoords, burialCoords });
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
            zoom: 2,
            center: { lat: 20, lng: 0 },
            mapTypeId: 'terrain'
        };
        this.map = new google.maps.Map(this.mapEl, mapOptions);

        const bounds = new google.maps.LatLngBounds();
        let markerCount = 0;
        let coordsAreIdentical = false;

        if (birthCoords) {
            const birthMarker = new google.maps.Marker({
                position: birthCoords,
                map: this.map,
                title: `Birth Place`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">B</text>
                        </svg>
                    `)
                }
            });
            bounds.extend(birthMarker.getPosition());
            markerCount++;
        }

        if (deathCoords) {
            const deathMarker = new google.maps.Marker({
                position: deathCoords,
                map: this.map,
                title: `Death Place`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">D</text>
                        </svg>
                    `)
                }
            });
            bounds.extend(deathMarker.getPosition());
            markerCount++;
        }

        if (residenceCoords) {
            const residenceMarker = new google.maps.Marker({
                position: residenceCoords,
                map: this.map,
                title: `Residence`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">R</text>
                        </svg>
                    `)
                }
            });
            bounds.extend(residenceMarker.getPosition());
            markerCount++;
        }

        if (burialCoords) {
            const burialMarker = new google.maps.Marker({
                position: burialCoords,
                map: this.map,
                title: `Burial Place`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#8B5CF6" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">✝</text>
                        </svg>
                    `)
                }
            });
            bounds.extend(burialMarker.getPosition());
            markerCount++;
        }

        // Check for the edge case of two identical coordinates
        if (birthCoords && deathCoords && 
            birthCoords.lat === deathCoords.lat && 
            birthCoords.lng === deathCoords.lng) {
            coordsAreIdentical = true;
        }

        if (markerCount > 1 && !coordsAreIdentical) {
            // If there are two distinct markers, fit them all
            this.map.fitBounds(bounds);
        } else if (markerCount > 0) {
            // If there is only one marker, or two identical markers, center on it and use fixed zoom
            this.map.setCenter(bounds.getCenter());
            this.map.setZoom(10);
        }
        // If markerCount is 0, do nothing.
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    calculateZoomFromArea(areaInSquareMiles) {
        console.log('calculateZoomFromArea called with:', areaInSquareMiles);
        if (!areaInSquareMiles || isNaN(areaInSquareMiles) || areaInSquareMiles <= 0) {
            console.log('Using default zoom 3');
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
        const finalZoom = Math.max(1, Math.min(15, Math.round(zoomLevel)));
        console.log('Calculated zoom level:', finalZoom, 'from area:', areaInSquareMiles);
        return finalZoom;
    }

    // Allow starting a new game even during an active session
    startNewGameFromButton() {
        // Reset current session and start fresh
        this.currentSessionId = null;
        this.startNewGame();
    }

    setupClickableNames() {
        // Add event listeners to all clickable names
        const clickableNames = document.querySelectorAll('.clickable-name');
        clickableNames.forEach(nameElement => {
            nameElement.addEventListener('click', (e) => {
                e.preventDefault();
                const personName = nameElement.getAttribute('data-name');
                if (personName) {
                    // Clear the input and start a new search for this person
                    this.userInput.value = personName;
                    this.startNewGame();
                }
            });
        });
    }

    setupCityLinks() {
        // Add event listeners to all city links
        const cityLinks = document.querySelectorAll('.city-link');
        cityLinks.forEach(linkElement => {
            linkElement.addEventListener('click', (e) => {
                e.preventDefault();
                const cityName = linkElement.getAttribute('data-city');
                if (cityName) {
                    // Store the city name in localStorage for the city game to use
                    localStorage.setItem('citySearchFromPerson', cityName);
                    // Navigate to the city game
                    window.location.href = '/city';
                }
            });
        });
    }

    setupBusinessLinks() {
        // Add event listeners to all business links
        const businessLinks = document.querySelectorAll('.business-link');
        businessLinks.forEach(linkElement => {
            linkElement.addEventListener('click', (e) => {
                e.preventDefault();
                const businessName = linkElement.getAttribute('data-business');
                if (businessName) {
                    // Store the business name in localStorage for the business game to use
                    localStorage.setItem('businessSearchFromPerson', businessName);
                    // Navigate to the business game
                    window.location.href = '/business';
                }
            });
        });
    }

    setupEventLinks() {
        // Add event listeners to all event links
        const eventLinks = document.querySelectorAll('.event-link');
        eventLinks.forEach(linkElement => {
            linkElement.addEventListener('click', (e) => {
                e.preventDefault();
                const eventName = linkElement.getAttribute('data-event');
                if (eventName) {
                    // Store the event name in localStorage for the event game to use
                    localStorage.setItem('eventSearchFromPerson', eventName);
                    // Navigate to the event game
                    window.location.href = '/event';
                }
            });
        });
    }

    checkForUrlParameters() {
        // Check if there's a person name stored in localStorage from the event game
        const personFromEvent = localStorage.getItem('personSearchFromEvent');
        
        if (personFromEvent) {
            // Clear the stored value
            localStorage.removeItem('personSearchFromEvent');
            // Set the input field with the person name
            if (this.userInput) {
                this.userInput.value = personFromEvent;
                // Automatically start the search after a short delay to ensure everything is loaded
                setTimeout(() => {
                    this.startNewGame();
                }, 500);
            }
        } else {
            // Check if there's a person name stored in localStorage from the invention game
            const personFromInvention = localStorage.getItem('personSearchFromInvention');
            
            if (personFromInvention) {
                // Clear the stored value
                localStorage.removeItem('personSearchFromInvention');
                // Set the input field with the person name
                if (this.userInput) {
                    this.userInput.value = personFromInvention;
                    // Automatically start the search after a short delay to ensure everything is loaded
                    setTimeout(() => {
                        this.startNewGame();
                    }, 500);
                }
            } else {
                // Check if there's a person name stored in localStorage from the business game
                const personFromBusiness = localStorage.getItem('personSearchFromBusiness');
                
                if (personFromBusiness) {
                    // Clear the stored value
                    localStorage.removeItem('personSearchFromBusiness');
                    // Set the input field with the person name
                    if (this.userInput) {
                        this.userInput.value = personFromBusiness;
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

    displayGuessOldFormat(guess) {
        // Safety check
        if (guess === null || guess === undefined) {
            this.showError('No guess data received');
            return;
        }
        
        // Fallback method for old text format parsing
        if (typeof guess === 'string' && guess.includes('NAME:') && guess.includes('REASONING:')) {
            const lines = guess.split('\n');
            let name = '';
            let dateOfBirth = '';
            let placeOfBirth = '';
            let dateOfDeath = '';
            let placeOfDeath = '';
            let parents = '';
            let siblings = '';
            let spouse = '';
            let children = '';
            let imageUrl = '';
            let wikipediaUrl = '';
            let coordinates = '';
            let reasoning = '';
            
            for (const line of lines) {
                if (line.startsWith('NAME:')) {
                    name = line.replace('NAME:', '').trim();
                } else if (line.startsWith('DATE OF BIRTH:')) {
                    dateOfBirth = line.replace('DATE OF BIRTH:', '').trim();
                } else if (line.startsWith('PLACE OF BIRTH:')) {
                    placeOfBirth = line.replace('PLACE OF BIRTH:', '').trim();
                } else if (line.startsWith('DATE OF DEATH:')) {
                    dateOfDeath = line.replace('DATE OF DEATH:', '').trim();
                } else if (line.startsWith('PLACE OF DEATH:')) {
                    placeOfDeath = line.replace('PLACE OF DEATH:', '').trim();
                } else if (line.startsWith('PARENTS:')) {
                    parents = line.replace('PARENTS:', '').trim();
                } else if (line.startsWith('SIBLINGS:')) {
                    siblings = line.replace('SIBLINGS:', '').trim();
                } else if (line.startsWith('SPOUSE:')) {
                    spouse = line.replace('SPOUSE:', '').trim();
                } else if (line.startsWith('CHILDREN:')) {
                    children = line.replace('CHILDREN:', '').trim();
                } else if (line.startsWith('IMAGE_URL:')) {
                    imageUrl = line.replace('IMAGE_URL:', '').trim();
                } else if (line.startsWith('WIKIPEDIA_URL:')) {
                    wikipediaUrl = line.replace('WIKIPEDIA_URL:', '').trim();
                } else if (line.startsWith('COORDINATES:')) {
                    coordinates = line.replace('COORDINATES:', '').trim();
                } else if (line.startsWith('REASONING:')) {
                    reasoning = line.replace('REASONING:', '').trim();
                }
            }
            
            // Build biographical information
            let bioInfo = '';
            if (dateOfBirth || placeOfBirth || dateOfDeath || placeOfDeath || wikipediaUrl) {
                bioInfo += '<div class="bio-section">';
                bioInfo += '<h4>Biographical Information:</h4>';
                if (dateOfBirth) bioInfo += `<p><strong>Born:</strong> ${dateOfBirth}</p>`;
                if (placeOfBirth) bioInfo += `<p><strong>Birthplace:</strong> <a href="/city" class="city-link" data-city="${placeOfBirth}">${placeOfBirth}</a></p>`;
                if (dateOfDeath && dateOfDeath.toLowerCase() !== 'n/a' && dateOfDeath.toLowerCase() !== 'alive' && dateOfDeath.toLowerCase() !== 'still alive') {
                    bioInfo += `<p><strong>Died:</strong> ${dateOfDeath}</p>`;
                }
                if (placeOfDeath && placeOfDeath.toLowerCase() !== 'n/a' && placeOfDeath.toLowerCase() !== 'alive' && placeOfDeath.toLowerCase() !== 'still alive') {
                    bioInfo += `<p><strong>Place of Death:</strong> <a href="/city" class="city-link" data-city="${placeOfDeath}">${placeOfDeath}</a></p>`;
                }
                if (wikipediaUrl && wikipediaUrl.toLowerCase() !== 'n/a') {
                    bioInfo += `<p><strong>Wikipedia:</strong> <a href="${wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wikipedia-link">Page</a></p>`;
                }
                bioInfo += '</div>';
            }
            
            // Handle Family Info (old format - strings)
            this.guessTextFamily.classList.remove('hidden');
            this.parentsSection.classList.add('hidden');
            this.siblingsSection.classList.add('hidden');
            this.spouseSection.classList.add('hidden');
            this.childrenSection.classList.add('hidden');

            if (parents && parents.toLowerCase() !== 'n/a' && parents !== '') {
                this.parentsList.textContent = parents;
                this.parentsSection.classList.remove('hidden');
            }
            if (siblings && siblings.toLowerCase() !== 'n/a' && siblings !== '') {
                this.siblingsList.textContent = siblings;
                this.siblingsSection.classList.remove('hidden');
            }
            if (spouse && spouse.toLowerCase() !== 'n/a' && spouse !== '') {
                this.spouseList.textContent = spouse;
                this.spouseSection.classList.remove('hidden');
            }
            if (children && children.toLowerCase() !== 'n/a' && children !== '') {
                this.childrenList.textContent = children;
                this.childrenSection.classList.remove('hidden');
            }
            
            // Build image HTML if available
            let imageHtml = '';
            if (imageUrl && imageUrl.toLowerCase() !== 'n/a') {
                let proxyUrl = '';
                if (imageUrl && imageUrl.includes('upload.wikimedia.org')) {
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
            
            // Display image, name, and biographical info
            this.guessText.innerHTML = `
                ${imageHtml}
                <div class="name-box">
                    <strong>${name}</strong>
                </div>
                ${bioInfo}
            `;
            
            // Hide overview section for old format (no overview data available)
            const guessTextOverview = document.getElementById('guessTextOverview');
            guessTextOverview.style.display = 'none';
            
            // Initialize map if coordinates are available (old format)
            if (coordinates && coordinates !== '') {
                try {
                    const coordsData = JSON.parse(coordinates);
                    const birthCoords = coordsData.birthplace ? {
                        lat: coordsData.birthplace.lat,
                        lng: coordsData.birthplace.lng
                    } : null;
                    const deathCoords = coordsData.deathplace ? {
                        lat: coordsData.deathplace.lat,
                        lng: coordsData.deathplace.lng
                    } : null;
                    const residenceCoords = coordsData.residence && (!dateOfDeath || dateOfDeath.toLowerCase() === 'n/a' || dateOfDeath.toLowerCase() === 'alive' || dateOfDeath.toLowerCase() === 'still alive') ? {
                        lat: coordsData.residence.lat,
                        lng: coordsData.residence.lng
                    } : null;
                    const burialCoords = coordsData.burial && dateOfDeath && dateOfDeath.toLowerCase() !== 'n/a' && dateOfDeath.toLowerCase() !== 'alive' && dateOfDeath.toLowerCase() !== 'still alive' ? {
                        lat: coordsData.burial.lat,
                        lng: coordsData.burial.lng
                    } : null;
                    
                    // Show the map container
                    if (this.mapEl) {
                        this.mapEl.style.display = 'block';
                        this.mapEl.style.height = '400px';
                        this.mapEl.style.width = '100%';
                        this.mapEl.style.marginTop = '15px';
                        this.mapEl.style.borderRadius = '10px';
                        this.mapEl.style.border = '1px solid #bae6fd';
                    }
                    
                    // Initialize the map
                    this.initMap(birthCoords, deathCoords, residenceCoords, burialCoords);
                } catch (e) {
                    // Error parsing coordinates
                }
            } else {
                // Hide the map container if no coordinates
                if (this.mapEl) {
                    this.mapEl.style.display = 'none';
                }
            }
            
            // Display reasoning
            this.guessTextReasoning.innerHTML = `
                <div class="reasoning-box">
                    ${reasoning}
                </div>
            `;
            
            // Add event listeners for clickable names (in case any were added)
            this.setupClickableNames();
            
            // Add event listeners for city links
            this.setupCityLinks();
            
            // Add event listeners for business links
            this.setupBusinessLinks();
            
            // Add event listeners for event links
            this.setupEventLinks();
        } else {
            // Fallback for old format or error messages
            this.guessText.textContent = guess;
            this.guessTextFamily.classList.add('hidden');
            this.guessTextReasoning.textContent = '';
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FamousPersonGame();
});

// Add some helpful keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Enter key submission is now handled within the game class
    
    // Escape to dismiss errors
    if (e.key === 'Escape') {
        const errorSection = document.getElementById('errorSection');
        if (errorSection && !errorSection.classList.contains('hidden')) {
            document.getElementById('dismissErrorBtn').click();
        }
    }
});
