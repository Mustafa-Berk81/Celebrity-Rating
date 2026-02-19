/**
 * Toast Notification System
 * Handles displaying beautiful notifications to the user.
 */

class ToastManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - 'success', 'error', 'info', 'warning'
     * @param {number} duration - Duration in ms (default 3000)
     */
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icon}</span>
                <span class="toast-message">${message}</span>
            </div>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove
        setTimeout(() => {
            this.dismiss(toast);
        }, duration);

        // Click to dismiss
        toast.addEventListener('click', () => {
            this.dismiss(toast);
        });
    }

    dismiss(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 400);
    }
}

// Initialize on window
window.Toast = new ToastManager();

// Helper function for global use
window.showToast = (message, type, duration) => {
    window.Toast.show(message, type, duration);
};
