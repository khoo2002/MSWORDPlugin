/**
 * ChatbotUI - Main UI controller for the Writing Assistant
 * Handles chat interface, document analysis, and suggestion management
 * Follows strict OOP principles with proper encapsulation and separation of concerns
 */
class ChatbotUI {
    // Private fields for encapsulation
    #apiService;
    #documentManager;
    #chatHistory;
    #currentSuggestions;
    #paragraphMapping;
    #isInitialized;

    constructor(apiService = null) {
        // Initialize private fields
        this.#apiService = apiService || new APIService();
        this.#documentManager = new WordDocumentManager();
        this.#chatHistory = [];
        this.#currentSuggestions = [];
        this.#paragraphMapping = [];
        this.#isInitialized = false;
        
        // Initialize the UI
        this.init();
    }

    // =============================================================================
    // PUBLIC API METHODS
    // =============================================================================

    /**
     * Initialize the ChatbotUI
     * @public
     */
    init() {
        if (this.#isInitialized) {
            console.warn('ChatbotUI already initialized');
            return;
        }

        this._renderChatInterface();
        this._bindEvents();
        this.#isInitialized = true;
    }

    /**
     * Send a chat message
     * @public
     */
    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput?.value?.trim();
        
        if (!message) return;

        try {
            await this._processChatMessage(message, chatInput);
        } catch (error) {
            this._handleSendMessageError(error);
        }
    }

    /**
     * Analyze paragraphs in the document
     * @public
     */
    async analyzeParagraphs() {
        const analyzeButton = document.getElementById('analyzeParagraphs');
        if (!analyzeButton) return;

        const originalText = analyzeButton.textContent;
        
        try {
            this._setAnalysisState(analyzeButton, true);
            await this._performDocumentAnalysis();
        } catch (error) {
            this.addMessage(`Error analyzing paragraphs: ${error.message}`, 'bot', 'error');
        } finally {
            this._setAnalysisState(analyzeButton, false, originalText);
        }
    }

    /**
     * Add a message to the chat
     * @public
     * @param {string} content - Message content
     * @param {string} sender - 'user' or 'bot'
     * @param {string} type - Message type for styling
     * @param {Array} sources - Optional array of source URLs/references for bot messages
     */
    addMessage(content, sender, type = '', sources = []) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageElement = this._createMessageElement(content, sender, type, sources);
        chatMessages.appendChild(messageElement);
        this._scrollToBottom(chatMessages);
    }

    /**
     * Clear chat history
     * @public
     */
    clearChat() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = this._getWelcomeMessage();
        }
        this.#chatHistory = [];
        this.#currentSuggestions = [];
    }

    /**
     * Refresh the welcome message
     * @public
     */
    refreshWelcomeMessage() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages && chatMessages.children.length === 1) {
            chatMessages.innerHTML = this._getWelcomeMessage();
        }
    }

    /**
     * Show tables modal with table templates for insertion
     * @public
     */
    async showTablesModal() {
        try {
            const { modal, container } = this._getTablesModalElements();
            if (!modal || !container) return;
            
            modal.style.display = 'block';
            this._showTablesLoadingState(container);
            
            const tableTemplates = await this._getTableTemplates();
            this._renderTableTemplates(tableTemplates);
            this._setupTableTemplatesSearch(tableTemplates);
            
        } catch (error) {
            this._handleTablesModalError(error);
        }
    }

    // =============================================================================
    // SUGGESTION MANAGEMENT METHODS
    // =============================================================================

    /**
     * Show suggestion in Word document with side-by-side highlighting
     * @public
     * @param {string} suggestionUniqueId - Unique ID of the suggestion to show
     */
    async showSuggestionInDocument(suggestionUniqueId) {
        const suggestion = this._findSuggestionById(suggestionUniqueId);
        if (!suggestion) return;

        try {
            await this._displaySuggestionInDocument(suggestion);
            this._updateSuggestionActions(suggestionUniqueId);
        } catch (error) {
            this.addMessage(`❌ Error showing suggestion: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Apply a suggestion to the document
     * @public
     * @param {string} suggestionUniqueId - Unique ID of the suggestion to apply
     */
    async applySuggestion(suggestionUniqueId) {
        const suggestion = this._findSuggestionById(suggestionUniqueId);
        if (!suggestion?.documentIndices) return;

        try {
            await this._applySuggestionToDocument(suggestion);
            const originalParagraphIndex = this._getOriginalParagraphIndex(suggestion.paragraphIndex);
            this._showActionResult(suggestionUniqueId, 'approved', 
                `Applied suggestion for paragraph ${originalParagraphIndex + 1}`);
        } catch (error) {
            this.addMessage(`❌ Error applying suggestion: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Reject a suggestion
     * @public
     * @param {string} suggestionUniqueId - Unique ID of the suggestion to reject
     */
    async rejectSuggestion(suggestionUniqueId) {
        const suggestion = this._findSuggestionById(suggestionUniqueId);
        if (!suggestion?.documentIndices) return;
        
        try {
            await this._rejectSuggestionInDocument(suggestion);
            const originalParagraphIndex = this._getOriginalParagraphIndex(suggestion.paragraphIndex);
            this._showActionResult(suggestionUniqueId, 'rejected', 
                `Rejected suggestion for paragraph ${originalParagraphIndex + 1}`);
        } catch (error) {
            this.addMessage(`❌ Error rejecting suggestion: ${error.message}`, 'bot', 'error');
        }
    }

    // =============================================================================
    // TABLE MANAGEMENT METHODS
    // =============================================================================

    /**
     * Insert a table template into the document
     * @public
     * @param {string} templateId - ID of the template to insert
     */
    async insertTableTemplate(templateId) {
        try {
            const templates = await this._getTableTemplates();
            const template = templates.find(t => t.id === templateId);
            
            if (!template) {
                throw new Error('Template not found');
            }

            this.addMessage(`� Inserting ${template.title}...`, 'bot', 'info');

            // Check if this is an API table with rich HTML
            if (template.apiSource && template.richHtml) {
                await this._insertAPITableWithHTML(template);
            } else if (template.rows) {
                // Regular row-based table
                await this.#documentManager.insertCustomTable(template.rows, template.title);
            } else {
                throw new Error('Invalid table template format');
            }
            
            this._closeTablesModal();
            this.addMessage(`✅ ${template.title} inserted successfully!`, 'bot', 'success');
            
        } catch (error) {
            console.error('Error inserting table template:', error);
            this.addMessage(`❌ Error inserting table: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Insert API table with rich HTML formatting using direct HTML insertion
     * @private
     * @param {Object} template - Template with rich HTML
     */
    async _insertAPITableWithHTML(template) {
        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const body = context.document.body;
                    
                    // Add table title and metadata as regular paragraphs
                    body.insertParagraph('', Word.InsertLocation.end);
                    const titleParagraph = body.insertParagraph(template.title || 'API Table', Word.InsertLocation.end);
                    titleParagraph.font.bold = true;
                    titleParagraph.font.size = 14;
                    
                    if (template.metadata?.sourceFile) {
                        const sourceParagraph = body.insertParagraph(`Source: ${template.metadata.sourceFile}`, Word.InsertLocation.end);
                        sourceParagraph.font.size = 9;
                        sourceParagraph.font.color = '#666666';
                    }
                    
                    if (template.metadata?.processingDate) {
                        const dateParagraph = body.insertParagraph(`Processed: ${template.metadata.processingDate}`, Word.InsertLocation.end);
                        dateParagraph.font.size = 9;
                        dateParagraph.font.color = '#666666';
                    }
                    
                    body.insertParagraph('', Word.InsertLocation.end);

                    // Direct HTML insertion - preserves all original formatting
                    if (template.richHtml) {
                        try {
                            console.log('Inserting rich HTML table directly into Word...');
                            
                            // Sanitize HTML to ensure it's safe for Word
                            const sanitizedHtml = this._sanitizeHtml(template.richHtml);
                            
                            // Insert the HTML table directly
                            body.insertHtml(sanitizedHtml, Word.InsertLocation.end);
                            
                            console.log('✅ Rich HTML table inserted successfully');
                        } catch (htmlError) {
                            console.warn('Direct HTML insertion failed, falling back to table parsing:', htmlError);
                            
                            // Fallback: parse HTML to table data
                            const tableData = this._parseHTMLTableToArray(template.richHtml);
                            if (tableData && tableData.length > 0) {
                                const table = body.insertTable(tableData.length, tableData[0].length, Word.InsertLocation.end, tableData);
                                table.styleBuiltIn = Word.Style.gridTable4_Accent1;
                                table.autoFitBehavior = Word.AutoFitBehavior.autoFitToContents;
                            } else {
                                body.insertParagraph(`Table: ${template.description}`, Word.InsertLocation.end);
                            }
                        }
                    } else {
                        body.insertParagraph('No table content available.', Word.InsertLocation.end);
                    }
                    
                    // Add footer
                    body.insertParagraph('', Word.InsertLocation.end);
                    const footerParagraph = body.insertParagraph(`Table inserted: ${new Date().toLocaleString()}`, Word.InsertLocation.end);
                    footerParagraph.font.size = 9;
                    footerParagraph.font.color = '#999999';
                    
                    await context.sync();
                    resolve(true);
                } catch (error) {
                    console.error('Error inserting API table:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Parse HTML table to 2D array for Word insertion
     * @private
     * @param {string} htmlContent - HTML table content
     * @returns {Array|null} 2D array of table data
     */
    _parseHTMLTableToArray(htmlContent) {
        try {
            const tempDiv = document.createElement('div');
            const sanitizedHtml = this._sanitizeHtml(htmlContent);
            tempDiv.innerHTML = sanitizedHtml;
            
            const table = tempDiv.querySelector('table');
            if (!table) {
                return null;
            }

            const rows = table.querySelectorAll('tr');
            const tableData = [];

            rows.forEach(row => {
                const cells = row.querySelectorAll('td, th');
                const rowData = [];
                
                cells.forEach(cell => {
                    // Extract text content and clean it up
                    let cellText = cell.textContent || cell.innerText || '';
                    cellText = cellText.trim().replace(/\s+/g, ' ');
                    rowData.push(cellText);
                });
                
                if (rowData.length > 0) {
                    tableData.push(rowData);
                }
            });

            return tableData.length > 0 ? tableData : null;
        } catch (error) {
            console.error('Error parsing HTML table:', error);
            return null;
        }
    }

    /**
     * Refresh API tables from the external service
     * @public
     */
    async refreshAPITables() {
        try {
            this.addMessage('🔄 Refreshing latest tables from API...', 'bot', 'info');
            
            // Show loading in the modal if open
            const container = document.getElementById('tablesContainer');
            if (container) {
                this._showTablesLoadingState(container);
            }
            
            const tableTemplates = await this._getTableTemplates();
            
            // Re-render templates if modal is open
            if (container) {
                this._renderTableTemplates(tableTemplates);
                this._setupTableTemplatesSearch(tableTemplates);
            }
            
            this.addMessage('✅ Latest tables refreshed successfully!', 'bot', 'success');
            
        } catch (error) {
            console.error('Error refreshing API tables:', error);
            this.addMessage(`❌ Error refreshing tables: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Customize template with AI (placeholder for future API integration)
     * @public
     * @param {string} templateId - ID of the template to customize
     */
    async customizeTemplate(templateId) {
        try {
            const templates = await this._getTableTemplates();
            const template = templates.find(t => t.id === templateId);
            
            if (!template) {
                throw new Error('Template not found');
            }

            this.addMessage(`🤖 AI customization for "${template.title}" will be available soon! For now, you can insert the standard template.`, 'bot', 'info');
            
        } catch (error) {
            console.error('Error customizing template:', error);
            this.addMessage(`❌ Error customizing template: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Show full table preview in a modal
     * @public
     * @param {string} templateId - ID of the template to preview
     */
    async showFullTablePreview(templateId) {
        try {
            const templates = await this._getTableTemplates();
            const template = templates.find(t => t.id === templateId);
            
            if (!template) {
                throw new Error('Template not found');
            }

            this._showFullTablePreviewModal(template);
            
        } catch (error) {
            console.error('Error showing table preview:', error);
            this.addMessage(`❌ Error showing table preview: ${error.message}`, 'bot', 'error');
        }
    }

    // =============================================================================
    // FEEDBACK SYSTEM METHODS
    // =============================================================================

    /**
     * Handle like/dislike feedback
     * @public
     * @param {string} messageId - Message ID
     * @param {string} feedbackType - 'like' or 'dislike'
     */
    handleFeedback(messageId, feedbackType) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const feedbackButtons = messageElement.querySelector('.feedback-buttons');
        if (!feedbackButtons || this._isFeedbackAlreadySubmitted(feedbackButtons)) {
            return;
        }

        this._showFeedbackInput(messageElement, messageId, feedbackType);
        this._highlightFeedbackButton(feedbackButtons, feedbackType);
    }

    /**
     * Submit feedback comment
     * @public
     * @param {string} messageId - Message ID
     * @param {string} feedbackType - 'like' or 'dislike'
     */
    submitFeedback(messageId, feedbackType) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const feedback = this._extractFeedbackData(messageElement, messageId, feedbackType);
        if (!feedback) return;

        this._storeFeedback(feedback);
        this._showFeedbackThankYou(messageElement, feedbackType, feedback.comment);
        this._disableFeedbackButtons(messageId, feedbackType);
        this._autoHideFeedbackInput(messageElement);
    }

    /**
     * Cancel feedback input
     * @public
     * @param {string} messageId - Message ID
     */
    cancelFeedback(messageId) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const inputContainer = messageElement.querySelector('.feedback-input-container');
        inputContainer?.remove();

        this._resetFeedbackButtonStates(messageElement);
    }

    /**
     * Show sources modal
     * @public
     * @param {string} messageId - Message ID
     * @param {Array} sources - Array of source objects
     */
    showSourcesModal(messageId, sources) {
        const modal = this._getOrCreateSourcesModal();
        this._populateSourcesModal(modal, sources);
        modal.style.display = 'flex';
    }

    /**
     * Hide sources modal
     * @public
     */
    hideSourcesModal() {
        const modal = document.getElementById('sourcesModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // =============================================================================
    // PRIVATE INITIALIZATION METHODS
    // =============================================================================

    /**
     * Render the main chat interface
     * @private
     */
    _renderChatInterface() {
        const container = document.getElementById('chatbot-container');
        if (!container) return;
        
        container.innerHTML = this._getChatInterfaceTemplate();
    }

    /**
     * Get the HTML template for the chat interface
     * @private
     * @returns {string} Chat interface HTML
     */
    _getChatInterfaceTemplate() {
        return `
            <div class="chat-header">
                <h4>🤖 AI Assistant</h4>
                <div class="header-buttons">
                    <button id="analyzeParagraphs" class="btn-analyze">📝 Analyze</button>
                    <button id="showTables" class="btn-tables">📋 Tables</button>
                </div>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                ${this._getWelcomeMessage()}
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
     * Get welcome message HTML with Markdown formatting
     * @private
     * @returns {string} Welcome message HTML
     */
    _getWelcomeMessage() {
        const aiStatus = this.#apiService.getActiveModelName();
        const modelReady = this.#apiService.isCurrentModelReady();
        const statusIcon = modelReady ? '✅' : '⚠️';
        
        const welcomeText = `**Hello! I can help you:**

- 📊 **Analyze document** with AI insights
- ✨ *Suggest improvements* for clarity and style  
- 💬 **Answer questions** about your writing

${statusIcon} **Active AI:** ${aiStatus}

Click **"Analyze"** to start, or use ⚙️ for more options!`;

        const welcomeSources = this._getWelcomeSources();
        const messageId = `welcome-${Date.now()}`;
        const feedbackButtons = this._createFeedbackButtons(messageId, welcomeSources);
            
        return `
            <div class="message bot-message" id="${messageId}">
                <div class="message-content">${typeof MarkdownRenderer !== 'undefined' ? MarkdownRenderer.render(welcomeText) : welcomeText.replace(/\n/g, '<br>')}</div>
                <div class="message-footer">
                    <div class="message-time">${this._getCurrentTime()}</div>
                    ${feedbackButtons}
                </div>
            </div>
        `;
    }

    /**
     * Get welcome message sources
     * @private
     * @returns {Array} Array of source objects
     */
    _getWelcomeSources() {
        return [
            {
                title: "Microsoft Word Add-ins Documentation",
                url: "https://docs.microsoft.com/en-us/office/dev/add-ins/word/",
                description: "Official documentation for Word add-ins development"
            },
            "https://www.microsoft.com/en-us/microsoft-365/word"
        ];
    }

    /**
     * Bind event listeners to UI elements
     * @private
     */
    _bindEvents() {
        const elements = this._getUIElements();
        
        // Send message events
        elements.sendButton?.addEventListener('click', () => this.sendMessage());
        elements.chatInput?.addEventListener('keypress', (e) => this._handleChatInputKeypress(e));
        
        // Analysis and settings events
        elements.analyzeButton?.addEventListener('click', () => this.analyzeParagraphs());
        elements.settingsButton?.addEventListener('click', () => window.toggleSettingsModal());
        
        // Tables button event
        elements.tablesButton?.addEventListener('click', () => this.showTablesModal());
    }

    /**
     * Get UI elements for event binding
     * @private
     * @returns {Object} Object containing UI elements
     */
    _getUIElements() {
        return {
            sendButton: document.getElementById('sendMessage'),
            chatInput: document.getElementById('chatInput'),
            analyzeButton: document.getElementById('analyzeParagraphs'),
            settingsButton: document.getElementById('settingsButton'),
            tablesButton: document.getElementById('showTables')
        };
    }

    /**
     * Handle chat input keypress events
     * @private
     * @param {KeyboardEvent} event - The keypress event
     */
    _handleChatInputKeypress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    // =============================================================================
    // PRIVATE CHAT PROCESSING METHODS
    // =============================================================================

    /**
     * Process a chat message
     * @private
     * @param {string} message - User message
     * @param {HTMLElement} chatInput - Chat input element
     */
    async _processChatMessage(message, chatInput) {
        this._disableAllSuggestionButtons();
        chatInput.value = '';

        this.addMessage(message, 'user');
        const typingId = this._showTypingIndicator();

        const documentContext = await this._getDocumentContext();
        const isAnalysisRequest = this._isAnalysisRequest(message);
        
        if (isAnalysisRequest) {
            await this._handleChatAnalysisRequest(message, typingId, documentContext);
        } else {
            await this._handleRegularChatRequest(message, typingId, documentContext);
        }
    }

    /**
     * Get document context for chat
     * @private
     * @returns {string} Document context
     */
    async _getDocumentContext() {
        try {
            return await this.#documentManager.readDocumentText();
        } catch (error) {
            console.warn('Could not read document context:', error);
            return '';
        }
    }

    /**
     * Check if the message is requesting paragraph analysis
     * @private
     * @param {string} message - User message
     * @returns {boolean} True if this is an analysis request
     */
    _isAnalysisRequest(message) {
        // Direct analysis command check - highest priority
        if (message.trim().startsWith('\\analyse')) {
            return true;
        }
        
        // Existing keyword detection for natural language requests
        const analysisKeywords = [
            'analyze', 'analysis', 'suggest', 'improve', 'fix', 'check',
            'review', 'edit', 'grammar', 'style', 'clarity', 'flow',
            'paragraph', 'paragraphs', 'structure', 'coherence'
        ];
        
        const lowerMessage = message.toLowerCase();
        return analysisKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    /**
     * Handle paragraph analysis request in chat
     * @private
     * @param {string} message - User message
     * @param {string} typingId - Typing indicator ID
     * @param {string} documentContext - Full document text
     */
    async _handleChatAnalysisRequest(message, typingId, documentContext) {
        try {
            // Check if this is a direct analysis command
            const isAnalysisCommand = message.trim().startsWith('\\analyse');
            
            if (isAnalysisCommand) {
                await this._handleAnalysisCommand(message, typingId, documentContext);
            } else {
                await this._handleNaturalAnalysisRequest(message, typingId, documentContext);
            }
        } catch (error) {
            this._removeTypingIndicator(typingId);
            this.addMessage(`❌ Error performing analysis: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Handle direct \analyse command
     * @private
     * @param {string} message - Message starting with \analyse
     * @param {string} typingId - Typing indicator ID
     * @param {string} documentContext - Full document text
     */
    async _handleAnalysisCommand(message, typingId, documentContext) {
        // Parse analysis command options
        const commandParts = message.trim().split(/\s+/);
        const analysisOptions = this._extractAnalysisOptions(commandParts.slice(1));
        
        // Build command acknowledgment message
        let commandAck = `🤖 **Analysis Command Received**\n\nProcessing document analysis`;
        
        if (analysisOptions.focusAreas.length > 0) {
            commandAck += ` focusing on: ${analysisOptions.focusAreas.join(', ')}`;
        }
        
        if (analysisOptions.userInput) {
            commandAck += `\n📝 **User Guidance:** "${analysisOptions.userInput}"`;
        }
        
        commandAck += `...`;
        
        // Show command acknowledgment
        this.addMessage(commandAck, 'bot', 'info');

        const paragraphs = await this.#documentManager.readParagraphs();
        this._validateParagraphs(paragraphs);
        this.#paragraphMapping = paragraphs;

        const suggestions = await this.#apiService.getParagraphSuggestions(paragraphs, {
            fullDocumentText: documentContext,
            focusAreas: analysisOptions.focusAreas,
            userGuidance: analysisOptions.userInput,
            analysisType: 'command'
        });

        this._removeTypingIndicator(typingId);
        this._displayAnalysisCommandResults(suggestions, paragraphs, analysisOptions);
    }

    /**
     * Handle natural language analysis request
     * @private
     * @param {string} message - Natural language analysis request
     * @param {string} typingId - Typing indicator ID
     * @param {string} documentContext - Full document text
     */
    async _handleNaturalAnalysisRequest(message, typingId, documentContext) {
        const paragraphs = await this.#documentManager.readParagraphs();
        this._validateParagraphs(paragraphs);
        this.#paragraphMapping = paragraphs;

        const suggestions = await this.#apiService.getParagraphSuggestions(paragraphs, {
            fullDocumentText: documentContext
        });

        this._removeTypingIndicator(typingId);
        this._displayChatAnalysisResults(message, suggestions, paragraphs);
    }

    /**
     * Handle regular chat request
     * @private
     * @param {string} message - User message
     * @param {string} typingId - Typing indicator ID
     * @param {string} documentContext - Full document text
     */
    async _handleRegularChatRequest(message, typingId, documentContext) {
        const response = await this.#apiService.sendChatMessage(message, this.#chatHistory, {
            documentContext: documentContext
        });
        
        this._removeTypingIndicator(typingId);
        
        // Generate sample sources for demonstration
        const sources = this._generateSampleSources(message);
        this.addMessage(response.message, 'bot', '', sources);
        
        this._updateChatHistory(message, response.message);
    }

    /**
     * Perform document analysis
     * @private
     */
    async _performDocumentAnalysis() {
        this._disableAllSuggestionButtons();

        const paragraphs = await this.#documentManager.readParagraphs();
        this._validateParagraphs(paragraphs);
        this.#paragraphMapping = paragraphs;

        const fullDocumentText = await this.#documentManager.readDocumentText();
        const suggestions = await this.#apiService.getParagraphSuggestions(paragraphs, {
            fullDocumentText: fullDocumentText
        });
        
        this._displayAnalysisResults(paragraphs, suggestions.suggestions);
    }

    /**
     * Display analysis results in chat format
     * @private
     * @param {string} originalMessage - User's original message
     * @param {Object} suggestions - Analysis suggestions
     * @param {Array} paragraphs - Document paragraphs
     */
    _displayChatAnalysisResults(originalMessage, suggestions, paragraphs) {
        const summaryMessage = `## 📊 Document Analysis Complete

**📄 Document Theme:** ${suggestions.documentTheme || 'General document'}  
**📝 Total Paragraphs:** ${suggestions.totalParagraphs}  
**💡 Suggestions Found:** ${suggestions.suggestions?.length || 0}

${suggestions.suggestions?.length > 0 ? 
    '*I found several areas for improvement. Here are the suggestions:*' : 
    '*Your document looks good! No major improvements needed.*'}`;
        
        this.addMessage(summaryMessage, 'bot', 'analysis');
        
        if (suggestions.suggestions && suggestions.suggestions.length > 0) {
            this._displayAnalysisResults(paragraphs, suggestions.suggestions);
        }
        
        this._updateChatHistory(originalMessage, summaryMessage);
    }

    /**
     * Extract analysis options from command parts
     * @private
     * @param {Array} commandParts - Array of command arguments
     * @returns {Object} Object with focus areas and user input
     */
    _extractAnalysisOptions(commandParts) {
        const validFocusAreas = ['grammar', 'style', 'clarity', 'structure', 'flow', 'tone'];
        const focusAreas = [];
        const remainingInput = [];
        
        for (const part of commandParts) {
            const normalizedPart = part.toLowerCase();
            if (validFocusAreas.includes(normalizedPart)) {
                focusAreas.push(normalizedPart);
            } else {
                remainingInput.push(part);
            }
        }
        
        return {
            focusAreas: focusAreas,
            userInput: remainingInput.join(' ').trim()
        };
    }

    /**
     * Display analysis command results
     * @private
     * @param {Object} suggestions - Analysis suggestions
     * @param {Array} paragraphs - Document paragraphs
     * @param {Object} analysisOptions - Analysis options with focus areas and user input
     */
    _displayAnalysisCommandResults(suggestions, paragraphs, analysisOptions) {
        // Command-specific results formatting
        let commandResults = `## 📋 Analysis Command Results\n\n`;
        
        if (analysisOptions.focusAreas.length > 0) {
            commandResults += `**🎯 Focus Areas:** ${analysisOptions.focusAreas.map(area => `\`${area}\``).join(', ')}\n`;
        }
        
        if (analysisOptions.userInput) {
            commandResults += `**� User Guidance:** "${analysisOptions.userInput}"\n`;
        }
        
        commandResults += `**�📊 Document Overview:**\n`;
        commandResults += `- **Theme:** ${suggestions.documentTheme || 'General document'}\n`;
        commandResults += `- **Paragraphs:** ${suggestions.totalParagraphs}\n`;
        commandResults += `- **Suggestions:** ${suggestions.suggestions?.length || 0}\n\n`;

        if (suggestions.suggestions && suggestions.suggestions.length > 0) {
            commandResults += `**💡 Analysis Results:**\n`;
            commandResults += this._buildSuggestionsContent(suggestions.suggestions);
        } else {
            commandResults += `✅ **No issues found!** Your document meets the analysis criteria.`;
        }
        
        this.addMessage(commandResults, 'bot', 'analysis-command');
        
        // Store suggestions for interaction
        this.#currentSuggestions = suggestions.suggestions || [];
        
        // Update chat history with full command including user input
        const fullCommand = `\\analyse ${analysisOptions.focusAreas.join(' ')}${analysisOptions.userInput ? ' ' + analysisOptions.userInput : ''}`;
        this._updateChatHistory(fullCommand, commandResults);
    }

    /**
     * Display comprehensive analysis results
     * @private
     * @param {Array} paragraphs - Array of document paragraphs
     * @param {Array} suggestions - Array of suggestions
     */
    _displayAnalysisResults(paragraphs, suggestions) {
        this.#currentSuggestions = suggestions;
        
        let analysisContent = `📊 **Document Analysis Complete**\n\n`;
        analysisContent += `📄 Found ${paragraphs.length} paragraphs\n`;
        analysisContent += `✨ Generated ${suggestions.length} suggestions for improvement\n\n`;
        
        if (suggestions.length > 0) {
            analysisContent += `**Suggestions:**\n`;
            analysisContent += this._buildSuggestionsContent(suggestions);
            analysisContent += `\n---\n\n✨ Click "Show in Document" to see each suggestion highlighted in your document.`;
        } else {
            analysisContent += `✅ Your document looks good! No suggestions at this time.`;
        }
        
        this.addMessage(analysisContent, 'bot', 'analysis');
    }

    /**
     * Build suggestions content for display
     * @private
     * @param {Array} suggestions - Array of suggestions
     * @returns {string} Formatted suggestions content
     */
    _buildSuggestionsContent(suggestions) {
        return suggestions.map((suggestion, index) => {
            suggestion.uniqueId = `suggestion_${Date.now()}_${index}`;
            const originalParagraphIndex = this._getOriginalParagraphIndex(suggestion.paragraphIndex);
            
            return `\n---\n<div class="suggestion-chat-item" data-index="${index}" data-unique-id="${suggestion.uniqueId}">
                <div class="suggestion-chat-header">
                    <strong>📝 Paragraph ${originalParagraphIndex + 1}</strong>
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
        }).join('');
    }

    // =============================================================================
    // PRIVATE SUGGESTION HELPER METHODS
    // =============================================================================

    /**
     * Display suggestion in document
     * @private
     * @param {Object} suggestion - Suggestion object
     */
    async _displaySuggestionInDocument(suggestion) {
        const originalParagraphIndex = this._getOriginalParagraphIndex(suggestion.paragraphIndex);
        
        const result = await this.#documentManager.insertSuggestionAfterParagraph(
            originalParagraphIndex,
            suggestion.originalText,
            suggestion.suggestedText
        );

        await this.#documentManager.navigateToParagraph(originalParagraphIndex);
        suggestion.documentIndices = result;
    }

    /**
     * Apply suggestion to document
     * @private
     * @param {Object} suggestion - Suggestion object
     */
    async _applySuggestionToDocument(suggestion) {
        await this.#documentManager.applySuggestionInDocument(
            suggestion.documentIndices.originalIndex,
            suggestion.documentIndices.suggestedIndex,
            suggestion.suggestedText
        );
    }

    /**
     * Reject suggestion in document
     * @private
     * @param {Object} suggestion - Suggestion object
     */
    async _rejectSuggestionInDocument(suggestion) {
        await this.#documentManager.removeSuggestion(
            suggestion.documentIndices.originalIndex,
            suggestion.documentIndices.suggestedIndex
        );
    }

    /**
     * Update suggestion action buttons to show approve/reject
     * @private
     * @param {string} suggestionUniqueId - Unique ID of the suggestion
     */
    _updateSuggestionActions(suggestionUniqueId) {
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
     * @private
     * @param {string} suggestionUniqueId - Unique ID of the suggestion
     * @param {string} actionType - 'approved' or 'rejected'
     * @param {string} actionDescription - Description of what was done
     */
    _showActionResult(suggestionUniqueId, actionType, actionDescription) {
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

    // =============================================================================
    // PRIVATE TABLE HELPER METHODS  
    // =============================================================================

    /**
     * Get tables modal elements
     * @private
     * @returns {Object} Modal and container elements
     */
    _getTablesModalElements() {
        const modal = document.getElementById('tablesModal');
        const container = document.getElementById('tablesContainer');
        
        if (!modal || !container) {
            console.error('Tables modal elements not found');
            return { modal: null, container: null };
        }
        
        return { modal, container };
    }

    /**
     * Show tables loading state
     * @private
     * @param {HTMLElement} container - Container element
     */
    _showTablesLoadingState(container) {
        container.innerHTML = '<div class="tables-loading"><p>📋 Loading table templates...</p></div>';
    }

    /**
     * Handle tables modal error
     * @private
     * @param {Error} error - Error object
     */
    _handleTablesModalError(error) {
        console.error('Error showing tables modal:', error);
        const container = document.getElementById('tablesContainer');
        if (container) {
            container.innerHTML = `
                <div class="tables-empty">
                    <p>❌ Error loading table templates: ${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Get predefined table templates for insertion
     * @private
     * @returns {Promise<Array>} Array of table template objects
     */
    async _getTableTemplates() {
        // Try to fetch latest tables from the API first
        try {
            const latestTables = await this._fetchLatestTablesFromAPI();
            if (latestTables && latestTables.length > 0) {
                console.log(`✅ Found ${latestTables.length} API tables - hiding static templates`);
                // Return ONLY API tables when available (hide static templates)
                return latestTables;
            }
        } catch (error) {
            console.warn('Could not fetch latest tables from API, using static templates:', error);
        }

        // Fallback to static templates only when no API tables are available
        console.log('📋 No API tables available - showing static templates as fallback');
        return this._getStaticTableTemplates();
    }

    /**
     * Fetch latest tables from external API
     * @private
     * @returns {Promise<Array>} Array of latest table templates
     */
    async _fetchLatestTablesFromAPI() {
        const maxRetries = 2;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Fetching latest tables from API (attempt ${attempt}/${maxRetries})`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch('https://127.0.0.1:5500/get_json/latestpadtables', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid API response: not a JSON object');
                }

                if (!data.tables || !Array.isArray(data.tables)) {
                    throw new Error('Invalid API response format: missing or invalid tables array');
                }

                console.log(`Successfully fetched ${data.tables.length} tables from API`);

                // Filter out Sheet1 tables temporarily
                const filteredTables = data.tables.filter((table) => {
                    const sourceSheet = (table.source_sheet || '').toLowerCase();
                    const description = (table.description || '').toLowerCase();
                    
                    // Hide tables that contain "sheet1" in source sheet or description
                    const isSheet1 = sourceSheet.includes('sheet1') || description.includes('sheet1');
                    
                    if (isSheet1) {
                        console.log(`Hiding Sheet1 table: ${table.description || 'Unknown'} from ${table.source_sheet || 'Unknown'}`);
                    }
                    
                    return !isSheet1; // Return false to filter out Sheet1 tables
                });

                console.log(`After filtering Sheet1 tables: ${filteredTables.length} tables remaining`);

                // Convert API tables to our template format
                const templates = filteredTables.slice(0, 10).map((table, index) => {
                    try {
                        // Extract table content for better searching
                        const tableTextContent = this._extractTableTextContent(table.rich_html || '');
                        
                        return {
                            id: `api-table-${this._sanitizeId(table.table_id || `table_${index}`)}`,
                            title: `${this._extractTableTitle(table.description || 'Table')}`,
                            description: `Latest Malaysian Statistics - ${table.source_sheet || 'Sheet1'}`,
                            category: 'Latest Malaysian Statistics',
                            apiSource: true,
                            metadata: {
                                sourceFile: data.metadata?.source_file || 'Unknown',
                                processingDate: data.metadata?.processing_date || new Date().toISOString(),
                                tableId: table.table_id || `table_${index}`,
                                sourceSheet: table.source_sheet || 'Unknown',
                                region: table.region || {}
                            },
                            richHtml: table.rich_html || '<p>No table content available</p>',
                            searchableText: `${table.description || ''} ${table.source_sheet || ''} ${tableTextContent} malaysian statistics latest api government mcmc kandungan permohonan penurunan tahun agama kaum raja jumlah`.toLowerCase()
                        };
                    } catch (tableError) {
                        console.warn(`Error processing table ${index}:`, tableError);
                        return null;
                    }
                }).filter(template => template !== null);

                return templates;

            } catch (error) {
                lastError = error;
                console.warn(`API fetch attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        throw new Error(`Failed to fetch API tables after ${maxRetries} attempts. Last error: ${lastError.message}`);
    }

    /**
     * Sanitize ID to make it safe for HTML
     * @private
     * @param {string} id - ID to sanitize
     * @returns {string} Sanitized ID
     */
    _sanitizeId(id) {
        if (!id || typeof id !== 'string') {
            return 'table_' + Date.now();
        }
        return id.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    }

    /**
     * Extract a readable title from table description
     * @private
     * @param {string} description - Table description
     * @returns {string} Extracted title
     */
    _extractTableTitle(description) {
        if (!description) return 'Table';
        
        // Try to extract meaningful title from description
        const match = description.match(/Table extracted from sheet '(.+?)'/);
        if (match) {
            return match[1];
        }
        
        // Fallback to truncated description
        return description.length > 50 ? description.substring(0, 50) + '...' : description;
    }

    /**
     * Extract text content from HTML table for searching
     * @private
     * @param {string} richHtml - Rich HTML table content
     * @returns {string} Plain text content from table
     */
    _extractTableTextContent(richHtml) {
        try {
            if (!richHtml || typeof richHtml !== 'string') {
                return '';
            }

            // Create a temporary element to parse HTML
            const tempDiv = document.createElement('div');
            const sanitizedHtml = this._sanitizeHtml(richHtml);
            tempDiv.innerHTML = sanitizedHtml;
            
            const table = tempDiv.querySelector('table');
            if (!table) {
                return '';
            }

            // Extract all text content from table cells
            const cells = table.querySelectorAll('td, th');
            const textContent = Array.from(cells)
                .map(cell => (cell.textContent || cell.innerText || '').trim())
                .filter(text => text.length > 0)
                .join(' ')
                .replace(/\s+/g, ' ')
                .toLowerCase();

            return textContent;
        } catch (error) {
            console.warn('Error extracting table text content:', error);
            return '';
        }
    }

    /**
     * Get static predefined table templates
     * @private
     * @returns {Array} Array of static table template objects
     */
    _getStaticTableTemplates() {
        return [
            {
                id: 'business-inventory',
                title: 'Business Inventory Table',
                description: 'Track products, categories, prices, and stock levels',
                category: 'Business',
                rows: [
                    ['Product', 'Category', 'Price', 'Stock', 'Status'],
                    ['Laptop Pro 15"', 'Electronics', '$1,299.99', '25', 'Available'],
                    ['Wireless Mouse', 'Electronics', '$29.99', '150', 'Available'],
                    ['Office Chair', 'Furniture', '$249.99', '12', 'Limited'],
                    ['Desk Organizer', 'Office Supplies', '$19.99', '75', 'Available'],
                    ['Monitor 27"', 'Electronics', '$349.99', '8', 'Limited']
                ],
                searchableText: 'business inventory product stock price category electronics furniture office supplies'
            },
            {
                id: 'project-timeline',
                title: 'Project Timeline Table',
                description: 'Manage project tasks, deadlines, and assignments',
                category: 'Project Management',
                rows: [
                    ['Task', 'Assigned To', 'Start Date', 'Due Date', 'Priority', 'Status'],
                    ['Requirements Analysis', 'John Doe', '2025-08-01', '2025-08-05', 'High', 'In Progress'],
                    ['UI Design', 'Jane Smith', '2025-08-06', '2025-08-12', 'Medium', 'Pending'],
                    ['Backend Development', 'Bob Johnson', '2025-08-10', '2025-08-20', 'High', 'Not Started'],
                    ['Testing & QA', 'Alice Brown', '2025-08-21', '2025-08-25', 'Medium', 'Not Started'],
                    ['Deployment', 'DevOps Team', '2025-08-26', '2025-08-28', 'Critical', 'Not Started']
                ],
                searchableText: 'project timeline task assignment deadline priority status management development'
            },
            {
                id: 'financial-budget',
                title: 'Financial Budget Table',
                description: 'Track expenses, income, and budget allocations',
                category: 'Finance',
                rows: [
                    ['Category', 'Budgeted Amount', 'Actual Amount', 'Variance', 'Percentage'],
                    ['Marketing', '$5,000.00', '$4,750.00', '+$250.00', '95%'],
                    ['Operations', '$15,000.00', '$15,200.00', '-$200.00', '101%'],
                    ['Salaries', '$25,000.00', '$25,000.00', '$0.00', '100%'],
                    ['Office Supplies', '$1,200.00', '$980.00', '+$220.00', '82%'],
                    ['Travel', '$3,000.00', '$2,450.00', '+$550.00', '82%']
                ],
                searchableText: 'financial budget expenses income variance percentage marketing operations salary'
            }
        ];
    }

    /**
     * Render table templates in the modal
     * @private
     * @param {Array} templates - Array of table template data
     */
    _renderTableTemplates(templates) {
        const container = document.getElementById('tablesContainer');
        if (!container) {
            console.error('Tables container not found');
            return;
        }

        if (!templates || templates.length === 0) {
            container.innerHTML = '<div class="tables-empty"><p>No table templates available</p></div>';
            return;
        }
        
        try {
            const templatesHtml = templates.map((template, index) => {
                try {
                    // Handle API tables vs regular tables
                    let sizeInfo, tablePreview;
                    
                    if (template.apiSource && template.richHtml) {
                        // API table with rich HTML
                        sizeInfo = `API Table - ${this._escapeHtml(template.metadata?.sourceSheet || 'Sheet')}`;
                        tablePreview = this._renderAPITablePreview(template.richHtml);
                    } else if (template.rows && Array.isArray(template.rows)) {
                        // Regular row-based table
                        sizeInfo = `${template.rows.length - 1} rows × ${template.rows[0]?.length || 0} columns`;
                        tablePreview = this._renderTableHTML(template.rows);
                    } else {
                        // Fallback
                        sizeInfo = 'Table';
                        tablePreview = '<p style="text-align: center; color: #6c757d; padding: 20px;">Table preview not available</p>';
                    }

                    // const categoryBadge = template.apiSource 
                    //     ? '<span class="api-badge">🌐 Latest</span>' 
                    //     : '';
                    const categoryBadge = template.apiSource 
                        ? '' 
                        : '';
                    const safeTemplateId = this._escapeHtml(template.id || `template_${index}`);
                    const safeTitle = this._escapeHtml(template.title || 'Untitled Table');
                    const safeCategory = this._escapeHtml(template.category || 'General');
                    const safeDescription = this._escapeHtml(template.description || 'No description available');
                    const safeSearchText = this._escapeHtml(template.searchableText || '');

                    return `
                        <div class="table-template-item" data-template-id="${safeTemplateId}" data-search-text="${safeSearchText}">
                            <div class="template-header">
                                <div class="template-title">📋 ${safeTitle} ${categoryBadge}</div>
                                <button class="btn-preview-table" onclick="chatbot.showFullTablePreview('${safeTemplateId}')" title="Preview full table">
                                    Preview
                                </button>
                            </div>
                            <div class="table-content">
                                ${tablePreview}
                            </div>
                            <div class="template-actions">
                                <button class="btn-insert-template" onclick="chatbot.insertTableTemplate('${safeTemplateId}')" title="Insert this table">
                                    ➕ Insert Table
                                </button>
                                ${template.apiSource ? '<button class="btn-refresh-template" onclick="chatbot.refreshAPITables()" title="Refresh API tables">🔄 Refresh</button>' : ''}
                            </div>
                        </div>
                    `;
                } catch (templateError) {
                    console.error(`Error rendering template ${index}:`, templateError);
                    return `
                        <div class="table-template-item error-template">
                            <div class="template-header">
                                <div class="template-title">⚠️ Error Loading Template</div>
                            </div>
                            <div class="template-description">
                                This template could not be loaded properly.
                            </div>
                        </div>
                    `;
                }
            }).join('');
            
            container.innerHTML = templatesHtml;
        } catch (error) {
            console.error('Error rendering table templates:', error);
            container.innerHTML = `
                <div class="tables-empty">
                    <p>❌ Error loading table templates: ${this._escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    /**
     * Render API table preview from rich HTML
     * @private
     * @param {string} richHtml - Rich HTML content
     * @returns {string} Simplified preview HTML
     */
    _renderAPITablePreview(richHtml) {
        try {
            if (!richHtml || typeof richHtml !== 'string') {
                return '<p style="text-align: center; color: #6c757d; padding: 20px;">Table preview not available</p>';
            }

            // Sanitize and create a simplified preview by limiting rows and styling
            const tempDiv = document.createElement('div');
            
            // Safely set HTML content with basic sanitization
            const sanitizedHtml = this._sanitizeHtml(richHtml);
            tempDiv.innerHTML = sanitizedHtml;
            
            const table = tempDiv.querySelector('table');
            if (!table) {
                return '<p style="text-align: center; color: #6c757d; padding: 20px;">Table preview not available</p>';
            }

            // Limit to first 4 rows for preview
            const rows = table.querySelectorAll('tr');
            if (rows.length > 4) {
                for (let i = 4; i < rows.length; i++) {
                    if (rows[i] && rows[i].parentNode) {
                        rows[i].remove();
                    }
                }
                // Add indication that there are more rows
                const lastRow = table.querySelector('tr:last-child');
                if (lastRow && lastRow.children.length > 0) {
                    const td = document.createElement('td');
                    td.colSpan = lastRow.children.length;
                    td.style.textAlign = 'center';
                    td.style.fontStyle = 'italic';
                    td.style.color = '#666';
                    td.textContent = '... and more rows';
                    const moreRow = document.createElement('tr');
                    moreRow.appendChild(td);
                    table.appendChild(moreRow);
                }
            }

            // Apply simplified styling for preview
            table.style.width = '100%';
            table.style.fontSize = '0.8em';
            table.style.maxHeight = '200px';
            table.style.overflow = 'hidden';
            table.style.borderCollapse = 'collapse';

            return tempDiv.innerHTML;
        } catch (error) {
            console.error('Error rendering API table preview:', error);
            return '<p style="text-align: center; color: #dc3545; padding: 20px;">⚠️ Table preview error</p>';
        }
    }

    /**
     * Basic HTML sanitization to prevent CSP issues
     * @private
     * @param {string} html - HTML content to sanitize
     * @returns {string} Sanitized HTML
     */
    _sanitizeHtml(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Remove potentially problematic script tags and event handlers
        let sanitized = html
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');

        return sanitized;
    }

    /**
     * Render table rows as HTML table
     * @private
     * @param {Array} rows - Table rows data
     * @returns {string} HTML table string
     */
    _renderTableHTML(rows) {
        if (rows.length === 0) {
            return '<p style="text-align: center; color: #6c757d; padding: 20px;">Empty table</p>';
        }
        
        let tableHtml = '<table class="document-table">';
        
        // First row as headers
        if (rows.length > 0) {
            tableHtml += '<thead><tr>';
            rows[0].forEach(cell => {
                tableHtml += `<th>${this._escapeHtml(cell || '')}</th>`;
            });
            tableHtml += '</tr></thead>';
        }
        
        // Remaining rows as data
        if (rows.length > 1) {
            tableHtml += '<tbody>';
            for (let i = 1; i < rows.length; i++) {
                tableHtml += '<tr>';
                rows[i].forEach(cell => {
                    tableHtml += `<td title="${this._escapeHtml(cell || '')}">${this._escapeHtml(cell || '')}</td>`;
                });
                tableHtml += '</tr>';
            }
            tableHtml += '</tbody>';
        }
        
        tableHtml += '</table>';
        return tableHtml;
    }

    /**
     * Setup search functionality for table templates
     * @private
     * @param {Array} templates - Array of template data
     */
    _setupTableTemplatesSearch(templates) {
        const searchInput = document.getElementById('tablesSearch');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const templateItems = document.querySelectorAll('.table-template-item');
            
            templateItems.forEach(item => {
                const searchText = item.getAttribute('data-search-text') || '';
                const title = item.querySelector('.template-title')?.textContent || '';
                const description = item.querySelector('.template-description')?.textContent || '';
                
                const isVisible = searchTerm === '' || 
                                searchText.includes(searchTerm) || 
                                title.toLowerCase().includes(searchTerm) ||
                                description.toLowerCase().includes(searchTerm);
                
                item.style.display = isVisible ? 'block' : 'none';
            });
        });
        
        searchInput.value = '';
    }

    /**
     * Find table template by ID
     * @private
     * @param {string} templateId - Template ID
     * @returns {Object|null} Template object or null
     */

    /**
     * Show full table preview modal
     * @private
     * @param {Object} template - Template object
     */
    _showFullTablePreviewModal(template) {
        // Get or create the preview modal
        let modal = document.getElementById('tablePreviewModal');
        if (!modal) {
            modal = this._createTablePreviewModal();
            document.body.appendChild(modal);
        }

        // Generate the full table HTML
        let fullTableHtml;
        if (template.apiSource && template.richHtml) {
            // API table with rich HTML - show without truncation
            fullTableHtml = this._sanitizeHtml(template.richHtml);
        } else if (template.rows && Array.isArray(template.rows)) {
            // Regular row-based table - show all rows
            fullTableHtml = this._renderTableHTML(template.rows);
        } else {
            fullTableHtml = '<p style="text-align: center; color: #6c757d; padding: 20px;">Table content not available</p>';
        }

        // Update modal content
        const modalTitle = modal.querySelector('.modal-title');
        const modalContent = modal.querySelector('.table-preview-content');
        
        if (modalTitle) {
            modalTitle.textContent = template.title || 'Table Preview';
        }
        
        if (modalContent) {
            modalContent.innerHTML = fullTableHtml;
        }

        // Show the modal with animation
        modal.style.display = 'flex';
        // Force a reflow to ensure the display change takes effect
        modal.offsetHeight;
        // Add the show class for fade-in animation
        modal.classList.add('show');
    }

    /**
     * Create table preview modal
     * @private
     * @returns {HTMLElement} Modal element
     */
    _createTablePreviewModal() {
        const modal = document.createElement('div');
        modal.id = 'tablePreviewModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content table-preview-modal">
                <div class="modal-header">
                    <h3 class="modal-title">Table Preview</h3>
                    <button class="modal-close" onclick="chatbot._closeTablePreviewModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="table-preview-content">
                        <!-- Table content will be inserted here -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="chatbot._closeTablePreviewModal()">Close</button>
                </div>
            </div>
        `;

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this._closeTablePreviewModal();
            }
        });

        // Close modal with ESC key
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                this._closeTablePreviewModal();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        
        // Add ESC key listener when modal is shown
        modal.addEventListener('transitionend', () => {
            if (modal.style.display === 'flex') {
                document.addEventListener('keydown', handleKeyPress);
            }
        });

        return modal;
    }

    /**
     * Close table preview modal
     * @private
     */
    _closeTablePreviewModal() {
        const modal = document.getElementById('tablePreviewModal');
        if (modal) {
            // Remove the show class for fade-out animation
            modal.classList.remove('show');
            // Hide the modal after animation completes
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            // Remove ESC key listener
            document.removeEventListener('keydown', this._handleModalKeyPress);
        }
    }

    /**
     * Close tables modal
     * @private
     */
    _closeTablesModal() {
        const modal = document.getElementById('tablesModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // =============================================================================
    // PRIVATE FEEDBACK HELPER METHODS
    // =============================================================================

    /**
     * Check if feedback has already been submitted
     * @private
     * @param {HTMLElement} feedbackButtons - Feedback buttons container
     * @returns {boolean} True if feedback already submitted
     */
    _isFeedbackAlreadySubmitted(feedbackButtons) {
        return !!feedbackButtons.querySelector('.feedback-submitted-indicator');
    }

    /**
     * Show feedback input
     * @private
     * @param {HTMLElement} messageElement - Message element
     * @param {string} messageId - Message ID
     * @param {string} feedbackType - Feedback type
     */
    _showFeedbackInput(messageElement, messageId, feedbackType) {
        const existingInput = messageElement.querySelector('.feedback-input-container');
        if (existingInput) {
            existingInput.remove();
        }

        const inputContainer = this._createFeedbackInputContainer(messageId, feedbackType);
        messageElement.querySelector('.message-footer').appendChild(inputContainer);
        
        const input = inputContainer.querySelector('.feedback-input');
        input.focus();

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitFeedback(messageId, feedbackType);
            }
        });
    }

    /**
     * Create feedback input container
     * @private
     * @param {string} messageId - Message ID
     * @param {string} feedbackType - Feedback type
     * @returns {HTMLElement} Input container element
     */
    _createFeedbackInputContainer(messageId, feedbackType) {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'feedback-input-container';
        
        const promptText = feedbackType === 'like' 
            ? 'What did you like about this response?' 
            : 'What could be improved?';

        inputContainer.innerHTML = `
            <div class="feedback-input-prompt">${promptText}</div>
            <input type="text" class="feedback-input" placeholder="Your feedback..." maxlength="200">
            <div class="feedback-input-actions">
                <button class="btn-feedback-submit" onclick="chatbot.submitFeedback('${messageId}', '${feedbackType}')">Submit</button>
                <button class="btn-feedback-cancel" onclick="chatbot.cancelFeedback('${messageId}')">Cancel</button>
            </div>
        `;

        return inputContainer;
    }

    /**
     * Highlight feedback button
     * @private
     * @param {HTMLElement} feedbackButtons - Feedback buttons container
     * @param {string} feedbackType - Feedback type
     */
    _highlightFeedbackButton(feedbackButtons, feedbackType) {
        const likeBtn = feedbackButtons.querySelector('.like-btn');
        const dislikeBtn = feedbackButtons.querySelector('.dislike-btn');
        
        likeBtn.classList.remove('active');
        dislikeBtn.classList.remove('active');
        
        if (feedbackType === 'like') {
            likeBtn.classList.add('active');
        } else {
            dislikeBtn.classList.add('active');
        }
    }

    /**
     * Extract feedback data from input
     * @private
     * @param {HTMLElement} messageElement - Message element
     * @param {string} messageId - Message ID
     * @param {string} feedbackType - Feedback type
     * @returns {Object|null} Feedback data or null
     */
    _extractFeedbackData(messageElement, messageId, feedbackType) {
        const inputContainer = messageElement.querySelector('.feedback-input-container');
        const input = inputContainer?.querySelector('.feedback-input');
        
        if (!input) return null;

        return {
            messageId,
            type: feedbackType,
            comment: input.value.trim(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Store feedback data
     * @private
     * @param {Object} feedback - Feedback data
     */
    _storeFeedback(feedback) {
        console.log('User feedback:', feedback);
        // In real implementation, send to analytics/server
    }

    /**
     * Show feedback thank you message
     * @private
     * @param {HTMLElement} messageElement - Message element
     * @param {string} feedbackType - Feedback type
     * @param {string} comment - Feedback comment
     */
    _showFeedbackThankYou(messageElement, feedbackType, comment) {
        const inputContainer = messageElement.querySelector('.feedback-input-container');
        if (!inputContainer) return;

        inputContainer.innerHTML = `
            <div class="feedback-thank-you">
                <span class="feedback-icon">${feedbackType === 'like' ? '👍' : '👎'}</span>
                Thank you for your feedback${comment ? ': "' + comment + '"' : '!'}
            </div>
        `;
    }

    /**
     * Disable feedback buttons after submission
     * @private
     * @param {string} messageId - Message ID
     * @param {string} submittedType - Submitted feedback type
     */
    _disableFeedbackButtons(messageId, submittedType) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const feedbackButtons = messageElement.querySelector('.feedback-buttons');
        if (!feedbackButtons) return;

        const likeBtn = feedbackButtons.querySelector('.like-btn');
        const dislikeBtn = feedbackButtons.querySelector('.dislike-btn');

        this._disableButton(likeBtn, submittedType === 'like', submittedType);
        this._disableButton(dislikeBtn, submittedType === 'dislike', submittedType);
        this._addSubmittedIndicator(feedbackButtons);
    }

    /**
     * Disable individual feedback button
     * @private
     * @param {HTMLElement} button - Button element
     * @param {boolean} isActive - Whether this button was clicked
     * @param {string} submittedType - Submitted feedback type
     */
    _disableButton(button, isActive, submittedType) {
        if (!button) return;

        button.disabled = true;
        button.style.cursor = 'not-allowed';
        button.style.opacity = isActive ? '1' : '0.5';
        button.classList.remove('active');
        
        if (isActive) {
            button.classList.add('active', 'submitted');
        }
        
        button.onclick = null;
    }

    /**
     * Add submitted indicator
     * @private
     * @param {HTMLElement} feedbackButtons - Feedback buttons container
     */
    _addSubmittedIndicator(feedbackButtons) {
        if (feedbackButtons.querySelector('.feedback-submitted-indicator')) return;

        const indicator = document.createElement('span');
        indicator.className = 'feedback-submitted-indicator';
        indicator.textContent = '✓ Submitted';
        Object.assign(indicator.style, {
            fontSize: '0.6rem',
            color: '#28a745',
            fontWeight: '500',
            marginLeft: '8px'
        });
        
        feedbackButtons.appendChild(indicator);
    }

    /**
     * Auto-hide feedback input
     * @private
     * @param {HTMLElement} messageElement - Message element
     */
    _autoHideFeedbackInput(messageElement) {
        setTimeout(() => {
            const inputContainer = messageElement.querySelector('.feedback-input-container');
            inputContainer?.remove();
        }, 3000);
    }

    /**
     * Reset feedback button states
     * @private
     * @param {HTMLElement} messageElement - Message element
     */
    _resetFeedbackButtonStates(messageElement) {
        const feedbackButtons = messageElement.querySelector('.feedback-buttons');
        if (feedbackButtons && !this._isFeedbackAlreadySubmitted(feedbackButtons)) {
            feedbackButtons.querySelectorAll('.feedback-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
    }

    /**
     * Create feedback buttons for bot messages
     * @private
     * @param {string} messageId - Unique message ID
     * @param {Array} sources - Array of source URLs/references
     * @returns {string} HTML for feedback buttons
     */
    _createFeedbackButtons(messageId, sources = []) {
        const sourcesButton = sources.length > 0 
            ? `<button class="feedback-btn sources-btn" onclick="chatbot.showSourcesModal('${messageId}', ${JSON.stringify(sources).replace(/"/g, '&quot;')})">🔗 Sources</button>`
            : '';

        return `
            <div class="feedback-buttons">
                <button class="feedback-btn like-btn" onclick="chatbot.handleFeedback('${messageId}', 'like')">👍</button>
                <button class="feedback-btn dislike-btn" onclick="chatbot.handleFeedback('${messageId}', 'dislike')">👎</button>
                ${sourcesButton}
            </div>
        `;
    }

    /**
     * Get or create sources modal
     * @private
     * @returns {HTMLElement} Sources modal element
     */
    _getOrCreateSourcesModal() {
        let modal = document.getElementById('sourcesModal');
        if (!modal) {
            modal = this._createSourcesModal();
            document.body.appendChild(modal);
        }
        return modal;
    }

    /**
     * Create sources modal element
     * @private
     * @returns {HTMLElement} Sources modal element
     */
    _createSourcesModal() {
        const modal = document.createElement('div');
        modal.id = 'sourcesModal';
        modal.className = 'modal sources-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span class="close-modal" onclick="chatbot.hideSourcesModal()">&times;</span>
                </div>
                <div class="sources-container">
                    <!-- Sources content will be populated here -->
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideSourcesModal();
            }
        });

        return modal;
    }

    /**
     * Populate sources modal with content
     * @private
     * @param {HTMLElement} modal - Modal element
     * @param {Array} sources - Array of sources
     */
    _populateSourcesModal(modal, sources) {
        const container = modal.querySelector('.sources-container');
        if (!container) return;

        if (!sources || sources.length === 0) {
            container.innerHTML = '<p class="no-sources">No sources available for this response.</p>';
            return;
        }

        const sourcesList = sources.map((source, index) => {
            if (typeof source === 'string') {
                return `
                    <div class="source-item">
                        <div class="source-number">${index + 1}</div>
                        <div class="source-content">
                            <a href="${source}" target="_blank" rel="noopener noreferrer">${source}</a>
                        </div>
                    </div>
                `;
            } else if (typeof source === 'object') {
                return `
                    <div class="source-item">
                        <div class="source-number">${index + 1}</div>
                        <div class="source-content">
                            <div class="source-title">${source.title || 'Reference'}</div>
                            <a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.url}</a>
                            ${source.description ? `<div class="source-description">${source.description}</div>` : ''}
                        </div>
                    </div>
                `;
            }
            return '';
        }).join('');

        container.innerHTML = `
            <div class="sources-header">
                <h3>📚 Sources & References</h3>
                <p>The following sources were referenced for this response:</p>
            </div>
            <div class="sources-list">
                ${sourcesList}
            </div>
        `;
    }

    /**
     * Generate sample sources for demonstration
     * @private
     * @param {string} message - User message to contextualize sources
     * @returns {Array} Array of sample source objects
     */
    _generateSampleSources(message) {
        const lowercaseMessage = message.toLowerCase();
        
        if (lowercaseMessage.includes('grammar') || lowercaseMessage.includes('writing')) {
            return [
                {
                    title: "Purdue Writing Lab - Grammar Guide",
                    url: "https://owl.purdue.edu/owl/general_writing/grammar/",
                    description: "Comprehensive grammar rules and writing guidelines"
                },
                {
                    title: "Grammarly Writing Resources",
                    url: "https://www.grammarly.com/blog/category/writing-tips/",
                    description: "Professional writing tips and best practices"
                }
            ];
        }
        
        if (lowercaseMessage.includes('style') || lowercaseMessage.includes('improve')) {
            return [
                {
                    title: "Chicago Manual of Style",
                    url: "https://www.chicagomanualofstyle.org/",
                    description: "Authoritative guide for writing and style"
                },
                "https://www.hemingwayapp.com/"
            ];
        }
        
        if (lowercaseMessage.includes('business') || lowercaseMessage.includes('professional')) {
            return [
                {
                    title: "Business Writing Guidelines",
                    url: "https://www.harvard.edu/business-writing",
                    description: "Professional business communication standards"
                }
            ];
        }
        
        if (Math.random() > 0.5) {
            return [
                "https://www.microsoft.com/en-us/microsoft-365/word",
                {
                    title: "Writing Best Practices",
                    url: "https://example.com/writing-guide",
                    description: "General writing improvement resources"
                }
            ];
        }
        
        return [];
    }

    // =============================================================================
    // PRIVATE HELPER METHODS
    // =============================================================================

    /**
     * Escape HTML characters to prevent XSS and CSP issues
     * @private
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML text
     */
    _escapeHtml(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Generate unique message ID
     * @private
     * @returns {string} Unique message identifier
     */
    _generateMessageId() {
        return `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current time formatted string
     * @private
     * @returns {string} Formatted time string
     */
    _getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Update chat history with user and assistant messages
     * @private
     * @param {string} userMessage - User's message
     * @param {string} assistantMessage - Assistant's response
     */
    _updateChatHistory(userMessage, assistantMessage) {
        this.#chatHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: assistantMessage }
        );
    }

    /**
     * Handle errors that occur during message sending
     * @private
     * @param {Error} error - The error that occurred
     */
    _handleSendMessageError(error) {
        const typingId = this._findTypingIndicator();
        if (typingId) this._removeTypingIndicator(typingId);
        this.addMessage(`Sorry, I encountered an error: ${error.message}`, 'bot', 'error');
    }

    /**
     * Set analysis button state
     * @private
     * @param {HTMLElement} button - The analyze button element
     * @param {boolean} isAnalyzing - Whether analysis is in progress
     * @param {string} originalText - Original button text to restore
     */
    _setAnalysisState(button, isAnalyzing, originalText = '📝 Analyze') {
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
     * @private
     * @param {Array} paragraphs - Array of paragraph objects
     * @throws {Error} If no paragraphs are found
     */
    _validateParagraphs(paragraphs) {
        if (!paragraphs || paragraphs.length === 0) {
            throw new Error('No paragraphs found in the document. Please add some content first.');
        }
    }

    /**
     * Map filtered paragraph index back to original Word document index
     * @private
     * @param {number} filteredIndex - Index in the filtered paragraph array
     * @returns {number} Original paragraph index in Word document
     */
    _getOriginalParagraphIndex(filteredIndex) {
        if (!this.#paragraphMapping || filteredIndex >= this.#paragraphMapping.length) {
            console.warn(`[WARNING] No paragraph mapping found for filtered index ${filteredIndex}`);
            return filteredIndex;
        }
        
        const originalIndex = this.#paragraphMapping[filteredIndex].originalIndex;
        console.log(`[DEBUG] Mapping filtered index ${filteredIndex} to original index ${originalIndex}`);
        return originalIndex;
    }

    /**
     * Find suggestion by unique ID
     * @private
     * @param {string} uniqueId - The unique identifier
     * @returns {Object|null} The suggestion object or null if not found
     */
    _findSuggestionById(uniqueId) {
        return this.#currentSuggestions.find(s => s.uniqueId === uniqueId) || null;
    }

    /**
     * Disable all suggestion buttons from previous interactions
     * @private
     */
    _disableAllSuggestionButtons() {
        const allActionContainers = document.querySelectorAll('[id^="actions-suggestion_"]');
        
        allActionContainers.forEach(container => {
            if (container.classList.contains('completed')) return;
            
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            });
            
            this._addDisabledStateIndicator(container);
        });
    }

    /**
     * Add disabled state indicator to suggestion container
     * @private
     * @param {HTMLElement} container - Container element
     */
    _addDisabledStateIndicator(container) {
        const disabledNote = document.createElement('div');
        disabledNote.className = 'suggestion-disabled-note';
        disabledNote.innerHTML = '⏸️ <em>Disabled - New analysis started</em>';
        Object.assign(disabledNote.style, {
            fontSize: '0.55rem',
            color: '#6c757d',
            textAlign: 'center',
            marginTop: '4px',
            fontStyle: 'italic'
        });
        
        container.appendChild(disabledNote);
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Create a message element with Markdown support
     * @private
     * @param {string} content - Message content
     * @param {string} sender - 'user' or 'bot'
     * @param {string} type - Message type for styling
     * @param {Array} sources - Optional array of source URLs/references
     * @returns {HTMLElement} The created message element
     */
    _createMessageElement(content, sender, type, sources = []) {
        const messageDiv = document.createElement('div');
        const messageId = this._generateMessageId();
        messageDiv.id = messageId;
        messageDiv.className = `message ${sender}-message ${type}`;
        
        const processedContent = this._processMessageContent(content, sender);
        const feedbackButtons = sender === 'bot' ? this._createFeedbackButtons(messageId, sources) : '';
        
        messageDiv.innerHTML = `
            <div class="message-content">${processedContent}</div>
            <div class="message-footer">
                <div class="message-time">${this._getCurrentTime()}</div>
                ${feedbackButtons}
            </div>
        `;
        return messageDiv;
    }

    /**
     * Process message content based on sender
     * @private
     * @param {string} content - Message content
     * @param {string} sender - Message sender
     * @returns {string} Processed content
     */
    _processMessageContent(content, sender) {
        if (sender === 'bot' && typeof MarkdownRenderer !== 'undefined') {
            return MarkdownRenderer.renderSafe(content, true);
        } else if (sender === 'user' && typeof MarkdownRenderer !== 'undefined') {
            return MarkdownRenderer.renderSafe(content, false);
        } else {
            return this._escapeHtml(content);
        }
    }

    /**
     * Scroll chat messages to bottom
     * @private
     * @param {HTMLElement} chatMessages - The chat messages container
     */
    _scrollToBottom(chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Show typing indicator
     * @private
     * @returns {string} Indicator ID for removal
     */
    _showTypingIndicator() {
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
        this._scrollToBottom(chatMessages);
        
        return typingId;
    }

    /**
     * Remove typing indicator
     * @private
     * @param {string} typingId - ID of the typing indicator to remove
     */
    _removeTypingIndicator(typingId) {
        if (!typingId) return;
        const typingElement = document.getElementById(typingId);
        typingElement?.remove();
    }

    /**
     * Find existing typing indicator
     * @private
     * @returns {string|null} Typing indicator ID or null
     */
    _findTypingIndicator() {
        const typingElement = document.querySelector('.typing');
        return typingElement?.id || null;
    }
}
