class CityGame {
    constructor() {
        this.currentSessionId = null;
        this.initializeElements();
        this.attachEventListeners();
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
        
        // Allow Enter key to submit
        if (this.userInput) {
            this.userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.startNewGameFromButton();
                }
            });
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

    displayJsonCityGuess(data) {
        // Extract data from JSON
        const name = data.name || 'Unknown';
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
        const yearFounded = data.year_founded || '';
        const wikipediaUrl = data.wikipedia_url || '';
        const imageUrl = data.image_url || '';
        const reasoning = data.reasoning || '';
        const overview = data.overview || '';
        
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
        
        if (adminDivisions.length > 0 || country || population || yearFounded || wikipediaUrl) {
            adminInfo += '<div class="bio-section">';
            adminInfo += '<h4>City Information:</h4>';
            if (adminDivisions.length > 0) {
                adminInfo += adminDivisions.map(div => `<p>${div}</p>`).join('');
            }
            if (country) adminInfo += `<p><strong>Country:</strong> ${country}</p>`;
            if (population) adminInfo += `<p><strong>Population:</strong> ${population}</p>`;
            if (yearFounded) adminInfo += `<p><strong>Year Founded:</strong> ${yearFounded}</p>`;
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
                    <h4>Overview:</h4>
                    <p>${overview}</p>
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
        
        // Initialize map if coordinates are available
        const coordinates = data.coordinates;
        if (coordinates && coordinates !== null) {
            try {
                const cityCoords = {
                    lat: coordinates.lat,
                    lng: coordinates.lng
                };
                
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
                this.initMap(cityCoords);
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
    
    initMap(cityCoords) {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
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
            this.map.setZoom(5);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CityGame();
});