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
            
            // Create chatbot interface
            this.chatbot = new ChatbotUI();
            
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
        // Add configuration button to header (if not exists)
        // const header = document.querySelector('.app-header');
        // if (header && !document.getElementById('configBtn')) {
        //     const configBtn = document.createElement('button');
        //     configBtn.id = 'configBtn';
        //     configBtn.className = 'btn btn-outline';
        //     configBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; padding: 5px 10px; font-size: 0.8rem;';
        //     configBtn.innerHTML = '⚙️ Config';
        //     configBtn.onclick = () => this.toggleConfigModal();
        //     header.style.position = 'relative';
        //     header.appendChild(configBtn);
        // }

        // Load saved Ollama URL
        const savedUrl = localStorage.getItem('ollamaApiUrl');
        if (savedUrl) {
            this.apiService.setOllamaApiUrl(savedUrl);
            const urlInput = document.getElementById('ollamaUrl');
            if (urlInput) urlInput.value = savedUrl;
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
        const url = urlInput?.value.trim();
        
        if (url) {
            this.apiService.setOllamaApiUrl(url);
            localStorage.setItem('ollamaApiUrl', url);
            
            this.chatbot?.addMessage(
                `⚙️ Ollama API URL saved: ${url}`,
                'bot',
                'success'
            );
        }
        
        this.toggleSettingsModal();
    }

    /**
     * Test connection to Ollama API
     */
    async testConnection() {
        const urlInput = document.getElementById('ollamaUrl');
        const url = urlInput?.value.trim();
        
        if (!url) {
            this.showError('Please enter an Ollama API URL first');
            return;
        }

        try {
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
                    '❌ Ollama connection failed. Please check the URL and try again.',
                    'bot',
                    'error'
                );
            }
        } catch (error) {
            this.showError(`Connection test failed: ${error.message}`);
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
