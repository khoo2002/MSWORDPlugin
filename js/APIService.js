/**
 * APIService - Handles all API communications
 * Manages connections to local server and external services like Ollama
 */
class APIService {
    constructor() {
        this.baseUrl = 'https://127.0.0.1:5500/api';
        this.ollamaApiUrl = ''; // Reserved for Ollama API URL
        this.requestTimeout = 30000; // 30 seconds
    }

    /**
     * Set the Ollama API URL
     * @param {string} url - Ollama API endpoint URL
     */
    setOllamaApiUrl(url) {
        this.ollamaApiUrl = url;
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
     * Analyze text using the local analysis API
     * @param {string} text - Text to analyze
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeText(text) {
        return this.makeRequest(`${this.baseUrl}/analyze-text`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }

    /**
     * Get text suggestions from AI (using Ollama or local processing)
     * @param {string} text - Text to get suggestions for
     * @param {string} context - Context for the suggestions
     * @returns {Promise<Object>} Suggestions response
     */
    async getTextSuggestions(text, context = '') {
        return this.makeRequest(`${this.baseUrl}/suggest-improvements`, {
            method: 'POST',
            body: JSON.stringify({ text, context })
        });
    }

    /**
     * Send chat message to AI assistant
     * @param {string} message - User message
     * @param {Array} history - Chat history
     * @returns {Promise<Object>} AI response
     */
    async sendChatMessage(message, history = []) {
        return this.makeRequest(`${this.baseUrl}/chat`, {
            method: 'POST',
            body: JSON.stringify({ message, history })
        });
    }

    /**
     * Get paragraph-specific suggestions
     * @param {Array} paragraphs - Array of paragraph objects
     * @returns {Promise<Object>} Suggestions for each paragraph
     */
    async getParagraphSuggestions(paragraphs) {
        return this.makeRequest(`${this.baseUrl}/analyze-paragraphs`, {
            method: 'POST',
            body: JSON.stringify({ paragraphs })
        });
    }

    /**
     * Test connection to Ollama API (when configured)
     * @returns {Promise<boolean>} Connection status
     */
    async testOllamaConnection() {
        if (!this.ollamaApiUrl) {
            throw new Error('Ollama API URL not configured');
        }

        try {
            // Test endpoint - adjust based on Ollama API structure
            const response = await this.makeRequest(`${this.ollamaApiUrl}/api/tags`);
            return true;
        } catch (error) {
            console.error('Ollama connection test failed:', error);
            return false;
        }
    }
}
