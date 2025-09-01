class FamousPersonGame {
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
            let wikipediaUrl = '';
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
                } else if (line.startsWith('WIKIPEDIA_URL:')) {
                    wikipediaUrl = line.replace('WIKIPEDIA_URL:', '').trim();
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
                    bioInfo += `<p><strong>Wikipedia:</strong> <a href="${wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wikipedia-link">View Wikipedia Page</a></p>`;
                }
                bioInfo += '</div>';
            }
            
            // Display name in the first element
            this.guessText.innerHTML = `
                <div class="name-box">
                    <strong>${name}</strong>
                </div>
                ${bioInfo}
            `;
            
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
