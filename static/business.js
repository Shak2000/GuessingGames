class BusinessGame {
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
        this.mapEl = document.getElementById('map');
        this.correctBtn = document.getElementById('correctBtn');
        this.incorrectBtn = document.getElementById('incorrectBtn');
        
        // Business image elements
        this.businessImageContainer = document.getElementById('businessImageContainer');
        this.businessImage = document.getElementById('businessImage');
        
        // Business details sections
        this.businessDetails = document.getElementById('businessDetails');
        this.basicInfoSection = document.getElementById('basicInfoSection');
        this.basicInfoContent = document.getElementById('basicInfoContent');
        this.financialInfoSection = document.getElementById('financialInfoSection');
        this.financialInfoContent = document.getElementById('financialInfoContent');
        this.leadershipSection = document.getElementById('leadershipSection');
        this.leadershipContent = document.getElementById('leadershipContent');
        this.productsServicesSection = document.getElementById('productsServicesSection');
        this.productsServicesContent = document.getElementById('productsServicesContent');
        this.moreInfoSection = document.getElementById('moreInfoSection');
        this.moreInfoContent = document.getElementById('moreInfoContent');
        
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
            this.showError('Please enter some information about the business.');
            return;
        }

        // Disable button and show loading
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Thinking...';
        this.hideAllSections();
        this.showLoading();

        try {
            const response = await fetch('/api/start-business-guess', {
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
            console.error('Error starting business game:', error);
            this.hideLoading();
            this.showError(`Failed to start game: ${error.message}`);
        } finally {
            // Re-enable button and hide loading
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Submit Information';
        }
    }

    async startNewGameFromButton() {
        await this.startNewGame();
    }

    displayGuess(guess) {
        if (!guess) {
            this.showError('No guess data received');
            return;
        }

        // Build overview section
        let overviewInfo = '';
        if (guess.overview) {
            overviewInfo = `
                <div class="bio-section overview-section">
                    <h4>Overview:</h4>
                    <p>${guess.overview}</p>
                </div>
            `;
        }

        // Display business name and overview
        this.guessText.innerHTML = `
            <div class="name-box">${guess.name}</div>
            ${overviewInfo}
        `;
        
        // Hide the separate overview section since we're including it in the main content
        this.guessTextOverview.style.display = 'none';

        // Display business image if available
        if (guess.image_url) {
            this.businessImage.src = guess.image_url;
            this.businessImageContainer.style.display = 'block';
        } else {
            this.businessImageContainer.style.display = 'none';
        }

        // Display business details
        this.displayBusinessDetails(guess);

        // Display reasoning
        if (guess.reasoning) {
            this.guessTextReasoning.innerHTML = `<div class="reasoning-box">${guess.reasoning}</div>`;
        }

        // Display map if coordinates are available
        if (guess.coordinates) {
            this.displayMap(guess.coordinates, guess.current_headquarters);
        } else {
            this.mapEl.style.display = 'none';
        }
    }

    displayBusinessDetails(guess) {
        // Basic Information
        let basicInfo = '';
        if (this.shouldDisplay(guess.type)) basicInfo += `<p><strong>Type:</strong> ${guess.type}</p>`;
        if (this.shouldDisplay(guess.current_status)) basicInfo += `<p><strong>Status:</strong> ${guess.current_status}</p>`;
        if (this.shouldDisplay(guess.industry)) basicInfo += `<p><strong>Industry:</strong> ${this.formatListWithSpaces(guess.industry)}</p>`;
        if (this.shouldDisplay(guess.year_founded)) basicInfo += `<p><strong>Founded:</strong> ${guess.year_founded}</p>`;
        if (this.shouldDisplay(guess.city_founded)) basicInfo += `<p><strong>Founded in:</strong> ${guess.city_founded}</p>`;
        if (this.shouldDisplay(guess.founders)) {
            basicInfo += `<p><strong>Founders:</strong> ${this.formatListWithSpaces(guess.founders)}</p>`;
        }
        if (this.shouldDisplay(guess.current_headquarters)) basicInfo += `<p><strong>Headquarters:</strong> ${guess.current_headquarters}</p>`;
        if (this.shouldDisplay(guess.areas_served)) basicInfo += `<p><strong>Areas Served:</strong> ${this.formatListWithSpaces(guess.areas_served)}</p>`;
        if (this.shouldDisplay(guess.number_of_locations)) basicInfo += `<p><strong>Number of Locations:</strong> ${this.formatNumberWithCommas(guess.number_of_locations)}</p>`;
        if (this.shouldDisplay(guess.number_of_employees)) basicInfo += `<p><strong>Employees:</strong> ${this.formatNumberWithCommas(guess.number_of_employees)}</p>`;
        if (this.shouldDisplay(guess.year_defunct)) basicInfo += `<p><strong>Year Defunct:</strong> ${guess.year_defunct}</p>`;
        if (this.shouldDisplay(guess.fate)) basicInfo += `<p><strong>Fate:</strong> ${guess.fate}</p>`;
        if (this.shouldDisplay(guess.successors)) basicInfo += `<p><strong>Successors:</strong> ${this.formatListWithSpaces(guess.successors)}</p>`;
        if (this.shouldDisplay(guess.parent)) basicInfo += `<p><strong>Parent Company:</strong> ${guess.parent}</p>`;
        if (this.shouldDisplay(guess.predecessors)) basicInfo += `<p><strong>Predecessors:</strong> ${this.formatListWithSpaces(guess.predecessors)}</p>`;
        if (this.shouldDisplay(guess.subsidiaries)) basicInfo += `<p><strong>Subsidiaries:</strong> ${this.formatListWithSpaces(guess.subsidiaries)}</p>`;
        
        if (basicInfo) {
            this.basicInfoContent.innerHTML = basicInfo;
            this.basicInfoSection.classList.remove('hidden');
        } else {
            this.basicInfoSection.classList.add('hidden');
        }

        // Financial Information
        let financialInfo = '';
        if (this.shouldDisplay(guess.stock_exchange)) {
            financialInfo += `<p><strong>Stock Exchange:</strong> ${guess.stock_exchange}</p>`;
        }
        if (this.shouldDisplay(guess.ticker)) {
            financialInfo += `<p><strong>Ticker:</strong> ${guess.ticker}</p>`;
        }
        if (this.shouldDisplay(guess.revenue)) financialInfo += `<p><strong>Revenue:</strong> ${this.formatNumberWithCommas(guess.revenue)}</p>`;
        if (this.shouldDisplay(guess.operating_income)) financialInfo += `<p><strong>Operating Income:</strong> ${this.formatNumberWithCommas(guess.operating_income)}</p>`;
        if (this.shouldDisplay(guess.net_income)) financialInfo += `<p><strong>Net Income:</strong> ${this.formatNumberWithCommas(guess.net_income)}</p>`;
        if (this.shouldDisplay(guess.total_assets)) financialInfo += `<p><strong>Total Assets:</strong> ${this.formatNumberWithCommas(guess.total_assets)}</p>`;
        if (this.shouldDisplay(guess.total_equity)) financialInfo += `<p><strong>Total Equity:</strong> ${this.formatNumberWithCommas(guess.total_equity)}</p>`;
        if (this.shouldDisplay(guess.owner)) {
            financialInfo += `<p><strong>Owner:</strong> ${guess.owner}`;
            if (this.shouldDisplay(guess.owner_equity_percentage)) {
                financialInfo += ` (${this.formatOwnershipPercentage(guess.owner_equity_percentage)})`;
            }
            financialInfo += `</p>`;
        }
        if (financialInfo) {
            this.financialInfoContent.innerHTML = financialInfo;
            this.financialInfoSection.classList.remove('hidden');
        } else {
            this.financialInfoSection.classList.add('hidden');
        }

        // Leadership
        let leadershipInfo = '';
        if (this.shouldDisplay(guess.ceo)) leadershipInfo += `<p><strong>CEO:</strong> ${guess.ceo}</p>`;
        if (this.shouldDisplay(guess.chairman)) leadershipInfo += `<p><strong>Chairman:</strong> ${guess.chairman}</p>`;
        
        if (leadershipInfo) {
            this.leadershipContent.innerHTML = leadershipInfo;
            this.leadershipSection.classList.remove('hidden');
        } else {
            this.leadershipSection.classList.add('hidden');
        }

        // Products & Services
        let productsServicesInfo = '';
        if (this.shouldDisplay(guess.products)) {
            productsServicesInfo += `<p><strong>Products:</strong> ${this.formatListWithSpaces(guess.products)}</p>`;
        }
        if (this.shouldDisplay(guess.services)) {
            productsServicesInfo += `<p><strong>Services:</strong> ${this.formatListWithSpaces(guess.services)}</p>`;
        }
        if (this.shouldDisplay(guess.previous_names)) {
            productsServicesInfo += `<p><strong>Previous Names:</strong> ${this.formatListWithSpaces(guess.previous_names)}</p>`;
        }
        
        if (productsServicesInfo) {
            this.productsServicesContent.innerHTML = productsServicesInfo;
            this.productsServicesSection.classList.remove('hidden');
        } else {
            this.productsServicesSection.classList.add('hidden');
        }

        // More Information
        let moreInfoContent = '';
        if (this.shouldDisplay(guess.website)) {
            moreInfoContent += `<p><strong>Website:</strong> <a href="${guess.website}" target="_blank">Visit Website</a></p>`;
        }
        if (this.shouldDisplay(guess.wikipedia_url)) {
            moreInfoContent += `<p><strong>Wikipedia:</strong> <a href="${guess.wikipedia_url}" target="_blank">View Wikipedia Page</a></p>`;
        }
        
        if (moreInfoContent) {
            this.moreInfoContent.innerHTML = moreInfoContent;
            this.moreInfoSection.classList.remove('hidden');
        } else {
            this.moreInfoSection.classList.add('hidden');
        }
    }

    displayMap(coordinates, locationName) {
        if (!this.mapsApiKey) {
            console.log('Maps API key not available');
            return;
        }

        // Wait for Google Maps to load
        const checkMapsLoaded = () => {
            if (typeof google !== 'undefined' && google.maps) {
                this.initializeMap(coordinates, locationName);
            } else {
                setTimeout(checkMapsLoaded, 100);
            }
        };
        checkMapsLoaded();
    }

    initializeMap(coordinates, locationName) {
        try {
            const mapOptions = {
                zoom: 10,
                center: { lat: coordinates.lat, lng: coordinates.lng },
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            this.map = new google.maps.Map(this.mapEl, mapOptions);

            // Add marker
            const marker = new google.maps.Marker({
                position: { lat: coordinates.lat, lng: coordinates.lng },
                map: this.map,
                title: locationName || 'Business Location'
            });

            this.mapEl.style.display = 'block';
        } catch (error) {
            console.error('Error initializing map:', error);
            this.mapEl.style.display = 'none';
        }
    }

    async submitFeedback(isCorrect) {
        if (!this.currentSessionId) {
            this.showError('No active session');
            return;
        }

        this.hideAllSections();
        this.showLoading();

        try {
            const response = await fetch('/api/submit-business-feedback', {
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
            this.hideLoading();

            if (data.game_over) {
                this.showVictory();
            } else if (data.guess) {
                this.displayGuess(data.guess);
                this.showGameSection();
            } else {
                this.showError('Unexpected response from server');
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.hideLoading();
            this.showError(`Failed to submit feedback: ${error.message}`);
        }
    }

    showLoading() {
        this.loadingSection.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingSection.classList.add('hidden');
    }

    showGameSection() {
        this.gameSection.classList.remove('hidden');
    }

    hideGameSection() {
        this.gameSection.classList.add('hidden');
    }

    showVictory() {
        this.victorySection.classList.remove('hidden');
    }

    hideVictory() {
        this.victorySection.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorSection.classList.remove('hidden');
    }

    hideError() {
        this.errorSection.classList.add('hidden');
    }

    hideAllSections() {
        this.hideGameSection();
        this.hideVictory();
        this.hideError();
        this.hideLoading();
    }

    resetGame() {
        this.currentSessionId = null;
        this.userInput.value = '';
        this.hideAllSections();
        
        // Reset button state
        this.submitBtn.disabled = false;
        this.submitBtn.textContent = 'Submit Information';
        
        // Clear previous guess data
        this.guessText.innerHTML = '';
        this.guessTextOverview.innerHTML = '';
        this.guessTextReasoning.innerHTML = '';
        this.businessImageContainer.style.display = 'none';
        this.mapEl.style.display = 'none';
        
        // Hide all business detail sections
        this.basicInfoSection.classList.add('hidden');
        this.financialInfoSection.classList.add('hidden');
        this.leadershipSection.classList.add('hidden');
        this.productsServicesSection.classList.add('hidden');
        this.moreInfoSection.classList.add('hidden');
        
        // Clear content
        this.basicInfoContent.innerHTML = '';
        this.financialInfoContent.innerHTML = '';
        this.leadershipContent.innerHTML = '';
        this.productsServicesContent.innerHTML = '';
        this.moreInfoContent.innerHTML = '';
        
        // Reset map
        if (this.map) {
            this.map = null;
        }
    }

    // Helper function to check if a value should be displayed
    shouldDisplay(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed !== '' && trimmed !== 'N/A' && trimmed !== 'null';
        }
        if (Array.isArray(value)) {
            return value.length > 0 && value.some(item => this.shouldDisplay(item));
        }
        return true;
    }

    // Formatting functions
    formatNumberWithCommas(number) {
        if (!number || isNaN(number)) return number;
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    formatListWithSpaces(list) {
        if (!Array.isArray(list)) {
            // If it's a string, split by comma and rejoin with proper spacing
            if (typeof list === 'string') {
                return list.split(',').map(item => item.trim()).join(', ');
            }
            return list;
        }
        // For arrays, join with proper spacing
        return list.join(', ');
    }

    formatOwnershipPercentage(percentage) {
        if (!percentage) return percentage;
        // Remove any existing % sign and add it back
        const cleanPercentage = percentage.toString().replace('%', '');
        return `${cleanPercentage}%`;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BusinessGame();
});