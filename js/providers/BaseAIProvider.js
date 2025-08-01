/**
 * BaseAIProvider - Abstract base class for AI providers
 * Defines the common interface that all AI providers must implement
 */
class BaseAIProvider {
    constructor(config = {}) {
        this.config = config;
        this.requestTimeout = 30000; // 30 seconds
    }

    /**
     * Check if the provider is properly configured
     * @returns {boolean} True if provider is ready to use
     */
    isConfigured() {
        throw new Error('isConfigured() must be implemented by subclass');
    }

    /**
     * Get the display name of the provider
     * @returns {string} Provider display name
     */
    getDisplayName() {
        throw new Error('getDisplayName() must be implemented by subclass');
    }

    /**
     * Send a chat message
     * @param {string} message - User message
     * @param {Array} history - Chat history
     * @param {Object} options - Additional options
     * @param {string} options.systemMessage - System instructions for AI behavior
     * @param {string} options.documentContext - Full document text as context
     * @returns {Promise<Object>} AI response
     */
    async sendChatMessage(message, history = [], options = {}) {
        throw new Error('sendChatMessage() must be implemented by subclass');
    }

    /**
     * Get paragraph suggestions
     * @param {Array} paragraphs - Array of paragraph objects
     * @param {Object} options - Additional options
     * @param {string} options.systemMessage - System instructions for analysis
     * @param {string} options.fullDocumentText - Complete document text for context
     * @returns {Promise<Object>} Suggestions response
     */
    async getParagraphSuggestions(paragraphs, options = {}) {
        throw new Error('getParagraphSuggestions() must be implemented by subclass');
    }

    /**
     * Test connection to the provider
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        throw new Error('testConnection() must be implemented by subclass');
    }

    /**
     * Make a generic API request with error handling
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response
     */
    async makeRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    /**
     * Create a standardized response object
     * @param {string} message - Response message
     * @param {string} source - Provider source name
     * @returns {Object} Standardized response
     */
    createResponse(message, source) {
        return {
            message,
            timestamp: new Date().toISOString(),
            type: 'assistant',
            source
        };
    }
}
