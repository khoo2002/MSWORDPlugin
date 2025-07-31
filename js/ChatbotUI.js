/**
 * ChatbotUI - Main UI controller for the AI Writing Assistant
 * Handles chat interface, document analysis, and suggestion management
 */
class ChatbotUI {
    constructor(apiService = null) {
        // Core services
        this.apiService = apiService || new APIService();
        this.documentManager = new WordDocumentManager();
        
        // State management
        this.chatHistory = [];
        this.currentSuggestions = [];
        
        // Initialize the UI
        this.init();
    }

    // =============================================================================
    // INITIALIZATION METHODS
    // =============================================================================

    /**
     * Initialize the ChatbotUI
     */
    init() {
        this.renderChatInterface();
        this.bindEvents();
    }

    /**
     * Render the main chat interface
     */
    renderChatInterface() {
        const container = document.getElementById('chatbot-container');
        if (!container) return;
        
        container.innerHTML = this.getChatInterfaceTemplate();
    }

    /**
     * Get the HTML template for the chat interface
     * @returns {string} Chat interface HTML
     */
    getChatInterfaceTemplate() {
        return `
            <div class="chat-header">
                <h4>🤖 AI Assistant</h4>
                <button id="analyzeParagraphs" class="btn-analyze">📝 Analyze</button>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                ${this.getWelcomeMessage()}
            </div>

            <div class="chat-input-container">
                <div class="input-group">
                    <button id="settingsButton" class="btn-settings" title="Settings & Actions">
                        ⚙️
                    </button>
                    <input type="text" id="chatInput" placeholder="Ask about your document..." />
                    <button id="sendMessage" class="btn-send" title="Send Message">
                        ➤
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get welcome message HTML
     * @returns {string} Welcome message HTML
     */
    getWelcomeMessage() {
        const aiStatus = this.apiService.getActiveModelName();
        const modelReady = this.apiService.isCurrentModelReady();
        const statusIcon = modelReady ? '✅' : '⚠️';
            
        return `
            <div class="message bot-message">
                <div class="message-content">
                    Hello! I can help you:
                    <br>• 📊 Analyze document
                    <br>• ✨ Suggest improvements  
                    <br>• 💬 Answer questions
                    <br><br>${statusIcon} <strong>Active AI:</strong> ${aiStatus}
                    <br><br>Click "Analyze" to start, or use ⚙️ for more options!
                </div>
                <div class="message-time">${this.getCurrentTime()}</div>
            </div>
        `;
    }

    /**
     * Bind event listeners to UI elements
     */
    bindEvents() {
        const elements = this.getUIElements();
        
        // Send message events
        elements.sendButton?.addEventListener('click', () => this.sendMessage());
        elements.chatInput?.addEventListener('keypress', (e) => this.handleChatInputKeypress(e));
        
        // Analysis and settings events
        elements.analyzeButton?.addEventListener('click', () => this.analyzeParagraphs());
        elements.settingsButton?.addEventListener('click', () => window.toggleSettingsModal());
    }

    /**
     * Get UI elements for event binding
     * @returns {Object} Object containing UI elements
     */
    getUIElements() {
        return {
            sendButton: document.getElementById('sendMessage'),
            chatInput: document.getElementById('chatInput'),
            analyzeButton: document.getElementById('analyzeParagraphs'),
            settingsButton: document.getElementById('settingsButton')
        };
    }

    /**
     * Handle chat input keypress events
     * @param {KeyboardEvent} event - The keypress event
     */
    handleChatInputKeypress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    // =============================================================================
    // PUBLIC API METHODS
    // =============================================================================

    /**
     * Send a chat message
     */
    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput?.value?.trim();
        
        if (!message) return;

        try {
            // Disable previous suggestions and clear input
            this.disableAllSuggestionButtons();
            chatInput.value = '';

            // Add user message and show typing indicator
            this.addMessage(message, 'user');
            const typingId = this.showTypingIndicator();

            // Get AI response
            const response = await this.apiService.sendChatMessage(message, this.chatHistory);
            
            // Remove typing indicator and show response
            this.removeTypingIndicator(typingId);
            this.addMessage(response.message, 'bot');
            
            // Update chat history
            this.updateChatHistory(message, response.message);

        } catch (error) {
            this.handleSendMessageError(error);
        }
    }

    /**
     * Analyze paragraphs in the document
     */
    async analyzeParagraphs() {
        const analyzeButton = document.getElementById('analyzeParagraphs');
        if (!analyzeButton) return;

        const originalText = analyzeButton.textContent;
        
        try {
            // Setup analysis state
            this.setAnalysisState(analyzeButton, true);
            this.disableAllSuggestionButtons();

            // Perform document analysis
            const paragraphs = await this.documentManager.readParagraphs();
            this.validateParagraphs(paragraphs);

            const suggestions = await this.apiService.getParagraphSuggestions(paragraphs);
            this.displayAnalysisResults(paragraphs, suggestions.suggestions);

        } catch (error) {
            this.addMessage(`Error analyzing paragraphs: ${error.message}`, 'bot', 'error');
        } finally {
            this.setAnalysisState(analyzeButton, false, originalText);
        }
    }

    /**
     * Show suggestion in Word document with side-by-side highlighting
     * @param {string} suggestionUniqueId - Unique ID of the suggestion to show
     */
    async showSuggestionInDocument(suggestionUniqueId) {
        const suggestion = this.findSuggestionById(suggestionUniqueId);
        if (!suggestion) return;

        try {
            // Insert and display suggestion in document
            const result = await this.documentManager.insertSuggestionAfterParagraph(
                suggestion.paragraphIndex,
                suggestion.originalText,
                suggestion.suggestedText
            );

            await this.documentManager.navigateToParagraph(suggestion.paragraphIndex);
            suggestion.documentIndices = result;

            // Update UI to show approve/reject buttons
            this.updateSuggestionActions(suggestionUniqueId);

        } catch (error) {
            this.addMessage(`❌ Error showing suggestion: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Apply a suggestion to the document
     * @param {string} suggestionUniqueId - Unique ID of the suggestion to apply
     */
    async applySuggestion(suggestionUniqueId) {
        const suggestion = this.findSuggestionById(suggestionUniqueId);
        if (!suggestion?.documentIndices) return;

        try {
            await this.documentManager.applySuggestionInDocument(
                suggestion.documentIndices.originalIndex,
                suggestion.documentIndices.suggestedIndex,
                suggestion.suggestedText
            );
            
            this.showActionResult(suggestionUniqueId, 'approved', 
                `Applied suggestion for paragraph ${suggestion.paragraphIndex + 1}`);
            
        } catch (error) {
            this.addMessage(`❌ Error applying suggestion: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Reject a suggestion
     * @param {string} suggestionUniqueId - Unique ID of the suggestion to reject
     */
    async rejectSuggestion(suggestionUniqueId) {
        const suggestion = this.findSuggestionById(suggestionUniqueId);
        if (!suggestion?.documentIndices) return;
        
        try {
            await this.documentManager.removeSuggestion(
                suggestion.documentIndices.originalIndex,
                suggestion.documentIndices.suggestedIndex
            );
            
            this.showActionResult(suggestionUniqueId, 'rejected', 
                `Rejected suggestion for paragraph ${suggestion.paragraphIndex + 1}`);
                
        } catch (error) {
            this.addMessage(`❌ Error rejecting suggestion: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Add a message to the chat
     * @param {string} content - Message content
     * @param {string} sender - 'user' or 'bot'
     * @param {string} type - Message type for styling
     */
    addMessage(content, sender, type = '') {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageElement = this.createMessageElement(content, sender, type);
        chatMessages.appendChild(messageElement);
        this.scrollToBottom(chatMessages);
    }

    /**
     * Clear chat history
     */
    clearChat() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = this.getWelcomeMessage();
        }
        this.chatHistory = [];
        this.currentSuggestions = [];
    }

    /**
     * Refresh the welcome message (useful when model configuration changes)
     */
    refreshWelcomeMessage() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages && chatMessages.children.length === 1) {
            // Only refresh if there's only the welcome message
            chatMessages.innerHTML = this.getWelcomeMessage();
        }
    }

    // =============================================================================
    // HELPER METHODS - Analysis and Display
    // =============================================================================

    /**
     * Display comprehensive analysis results
     * @param {Array} paragraphs - Array of document paragraphs
     * @param {Array} suggestions - Array of suggestions
     */
    displayAnalysisResults(paragraphs, suggestions) {
        // Store suggestions for interaction
        this.currentSuggestions = suggestions;
        
        // Create comprehensive analysis message
        let analysisContent = `📊 **Document Analysis Complete**\n\n`;
        analysisContent += `📄 Found ${paragraphs.length} paragraphs\n`;
        analysisContent += `✨ Generated ${suggestions.length} suggestions for improvement\n\n`;
        
        if (suggestions.length > 0) {
            analysisContent += `**Suggestions:**\n`;
            
            // Add all suggestions in a single response
            suggestions.forEach((suggestion, index) => {
                // Create unique identifier for this suggestion
                suggestion.uniqueId = `suggestion_${Date.now()}_${index}`;
                
                analysisContent += `\n---\n`;
                analysisContent += `<div class="suggestion-chat-item" data-index="${index}" data-unique-id="${suggestion.uniqueId}">
                    <div class="suggestion-chat-header">
                        <strong>📝 Paragraph ${suggestion.paragraphIndex + 1}</strong>
                        <span class="suggestion-type-badge ${suggestion.type}">${suggestion.type}</span>
                    </div>
                    
                    <div class="suggestion-reason">
                        💡 ${suggestion.reason}
                    </div>
                    
                    <div class="suggestion-chat-actions" id="actions-${suggestion.uniqueId}">
                        <button class="btn-chat-show" onclick="chatbot.showSuggestionInDocument('${suggestion.uniqueId}')" title="Show suggestion in document">
                            👁️ Show in Document
                        </button>
                    </div>
                </div>`;
            });
            
            analysisContent += `\n---\n\n✨ Click "Show in Document" to see each suggestion highlighted in your document.`;
        } else {
            analysisContent += `✅ Your document looks good! No suggestions at this time.`;
        }
        
        // Add the comprehensive analysis as a single bot message
        this.addMessage(analysisContent, 'bot', 'analysis');
    }

    /**
     * Disable all suggestion buttons from previous interactions
     */
    disableAllSuggestionButtons() {
        // Find all suggestion action containers
        const allActionContainers = document.querySelectorAll('[id^="actions-suggestion_"]');
        
        allActionContainers.forEach(container => {
            // Skip if already completed
            if (container.classList.contains('completed')) return;
            
            // Disable all buttons in this container
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            });
            
            // Add a disabled state indicator
            const disabledNote = document.createElement('div');
            disabledNote.className = 'suggestion-disabled-note';
            disabledNote.innerHTML = '⏸️ <em>Disabled - New analysis started</em>';
            disabledNote.style.fontSize = '0.55rem';
            disabledNote.style.color = '#6c757d';
            disabledNote.style.textAlign = 'center';
            disabledNote.style.marginTop = '4px';
            disabledNote.style.fontStyle = 'italic';
            
            container.appendChild(disabledNote);
        });
    }

    // =============================================================================
    // HELPER METHODS - Utilities
    // =============================================================================

    /**
     * Get current time formatted string
     * @returns {string} Formatted time string
     */
    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Update chat history with user and assistant messages
     * @param {string} userMessage - User's message
     * @param {string} assistantMessage - Assistant's response
     */
    updateChatHistory(userMessage, assistantMessage) {
        this.chatHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: assistantMessage }
        );
    }

    /**
     * Handle errors that occur during message sending
     * @param {Error} error - The error that occurred
     */
    handleSendMessageError(error) {
        const typingId = this.findTypingIndicator();
        if (typingId) this.removeTypingIndicator(typingId);
        this.addMessage(`Sorry, I encountered an error: ${error.message}`, 'bot', 'error');
    }

    /**
     * Set analysis button state
     * @param {HTMLElement} button - The analyze button element
     * @param {boolean} isAnalyzing - Whether analysis is in progress
     * @param {string} originalText - Original button text to restore
     */
    setAnalysisState(button, isAnalyzing, originalText = '📝 Analyze') {
        if (isAnalyzing) {
            button.textContent = '🔄 Analyzing...';
            button.disabled = true;
        } else {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    /**
     * Validate that paragraphs were found in the document
     * @param {Array} paragraphs - Array of paragraph objects
     * @throws {Error} If no paragraphs are found
     */
    validateParagraphs(paragraphs) {
        if (!paragraphs || paragraphs.length === 0) {
            throw new Error('No paragraphs found in the document. Please add some content first.');
        }
    }

    /**
     * Find suggestion by unique ID
     * @param {string} uniqueId - The unique identifier
     * @returns {Object|null} The suggestion object or null if not found
     */
    findSuggestionById(uniqueId) {
        return this.currentSuggestions.find(s => s.uniqueId === uniqueId) || null;
    }

    /**
     * Update suggestion action buttons to show approve/reject
     * @param {string} suggestionUniqueId - Unique ID of the suggestion
     */
    updateSuggestionActions(suggestionUniqueId) {
        const actionsElement = document.getElementById(`actions-${suggestionUniqueId}`);
        if (!actionsElement) return;

        actionsElement.innerHTML = `
            <button class="btn-chat-accept" onclick="chatbot.applySuggestion('${suggestionUniqueId}')" title="Apply suggestion">
                ✅ Approve
            </button>
            <button class="btn-chat-reject" onclick="chatbot.rejectSuggestion('${suggestionUniqueId}')" title="Reject suggestion">
                ❌ Reject
            </button>
        `;
    }

    /**
     * Show the final action result
     * @param {string} suggestionUniqueId - Unique ID of the suggestion
     * @param {string} actionType - 'approved' or 'rejected'
     * @param {string} actionDescription - Description of what was done
     */
    showActionResult(suggestionUniqueId, actionType, actionDescription) {
        const actionsElement = document.getElementById(`actions-${suggestionUniqueId}`);
        if (!actionsElement) return;

        const iconClass = actionType === 'approved' ? 'action-approved' : 'action-rejected';
        const icon = actionType === 'approved' ? '✅' : '❌';
        
        actionsElement.innerHTML = `
            <div class="suggestion-action-result ${iconClass}">
                ${icon} ${actionDescription}
            </div>
        `;
        actionsElement.classList.add('completed');
    }

    /**
     * Create a message element
     * @param {string} content - Message content
     * @param {string} sender - 'user' or 'bot'
     * @param {string} type - Message type for styling
     * @returns {HTMLElement} The created message element
     */
    createMessageElement(content, sender, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${this.getCurrentTime()}</div>
        `;
        return messageDiv;
    }

    /**
     * Scroll chat messages to bottom
     * @param {HTMLElement} chatMessages - The chat messages container
     */
    scrollToBottom(chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Show typing indicator
     * @returns {string} Indicator ID for removal
     */
    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return null;

        const typingDiv = document.createElement('div');
        const typingId = 'typing-' + Date.now();
        
        typingDiv.id = typingId;
        typingDiv.className = 'message bot-message typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        this.scrollToBottom(chatMessages);
        
        return typingId;
    }

    /**
     * Remove typing indicator
     * @param {string} typingId - ID of the typing indicator to remove
     */
    removeTypingIndicator(typingId) {
        if (!typingId) return;
        const typingElement = document.getElementById(typingId);
        typingElement?.remove();
    }

    /**
     * Find existing typing indicator
     * @returns {string|null} Typing indicator ID or null
     */
    findTypingIndicator() {
        const typingElement = document.querySelector('.typing');
        return typingElement?.id || null;
    }
}
