class BusinessGame {
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

        // Setup clickable links
        this.setupClickableLinks();

        // Display reasoning
        if (guess.reasoning) {
            this.guessTextReasoning.innerHTML = `<div class="reasoning-box">${guess.reasoning}</div>`;
        }

        // Display map if coordinates are available
        if (guess.coordinates && (guess.coordinates.founding || guess.coordinates.headquarters)) {
            this.displayMap(guess.coordinates);
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
        if (this.shouldDisplay(guess.city_founded)) {
            basicInfo += `<p><strong>Founded in:</strong> <span class="clickable-city" data-city="${guess.city_founded}">${guess.city_founded}</span></p>`;
        }
        if (this.shouldDisplay(guess.founders)) {
            const clickableFounders = this.formatClickablePersonList(guess.founders);
            basicInfo += `<p><strong>Founders:</strong> ${clickableFounders}</p>`;
        }
        if (this.shouldDisplay(guess.current_headquarters)) {
            basicInfo += `<p><strong>Headquarters:</strong> <span class="clickable-city" data-city="${guess.current_headquarters}">${guess.current_headquarters}</span></p>`;
        }
        if (this.shouldDisplay(guess.areas_served)) basicInfo += `<p><strong>Areas Served:</strong> ${this.formatListWithSpaces(guess.areas_served)}</p>`;
        if (this.shouldDisplay(guess.number_of_locations)) basicInfo += `<p><strong>Number of Locations:</strong> ${this.formatNumberWithCommas(guess.number_of_locations)}</p>`;
        if (this.shouldDisplay(guess.number_of_employees)) basicInfo += `<p><strong>Employees:</strong> ${this.formatNumberWithCommas(guess.number_of_employees)}</p>`;
        if (this.shouldDisplay(guess.year_defunct)) basicInfo += `<p><strong>Year Defunct:</strong> ${guess.year_defunct}</p>`;
        if (this.shouldDisplay(guess.fate)) basicInfo += `<p><strong>Fate:</strong> ${guess.fate}</p>`;
        if (this.shouldDisplay(guess.parent)) basicInfo += `<p><strong>Parent Company:</strong> <span class="clickable-name" data-name="${guess.parent}">${guess.parent}</span></p>`;
        if (this.shouldDisplay(guess.predecessors)) basicInfo += `<p><strong>Predecessors:</strong> ${this.formatClickableList(guess.predecessors)}</p>`;
        if (this.shouldDisplay(guess.subsidiaries)) basicInfo += `<p><strong>Subsidiaries:</strong> ${this.formatClickableList(guess.subsidiaries)}</p>`;
        if (this.shouldDisplay(guess.successors)) basicInfo += `<p><strong>Successors:</strong> ${this.formatClickableList(guess.successors)}</p>`;
        if (this.shouldDisplay(guess.previous_names)) basicInfo += `<p><strong>Previous Names:</strong> ${this.formatListWithSpaces(guess.previous_names)}</p>`;
        
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
            // Format ticker list with spaces after commas
            const tickerDisplay = Array.isArray(guess.ticker) ? guess.ticker.join(', ') : guess.ticker;
            financialInfo += `<p><strong>Ticker:</strong> ${tickerDisplay}</p>`;
        }
        if (this.shouldDisplay(guess.revenue)) financialInfo += `<p><strong>Revenue:</strong> ${this.formatCurrencyWithCommas(guess.revenue)}</p>`;
        if (this.shouldDisplay(guess.operating_income)) financialInfo += `<p><strong>Operating Income:</strong> ${this.formatCurrencyWithCommas(guess.operating_income)}</p>`;
        if (this.shouldDisplay(guess.net_income)) financialInfo += `<p><strong>Net Income:</strong> ${this.formatCurrencyWithCommas(guess.net_income)}</p>`;
        if (this.shouldDisplay(guess.total_assets)) financialInfo += `<p><strong>Total Assets:</strong> ${this.formatCurrencyWithCommas(guess.total_assets)}</p>`;
        if (this.shouldDisplay(guess.total_equity)) financialInfo += `<p><strong>Total Equity:</strong> ${this.formatCurrencyWithCommas(guess.total_equity)}</p>`;
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
        if (this.shouldDisplay(guess.ceo)) {
            leadershipInfo += `<p><strong>CEO:</strong> <span class="clickable-person" data-person="${guess.ceo}">${guess.ceo}</span></p>`;
        }
        if (this.shouldDisplay(guess.chairman)) {
            leadershipInfo += `<p><strong>Chairman:</strong> <span class="clickable-person" data-person="${guess.chairman}">${guess.chairman}</span></p>`;
        }
        
        if (leadershipInfo) {
            this.leadershipContent.innerHTML = leadershipInfo;
            this.leadershipSection.classList.remove('hidden');
        } else {
            this.leadershipSection.classList.add('hidden');
        }

        // Products, Services & Technologies
        let productsServicesInfo = '';
        if (this.shouldDisplay(guess.products)) {
            productsServicesInfo += `<p><strong>Products:</strong> ${this.formatListWithSpaces(guess.products)}</p>`;
        }
        if (this.shouldDisplay(guess.services)) {
            productsServicesInfo += `<p><strong>Services:</strong> ${this.formatListWithSpaces(guess.services)}</p>`;
        }
        if (this.shouldDisplay(guess.technologies)) {
            const clickableTechnologies = guess.technologies.map(technology => 
                `<a href="/invention" class="invention-link" data-invention="${technology.trim()}">${technology.trim()}</a>`
            ).join(', ');
            productsServicesInfo += `<p><strong>Technologies:</strong> ${clickableTechnologies}</p>`;
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
        if (this.shouldDisplay(guess.ticker)) {
            // Handle ticker as array or string
            const tickerValue = Array.isArray(guess.ticker) ? guess.ticker[0] : guess.ticker;
            // Replace . with - for Business Insider URL
            const tickerFormatted = tickerValue.replace('.', '-');
            moreInfoContent += `<p><strong>Business Insider:</strong> <a href="https://markets.businessinsider.com/stocks/${tickerFormatted}-stock" target="_blank">View Stock Information</a></p>`;
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

    displayMap(coordinates) {
        if (!this.mapsApiKey) {
            console.log('Maps API key not available');
            return;
        }

        // Wait for Google Maps to load
        const checkMapsLoaded = () => {
            if (typeof google !== 'undefined' && google.maps) {
                this.initializeMap(coordinates);
            } else {
                setTimeout(checkMapsLoaded, 100);
            }
        };
        checkMapsLoaded();
    }

    initializeMap(coordinates) {
        console.log('initMap called with coords:', coordinates);
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

        // Add founding city marker
        if (coordinates.founding) {
            const foundingMarker = new google.maps.Marker({
                position: coordinates.founding,
                map: this.map,
                title: `Founded in`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">F</text>
                        </svg>
                    `)
                }
            });
            bounds.extend(foundingMarker.getPosition());
            markerCount++;
        }

        // Add headquarters marker
        if (coordinates.headquarters) {
            const headquartersMarker = new google.maps.Marker({
                position: coordinates.headquarters,
                map: this.map,
                title: `Headquarters`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">H</text>
                        </svg>
                    `)
                }
            });
            bounds.extend(headquartersMarker.getPosition());
            markerCount++;
        }

        // Check if coordinates are identical (same city)
        if (coordinates.founding && coordinates.headquarters) {
            const foundingLat = coordinates.founding.lat;
            const foundingLng = coordinates.founding.lng;
            const headquartersLat = coordinates.headquarters.lat;
            const headquartersLng = coordinates.headquarters.lng;
            
            const latDiff = Math.abs(foundingLat - headquartersLat);
            const lngDiff = Math.abs(foundingLng - headquartersLng);
            
            // Consider coordinates identical if they're within 0.01 degrees (~1km)
            if (latDiff < 0.01 && lngDiff < 0.01) {
                coordsAreIdentical = true;
            }
        }

        if (markerCount > 0) {
            this.mapEl.style.display = 'block';
            
            if (markerCount === 1 || coordsAreIdentical) {
                // Single marker or identical coordinates - center on the marker
                const singleMarker = coordinates.founding || coordinates.headquarters;
                this.map.setCenter(singleMarker);
                this.map.setZoom(10);
            } else {
                // Multiple different markers - fit bounds
                this.map.fitBounds(bounds);
            }
        } else {
            this.mapEl.style.display = 'none';
        }
        
        // Set up clickable names for business relationships
        this.setupClickableNames();
    }

    setupClickableNames() {
        // Add event listeners to all clickable names
        const clickableNames = document.querySelectorAll('.clickable-name');
        clickableNames.forEach(nameElement => {
            nameElement.addEventListener('click', (e) => {
                e.preventDefault();
                const companyName = nameElement.getAttribute('data-name');
                if (companyName) {
                    // Clear the input and start a new search for this company
                    this.userInput.value = companyName;
                    this.startNewGame();
                }
            });
        });
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

    formatCurrencyWithCommas(number) {
        if (!number || isNaN(number)) return number;
        return '$' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

    formatClickableList(list) {
        if (!Array.isArray(list)) {
            // If it's a string, split by comma and create clickable elements
            if (typeof list === 'string') {
                return list.split(',').map(item => 
                    `<span class="clickable-name" data-name="${item.trim()}">${item.trim()}</span>`
                ).join(', ');
            }
            return list;
        }
        // For arrays, create clickable elements
        return list.map(item => 
            `<span class="clickable-name" data-name="${item.trim()}">${item.trim()}</span>`
        ).join(', ');
    }

    formatClickablePersonList(list) {
        if (!Array.isArray(list)) {
            // If it's a string, split by comma and create clickable person elements
            if (typeof list === 'string') {
                return list.split(',').map(item => 
                    `<span class="clickable-person" data-person="${item.trim()}">${item.trim()}</span>`
                ).join(', ');
            }
            return list;
        }
        // For arrays, create clickable person elements
        return list.map(item => 
            `<span class="clickable-person" data-person="${item.trim()}">${item.trim()}</span>`
        ).join(', ');
    }

    formatOwnershipPercentage(percentage) {
        if (!percentage) return percentage;
        // Remove any existing % sign and add it back
        const cleanPercentage = percentage.toString().replace('%', '');
        return `${cleanPercentage}%`;
    }

    checkForUrlParameters() {
        // Check if there's a business name stored in localStorage from the person game
        const businessFromPerson = localStorage.getItem('businessSearchFromPerson');
        
        if (businessFromPerson) {
            // Clear the stored value
            localStorage.removeItem('businessSearchFromPerson');
            // Set the input field with the business name
            if (this.userInput) {
                this.userInput.value = businessFromPerson;
                // Automatically start the search after a short delay to ensure everything is loaded
                setTimeout(() => {
                    this.startNewGame();
                }, 500);
            }
        } else {
            // Check if there's a business name stored in localStorage from the invention game
            const businessFromInvention = localStorage.getItem('businessSearchFromInvention');
            
            if (businessFromInvention) {
                // Clear the stored value
                localStorage.removeItem('businessSearchFromInvention');
                // Set the input field with the business name
                if (this.userInput) {
                    this.userInput.value = businessFromInvention;
                    // Automatically start the search after a short delay to ensure everything is loaded
                    setTimeout(() => {
                        this.startNewGame();
                    }, 500);
                }
            } else {
                // Check if there's a business name stored in localStorage from the city game
                const businessFromCity = localStorage.getItem('businessSearchFromCity');
                
                if (businessFromCity) {
                    // Clear the stored value
                    localStorage.removeItem('businessSearchFromCity');
                    // Set the input field with the business name
                    if (this.userInput) {
                        this.userInput.value = businessFromCity;
                        // Automatically start the search after a short delay to ensure everything is loaded
                        setTimeout(() => {
                            this.startNewGame();
                        }, 500);
                    }
                } else {
                    // Check if there's a business name stored in localStorage from the movie game
                    const businessFromMovie = localStorage.getItem('businessSearchFromMovie');
                    
                    if (businessFromMovie) {
                        // Clear the stored value
                        localStorage.removeItem('businessSearchFromMovie');
                        // Set the input field with the business name
                        if (this.userInput) {
                            this.userInput.value = businessFromMovie;
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

    setupClickableLinks() {
        // Add event listeners to all clickable person links
        const clickablePersons = document.querySelectorAll('.clickable-person');
        clickablePersons.forEach(personElement => {
            personElement.addEventListener('click', (e) => {
                e.preventDefault();
                const personName = personElement.getAttribute('data-person');
                if (personName) {
                    // Store the person name in localStorage for the person game to use
                    localStorage.setItem('personSearchFromBusiness', personName);
                    // Navigate to the person game
                    window.location.href = '/person';
                }
            });
        });

        // Add event listeners to all clickable city links
        const clickableCities = document.querySelectorAll('.clickable-city');
        clickableCities.forEach(cityElement => {
            cityElement.addEventListener('click', (e) => {
                e.preventDefault();
                const cityName = cityElement.getAttribute('data-city');
                if (cityName) {
                    // Store the city name in localStorage for the city game to use
                    localStorage.setItem('citySearchFromBusiness', cityName);
                    // Navigate to the city game
                    window.location.href = '/city';
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
                    localStorage.setItem('inventionSearchFromBusiness', inventionName);
                    // Navigate to the invention game
                    window.location.href = '/invention';
                }
            });
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BusinessGame();
});