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
            if (e.key === 'Enter' && e.ctrlKey) {
                this.startNewGameFromButton();
            }
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

        // Display main guess
        this.guessText.innerHTML = `<strong>${guess.name}</strong>`;
        
        // Display overview
        if (guess.overview) {
            this.guessTextOverview.innerHTML = `<strong>Overview:</strong> ${guess.overview}`;
        }

        // Display reasoning
        if (guess.reasoning) {
            this.guessTextReasoning.innerHTML = `<strong>My reasoning:</strong> ${guess.reasoning}`;
        }

        // Display detailed information
        this.displayMovieDetails(guess);
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
        if (movie.starring && movie.starring.length > 0) castCrew += `<p><strong>Starring:</strong> ${movie.starring.join(', ')}</p>`;
        if (movie.directed_by && movie.directed_by.length > 0) castCrew += `<p><strong>Directed by:</strong> ${movie.directed_by.join(', ')}</p>`;
        if (movie.screenplay_by && movie.screenplay_by.length > 0) castCrew += `<p><strong>Screenplay by:</strong> ${movie.screenplay_by.join(', ')}</p>`;
        if (movie.story_by && movie.story_by.length > 0) castCrew += `<p><strong>Story by:</strong> ${movie.story_by.join(', ')}</p>`;
        if (movie.cinematography && movie.cinematography.length > 0) castCrew += `<p><strong>Cinematography:</strong> ${movie.cinematography.join(', ')}</p>`;
        if (movie.edited_by && movie.edited_by.length > 0) castCrew += `<p><strong>Edited by:</strong> ${movie.edited_by.join(', ')}</p>`;
        if (movie.music_by && movie.music_by.length > 0) castCrew += `<p><strong>Music by:</strong> ${movie.music_by.join(', ')}</p>`;
        
        if (castCrew) {
            this.castCrewContent.innerHTML = castCrew;
            this.castCrewSection.classList.remove('hidden');
        }

        // Production
        let production = '';
        if (movie.produced_by && movie.produced_by.length > 0) production += `<p><strong>Produced by:</strong> ${movie.produced_by.join(', ')}</p>`;
        if (movie.production_company && movie.production_company.length > 0) production += `<p><strong>Production Company:</strong> ${movie.production_company.join(', ')}</p>`;
        if (movie.distributed_by && movie.distributed_by.length > 0) production += `<p><strong>Distributed by:</strong> ${movie.distributed_by.join(', ')}</p>`;
        
        if (production) {
            this.productionContent.innerHTML = production;
            this.productionSection.classList.remove('hidden');
        }

        // Financial Information
        let financial = '';
        if (movie.budget) financial += `<p><strong>Budget:</strong> ${movie.budget}</p>`;
        if (movie.box_office) financial += `<p><strong>Box Office:</strong> ${movie.box_office}</p>`;
        
        if (financial) {
            this.financialContent.innerHTML = financial;
            this.financialSection.classList.remove('hidden');
        }

        // Release Information
        let release = '';
        if (movie.release_dates && typeof movie.release_dates === 'object') {
            release += '<p><strong>Release Dates:</strong></p><ul>';
            for (const [country, date] of Object.entries(movie.release_dates)) {
                release += `<li><strong>${country}:</strong> ${date}</li>`;
            }
            release += '</ul>';
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