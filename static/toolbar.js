// Toolbar Auto-Center Functionality
class ToolbarManager {
    constructor() {
        this.toolbarContent = document.querySelector('.toolbar-content');
        this.activeItem = document.querySelector('.toolbar-item.active');
        
        if (this.toolbarContent && this.activeItem) {
            this.centerActiveItem();
        }
    }

    centerActiveItem() {
        // Wait for the page to fully load and fonts to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // Add a small delay to ensure all styles are applied
                setTimeout(() => this.performCentering(), 100);
            });
        } else {
            // Add a small delay to ensure all styles are applied
            setTimeout(() => this.performCentering(), 100);
        }
    }

    performCentering() {
        // Re-check elements in case they weren't ready initially
        if (!this.toolbarContent || !this.activeItem) {
            this.toolbarContent = document.querySelector('.toolbar-content');
            this.activeItem = document.querySelector('.toolbar-item.active');
            
            if (!this.toolbarContent || !this.activeItem) {
                return; // Elements still not found
            }
        }

        // Check if scrolling is needed
        if (this.toolbarContent.scrollWidth <= this.toolbarContent.clientWidth) {
            return; // No scrolling needed
        }

        // Calculate the position to center the active item
        const toolbarRect = this.toolbarContent.getBoundingClientRect();
        const activeItemRect = this.activeItem.getBoundingClientRect();
        
        // Calculate the offset needed to center the active item
        const activeItemCenter = activeItemRect.left + (activeItemRect.width / 2);
        const toolbarCenter = toolbarRect.left + (toolbarRect.width / 2);
        const offsetToCenter = activeItemCenter - toolbarCenter;
        
        // Scroll to center the active item
        const currentScrollLeft = this.toolbarContent.scrollLeft;
        const targetScrollLeft = currentScrollLeft + offsetToCenter;
        
        // Ensure we don't scroll beyond bounds
        const maxScrollLeft = this.toolbarContent.scrollWidth - this.toolbarContent.clientWidth;
        const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));
        
        // Smooth scroll to the target position
        this.toolbarContent.scrollTo({
            left: finalScrollLeft,
            behavior: 'smooth'
        });
    }
}

// Initialize toolbar centering when the script loads
document.addEventListener('DOMContentLoaded', () => {
    new ToolbarManager();
});