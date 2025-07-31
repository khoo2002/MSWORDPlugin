/**
 * LocalAIProvider - Local processing AI provider implementation
 * Handles communication with local API server for fallback processing
 */
class LocalAIProvider extends BaseAIProvider {
    constructor(baseUrl = 'https://127.0.0.1:5500/api') {
        super();
        this.baseUrl = baseUrl;
    }

    /**
     * Set the base URL
     * @param {string} baseUrl - Local API base URL
     */
    setBaseUrl(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Check if the provider is properly configured
     * @returns {boolean} True (local is always available)
     */
    isConfigured() {
        return true; // Local processing is always available
    }

    /**
     * Get the display name of the provider
     * @returns {string} Provider display name
     */
    getDisplayName() {
        return '🔧 Local Processing';
    }

    /**
     * Send a chat message to local API
     * @param {string} message - User message
     * @param {Array} history - Chat history
     * @returns {Promise<Object>} Local AI response
     */
    async sendChatMessage(message, history = []) {
        try {
            const response = await this.makeRequest(`${this.baseUrl}/chat`, {
                method: 'POST',
                body: JSON.stringify({ message, history })
            });

            // Standardize the response format
            if (response.message) {
                return this.createResponse(response.message, 'local');
            } else if (response.response) {
                return this.createResponse(response.response, 'local');
            } else {
                // Create a fallback response if local server is not available
                return this.createFallbackChatResponse(message);
            }
        } catch (error) {
            console.warn('Local API not available, using fallback response:', error);
            return this.createFallbackChatResponse(message);
        }
    }

    /**
     * Get paragraph suggestions from local API
     * @param {Array} paragraphs - Array of paragraph objects
     * @returns {Promise<Object>} Local suggestions
     */
    async getParagraphSuggestions(paragraphs) {
        try {
            const response = await this.makeRequest(`${this.baseUrl}/analyze-paragraphs`, {
                method: 'POST',
                body: JSON.stringify({ paragraphs })
            });

            return response;
        } catch (error) {
            console.warn('Local API not available, using fallback analysis:', error);
            return this.createFallbackSuggestions(paragraphs);
        }
    }

    /**
     * Analyze text using local API
     * @param {string} text - Text to analyze
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeText(text) {
        try {
            return await this.makeRequest(`${this.baseUrl}/analyze-text`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });
        } catch (error) {
            console.warn('Local API not available, using fallback analysis:', error);
            return this.createFallbackAnalysis(text);
        }
    }

    /**
     * Get text suggestions from local API
     * @param {string} text - Text to get suggestions for
     * @param {string} context - Context for the suggestions
     * @returns {Promise<Object>} Suggestions response
     */
    async getTextSuggestions(text, context = '') {
        try {
            return await this.makeRequest(`${this.baseUrl}/suggest-improvements`, {
                method: 'POST',
                body: JSON.stringify({ text, context })
            });
        } catch (error) {
            console.warn('Local API not available, using fallback suggestions:', error);
            return this.createFallbackTextSuggestions(text);
        }
    }

    /**
     * Test connection to local API
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch (error) {
            console.warn('Local API connection test failed:', error);
            return false; // Still return false for accurate status, but provider remains available
        }
    }

    /**
     * Create a fallback chat response when local API is not available
     * @param {string} message - User message
     * @returns {Object} Fallback response
     */
    createFallbackChatResponse(message) {
        const responses = [
            "I understand you're asking about your document. While the local AI server isn't available, I recommend using the 'Analyze Document' feature for basic text analysis.",
            "The local processing server appears to be offline. You can still use the basic document analysis features or configure Gemini/Ollama for AI assistance.",
            "I'm currently operating in limited mode. For full AI assistance, please check your network connection or configure an external AI provider like Gemini.",
            "The AI service is temporarily unavailable. You can still perform basic document operations using the Quick Actions menu."
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return this.createResponse(randomResponse, 'local-fallback');
    }

    /**
     * Create fallback analysis when local API is not available
     * @param {string} text - Text to analyze
     * @returns {Object} Fallback analysis
     */
    createFallbackAnalysis(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        
        return {
            wordCount: words.length,
            characterCount: text.length,
            sentenceCount: sentences.length,
            paragraphCount: paragraphs.length,
            preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            timestamp: new Date().toISOString(),
            source: 'local-fallback'
        };
    }

    /**
     * Create fallback suggestions when local API is not available
     * @param {Array} paragraphs - Array of paragraph objects
     * @returns {Object} Fallback suggestions
     */
    createFallbackSuggestions(paragraphs) {
        return {
            totalParagraphs: paragraphs.length,
            suggestions: [],
            timestamp: new Date().toISOString(),
            note: "Local analysis server not available. Configure Gemini or Ollama for AI-powered suggestions.",
            source: 'local-fallback'
        };
    }

    /**
     * Create fallback text suggestions when local API is not available
     * @param {string} text - Text to suggest improvements for
     * @returns {Object} Fallback text suggestions
     */
    createFallbackTextSuggestions(text) {
        return {
            suggestions: [],
            timestamp: new Date().toISOString(),
            note: "Local suggestion server not available. Configure Gemini or Ollama for AI-powered suggestions.",
            source: 'local-fallback'
        };
    }
}
