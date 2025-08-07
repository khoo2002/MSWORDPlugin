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
        const insertTableBtn = document.getElementById('insertTable');
        const insertAdvancedTableBtn = document.getElementById('insertAdvancedTable');
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

        if (insertTableBtn) {
            insertTableBtn.addEventListener('click', () => {
                this.insertTable();
                this.toggleSettingsModal(); // Close modal after action
            });
        }

        if (insertAdvancedTableBtn) {
            insertAdvancedTableBtn.addEventListener('click', () => {
                this.insertAdvancedMalaysianTable();
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

        // Load saved system message
        const savedSystemMessage = this.apiService.systemMessage();
        if (savedSystemMessage) {
            const systemInput = document.getElementById('systemMessage');
            if (systemInput) systemInput.value = savedSystemMessage;
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
     * Insert a sample table into the document
     */
    async insertTable() {
        try {
            this.chatbot?.addMessage(
                '📋 Inserting table into document...',
                'bot',
                'info'
            );

            await this.documentManager.insertTable();
            
            this.chatbot?.addMessage(
                '� Malaysian Statistics Table inserted successfully! STATISTIK PENURUNAN KANDUNGAN 3R has been added to your document with proper government formatting.',
                'bot',
                'success'
            );
            
        } catch (error) {
            this.showError(`Failed to insert table: ${error.message}`);
        }
    }

    /**
     * Insert an advanced Malaysian statistics table with complex structure
     */
    async insertAdvancedMalaysianTable() {
        try {
            this.chatbot?.addMessage(
                '📊 Inserting advanced Malaysian statistics table with merged cells and professional formatting...',
                'bot',
                'info'
            );

            // Create the advanced Malaysian statistics table structure
            const malaysianTableStructure = {
                id: 'malaysian_stats_' + Date.now(),
                title: "STATISTIK PENURUNAN KANDUNGAN 3R",
                metadata: {
                    source: "MCMC Malaysia",
                    description: "Perincian penurunan kandungan 3R dari tahun 2022 hingga 2025",
                    dateRange: "2022-2025",
                    lastUpdated: "31 Julai 2025",
                    category: "Government Statistics"
                },
                structure: {
                    headerLevels: [
                        // Main headers
                        {
                            cells: [
                                { text: "No.", rowspan: 2, alignment: "center" },
                                { text: "Tahun", rowspan: 2, alignment: "center" },
                                { text: "Penurunan Kandungan 3R", colspan: 3, alignment: "center" },
                                { text: "Col5", rowspan: 2, alignment: "center" },
                                { text: "Col6", rowspan: 2, alignment: "center" }
                            ]
                        },
                        // Sub headers
                        {
                            cells: [
                                { text: "Agama", alignment: "center", style: "subheader" },
                                { text: "Kaum", alignment: "center", style: "subheader" },
                                { text: "Raja", alignment: "center", style: "subheader" }
                            ]
                        }
                    ],
                    dataRows: [
                        {
                            cells: [
                                { value: "1.", displayText: "1.", alignment: "center" },
                                { value: "2022", displayText: "2022", alignment: "center" },
                                { value: "40", displayText: "40", alignment: "right", dataType: "number" },
                                { value: "119", displayText: "119", alignment: "right", dataType: "number" },
                                { value: "16", displayText: "16", alignment: "right", dataType: "number" },
                                { value: "175.0", displayText: "175.0", alignment: "right", dataType: "number" },
                                { value: "422.0", displayText: "422.0", alignment: "right", dataType: "number" }
                            ]
                        },
                        {
                            cells: [
                                { value: "2.", displayText: "2.", alignment: "center" },
                                { value: "2023", displayText: "2023", alignment: "center" },
                                { value: "519", displayText: "519", alignment: "right", dataType: "number" },
                                { value: "960", displayText: "960", alignment: "right", dataType: "number" },
                                { value: "154", displayText: "154", alignment: "right", dataType: "number" },
                                { value: "1633.0", displayText: "1633.0", alignment: "right", dataType: "number" },
                                { value: "3396.0", displayText: "3396.0", alignment: "right", dataType: "number" }
                            ]
                        },
                        {
                            cells: [
                                { value: "3.", displayText: "3.", alignment: "center" },
                                { value: "2024", displayText: "2024", alignment: "center" },
                                { value: "1772", displayText: "1772", alignment: "right", dataType: "number" },
                                { value: "2670", displayText: "2670", alignment: "right", dataType: "number" },
                                { value: "388", displayText: "388", alignment: "right", dataType: "number" },
                                { value: "4830.0", displayText: "4830.0", alignment: "right", dataType: "number" },
                                { value: "13805.0", displayText: "13805.0", alignment: "right", dataType: "number" }
                            ]
                        },
                        {
                            cells: [
                                { value: "4.", displayText: "4.", alignment: "center" },
                                { value: "2025", displayText: "2025", alignment: "center" },
                                { value: "148", displayText: "148", alignment: "right", dataType: "number" },
                                { value: "992", displayText: "992", alignment: "right", dataType: "number" },
                                { value: "76", displayText: "76", alignment: "right", dataType: "number" },
                                { value: "1216.0", displayText: "1216.0", alignment: "right", dataType: "number" },
                                { value: "25962.0", displayText: "25962.0", alignment: "right", dataType: "number" }
                            ]
                        }
                    ],
                    summaryRows: [
                        {
                            label: "Jumlah",
                            cells: [
                                { value: "Jumlah", displayText: "Jumlah", alignment: "center", style: "summary" },
                                { value: "", displayText: "", alignment: "center" },
                                { value: "2479", displayText: "2479", alignment: "right", style: "summary", isCalculated: true },
                                { value: "4741", displayText: "4741", alignment: "right", style: "summary", isCalculated: true },
                                { value: "634", displayText: "634", alignment: "right", style: "summary", isCalculated: true },
                                { value: "7854", displayText: "7854", alignment: "right", style: "summary", isCalculated: true },
                                { value: "43585.0", displayText: "43585.0", alignment: "right", style: "summary", isCalculated: true }
                            ]
                        }
                    ]
                },
                formatting: {
                    headerStyle: {
                        bold: true,
                        backgroundColor: "#2F5597",
                        textColor: "#FFFFFF",
                        borderStyle: "solid",
                        borderWidth: "2px"
                    },
                    subHeaderStyle: {
                        bold: true,
                        backgroundColor: "#E6F3FF",
                        textColor: "#000000",
                        borderStyle: "solid",
                        borderWidth: "1px"
                    },
                    dataStyle: {
                        backgroundColor: "#FFFFFF",
                        textColor: "#000000",
                        borderStyle: "solid",
                        borderWidth: "1px"
                    },
                    summaryStyle: {
                        bold: true,
                        backgroundColor: "#F0F8FF",
                        textColor: "#000000",
                        borderStyle: "double",
                        borderWidth: "3px"
                    }
                },
                renderingStrategy: "html_insertion"
            };

            // Insert the advanced table
            await this.documentManager.insertCustomTable(malaysianTableStructure);
            
            this.chatbot?.addMessage(
                '🎉 Advanced Malaysian Statistics Table inserted successfully! This table includes merged headers, professional formatting, and complex structure matching government document standards.',
                'bot',
                'success'
            );
            
        } catch (error) {
            this.showError(`Failed to insert advanced Malaysian table: ${error.message}`);
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
        const systemInput = document.getElementById('systemMessage');
        const selectedModel = document.querySelector('input[name="aiModel"]:checked');
        
        const ollamaUrl = urlInput?.value.trim();
        const geminiKey = keyInput?.value.trim();
        const systemMessage = systemInput?.value.trim();
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
        
        // Save system message
        if (systemMessage) {
            this.apiService.systemMessage(systemMessage);
            savedItems.push('System instructions');
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
window.toggleTablesModal = () => {
    const modal = document.getElementById('tablesModal');
    if (modal) {
        modal.style.display = modal.style.display === 'none' || !modal.style.display ? 'block' : 'none';
    }
};
window.saveConfiguration = () => app?.saveConfiguration();
window.testConnection = () => app?.testConnection();

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new AIWritingAssistant();
    
    // Setup modal close functionality
    window.onclick = (event) => {
        const settingsModal = document.getElementById('settingsModal');
        const tablesModal = document.getElementById('tablesModal');
        
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        if (event.target === tablesModal) {
            tablesModal.style.display = 'none';
        }
    };
});

// Export for debugging in console
window.app = app;
