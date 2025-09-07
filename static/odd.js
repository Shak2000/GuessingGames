class OddSituationGame {
    constructor() {
        this.currentSessionId = null;
        this.guessCount = 0;
        
        // Get DOM elements
        this.startSection = document.getElementById('startSection');
        this.gameSection = document.getElementById('gameSection');
        this.loadingSection = document.getElementById('loadingSection');
        this.errorSection = document.getElementById('errorSection');
        
        this.situationImg = document.getElementById('situationImg');
        this.guessInput = document.getElementById('guessInput');
        this.feedbackSection = document.getElementById('feedbackSection');
        this.feedbackText = document.getElementById('feedbackText');
        this.answerSection = document.getElementById('answerSection');
        this.answerText = document.getElementById('answerText');
        
        // Buttons
        this.startGameBtn = document.getElementById('startGameBtn');
        this.submitGuessBtn = document.getElementById('submitGuessBtn');
        this.revealBtn = document.getElementById('revealBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.retryBtn = document.getElementById('retryBtn');
        
        // Event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.startGameBtn.addEventListener('click', () => this.startNewGame());
        this.submitGuessBtn.addEventListener('click', () => this.submitGuess());
        this.revealBtn.addEventListener('click', () => this.revealAnswer());
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        this.retryBtn.addEventListener('click', () => this.startNewGame());
        
        // Allow Enter key to submit guess
        this.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitGuess();
            }
        });
    }
    
    async startNewGame() {
        this.hideAllSections();
        this.showLoading();
        
        try {
            const response = await fetch('/api/start-odd-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.currentSessionId = data.session_id;
            this.guessCount = 0;
            
            // Display the image
            this.situationImg.src = data.image_url;
            this.situationImg.alt = "Odd situation image";
            
            this.hideLoading();
            this.showGameSection();
            this.guessInput.value = '';
            this.guessInput.focus();
            
        } catch (error) {
            console.error('Error starting new game:', error);
            this.showError('Failed to start new game. Please try again.');
        }
    }
    
    async submitGuess() {
        const guess = this.guessInput.value.trim();
        if (!guess) {
            alert('Please enter a guess!');
            return;
        }
        
        if (!this.currentSessionId) {
            this.showError('No active game session. Please start a new game.');
            return;
        }
        
        this.submitGuessBtn.disabled = true;
        this.submitGuessBtn.textContent = 'Checking...';
        
        try {
            const response = await fetch('/api/submit-odd-guess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.currentSessionId,
                    guess: guess
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.guessCount++;
            
            if (data.correct) {
                this.showCorrectFeedback();
            } else {
                this.showIncorrectFeedback();
            }
            
            // Show reveal button after first incorrect guess
            if (!data.correct && this.guessCount >= 1) {
                this.revealBtn.style.display = 'inline-block';
            }
            
        } catch (error) {
            console.error('Error submitting guess:', error);
            this.showError('Failed to submit guess. Please try again.');
        } finally {
            this.submitGuessBtn.disabled = false;
            this.submitGuessBtn.textContent = 'Submit Guess';
        }
    }
    
    async revealAnswer() {
        if (!this.currentSessionId) {
            this.showError('No active game session.');
            return;
        }
        
        try {
            const response = await fetch('/api/reveal-odd-answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.currentSessionId
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.showAnswer(data);
            
        } catch (error) {
            console.error('Error revealing answer:', error);
            this.showError('Failed to reveal answer. Please try again.');
        }
    }
    
    showCorrectFeedback() {
        this.feedbackText.innerHTML = `
            <div class="feedback-correct">
                <h3>🎉 Correct!</h3>
                <p>Great job! You guessed it right!</p>
            </div>
        `;
        this.feedbackSection.classList.remove('hidden');
        this.revealBtn.style.display = 'none';
        this.guessInput.disabled = true;
        this.submitGuessBtn.disabled = true;
    }
    
    showIncorrectFeedback() {
        this.feedbackText.innerHTML = `
            <div class="feedback-incorrect">
                <h3>❌ Not quite right</h3>
                <p>That's not the correct answer. Try again or reveal the answer!</p>
            </div>
        `;
        this.feedbackSection.classList.remove('hidden');
        this.guessInput.value = '';
        this.guessInput.focus();
    }
    
    showAnswer(data) {
        this.answerText.innerHTML = `
            <div class="answer-details">
                <h4>${data.correct_person}</h4>
                <p><strong>Outfit:</strong> ${data.outfit}</p>
                <p><strong>Setting:</strong> ${data.setting}</p>
                <p class="full-situation">${data.full_situation}</p>
            </div>
        `;
        this.answerSection.classList.remove('hidden');
        this.feedbackSection.classList.add('hidden');
        this.guessInput.disabled = true;
        this.submitGuessBtn.disabled = true;
        this.revealBtn.style.display = 'none';
    }
    
    showGameSection() {
        this.gameSection.classList.remove('hidden');
        this.feedbackSection.classList.add('hidden');
        this.answerSection.classList.add('hidden');
        this.guessInput.disabled = false;
        this.guessInput.value = '';
        this.submitGuessBtn.disabled = false;
        this.revealBtn.style.display = 'none';
    }
    
    showLoading() {
        this.loadingSection.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loadingSection.classList.add('hidden');
    }
    
    showError(message) {
        document.getElementById('errorText').textContent = message;
        this.hideAllSections();
        this.errorSection.classList.remove('hidden');
    }
    
    hideAllSections() {
        this.startSection.classList.add('hidden');
        this.gameSection.classList.add('hidden');
        this.loadingSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new OddSituationGame();
});