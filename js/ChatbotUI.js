/**
 * ChatbotUI - Main UI controller for the Writing Assistant
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
        this.paragraphMapping = []; // Store mapping between filtered and original indexes
        
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
                <div class="header-buttons">
                    <button id="analyzeParagraphs" class="btn-analyze">📝 Analyze</button>
                    <button id="showTables" class="btn-tables">📋 Tables</button>
                </div>
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
                <div class="header-buttons">
                    <button id="analyzeParagraphs" class="btn-analyze">📝 Analyze</button>
                    <button id="showTables" class="btn-tables">📋 Tables</button>
                </div>
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
     * Get welcome message HTML with Markdown formatting
     * @returns {string} Welcome message HTML
     */
    getWelcomeMessage() {
        const aiStatus = this.apiService.getActiveModelName();
        const modelReady = this.apiService.isCurrentModelReady();
        const statusIcon = modelReady ? '✅' : '⚠️';
        
        // Create welcome message with Markdown formatting
        const welcomeText = `**Hello! I can help you:**

- 📊 **Analyze document** with AI insights
- ✨ *Suggest improvements* for clarity and style  
- 💬 **Answer questions** about your writing

${statusIcon} **Active AI:** ${aiStatus}

Click **"Analyze"** to start, or use ⚙️ for more options!`;

        // Sample sources for welcome message demonstration
        const welcomeSources = [
            {
                title: "Microsoft Word Add-ins Documentation",
                url: "https://docs.microsoft.com/en-us/office/dev/add-ins/word/",
                description: "Official documentation for Word add-ins development"
            },
            "https://www.microsoft.com/en-us/microsoft-365/word"
        ];

        const messageId = `welcome-${Date.now()}`;
        const feedbackButtons = this.createFeedbackButtons(messageId, welcomeSources);
            
        return `
            <div class="message bot-message" id="${messageId}">
                <div class="message-content">${typeof MarkdownRenderer !== 'undefined' ? MarkdownRenderer.render(welcomeText) : welcomeText.replace(/\n/g, '<br>')}</div>
                <div class="message-footer">
                    <div class="message-time">${this.getCurrentTime()}</div>
                    ${feedbackButtons}
                </div>
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
        
        // Tables button event
        const tablesButton = document.getElementById('showTables');
        tablesButton?.addEventListener('click', () => this.showTablesModal());
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

            // Get full document context for better AI responses
            let documentContext = '';
            try {
                documentContext = await this.documentManager.readDocumentText();
                console.log('📄 [DOCUMENT CONTEXT] Retrieved:', {
                    hasContext: !!documentContext,
                    contextLength: documentContext ? documentContext.length : 0,
                    wordCount: documentContext ? documentContext.split(/\s+/).filter(w => w.length > 0).length : 0,
                    contextPreview: documentContext ? documentContext.substring(0, 300) + '...' : 'No document text',
                    // FULL CONTEXT FOR DEBUGGING - Remove this in production
                    FULL_CONTEXT_DEBUG: documentContext || 'No context available'
                });
            } catch (error) {
                console.warn('Could not read document context:', error);
            }

            // Check if this is a paragraph analysis request
            const isAnalysisRequest = this.isAnalysisRequest(message);
            
            if (isAnalysisRequest) {
                // Handle paragraph analysis in chat
                await this.handleChatAnalysisRequest(message, typingId, documentContext);
            } else {
                // Regular chat with document context
                const response = await this.apiService.sendChatMessage(message, this.chatHistory, {
                    documentContext: documentContext
                });
                
                // Remove typing indicator and show response
                this.removeTypingIndicator(typingId);
                
                // Add sample sources for demonstration (in real implementation, sources would come from API)
                const sampleSources = this.generateSampleSources(message);
                this.addMessage(response.message, 'bot', '', sampleSources);
                
                // Update chat history
                this.updateChatHistory(message, response.message);
            }

        } catch (error) {
            this.handleSendMessageError(error);
        }
    }

    /**
     * Check if the message is requesting paragraph analysis
     * @param {string} message - User message
     * @returns {boolean} True if this is an analysis request
     */
    isAnalysisRequest(message) {
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
     * @param {string} message - User message
     * @param {string} typingId - Typing indicator ID
     * @param {string} documentContext - Full document text
     */
    async handleChatAnalysisRequest(message, typingId, documentContext) {
        try {
            console.log('🔍 [CHAT ANALYSIS] Starting analysis request:', {
                message: message,
                hasDocumentContext: !!documentContext,
                documentContextLength: documentContext ? documentContext.length : 0,
                documentContextPreview: documentContext ? documentContext.substring(0, 200) + '...' : 'No context'
            });

            // Read paragraphs for analysis
            const paragraphs = await this.documentManager.readParagraphs();
            this.validateParagraphs(paragraphs);

            // Store paragraph mapping for correct index translation
            this.paragraphMapping = paragraphs;

            console.log('🔍 [CHAT ANALYSIS] Sending to API service:', {
                paragraphCount: paragraphs.length,
                fullDocumentTextLength: documentContext ? documentContext.length : 0,
                paragraphsPreview: paragraphs.slice(0, 2).map(p => p.text.substring(0, 100) + '...'),
                paragraphMapping: paragraphs.map(p => ({ filtered: p.filteredIndex, original: p.originalIndex }))
            });

            // Get suggestions with full document context
            const suggestions = await this.apiService.getParagraphSuggestions(paragraphs, {
                fullDocumentText: documentContext
            });

            // Remove typing indicator
            this.removeTypingIndicator(typingId);

            // Display analysis results in chat format
            this.displayChatAnalysisResults(message, suggestions, paragraphs);

        } catch (error) {
            this.removeTypingIndicator(typingId);
            this.addMessage(`Error performing analysis: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Display analysis results in chat format
     * @param {string} originalMessage - User's original message
     * @param {Object} suggestions - Analysis suggestions
     * @param {Array} paragraphs - Document paragraphs
     */
    displayChatAnalysisResults(originalMessage, suggestions, paragraphs) {
        // Create analysis summary with Markdown formatting
        const summaryMessage = `## 📊 Document Analysis Complete

**📄 Document Theme:** ${suggestions.documentTheme || 'General document'}  
**📝 Total Paragraphs:** ${suggestions.totalParagraphs}  
**💡 Suggestions Found:** ${suggestions.suggestions?.length || 0}

${suggestions.suggestions?.length > 0 ? 
    '*I found several areas for improvement. Here are the suggestions:*' : 
    '*Your document looks good! No major improvements needed.*'}`;
        
        this.addMessage(summaryMessage, 'bot', 'analysis');
        
        // Display each suggestion as a chat message
        if (suggestions.suggestions && suggestions.suggestions.length > 0) {
            this.displayAnalysisResults(paragraphs, suggestions.suggestions);
        }
        
        // Update chat history
        this.updateChatHistory(originalMessage, summaryMessage);
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

            // Perform document analysis with full context
            const paragraphs = await this.documentManager.readParagraphs();
            this.validateParagraphs(paragraphs);

            // Store paragraph mapping for correct index translation
            this.paragraphMapping = paragraphs;

            // Get full document text for context
            const fullDocumentText = await this.documentManager.readDocumentText();

            console.log('🔍 [ANALYSIS] Full document context for analysis:', {
                hasFullText: !!fullDocumentText,
                fullTextLength: fullDocumentText ? fullDocumentText.length : 0,
                fullTextPreview: fullDocumentText ? fullDocumentText.substring(0, 300) + '...' : 'No full text',
                paragraphCount: paragraphs.length,
                totalWordCount: fullDocumentText ? fullDocumentText.split(/\s+/).filter(w => w.length > 0).length : 0
            });

            // Get suggestions with full document context
            const suggestions = await this.apiService.getParagraphSuggestions(paragraphs, {
                fullDocumentText: fullDocumentText
            });
            
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
            // Map filtered paragraph index to original Word document index
            const originalParagraphIndex = this.getOriginalParagraphIndex(suggestion.paragraphIndex);
            
            console.log(`[DEBUG] Showing suggestion for filtered index ${suggestion.paragraphIndex}, mapped to original index ${originalParagraphIndex}`);
            
            // Insert and display suggestion in document
            const result = await this.documentManager.insertSuggestionAfterParagraph(
                originalParagraphIndex,
                suggestion.originalText,
                suggestion.suggestedText
            );

            await this.documentManager.navigateToParagraph(originalParagraphIndex);
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
            
            const originalParagraphIndex = this.getOriginalParagraphIndex(suggestion.paragraphIndex);
            this.showActionResult(suggestionUniqueId, 'approved', 
                `Applied suggestion for paragraph ${originalParagraphIndex + 1}`);
            
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
            
            const originalParagraphIndex = this.getOriginalParagraphIndex(suggestion.paragraphIndex);
            this.showActionResult(suggestionUniqueId, 'rejected', 
                `Rejected suggestion for paragraph ${originalParagraphIndex + 1}`);
                
        } catch (error) {
            this.addMessage(`❌ Error rejecting suggestion: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Add a message to the chat
     * @param {string} content - Message content
     * @param {string} sender - 'user' or 'bot'
     * @param {string} type - Message type for styling
     * @param {Array} sources - Optional array of source URLs/references for bot messages
     */
    addMessage(content, sender, type = '', sources = []) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageElement = this.createMessageElement(content, sender, type, sources);
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

    /**
     * Show tables modal with table templates for insertion
     */
    async showTablesModal() {
        try {
            // Show the modal
            const modal = document.getElementById('tablesModal');
            const container = document.getElementById('tablesContainer');
            
            if (!modal || !container) {
                console.error('Tables modal elements not found');
                return;
            }
            
            modal.style.display = 'block';
            
            // Show loading state
            container.innerHTML = '<div class="tables-loading"><p>📋 Loading table templates...</p></div>';
            
            // Get predefined table templates
            const tableTemplates = this.getTableTemplates();
            
            // Render table templates
            this.renderTableTemplates(tableTemplates);
            
            // Setup search functionality
            this.setupTableTemplatesSearch(tableTemplates);
            
        } catch (error) {
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
    }

    /**
     * Get predefined table templates for insertion
     * @returns {Array} Array of table template objects
     */
    getTableTemplates() {
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
     * @param {Array} templates - Array of table template data
     */
    /**
     * Render table templates in the modal
     * @param {Array} templates - Array of table template data
     */
    renderTableTemplates(templates) {
        const container = document.getElementById('tablesContainer');
        
        let templatesHtml = '';
        
        templates.forEach((template, index) => {
            templatesHtml += `
                <div class="table-template-item" data-template-id="${template.id}" data-search-text="${template.searchableText}">
                    <div class="template-header">
                        <div class="template-title">� ${template.title}</div>
                        <div class="template-info">
                            <span class="template-category">${template.category}</span>
                            <span>${template.rows.length - 1} rows × ${template.rows[0].length} columns</span>
                        </div>
                    </div>
                    <div class="template-description">
                        💡 ${template.description}
                    </div>
                    <div class="table-content">
                        ${this.renderTableHTML(template.rows)}
                    </div>
                    <div class="template-actions">
                        <button class="btn-insert-template" onclick="chatbot.insertTableTemplate('${template.id}')" title="Insert this table">
                            ➕ Insert Table
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = templatesHtml;
    }

    /**
     * Render table rows as HTML table
     * @param {Array} rows - Table rows data
     * @returns {string} HTML table string
     */
    renderTableHTML(rows) {
        if (rows.length === 0) {
            return '<p style="text-align: center; color: #6c757d; padding: 20px;">Empty table</p>';
        }
        
        let tableHtml = '<table class="document-table">';
        
        // First row as headers
        if (rows.length > 0) {
            tableHtml += '<thead><tr>';
            rows[0].forEach(cell => {
                tableHtml += `<th>${this.escapeHtml(cell || '')}</th>`;
            });
            tableHtml += '</tr></thead>';
        }
        
        // Remaining rows as data
        if (rows.length > 1) {
            tableHtml += '<tbody>';
            for (let i = 1; i < rows.length; i++) {
                tableHtml += '<tr>';
                rows[i].forEach(cell => {
                    tableHtml += `<td title="${this.escapeHtml(cell || '')}">${this.escapeHtml(cell || '')}</td>`;
                });
                tableHtml += '</tr>';
            }
            tableHtml += '</tbody>';
        }
        
        tableHtml += '</table>';
        return tableHtml;
    }

    /**
     * Insert a table template into the document
     * @param {string} templateId - ID of the template to insert
     */
    async insertTableTemplate(templateId) {
        try {
            const templates = this.getTableTemplates();
            const template = templates.find(t => t.id === templateId);
            
            if (!template) {
                throw new Error('Template not found');
            }

            // Show loading feedback
            this.addMessage(`📋 Inserting ${template.title}...`, 'bot', 'info');
            
            // Insert the table using WordDocumentManager
            await this.documentManager.insertCustomTable(template.rows, template.title);
            
            // Close modal and show success message
            document.getElementById('tablesModal').style.display = 'none';
            this.addMessage(`✅ ${template.title} inserted successfully!`, 'bot', 'success');
            
        } catch (error) {
            console.error('Error inserting table template:', error);
            this.addMessage(`❌ Error inserting table: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Customize template with AI (placeholder for future API integration)
     * @param {string} templateId - ID of the template to customize
     */
    async customizeTemplate(templateId) {
        try {
            const templates = this.getTableTemplates();
            const template = templates.find(t => t.id === templateId);
            
            if (!template) {
                throw new Error('Template not found');
            }

            // Placeholder for future API integration
            this.addMessage(`🤖 AI customization for "${template.title}" will be available soon! For now, you can insert the standard template.`, 'bot', 'info');
            
            // TODO: Integrate with AI API to customize table based on user requirements
            // Example: await this.apiService.customizeTable(template, userRequirements);
            
        } catch (error) {
            console.error('Error customizing template:', error);
            this.addMessage(`❌ Error customizing template: ${error.message}`, 'bot', 'error');
        }
    }

    /**
     * Check if AI API is ready for customization
     * @returns {boolean} True if API is ready
     */
    isApiReady() {
        // For now, always show the customize button as placeholder
        // In the future, check if AI service is configured and ready
        return this.apiService && this.apiService.isCurrentModelReady();
    }

    /**
     * Setup search functionality for table templates
     * @param {Array} templates - Array of template data
     */
    /**
     * Setup search functionality for table templates
     * @param {Array} templates - Array of template data
     */
    setupTableTemplatesSearch(templates) {
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
                
                if (isVisible) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
        
        // Clear search on modal open
        searchInput.value = '';
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Map filtered paragraph index back to original Word document index
     * @param {number} filteredIndex - Index in the filtered paragraph array
     * @returns {number} Original paragraph index in Word document
     */
    getOriginalParagraphIndex(filteredIndex) {
        if (!this.paragraphMapping || filteredIndex >= this.paragraphMapping.length) {
            console.warn(`[WARNING] No paragraph mapping found for filtered index ${filteredIndex}`);
            return filteredIndex; // Fallback to filtered index
        }
        
        const originalIndex = this.paragraphMapping[filteredIndex].originalIndex;
        console.log(`[DEBUG] Mapping filtered index ${filteredIndex} to original index ${originalIndex}`);
        return originalIndex;
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
                
                // Get the original paragraph number for display
                const originalParagraphIndex = this.getOriginalParagraphIndex(suggestion.paragraphIndex);
                
                analysisContent += `\n---\n`;
                analysisContent += `<div class="suggestion-chat-item" data-index="${index}" data-unique-id="${suggestion.uniqueId}">
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
     * Create a message element with Markdown support
     * @param {string} content - Message content (supports Markdown for bot messages)
     * @param {string} sender - 'user' or 'bot'
     * @param {string} type - Message type for styling
     * @returns {HTMLElement} The created message element
     */
    createMessageElement(content, sender, type, sources = []) {
        const messageDiv = document.createElement('div');
        const messageId = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        messageDiv.id = messageId;
        messageDiv.className = `message ${sender}-message ${type}`;
        
        // Process content based on sender
        let processedContent;
        if (sender === 'bot' && typeof MarkdownRenderer !== 'undefined') {
            // Bot messages: render Markdown (trusted content from AI)
            processedContent = MarkdownRenderer.renderSafe(content, true);
        } else if (sender === 'user' && typeof MarkdownRenderer !== 'undefined') {
            // User messages: escape HTML but preserve some basic formatting
            processedContent = MarkdownRenderer.renderSafe(content, false);
        } else {
            // Fallback: escape HTML for safety
            const div = document.createElement('div');
            div.textContent = content;
            processedContent = div.innerHTML;
        }
        
        // Add feedback buttons for bot messages
        const feedbackButtons = sender === 'bot' ? this.createFeedbackButtons(messageId, sources) : '';
        
        messageDiv.innerHTML = `
            <div class="message-content">${processedContent}</div>
            <div class="message-footer">
                <div class="message-time">${this.getCurrentTime()}</div>
                ${feedbackButtons}
            </div>
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

    // =============================================================================
    // FEEDBACK AND SOURCES METHODS
    // =============================================================================

    /**
     * Create feedback buttons for bot messages
     * @param {string} messageId - Unique message ID
     * @param {Array} sources - Array of source URLs/references
     * @returns {string} HTML for feedback buttons
     */
    createFeedbackButtons(messageId, sources = []) {
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
     * Handle like/dislike feedback
     * @param {string} messageId - Message ID
     * @param {string} feedbackType - 'like' or 'dislike'
     */
    handleFeedback(messageId, feedbackType) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const feedbackButtons = messageElement.querySelector('.feedback-buttons');
        if (!feedbackButtons) return;

        // Check if feedback has already been submitted
        const submittedIndicator = feedbackButtons.querySelector('.feedback-submitted-indicator');
        if (submittedIndicator) {
            // Feedback already submitted, don't allow changes
            return;
        }

        // Show feedback input
        const existingInput = messageElement.querySelector('.feedback-input-container');
        if (existingInput) {
            existingInput.remove();
        }

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

        messageElement.querySelector('.message-footer').appendChild(inputContainer);
        
        // Focus the input
        const input = inputContainer.querySelector('.feedback-input');
        input.focus();

        // Handle Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitFeedback(messageId, feedbackType);
            }
        });

        // Highlight the clicked button
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
     * Submit feedback comment
     * @param {string} messageId - Message ID
     * @param {string} feedbackType - 'like' or 'dislike'
     */
    submitFeedback(messageId, feedbackType) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const inputContainer = messageElement.querySelector('.feedback-input-container');
        const input = inputContainer?.querySelector('.feedback-input');
        
        if (!input) return;

        const comment = input.value.trim();
        
        // Store feedback (you can extend this to send to analytics/server)
        const feedback = {
            messageId,
            type: feedbackType,
            comment,
            timestamp: new Date().toISOString()
        };

        console.log('User feedback:', feedback);

        // Show thank you message
        inputContainer.innerHTML = `
            <div class="feedback-thank-you">
                <span class="feedback-icon">${feedbackType === 'like' ? '👍' : '👎'}</span>
                Thank you for your feedback${comment ? ': "' + comment + '"' : '!'}
            </div>
        `;

        // Disable all feedback buttons for this message
        this.disableFeedbackButtons(messageId, feedbackType);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            inputContainer.remove();
        }, 3000);
    }

    /**
     * Disable feedback buttons after submission
     * @param {string} messageId - Message ID
     * @param {string} submittedType - The type of feedback that was submitted
     */
    disableFeedbackButtons(messageId, submittedType) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const feedbackButtons = messageElement.querySelector('.feedback-buttons');
        if (!feedbackButtons) return;

        const likeBtn = feedbackButtons.querySelector('.like-btn');
        const dislikeBtn = feedbackButtons.querySelector('.dislike-btn');

        // Disable and style the buttons
        if (likeBtn) {
            likeBtn.disabled = true;
            likeBtn.style.cursor = 'not-allowed';
            likeBtn.style.opacity = submittedType === 'like' ? '1' : '0.5';
            likeBtn.classList.remove('active');
            if (submittedType === 'like') {
                likeBtn.classList.add('active', 'submitted');
            }
            // Remove click handler
            likeBtn.onclick = null;
        }

        if (dislikeBtn) {
            dislikeBtn.disabled = true;
            dislikeBtn.style.cursor = 'not-allowed';
            dislikeBtn.style.opacity = submittedType === 'dislike' ? '1' : '0.5';
            dislikeBtn.classList.remove('active');
            if (submittedType === 'dislike') {
                dislikeBtn.classList.add('active', 'submitted');
            }
            // Remove click handler
            dislikeBtn.onclick = null;
        }

        // Add a small indicator showing feedback was submitted
        const existingIndicator = feedbackButtons.querySelector('.feedback-submitted-indicator');
        if (!existingIndicator) {
            const indicator = document.createElement('span');
            indicator.className = 'feedback-submitted-indicator';
            indicator.textContent = '✓ Submitted';
            indicator.style.fontSize = '0.6rem';
            indicator.style.color = '#28a745';
            indicator.style.fontWeight = '500';
            indicator.style.marginLeft = '8px';
            feedbackButtons.appendChild(indicator);
        }
    }

    /**
     * Cancel feedback input
     * @param {string} messageId - Message ID
     */
    cancelFeedback(messageId) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        const inputContainer = messageElement.querySelector('.feedback-input-container');
        inputContainer?.remove();

        // Reset button states (only if not already submitted)
        const feedbackButtons = messageElement.querySelector('.feedback-buttons');
        if (feedbackButtons && !feedbackButtons.querySelector('.feedback-submitted-indicator')) {
            feedbackButtons.querySelectorAll('.feedback-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
    }

    /**
     * Show sources modal
     * @param {string} messageId - Message ID
     * @param {Array} sources - Array of source objects
     */
    showSourcesModal(messageId, sources) {
        // Create or get sources modal
        let modal = document.getElementById('sourcesModal');
        if (!modal) {
            modal = this.createSourcesModal();
            document.body.appendChild(modal);
        }

        // Populate sources
        const container = modal.querySelector('.sources-container');
        if (!container) return;

        if (!sources || sources.length === 0) {
            container.innerHTML = '<p class="no-sources">No sources available for this response.</p>';
        } else {
            const sourcesList = sources.map((source, index) => {
                if (typeof source === 'string') {
                    // Simple URL string
                    return `
                        <div class="source-item">
                            <div class="source-number">${index + 1}</div>
                            <div class="source-content">
                                <a href="${source}" target="_blank" rel="noopener noreferrer">${source}</a>
                            </div>
                        </div>
                    `;
                } else if (typeof source === 'object') {
                    // Source object with title and URL
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

        // Show modal
        modal.style.display = 'flex';
    }

    /**
     * Create sources modal element
     * @returns {HTMLElement} Sources modal element
     */
    createSourcesModal() {
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

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideSourcesModal();
            }
        });

        return modal;
    }

    /**
     * Generate sample sources for demonstration
     * @param {string} message - User message to contextualize sources
     * @returns {Array} Array of sample source objects
     */
    generateSampleSources(message) {
        // In a real implementation, sources would come from the AI API response
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
        
        // Default sources for general queries
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
        
        return []; // No sources for some responses
    }

    /**
     * Hide sources modal
     */
    hideSourcesModal() {
        const modal = document.getElementById('sourcesModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}
