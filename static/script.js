class FamousPersonGame {
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
        
        // Debug: Check if elements are found
        console.log('Elements found:', {
            userInput: !!this.userInput,
            submitBtn: !!this.submitBtn,
            gameSection: !!this.gameSection,
            guessText: !!this.guessText,
            guessTextReasoning: !!this.guessTextReasoning,
            correctBtn: !!this.correctBtn,
            incorrectBtn: !!this.incorrectBtn
        });
    }

    attachEventListeners() {
        console.log('Attaching event listeners...');
        
        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', () => {
                console.log('Submit button clicked!');
                this.startNewGameFromButton();
            });
        } else {
            console.error('Submit button not found!');
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
        
        // Allow Enter key to submit
        if (this.userInput) {
            this.userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    console.log('Ctrl+Enter pressed!');
                    this.startNewGameFromButton();
                }
            });
        }
        
        console.log('Event listeners attached successfully');
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
            console.log('Google Maps script loaded successfully');
        } catch (error) {
            console.error("Failed to load Google Maps script:", error);
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
            console.log('Starting new game with input:', inputText);
            const response = await fetch('/api/start-guess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: inputText })
            });

            console.log('Response status:', response.status);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to start game');
            }

            const data = await response.json();
            console.log('Response data:', data);
            this.currentSessionId = data.session_id;
            this.displayGuess(data.guess);
            this.showGameSection();

        } catch (error) {
            console.error('Error starting game:', error);
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
                this.displayGuess(data.guess);
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
        // Format the guess response to display name, biographical info, and reasoning
        if (guess.includes('NAME:') && guess.includes('REASONING:')) {
            const lines = guess.split('\n');
            let name = '';
            let dateOfBirth = '';
            let placeOfBirth = '';
            let dateOfDeath = '';
            let placeOfDeath = '';
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
                if (placeOfBirth) bioInfo += `<p><strong>Birthplace:</strong> ${placeOfBirth}</p>`;
                // Only show death information if the person is actually deceased
                if (dateOfDeath && dateOfDeath.toLowerCase() !== 'n/a' && dateOfDeath.toLowerCase() !== 'alive' && dateOfDeath.toLowerCase() !== 'still alive') {
                    bioInfo += `<p><strong>Died:</strong> ${dateOfDeath}</p>`;
                }
                if (placeOfDeath && placeOfDeath.toLowerCase() !== 'n/a' && placeOfDeath.toLowerCase() !== 'alive' && placeOfDeath.toLowerCase() !== 'still alive') {
                    bioInfo += `<p><strong>Place of Death:</strong> ${placeOfDeath}</p>`;
                }
                // Add Wikipedia link if available
                if (wikipediaUrl && wikipediaUrl.toLowerCase() !== 'n/a') {
                    bioInfo += `<p><strong>Wikipedia:</strong> <a href="${wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wikipedia-link">Page</a></p>`;
                }
                bioInfo += '</div>';
            }
            
            // Build image HTML if available
            let imageHtml = '';
            if (imageUrl && imageUrl.toLowerCase() !== 'n/a') {
                // Use a CORS proxy for Wikipedia images
                let proxyUrl = '';
                if (imageUrl.includes('upload.wikimedia.org')) {
                    // Use images.weserv.nl as a CORS proxy for Wikipedia images
                    proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=200&h=200&fit=cover`;
                } else {
                    proxyUrl = imageUrl;
                }
                
                imageHtml = `
                    <div class="person-image-container">
                        <img src="${proxyUrl}" alt="Photo of ${name}" class="person-image" onerror="console.log('Image failed to load:', this.src); this.style.display='none'">
                    </div>
                `;
            }
            
            // Display image, name, and biographical info in the first element
            this.guessText.innerHTML = `
                ${imageHtml}
                <div class="name-box">
                    <strong>${name}</strong>
                </div>
                ${bioInfo}
            `;
            
            // Initialize map if coordinates are available
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
                    
                    // Show the map container
                    if (this.mapEl) {
                        this.mapEl.style.display = 'block';
                        this.mapEl.style.height = '300px';
                        this.mapEl.style.width = '100%';
                        this.mapEl.style.marginTop = '15px';
                        this.mapEl.style.borderRadius = '10px';
                        this.mapEl.style.border = '1px solid #bae6fd';
                    }
                    
                    // Initialize the map
                    this.initMap(birthCoords, deathCoords);
                } catch (e) {
                    console.error('Error parsing coordinates:', e);
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
        } else {
            // Fallback for old format or error messages
            this.guessText.textContent = guess;
            this.guessTextReasoning.textContent = '';
        }
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

    initMap(birthCoords, deathCoords) {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.error("Google Maps script not loaded yet.");
            if (this.mapEl) {
                this.mapEl.innerHTML = '<p class="text-center text-red-500">Map could not be loaded.</p>';
            }
            return;
        }

        if (!this.mapEl) {
            console.error("Map element not found");
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
            // If there is only one marker, or two identical markers
            this.map.setCenter(bounds.getCenter());
            this.map.setZoom(5);
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

    // Allow starting a new game even during an active session
    startNewGameFromButton() {
        // Reset current session and start fresh
        this.currentSessionId = null;
        this.startNewGame();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FamousPersonGame();
});

// Add some helpful keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
        }
    }
    
    // Escape to dismiss errors
    if (e.key === 'Escape') {
        const errorSection = document.getElementById('errorSection');
        if (errorSection && !errorSection.classList.contains('hidden')) {
            document.getElementById('dismissErrorBtn').click();
        }
    }
});
