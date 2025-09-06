// General app JavaScript code
// This file contains shared functionality that can be used across multiple games

// Common utility functions
const AppUtils = {
    // Show loading state for any element
    showLoading: function(element) {
        if (element) {
            element.disabled = true;
            const originalText = element.textContent;
            element.setAttribute('data-original-text', originalText);
            element.textContent = 'Loading...';
        }
    },

    // Hide loading state for any element
    hideLoading: function(element) {
        if (element) {
            element.disabled = false;
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
                element.removeAttribute('data-original-text');
            }
        }
    },

    // Show error message
    showError: function(message, containerId = 'errorSection') {
        const errorSection = document.getElementById(containerId);
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorSection && errorMessage) {
            errorMessage.textContent = message;
            errorSection.classList.remove('hidden');
        } else {
            // Fallback to alert if error elements don't exist
            alert('Error: ' + message);
        }
    },

    // Hide error message
    hideError: function(containerId = 'errorSection') {
        const errorSection = document.getElementById(containerId);
        if (errorSection) {
            errorSection.classList.add('hidden');
        }
    },

    // Make API request with error handling
    async makeApiRequest: function(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
};

// Common keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to dismiss errors
    if (e.key === 'Escape') {
        const errorSection = document.getElementById('errorSection');
        if (errorSection && !errorSection.classList.contains('hidden')) {
            const dismissBtn = document.getElementById('dismissErrorBtn');
            if (dismissBtn) {
                dismissBtn.click();
            }
        }
    }
});

// Initialize common functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add any general app initialization code here
    console.log('General app script loaded');
});