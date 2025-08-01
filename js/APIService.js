/**
 * APIService - Orchestrates AI providers and manages configurations
 * Provides a unified interface for all AI operations
 */
class APIService {
    constructor() {
        // Initialize AI providers
        this.providers = {
            gemini: new GeminiAIProvider(),
            ollama: new OllamaAIProvider(),
            local: new LocalAIProvider()
        };
        
        // Load saved configurations
        this.loadConfigurations();
        
        // Set active model from storage
        this.activeModel = this.loadActiveModel();
    }

    // =============================================================================
    // CONFIGURATION MANAGEMENT
    // =============================================================================

    /**
     * Get or set the system message for AI interactions
     * @param {string} message - Optional system message to set
     * @returns {string} Current system message
     */
    systemMessage(message = null) {
        if (message !== null) {
            localStorage.setItem('systemMessage', message);
        }
        return localStorage.getItem('systemMessage') || 'You are a professional writing assistant. Provide clear, helpful, and contextual advice for improving documents. Focus on clarity, coherence, and effectiveness.';
    }

    /**
     * Load all saved configurations from localStorage
     */
    loadConfigurations() {
        // Load Gemini API key
        const geminiKey = localStorage.getItem('geminiApiKey') || '';
        this.providers.gemini.setApiKey(geminiKey);
        
        // Load Ollama URL
        const ollamaUrl = localStorage.getItem('ollamaApiUrl') || 'http://localhost:11434';
        this.providers.ollama.setApiUrl(ollamaUrl);
        
        // Load local base URL (if customized)
        const localUrl = localStorage.getItem('localApiUrl') || 'https://127.0.0.1:5500/api';
        this.providers.local.setBaseUrl(localUrl);
    }

    /**
     * Set and save the Gemini API key
     * @param {string} apiKey - Gemini API key
     */
    setGeminiApiKey(apiKey) {
        this.providers.gemini.setApiKey(apiKey);
        localStorage.setItem('geminiApiKey', apiKey);
    }

    /**
     * Load saved Gemini API key from localStorage
     * @returns {string} Saved API key or empty string
     */
    loadGeminiApiKey() {
        return localStorage.getItem('geminiApiKey') || '';
    }

    /**
     * Set the Ollama API URL
     * @param {string} url - Ollama API endpoint URL
     */
    setOllamaApiUrl(url) {
        this.providers.ollama.setApiUrl(url);
        localStorage.setItem('ollamaApiUrl', url);
    }

    /**
     * Load saved Ollama API URL from localStorage
     * @returns {string} Saved URL or default
     */
    loadOllamaApiUrl() {
        return localStorage.getItem('ollamaApiUrl') || 'http://localhost:11434';
    }

    /**
     * Set and save the active model
     * @param {string} model - 'gemini' or 'ollama' or 'local'
     */
    setActiveModel(model) {
        if (this.providers[model]) {
            this.activeModel = model;
            localStorage.setItem('activeModel', model);
        } else {
            throw new Error(`Unknown model: ${model}`);
        }
    }

    /**
     * Load saved active model from localStorage
     * @returns {string} Saved model or default
     */
    loadActiveModel() {
        return localStorage.getItem('activeModel') || 'local';
    }

    // =============================================================================
    // PROVIDER STATUS METHODS
    // =============================================================================

    /**
     * Check if Gemini API key is configured
     * @returns {boolean} True if API key is available
     */
    hasGeminiApiKey() {
        return this.providers.gemini.isConfigured();
    }

    /**
     * Check if Ollama is configured
     * @returns {boolean} True if Ollama URL is available
     */
    hasOllamaConfig() {
        return this.providers.ollama.isConfigured();
    }

    /**
     * Get the currently active model name
     * @returns {string} Active model display name
     */
    getActiveModelName() {
        return this.providers[this.activeModel]?.getDisplayName() || '❌ Unknown Model';
    }

    /**
     * Check if the current model is ready to use
     * @returns {boolean} True if model is properly configured
     */
    isCurrentModelReady() {
        return this.providers[this.activeModel]?.isConfigured() || false;
    }

    /**
     * Get the current active provider instance
     * @returns {BaseAIProvider} Current provider
     */
    getCurrentProvider() {
        return this.providers[this.activeModel] || this.providers.local;
    }

    // =============================================================================
    // AI OPERATIONS (DELEGATED TO PROVIDERS)
    // =============================================================================

    /**
     * Send chat message to the active AI provider
     * @param {string} message - User message
     * @param {Array} history - Chat history
     * @param {Object} options - Additional options
     * @param {string} options.documentContext - Full document text for context
     * @param {boolean} options.includeSystemMessage - Whether to include system message (default: true)
     * @returns {Promise<Object>} AI response
     */
    async sendChatMessage(message, history = [], options = {}) {
        const provider = this.getCurrentProvider();
        
        console.log('⚡ [API SERVICE] Chat request routing:', {
            activeModel: this.activeModel,
            providerName: provider.getDisplayName(),
            message: message,
            historyLength: history.length,
            hasDocumentContext: !!options.documentContext,
            documentContextLength: options.documentContext ? options.documentContext.length : 0,
            includeSystemMessage: options.includeSystemMessage !== false
        });
        
        // Prepare options with system message and document context
        const chatOptions = {
            systemMessage: options.includeSystemMessage !== false ? this.systemMessage() : undefined,
            documentContext: options.documentContext,
            ...options
        };

        console.log('⚡ [API SERVICE] Final chat options being sent:', {
            hasSystemMessage: !!chatOptions.systemMessage,
            systemMessagePreview: chatOptions.systemMessage ? chatOptions.systemMessage.substring(0, 100) + '...' : 'None',
            hasDocumentContext: !!chatOptions.documentContext,
            documentContextLength: chatOptions.documentContext ? chatOptions.documentContext.length : 0
        });
        
        try {
            return await provider.sendChatMessage(message, history, chatOptions);
        } catch (error) {
            console.error(`${this.activeModel} provider failed, falling back to local:`, error);
            
            // Fallback to local provider if active provider fails
            if (this.activeModel !== 'local') {
                return await this.providers.local.sendChatMessage(message, history, chatOptions);
            }
            throw error;
        }
    }

    /**
     * Get paragraph-specific suggestions from the active AI provider
     * @param {Array} paragraphs - Array of paragraph objects
     * @param {Object} options - Additional options
     * @param {string} options.fullDocumentText - Complete document text for context
     * @param {boolean} options.includeSystemMessage - Whether to include system message (default: true)
     * @returns {Promise<Object>} Suggestions for each paragraph
     */
    async getParagraphSuggestions(paragraphs, options = {}) {
        const provider = this.getCurrentProvider();
        
        console.log('⚡ [API SERVICE] Analysis request routing:', {
            activeModel: this.activeModel,
            providerName: provider.getDisplayName(),
            paragraphCount: paragraphs.length,
            hasFullDocumentText: !!options.fullDocumentText,
            fullDocumentTextLength: options.fullDocumentText ? options.fullDocumentText.length : 0,
            fullDocumentPreview: options.fullDocumentText ? options.fullDocumentText.substring(0, 200) + '...' : 'No full document',
            includeSystemMessage: options.includeSystemMessage !== false
        });
        
        // Prepare options with system message and full document context
        const analysisOptions = {
            systemMessage: options.includeSystemMessage !== false ? this.systemMessage() : undefined,
            fullDocumentText: options.fullDocumentText,
            ...options
        };

        console.log('⚡ [API SERVICE] Final analysis options being sent:', {
            hasSystemMessage: !!analysisOptions.systemMessage,
            systemMessagePreview: analysisOptions.systemMessage ? analysisOptions.systemMessage.substring(0, 100) + '...' : 'None',
            hasFullDocumentText: !!analysisOptions.fullDocumentText,
            fullDocumentTextLength: analysisOptions.fullDocumentText ? analysisOptions.fullDocumentText.length : 0,
            // FULL DOCUMENT TEXT FOR DEBUGGING
            FULL_DOCUMENT_TEXT_DEBUG: analysisOptions.fullDocumentText || 'No full document text'
        });
        
        try {
            return await provider.getParagraphSuggestions(paragraphs, analysisOptions);
        } catch (error) {
            console.error(`${this.activeModel} provider failed, falling back to local:`, error);
            
            // Fallback to local provider if active provider fails
            if (this.activeModel !== 'local') {
                return await this.providers.local.getParagraphSuggestions(paragraphs, analysisOptions);
            }
            throw error;
        }
    }

    // =============================================================================
    // LOCAL PROVIDER SPECIFIC METHODS (BACKWARDS COMPATIBILITY)
    // =============================================================================

    /**
     * Analyze text using the local provider
     * @param {string} text - Text to analyze
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeText(text) {
        return await this.providers.local.analyzeText(text);
    }

    /**
     * Get text suggestions using the local provider
     * @param {string} text - Text to get suggestions for
     * @param {string} context - Context for the suggestions
     * @returns {Promise<Object>} Suggestions response
     */
    async getTextSuggestions(text, context = '') {
        return await this.providers.local.getTextSuggestions(text, context);
    }

    // =============================================================================
    // CONNECTION TESTING
    // =============================================================================

    /**
     * Test connection to Gemini API
     * @returns {Promise<boolean>} Connection status
     */
    async testGeminiConnection() {
        return await this.providers.gemini.testConnection();
    }

    /**
     * Test connection to Ollama API
     * @returns {Promise<boolean>} Connection status
     */
    async testOllamaConnection() {
        return await this.providers.ollama.testConnection();
    }

    /**
     * Test connection to Local API
     * @returns {Promise<boolean>} Connection status
     */
    async testLocalConnection() {
        return await this.providers.local.testConnection();
    }

    /**
     * Test connection for the currently active provider
     * @returns {Promise<boolean>} Connection status
     */
    async testCurrentConnection() {
        const provider = this.getCurrentProvider();
        return await provider.testConnection();
    }
}
