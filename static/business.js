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
        this.subsidiariesSection = document.getElementById('subsidiariesSection');
        this.subsidiariesContent = document.getElementById('subsidiariesContent');
        
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

        // Display business name
        this.guessText.innerHTML = `<div class="name-box">${guess.name}</div>`;
        
        // Display overview
        if (guess.overview) {
            this.guessTextOverview.innerHTML = `<div class="overview-box">${guess.overview}</div>`;
        }

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
        if (guess.type) basicInfo += `<p><strong>Type:</strong> ${guess.type}</p>`;
        if (guess.industry) basicInfo += `<p><strong>Industry:</strong> ${guess.industry}</p>`;
        if (guess.year_founded) basicInfo += `<p><strong>Founded:</strong> ${guess.year_founded}</p>`;
        if (guess.city_founded) basicInfo += `<p><strong>Founded in:</strong> ${guess.city_founded}</p>`;
        if (guess.founders && guess.founders.length > 0) {
            basicInfo += `<p><strong>Founders:</strong> ${guess.founders.join(', ')}</p>`;
        }
        if (guess.current_headquarters) basicInfo += `<p><strong>Headquarters:</strong> ${guess.current_headquarters}</p>`;
        if (guess.areas_served) basicInfo += `<p><strong>Areas Served:</strong> ${guess.areas_served}</p>`;
        if (guess.number_of_employees) basicInfo += `<p><strong>Employees:</strong> ${guess.number_of_employees}</p>`;
        
        if (basicInfo) {
            this.basicInfoContent.innerHTML = basicInfo;
            this.basicInfoSection.classList.remove('hidden');
        } else {
            this.basicInfoSection.classList.add('hidden');
        }

        // Financial Information
        let financialInfo = '';
        if (guess.stock_exchange && guess.stock_exchange !== 'N/A') {
            financialInfo += `<p><strong>Stock Exchange:</strong> ${guess.stock_exchange}</p>`;
        }
        if (guess.ticker && guess.ticker !== 'N/A') {
            financialInfo += `<p><strong>Ticker:</strong> ${guess.ticker}</p>`;
        }
        if (guess.revenue) financialInfo += `<p><strong>Revenue:</strong> ${guess.revenue}</p>`;
        if (guess.operating_income) financialInfo += `<p><strong>Operating Income:</strong> ${guess.operating_income}</p>`;
        if (guess.net_income) financialInfo += `<p><strong>Net Income:</strong> ${guess.net_income}</p>`;
        if (guess.total_assets) financialInfo += `<p><strong>Total Assets:</strong> ${guess.total_assets}</p>`;
        if (guess.total_equity) financialInfo += `<p><strong>Total Equity:</strong> ${guess.total_equity}</p>`;
        if (guess.owner) {
            financialInfo += `<p><strong>Owner:</strong> ${guess.owner}`;
            if (guess.owner_equity_percentage) {
                financialInfo += ` (${guess.owner_equity_percentage})`;
            }
            financialInfo += `</p>`;
        }
        if (guess.parent) financialInfo += `<p><strong>Parent Company:</strong> ${guess.parent}</p>`;
        
        if (financialInfo) {
            this.financialInfoContent.innerHTML = financialInfo;
            this.financialInfoSection.classList.remove('hidden');
        } else {
            this.financialInfoSection.classList.add('hidden');
        }

        // Leadership
        let leadershipInfo = '';
        if (guess.ceo) leadershipInfo += `<p><strong>CEO:</strong> ${guess.ceo}</p>`;
        if (guess.chairman) leadershipInfo += `<p><strong>Chairman:</strong> ${guess.chairman}</p>`;
        
        if (leadershipInfo) {
            this.leadershipContent.innerHTML = leadershipInfo;
            this.leadershipSection.classList.remove('hidden');
        } else {
            this.leadershipSection.classList.add('hidden');
        }

        // Products & Services
        let productsServicesInfo = '';
        if (guess.products && guess.products.length > 0) {
            productsServicesInfo += `<p><strong>Products:</strong> ${guess.products.join(', ')}</p>`;
        }
        if (guess.services && guess.services.length > 0) {
            productsServicesInfo += `<p><strong>Services:</strong> ${guess.services.join(', ')}</p>`;
        }
        if (guess.predecessors && guess.predecessors.length > 0) {
            productsServicesInfo += `<p><strong>Predecessors:</strong> ${guess.predecessors.join(', ')}</p>`;
        }
        if (guess.previous_names && guess.previous_names.length > 0) {
            productsServicesInfo += `<p><strong>Previous Names:</strong> ${guess.previous_names.join(', ')}</p>`;
        }
        if (guess.website) {
            productsServicesInfo += `<p><strong>Website:</strong> <a href="${guess.website}" target="_blank">${guess.website}</a></p>`;
        }
        if (guess.wikipedia_url) {
            productsServicesInfo += `<p><strong>Wikipedia:</strong> <a href="${guess.wikipedia_url}" target="_blank">View Wikipedia Page</a></p>`;
        }
        
        if (productsServicesInfo) {
            this.productsServicesContent.innerHTML = productsServicesInfo;
            this.productsServicesSection.classList.remove('hidden');
        } else {
            this.productsServicesSection.classList.add('hidden');
        }

        // Subsidiaries
        if (guess.subsidiaries && guess.subsidiaries.length > 0) {
            this.subsidiariesContent.innerHTML = `<p>${guess.subsidiaries.join(', ')}</p>`;
            this.subsidiariesSection.classList.remove('hidden');
        } else {
            this.subsidiariesSection.classList.add('hidden');
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
        this.subsidiariesSection.classList.add('hidden');
        
        // Clear content
        this.basicInfoContent.innerHTML = '';
        this.financialInfoContent.innerHTML = '';
        this.leadershipContent.innerHTML = '';
        this.productsServicesContent.innerHTML = '';
        this.subsidiariesContent.innerHTML = '';
        
        // Reset map
        if (this.map) {
            this.map = null;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BusinessGame();
});