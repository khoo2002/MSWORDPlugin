/**
 * Main Application Entry Point
 * Initializes and coordinates all components of the AI Writing Assistant
 */

// Global application instance
let app = null;

/**
 * Main Application Class
 * Orchestrates the Word Document Manager, API Service, and Chatbot UI
 */
class AIWritingAssistant {
    constructor() {
        this.documentManager = null;
        this.apiService = null;
        this.chatbot = null;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing AI Writing Assistant...');
            
            // Initialize core services
            this.documentManager = new WordDocumentManager();
            this.apiService = new APIService();
            
            // Wait for Office.js to be ready
            await this.documentManager.init();
            
            // Initialize UI components
            this.initializeUI();
            
            // Create chatbot interface with shared API service
            this.chatbot = new ChatbotUI(this.apiService);
            
            // Make chatbot globally accessible for button callbacks
            window.chatbot = this.chatbot;
            
            this.isInitialized = true;
            this.updateStatus('🟢 Ready', 'Connected and ready to assist');
            
            console.log('✅ AI Writing Assistant initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.updateStatus('🔴 Error', 'Initialization failed');
        }
    }

    /**
     * Initialize UI event listeners and components
     */
    initializeUI() {
        // Quick action buttons (now in settings modal)
        const analyzeBtn = document.getElementById('analyzeDocument');
        const greetingBtn = document.getElementById('insertGreeting');
        const clearChatBtn = document.getElementById('clearChat');

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeDocument();
                this.toggleSettingsModal(); // Close modal after action
            });
        }

        if (greetingBtn) {
            greetingBtn.addEventListener('click', () => {
                this.insertGreeting();
                this.toggleSettingsModal(); // Close modal after action
            });
        }

        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                this.clearChat();
                this.toggleSettingsModal(); // Close modal after action
            });
        }

        // Configuration modal setup
        this.setupConfigurationModal();

        // Update last update timestamp
        this.updateLastUpdateTime();
        setInterval(() => this.updateLastUpdateTime(), 60000); // Update every minute
    }

    /**
     * Setup configuration modal for Ollama API
     */
    setupConfigurationModal() {
        // Load saved Ollama URL
        const savedOllamaUrl = this.apiService.loadOllamaApiUrl();
        if (savedOllamaUrl) {
            const urlInput = document.getElementById('ollamaUrl');
            if (urlInput) urlInput.value = savedOllamaUrl;
        }

        // Load saved Gemini API key
        const savedGeminiKey = this.apiService.loadGeminiApiKey();
        if (savedGeminiKey) {
            const keyInput = document.getElementById('geminiApiKey');
            if (keyInput) keyInput.value = savedGeminiKey;
        }

        // Load saved active model and set radio button
        const activeModel = this.apiService.loadActiveModel();
        const modelRadio = document.getElementById(`model${activeModel.charAt(0).toUpperCase() + activeModel.slice(1)}`);
        if (modelRadio) {
            modelRadio.checked = true;
            this.showConfigForModel(activeModel);
        }

        // Setup model selection listeners
        const modelRadios = document.querySelectorAll('input[name="aiModel"]');
        modelRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.showConfigForModel(e.target.value);
                }
            });
        });
    }

    /**
     * Show configuration options for selected model
     * @param {string} model - Selected model ('gemini', 'ollama', 'local')
     */
    showConfigForModel(model) {
        const geminiConfig = document.getElementById('geminiConfig');
        const ollamaConfig = document.getElementById('ollamaConfig');
        const testButton = document.getElementById('testButton');

        // Hide all configs first
        if (geminiConfig) geminiConfig.style.display = 'none';
        if (ollamaConfig) ollamaConfig.style.display = 'none';

        // Show relevant config
        switch (model) {
            case 'gemini':
                if (geminiConfig) geminiConfig.style.display = 'block';
                if (testButton) testButton.textContent = '🧪 Test Gemini';
                break;
            case 'ollama':
                if (ollamaConfig) ollamaConfig.style.display = 'block';
                if (testButton) testButton.textContent = '🧪 Test Ollama';
                break;
            case 'local':
                if (testButton) testButton.textContent = '🧪 Test Local';
                break;
        }
    }

    /**
     * Analyze the entire document
     */
    async analyzeDocument() {
        if (!this.isInitialized) {
            this.showError('Application not initialized');
            return;
        }

        const analyzeBtn = document.getElementById('analyzeDocument');
        const originalText = analyzeBtn?.textContent;
        
        try {
            if (analyzeBtn) {
                analyzeBtn.textContent = '🔄 Analyzing...';
                analyzeBtn.disabled = true;
            }

            // Read document text
            const text = await this.documentManager.readDocumentText();
            
            if (!text.trim()) {
                this.chatbot?.addMessage(
                    'No content found in the document. Please add some text first.',
                    'bot',
                    'warning'
                );
                return;
            }

            // Analyze with API
            const analysis = await this.apiService.analyzeText(text);
            
            // Display results in chat
            const message = `
                📊 <strong>Document Analysis Complete!</strong><br><br>
                📝 <strong>Statistics:</strong><br>
                • Words: ${analysis.wordCount}<br>
                • Characters: ${analysis.characterCount}<br>
                • Sentences: ${analysis.sentenceCount}<br>
                • Paragraphs: ${analysis.paragraphCount}<br><br>
                📄 <strong>Preview:</strong><br>
                "${analysis.preview}"<br><br>
                💡 Use "Analyze Paragraphs" for detailed suggestions!
            `;
            
            this.chatbot?.addMessage(message, 'bot', 'success');
            
        } catch (error) {
            this.showError(`Analysis failed: ${error.message}`);
        } finally {
            if (analyzeBtn) {
                analyzeBtn.textContent = originalText;
                analyzeBtn.disabled = false;
            }
        }
    }

    /**
     * Insert a greeting message into the document
     */
    async insertGreeting() {
        if (!this.isInitialized) {
            this.showError('Application not initialized');
            return;
        }

        try {
            const greeting = `Hello from your AI Writing Assistant! 
            
This document is being enhanced with intelligent analysis and suggestions. The AI can help you:
• Improve clarity and readability
• Fix grammar and style issues
• Enhance vocabulary and sentence structure
• Provide writing suggestions

Generated on: ${new Date().toLocaleString()}`;

            await this.documentManager.insertText(greeting);
            
            this.chatbot?.addMessage(
                '👋 Greeting inserted successfully! The text has been added to your document.',
                'bot',
                'success'
            );
            
        } catch (error) {
            this.showError(`Failed to insert greeting: ${error.message}`);
        }
    }

    /**
     * Clear chat history
     */
    clearChat() {
        if (this.chatbot) {
            this.chatbot.clearChat();
            
            // Add welcome message
            this.chatbot.addMessage(
                'Chat cleared! I\'m ready to help you with your document analysis and improvements.',
                'bot'
            );
        }
    }

    /**
     * Toggle settings modal
     */
    toggleSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
        }
    }

    /**
     * Save configuration settings
     */
    saveConfiguration() {
        const urlInput = document.getElementById('ollamaUrl');
        const keyInput = document.getElementById('geminiApiKey');
        const selectedModel = document.querySelector('input[name="aiModel"]:checked');
        
        const ollamaUrl = urlInput?.value.trim();
        const geminiKey = keyInput?.value.trim();
        const activeModel = selectedModel?.value || 'local';
        
        let savedItems = [];
        
        // Save selected model
        this.apiService.setActiveModel(activeModel);
        savedItems.push(`Active model: ${this.apiService.getActiveModelName()}`);
        
        // Save Ollama URL if provided
        if (ollamaUrl) {
            this.apiService.setOllamaApiUrl(ollamaUrl);
            savedItems.push('Ollama URL');
        }
        
        // Save Gemini API Key if provided
        if (geminiKey) {
            this.apiService.setGeminiApiKey(geminiKey);
            savedItems.push('Gemini API key');
        }
        
        // Update chatbot to reflect new model
        if (this.chatbot) {
            this.chatbot.clearChat();
            this.chatbot.refreshWelcomeMessage();
        }
        
        this.chatbot?.addMessage(
            `⚙️ Configuration saved: ${savedItems.join(', ')}`,
            'bot',
            'success'
        );
        
        this.toggleSettingsModal();
    }

    /**
     * Test connection based on selected model
     */
    async testConnection() {
        const selectedModel = document.querySelector('input[name="aiModel"]:checked');
        const activeModel = selectedModel?.value || this.apiService.activeModel;
        
        switch (activeModel) {
            case 'gemini':
                return this.testGeminiConnection();
            case 'ollama':
                return this.testOllamaConnection();
            case 'local':
                return this.testLocalConnection();
            default:
                this.showError('Unknown model selected');
        }
    }

    /**
     * Test connection to Ollama API
     */
    async testOllamaConnection() {
        const urlInput = document.getElementById('ollamaUrl');
        const url = urlInput?.value.trim();
        
        if (!url) {
            this.showError('Please enter an Ollama API URL first');
            return;
        }

        try {
            // Temporarily set the URL for testing
            this.apiService.setOllamaApiUrl(url);
            const connected = await this.apiService.testOllamaConnection();
            
            if (connected) {
                this.chatbot?.addMessage(
                    '✅ Ollama connection successful!',
                    'bot',
                    'success'
                );
            } else {
                this.chatbot?.addMessage(
                    '❌ Ollama connection failed. Please check the URL and ensure Ollama is running.',
                    'bot',
                    'error'
                );
            }
        } catch (error) {
            this.showError(`Ollama connection test failed: ${error.message}`);
        }
    }

    /**
     * Test local server connection
     */
    async testLocalConnection() {
        try {
            const response = await this.apiService.makeRequest(`${this.apiService.baseUrl}/chat`, {
                method: 'POST',
                body: JSON.stringify({ 
                    message: 'test', 
                    history: [] 
                })
            });
            
            this.chatbot?.addMessage(
                '✅ Local server connection successful!',
                'bot',
                'success'
            );
        } catch (error) {
            this.chatbot?.addMessage(
                '❌ Local server connection failed. Please ensure the server is running.',
                'bot',
                'error'
            );
        }
    }

    /**
     * Test connection to Gemini API
     */
    async testGeminiConnection() {
        const keyInput = document.getElementById('geminiApiKey');
        const apiKey = keyInput?.value.trim();
        
        if (!apiKey) {
            this.showError('Please enter a Gemini API key first');
            return;
        }

        try {
            // Temporarily set the API key for testing
            const originalKey = this.apiService.geminiApiKey;
            this.apiService.setGeminiApiKey(apiKey);
            
            const connected = await this.apiService.testGeminiConnection();
            
            if (connected) {
                this.chatbot?.addMessage(
                    '✅ Gemini API connection successful! You can now use AI-powered features.',
                    'bot',
                    'success'
                );
            } else {
                this.chatbot?.addMessage(
                    '❌ Gemini API connection failed. Please check your API key and try again.',
                    'bot',
                    'error'
                );
                // Restore original key on failure
                this.apiService.setGeminiApiKey(originalKey);
            }
        } catch (error) {
            this.showError(`Gemini connection test failed: ${error.message}`);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        console.error('Application Error:', message);
        
        if (this.chatbot) {
            this.chatbot.addMessage(message, 'bot', 'error');
        } else {
            alert(`Error: ${message}`);
        }
    }

    /**
     * Update application status
     * @param {string} status - Status text
     * @param {string} detail - Detail text for tooltip
     */
    updateStatus(status, detail = '') {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.title = detail;
        }
    }

    /**
     * Update last update timestamp
     */
    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        }
    }
}

// Global functions for HTML onclick handlers
window.toggleSettingsModal = () => app?.toggleSettingsModal();
window.saveConfiguration = () => app?.saveConfiguration();
window.testConnection = () => app?.testConnection();

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new AIWritingAssistant();
});

// Export for debugging in console
window.app = app;
