class MovieGame {
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
        
        // Movie image elements
        this.movieImageContainer = document.getElementById('movieImageContainer');
        this.movieImage = document.getElementById('movieImage');
        this.correctBtn = document.getElementById('correctBtn');
        this.incorrectBtn = document.getElementById('incorrectBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.dismissErrorBtn = document.getElementById('dismissErrorBtn');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Movie details sections
        this.basicInfoSection = document.getElementById('basicInfoSection');
        this.basicInfoContent = document.getElementById('basicInfoContent');
        this.castCrewSection = document.getElementById('castCrewSection');
        this.castCrewContent = document.getElementById('castCrewContent');
        this.productionSection = document.getElementById('productionSection');
        this.productionContent = document.getElementById('productionContent');
        this.financialSection = document.getElementById('financialSection');
        this.financialContent = document.getElementById('financialContent');
        this.releaseSection = document.getElementById('releaseSection');
        this.releaseContent = document.getElementById('releaseContent');
        this.moreInfoSection = document.getElementById('moreInfoSection');
        this.moreInfoContent = document.getElementById('moreInfoContent');
        this.inspirationSection = document.getElementById('inspirationSection');
        this.inspirationContent = document.getElementById('inspirationContent');
        
        this.currentSessionId = null;
        
        this.initializeEventListeners();
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
    }

    async startNewGameFromButton() {
        const inputText = this.userInput.value.trim();
        
        if (!inputText) {
            this.showError('Please enter some information about the movie.');
            return;
        }

        // Disable button and show loading
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Thinking...';
        this.hideAllSections();
        this.showLoading();

        try {
            const response = await fetch('/api/start-movie-guess', {
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
            console.error('Error starting movie game:', error);
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

        // Display movie image if available
        if (guess.image_url) {
            // Use a CORS proxy for Wikipedia images
            let proxyUrl = '';
            if (guess.image_url.includes('upload.wikimedia.org')) {
                // Use images.weserv.nl as a CORS proxy for Wikipedia images
                proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(guess.image_url)}&w=300&h=400&fit=cover`;
            } else {
                proxyUrl = guess.image_url;
            }
            
            this.movieImage.src = proxyUrl;
            this.movieImageContainer.style.display = 'block';
        } else {
            this.movieImageContainer.style.display = 'none';
        }

        // Display main guess and overview
        let overviewInfo = '';
        if (guess.overview) {
            overviewInfo = `
                <div class="bio-section overview-section">
                    <h4>Overview:</h4>
                    <p>${guess.overview}</p>
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

        // Display detailed information
        this.displayMovieDetails(guess);
    }

    formatNumberWithCommas(value) {
        // Ensure the value is a string and extract numbers to format them with commas
        if (typeof value !== 'string') {
            value = String(value);
        }
        return value.replace(/\d+/g, (match) => {
            return parseInt(match).toLocaleString();
        });
    }

    formatClickablePersonList(persons) {
        if (!persons || persons.length === 0) return '';
        
        return persons.map(person => 
            `<span class="clickable-person" data-person="${person.trim()}">${person.trim()}</span>`
        ).join(', ');
    }

    displayMovieDetails(movie) {
        // Basic Information
        let basicInfo = '';
        if (movie.running_time) basicInfo += `<p><strong>Running Time:</strong> ${movie.running_time} minutes</p>`;
        if (movie.country && movie.country.length > 0) basicInfo += `<p><strong>Country:</strong> ${movie.country.join(', ')}</p>`;
        if (movie.language && movie.language.length > 0) basicInfo += `<p><strong>Language:</strong> ${movie.language.join(', ')}</p>`;
        if (movie.based_on) basicInfo += `<p><strong>Based on:</strong> ${movie.based_on}</p>`;
        
        if (basicInfo) {
            this.basicInfoContent.innerHTML = basicInfo;
            this.basicInfoSection.classList.remove('hidden');
        }

        // Cast & Crew
        let castCrew = '';
        if (movie.starring && movie.starring.length > 0) castCrew += `<p><strong>Starring:</strong> ${this.formatClickablePersonList(movie.starring)}</p>`;
        if (movie.directed_by && movie.directed_by.length > 0) castCrew += `<p><strong>Directed by:</strong> ${this.formatClickablePersonList(movie.directed_by)}</p>`;
        if (movie.screenplay_by && movie.screenplay_by.length > 0) castCrew += `<p><strong>Screenplay by:</strong> ${this.formatClickablePersonList(movie.screenplay_by)}</p>`;
        if (movie.story_by && movie.story_by.length > 0) castCrew += `<p><strong>Story by:</strong> ${this.formatClickablePersonList(movie.story_by)}</p>`;
        if (movie.cinematography && movie.cinematography.length > 0) castCrew += `<p><strong>Cinematography:</strong> ${this.formatClickablePersonList(movie.cinematography)}</p>`;
        if (movie.edited_by && movie.edited_by.length > 0) castCrew += `<p><strong>Edited by:</strong> ${this.formatClickablePersonList(movie.edited_by)}</p>`;
        if (movie.music_by && movie.music_by.length > 0) castCrew += `<p><strong>Music by:</strong> ${this.formatClickablePersonList(movie.music_by)}</p>`;
        
        if (castCrew) {
            this.castCrewContent.innerHTML = castCrew;
            this.castCrewSection.classList.remove('hidden');
        }

        // Production
        let production = '';
        if (movie.produced_by && movie.produced_by.length > 0) production += `<p><strong>Produced by:</strong> ${this.formatClickablePersonList(movie.produced_by)}</p>`;
        if (movie.production_company && movie.production_company.length > 0) production += `<p><strong>Production Company:</strong> ${movie.production_company.join(', ')}</p>`;
        if (movie.distributed_by && movie.distributed_by.length > 0) production += `<p><strong>Distributed by:</strong> ${movie.distributed_by.join(', ')}</p>`;
        
        if (production) {
            this.productionContent.innerHTML = production;
            this.productionSection.classList.remove('hidden');
        }

        // Financial Information
        let financial = '';
        if (movie.budget) financial += `<p><strong>Budget:</strong> ${this.formatNumberWithCommas(movie.budget)}</p>`;
        if (movie.box_office) financial += `<p><strong>Box Office:</strong> ${this.formatNumberWithCommas(movie.box_office)}</p>`;
        
        if (financial) {
            this.financialContent.innerHTML = financial;
            this.financialSection.classList.remove('hidden');
        }

        // Release Dates
        let release = '';
        if (movie.release_dates && typeof movie.release_dates === 'object') {
            for (const [country, date] of Object.entries(movie.release_dates)) {
                release += `<p><strong>${country}:</strong> ${date}</p>`;
            }
        }
        
        if (release) {
            this.releaseContent.innerHTML = release;
            this.releaseSection.classList.remove('hidden');
        }

        // More Information
        let moreInfo = '';
        if (movie.wikipedia_url) {
            moreInfo += `<p><strong>Wikipedia:</strong> <a href="${movie.wikipedia_url}" target="_blank" rel="noopener noreferrer">View on Wikipedia</a></p>`;
        }
        
        if (moreInfo) {
            this.moreInfoContent.innerHTML = moreInfo;
            this.moreInfoSection.classList.remove('hidden');
        }

        // Inspiration
        let inspiration = '';
        if (movie.people && movie.people.length > 0) {
            inspiration += `<p><strong>Real-World People:</strong> ${this.formatClickablePersonList(movie.people)}</p>`;
        }
        if (movie.cities && movie.cities.length > 0) {
            inspiration += `<p><strong>Real-World Cities:</strong> ${movie.cities.join(', ')}</p>`;
        }
        if (movie.events && movie.events.length > 0) {
            inspiration += `<p><strong>Real-World Events:</strong> ${movie.events.join(', ')}</p>`;
        }
        
        if (inspiration) {
            this.inspirationContent.innerHTML = inspiration;
            this.inspirationSection.classList.remove('hidden');
        }

        // Set up clickable person links
        this.setupClickablePersonLinks();
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

    async submitFeedback(isCorrect) {
        if (!this.currentSessionId) {
            return;
        }

        // Disable buttons and show loading
        this.correctBtn.disabled = true;
        this.incorrectBtn.disabled = true;
        this.showLoading();

        try {
            const response = await fetch('/api/submit-movie-feedback', {
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
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MovieGame();
});