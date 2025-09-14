class InventionGame {
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
        this.guessTextOverview = document.getElementById('guessTextOverview');
        this.guessTextReasoning = document.getElementById('guessTextReasoning');
        this.inventionImageContainer = document.getElementById('inventionImageContainer');
        this.inventionImage = document.getElementById('inventionImage');
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

        // Allow Enter key to submit
        if (this.userInput) {
            this.userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.startNewGameFromButton();
                }
            });
        }
    }

    async startNewGameFromButton() {
        const userInput = this.userInput.value.trim();
        
        if (!userInput) {
            this.showError('Please enter some information about an invention!');
            return;
        }

        this.showLoading();
        this.hideError();

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
            this.showGameSection();

        } catch (error) {
            console.error('Error starting game:', error);
            this.showError('Failed to start the game. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async submitFeedback(isCorrect) {
        if (!this.currentSessionId) {
            return;
        }

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
            this.hideLoading();
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
            const businesses = guess.businesses || [];
            const events = guess.historical_events || [];
            const wikipediaUrl = guess.wikipedia_url;
            const reasoning = guess.reasoning;
            const overview = guess.overview;
            
            // Build invention info section
            let inventionInfo = '';
            if (year || place || inventors.length > 0 || materials.length > 0 || 
                previous.length > 0 || later.length > 0 || businesses.length > 0 || events.length > 0) {
                inventionInfo = '<div class="bio-section">';
                
                if (year) inventionInfo += `<p><strong>Year Invented:</strong> ${year}</p>`;
                if (place) inventionInfo += `<p><strong>Place Invented:</strong> ${place}</p>`;
                if (inventors.length > 0) inventionInfo += `<p><strong>Inventors:</strong> ${inventors.join(', ')}</p>`;
                if (materials.length > 0) inventionInfo += `<p><strong>Materials Used:</strong> ${materials.join(', ')}</p>`;
                if (previous.length > 0) inventionInfo += `<p><strong>Previous Inventions:</strong> ${previous.join(', ')}</p>`;
                if (later.length > 0) inventionInfo += `<p><strong>Later Inventions:</strong> ${later.join(', ')}</p>`;
                if (businesses.length > 0) inventionInfo += `<p><strong>Businesses:</strong> ${businesses.join(', ')}</p>`;
                if (events.length > 0) inventionInfo += `<p><strong>Historical Events:</strong> ${events.join(', ')}</p>`;
                
                if (wikipediaUrl) {
                    inventionInfo += `<p><strong>Wikipedia:</strong> <a href="${wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wikipedia-link">Page</a></p>`;
                }
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
        } else {
            this.guessText.innerHTML = '<div class="name-box"><strong>No guess available</strong></div>';
            this.guessTextOverview.style.display = 'none';
            this.guessTextReasoning.style.display = 'none';
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

    showGameSection() {
        this.gameSection.classList.remove('hidden');
        this.victorySection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
    }

    showVictory() {
        this.victorySection.classList.remove('hidden');
        this.gameSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
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
        this.currentSessionId = null;
        this.userInput.value = '';
        this.gameSection.classList.add('hidden');
        this.victorySection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
        this.guessText.innerHTML = '';
        this.guessTextOverview.style.display = 'none';
        this.guessTextReasoning.innerHTML = '';
        this.inventionImageContainer.style.display = 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InventionGame();
});