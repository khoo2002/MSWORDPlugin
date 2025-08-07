# 📋 MS Word Plugin API Specification

## 🔍 Overview
This document provides detailed API specifications for all endpoints and functionalities required for the AI Writing Assistant Microsoft Word Add-in. Each API includes complete request/response schemas, authentication requirements, and implementation notes.

---

## 🚀 Backend REST API Endpoints

### 1. Text Analysis API

**Endpoint:** `POST /api/analyze-text`  
**Purpose:** Analyze document text for metrics, readability, and AI insights  
**Status:** ⚠️ Basic implementation exists, AI enhancement needed

#### Request Parameters
```json
{
  "text": "string (required) - Full document text content",
  "options": {
    "includeReadability": "boolean (optional, default: true) - Calculate readability scores",
    "includeToneAnalysis": "boolean (optional, default: true) - Analyze document tone",
    "includeKeywords": "boolean (optional, default: false) - Extract key phrases"
  }
}
```

#### Response Schema
```json
{
  "wordCount": "number - Total word count",
  "characterCount": "number - Total character count", 
  "sentenceCount": "number - Total sentence count",
  "paragraphCount": "number - Total paragraph count",
  "readabilityScore": "number (0-100) - Flesch reading ease score",
  "toneAnalysis": {
    "primary": "string - Primary tone (professional|casual|academic|creative)",
    "confidence": "number (0-1) - Confidence score",
    "emotions": ["string"] - Detected emotions
  },
  "keyPhrases": ["string"] - Important phrases (if requested),
  "timestamp": "string (ISO 8601) - Analysis timestamp",
  "preview": "string - First 100 characters of text",
  "message": "string - Human-readable status message"
}
```

#### Authentication
- **Type:** None (local server)
- **Headers:** Content-Type: application/json

#### Error Responses
- `400` - Invalid request format or missing text
- `500` - Server analysis error

---

### 2. Text Suggestions API

**Endpoint:** `POST /api/suggest-improvements`  
**Purpose:** Generate AI-powered text improvement suggestions  
**Status:** ⚠️ Basic implementation exists, AI enhancement needed

#### Request Parameters
```json
{
  "text": "string (required) - Text to analyze for improvements",
  "context": "string (optional) - Additional context about the document",
  "focusAreas": ["string"] - Areas to focus on (grammar|style|clarity|structure),
  "maxSuggestions": "number (optional, default: 10) - Maximum suggestions to return"
}
```

#### Response Schema
```json
{
  "originalText": "string - Input text that was analyzed",
  "suggestions": [
    {
      "id": "string - Unique suggestion identifier",
      "type": "string - grammar|style|clarity|structure|flow",
      "suggestion": "string - Specific improvement suggestion",
      "reason": "string - Explanation for the suggestion",
      "confidence": "number (0-1) - AI confidence score",
      "startIndex": "number - Character start position in text",
      "endIndex": "number - Character end position in text",
      "originalPhrase": "string - Original text segment",
      "suggestedPhrase": "string - Improved text segment"
    }
  ],
  "overallScore": "number (0-100) - Text quality score",
  "timestamp": "string (ISO 8601) - Analysis timestamp"
}
```

#### Authentication
- **Type:** None (local server)
- **Headers:** Content-Type: application/json

---

### 3. Chat Message API

**Endpoint:** `POST /api/chat`  
**Purpose:** Handle chat conversations with AI assistant  
**Status:** ⚠️ Basic implementation exists, context awareness needed

#### Request Parameters
```json
{
  "message": "string (required) - User message or question",
  "history": [
    {
      "role": "string (user|assistant) - Message sender",
      "content": "string - Message content"
    }
  ],
  "documentContext": "string (optional) - Current document content for context",
  "isAnalysisCommand": "boolean (optional) - True if message starts with \\analyse",
  "analysisOptions": {
    "focusAreas": ["string"] - Areas to analyze if analysis command,
    "userInput": "string (optional) - Additional user input/guidance from command"
  }
}
```

#### Response Schema
```json
{
  "message": "string - AI assistant response",
  "type": "string - assistant|analysis|error",
  "timestamp": "string (ISO 8601) - Response timestamp",
  "sources": [
    {
      "title": "string - Reference title",
      "url": "string - Reference URL",
      "description": "string - Reference description"
    }
  ],
  "suggestedActions": [
    {
      "action": "string - Suggested user action",
      "description": "string - Action description"
    }
  ],
  "confidence": "number (0-1) - Response confidence score"
}
```

#### Special Handling: Analysis Commands
When `message` starts with `\analyse`:
- Set `isAnalysisCommand: true`
- Extract command parameters (focus areas, user input text)
- Send both document context AND user input to AI for contextual analysis
- Process as paragraph analysis request with user guidance
- Return structured analysis instead of conversational response
- Include detailed suggestions in response

#### Authentication
- **Type:** None (local server)
- **Headers:** Content-Type: application/json

---

### 4. Paragraph Analysis API

**Endpoint:** `POST /api/analyze-paragraphs`  
**Purpose:** Comprehensive AI analysis of document paragraphs  
**Status:** ⚠️ Basic implementation exists, AI enhancement needed

#### Request Parameters
```json
{
  "paragraphs": [
    {
      "index": "number - Paragraph index in document",
      "text": "string - Paragraph content"
    }
  ],
  "fullDocumentText": "string (optional) - Complete document for context",
  "analysisType": "string (optional) - comprehensive|quick|focused",
  "focusAreas": ["string"] - Areas to analyze (clarity|grammar|style|structure|flow),
  "userGuidance": "string (optional) - User input/instructions for analysis"
}
```

#### Response Schema
```json
{
  "totalParagraphs": "number - Number of paragraphs analyzed",
  "documentTheme": "string - Overall document theme/type",
  "analysisType": "string - Type of analysis performed",
  "overallScore": "number (0-100) - Document quality score",
  "suggestions": [
    {
      "id": "string - Unique suggestion identifier",
      "paragraphIndex": "number - Target paragraph index",
      "originalText": "string - Original paragraph text",
      "suggestedText": "string - Improved paragraph text",
      "type": "string - clarity|grammar|style|structure|flow",
      "reason": "string - Explanation of the improvement",
      "confidence": "number (0-1) - AI confidence score",
      "severity": "string - low|medium|high - Importance level",
      "category": "string - More specific categorization"
    }
  ],
  "documentMetrics": {
    "averageWordsPerParagraph": "number",
    "readabilityScore": "number (0-100)",
    "consistencyScore": "number (0-100)"
  },
  "timestamp": "string (ISO 8601) - Analysis timestamp"
}
```

#### Authentication
- **Type:** None (local server)
- **Headers:** Content-Type: application/json

---

### 5. AI Provider Configuration API

**Endpoint:** `POST /api/configure-provider`  
**Purpose:** Configure and test AI provider connections  
**Status:** ❌ Not implemented

#### Request Parameters
```json
{
  "provider": "string (required) - gemini|ollama|local",
  "config": {
    "apiKey": "string - API key (for Gemini)",
    "baseUrl": "string - Base URL (for Ollama)",
    "model": "string - Model name to use",
    "parameters": {
      "temperature": "number (0-1) - Response creativity",
      "maxTokens": "number - Maximum response length"
    }
  },
  "testConnection": "boolean (optional, default: false) - Test connection after config"
}
```

#### Response Schema
```json
{
  "provider": "string - Configured provider name",
  "status": "string - configured|active|error",
  "connectionTest": {
    "success": "boolean - Connection test result",
    "latency": "number - Response time in milliseconds",
    "error": "string - Error message if failed"
  },
  "availableModels": ["string"] - List of available models,
  "timestamp": "string (ISO 8601) - Configuration timestamp"
}
```

#### Authentication
- **Type:** None (local server)
- **Headers:** Content-Type: application/json

---

### 6. Document Export API

**Endpoint:** `POST /api/export-analysis`  
**Purpose:** Export analysis results in various formats  
**Status:** ❌ Not implemented

#### Request Parameters
```json
{
  "analysisId": "string (required) - Analysis session identifier",
  "format": "string (required) - json|pdf|docx|html",
  "includeOriginal": "boolean (optional, default: true) - Include original text",
  "includeSuggestions": "boolean (optional, default: true) - Include suggestions",
  "options": {
    "title": "string - Export document title",
    "author": "string - Export document author",
    "includeMetadata": "boolean - Include analysis metadata"
  }
}
```

#### Response Schema
```json
{
  "exportId": "string - Unique export identifier",
  "format": "string - Export format used",
  "downloadUrl": "string - Temporary download URL",
  "expiresAt": "string (ISO 8601) - URL expiration time",
  "fileSize": "number - File size in bytes",
  "timestamp": "string (ISO 8601) - Export timestamp"
}
```

#### Authentication
- **Type:** None (local server)
- **Headers:** Content-Type: application/json

---

## 🤖 AI Provider Integration APIs

### 1. Gemini AI Provider Class

**Class:** `GeminiAIProvider extends BaseAIProvider`  
**Purpose:** Google Gemini API integration  
**Status:** ✅ Implemented, enhancement needed

#### Required Methods

##### `async sendChatMessage(message, history, options)`
```javascript
/**
 * Send chat message to Gemini API
 * @param {string} message - User message
 * @param {Array} history - Chat history array
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Response object
 */
```

**Parameters:**
- `message`: User input message
- `history`: Array of previous chat messages
- `options.documentContext`: Current document text
- `options.temperature`: Response creativity (0-1)
- `options.maxTokens`: Maximum response length

**Returns:**
```json
{
  "message": "string - AI response",
  "usage": {
    "promptTokens": "number",
    "completionTokens": "number",
    "totalTokens": "number"
  },
  "model": "string - Model used",
  "timestamp": "string (ISO 8601)"
}
```

##### `async getParagraphSuggestions(paragraphs, options)`
```javascript
/**
 * Get paragraph improvement suggestions from Gemini
 * @param {Array} paragraphs - Document paragraphs
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Suggestions object
 */
```

##### `async testConnection()`
```javascript
/**
 * Test connection to Gemini API
 * @returns {Promise<Object>} Connection test result
 */
```

#### External API Integration
- **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Method:** POST
- **Authentication:** API Key in query parameter `?key=${apiKey}`
- **Headers:** `Content-Type: application/json`

---

### 2. Ollama AI Provider Class

**Class:** `OllamaAIProvider extends BaseAIProvider`  
**Purpose:** Local Ollama server integration  
**Status:** ✅ Implemented, enhancement needed

#### Required Methods

Same method signatures as Gemini provider but with different implementation.

#### External API Integration
- **URL:** `http://localhost:11434/api/generate`
- **Method:** POST
- **Authentication:** None (local server)
- **Headers:** `Content-Type: application/json`

#### Request Format for Ollama
```json
{
  "model": "string - Model name (e.g., 'llama2', 'mistral')",
  "prompt": "string - Complete prompt",
  "stream": "boolean - Stream response (default: false)",
  "options": {
    "temperature": "number",
    "top_p": "number",
    "max_tokens": "number"
  }
}
```

---

### 3. Local AI Provider Class

**Class:** `LocalAIProvider extends BaseAIProvider`  
**Purpose:** Fallback local text processing  
**Status:** ⚠️ Basic implementation, enhancement needed

#### Required Enhancements
- Advanced grammar checking algorithms
- Style analysis patterns
- Readability calculations
- Synonym suggestions
- Sentence structure analysis

---

## 📄 Word Document Management APIs

### 1. Document Reader API

**Class:** `WordDocumentManager`  
**Status:** ✅ Implemented

#### `async readDocumentText()`
```javascript
/**
 * Read complete document text
 * @returns {Promise<string>} Full document text
 */
```

#### `async readParagraphs()`
```javascript
/**
 * Read document paragraphs with metadata
 * @returns {Promise<Array>} Paragraph objects
 */
```

**Return Format:**
```json
[
  {
    "originalIndex": "number - Original paragraph index",
    "filteredIndex": "number - Filtered array index", 
    "text": "string - Paragraph content",
    "range": "object - Word range object",
    "wordCount": "number - Words in paragraph",
    "isEmpty": "boolean - Is paragraph empty"
  }
]
```

#### `async readTables()`
```javascript
/**
 * Extract table data from document
 * @returns {Promise<Array>} Table objects
 */
```

---

### 2. Document Writer API

**Class:** `WordDocumentManager`  
**Status:** ✅ Implemented, enhancement needed

#### `async insertText(text, position)`
```javascript
/**
 * Insert text at specified position
 * @param {string} text - Text to insert
 * @param {string} position - 'cursor'|'start'|'end'
 * @returns {Promise<Object>} Insertion result
 */
```

#### `async insertCustomTable(data, title, options)`
```javascript
/**
 * Insert formatted table into document
 * @param {Array} data - Table data (rows and columns)
 * @param {string} title - Table title
 * @param {Object} options - Formatting options
 * @returns {Promise<Object>} Insertion result
 */
```

#### `async replaceParagraph(index, newText, preserveFormatting)`
```javascript
/**
 * Replace paragraph content
 * @param {number} index - Paragraph index
 * @param {string} newText - New paragraph text
 * @param {boolean} preserveFormatting - Keep original formatting
 * @returns {Promise<Object>} Replacement result
 */
```

---

### 3. Document Analysis API

**Class:** `WordDocumentManager`  
**Status:** ✅ Implemented, enhancement needed

#### `async insertSuggestionAfterParagraph(index, original, suggested)`
```javascript
/**
 * Insert suggestion display after paragraph
 * @param {number} index - Paragraph index
 * @param {string} original - Original text
 * @param {string} suggested - Suggested text
 * @returns {Promise<Object>} Document indices for suggestion
 */
```

#### `async applySuggestionInDocument(originalIndex, suggestedIndex, newText)`
```javascript
/**
 * Apply suggestion to document
 * @param {number} originalIndex - Original paragraph index
 * @param {number} suggestedIndex - Suggestion paragraph index
 * @param {string} newText - New text to apply
 * @returns {Promise<void>}
 */
```

#### `async highlightParagraph(index, color, duration)`
```javascript
/**
 * Highlight paragraph with color
 * @param {number} index - Paragraph index
 * @param {string} color - Highlight color
 * @param {number} duration - Auto-remove after milliseconds
 * @returns {Promise<void>}
 */
```

---

## 🎨 Frontend UI APIs

### 1. ChatbotUI Class

**Class:** `ChatbotUI`  
**Status:** ✅ Implemented (OOP Refactored)

#### Analysis Command Handler

##### `_isAnalysisRequest(message)`
```javascript
/**
 * Enhanced analysis detection including \analyse command
 * @param {string} message - User message
 * @returns {boolean} True if analysis request
 */
```

**Enhanced Implementation Needed:**
```javascript
_isAnalysisRequest(message) {
    // Direct command check
    if (message.trim().startsWith('\\analyse')) {
        return true;
    }
    
    // Existing keyword detection
    const analysisKeywords = [
        'analyze', 'analysis', 'suggest', 'improve', 'fix', 'check',
        'review', 'edit', 'grammar', 'style', 'clarity', 'flow',
        'paragraph', 'paragraphs', 'structure', 'coherence'
    ];
    
    const lowerMessage = message.toLowerCase();
    return analysisKeywords.some(keyword => lowerMessage.includes(keyword));
}
```

##### `_handleAnalysisCommand(message, typingId, documentContext)`
```javascript
/**
 * Handle \analyse command specifically
 * @param {string} message - Original message with \analyse
 * @param {string} typingId - Typing indicator ID
 * @param {string} documentContext - Document text
 * @returns {Promise<void>}
 */
```

**New Method Implementation:**
```javascript
async _handleAnalysisCommand(message, typingId, documentContext) {
    try {
        // Extract analysis options from command
        const commandParts = message.trim().split(' ');
        const focusAreas = this._extractAnalysisOptions(commandParts.slice(1));
        
        const paragraphs = await this.#documentManager.readParagraphs();
        this._validateParagraphs(paragraphs);
        this.#paragraphMapping = paragraphs;

        const suggestions = await this.#apiService.getParagraphSuggestions(paragraphs, {
            fullDocumentText: documentContext,
            focusAreas: focusAreas,
            analysisType: 'command'
        });

        this._removeTypingIndicator(typingId);
        this._displayAnalysisCommandResults(suggestions, paragraphs, focusAreas);

    } catch (error) {
        this._removeTypingIndicator(typingId);
        this.addMessage(`❌ Analysis command failed: ${error.message}`, 'bot', 'error');
    }
}
```

#### Public API Methods

##### `sendMessage()`
**Enhancement needed** to handle `\analyse` commands:
```javascript
async sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput?.value?.trim();
    
    if (!message) return;

    try {
        // Check for analysis command first
        if (message.startsWith('\\analyse')) {
            await this._processAnalysisCommand(message, chatInput);
        } else {
            await this._processChatMessage(message, chatInput);
        }
    } catch (error) {
        this._handleSendMessageError(error);
    }
}
```

##### `addMessage(content, sender, type, sources)`
**Current implementation sufficient**

##### `handleFeedback(messageId, type)`
**Current implementation sufficient**

##### `showSuggestionInDocument(id)`
**Current implementation sufficient**

##### `applySuggestion(id)`
**Current implementation sufficient**

##### `rejectSuggestion(id)`
**Current implementation sufficient**

---

### 2. Settings Management API

**Status:** ⚠️ Partially implemented, needs completion

#### Required Methods

##### `saveSettings(config)`
```javascript
/**
 * Save user preferences and AI provider configurations
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
```

**Parameters:**
```json
{
  "aiProvider": {
    "active": "string - gemini|ollama|local",
    "gemini": {
      "apiKey": "string",
      "model": "string",
      "temperature": "number"
    },
    "ollama": {
      "baseUrl": "string",
      "model": "string"
    }
  },
  "ui": {
    "theme": "string - light|dark|auto",
    "language": "string - Language code",
    "autoAnalyze": "boolean"
  },
  "analysis": {
    "defaultFocusAreas": ["string"],
    "confidenceThreshold": "number",
    "maxSuggestions": "number"
  }
}
```

##### `loadSettings()`
```javascript
/**
 * Load user preferences
 * @returns {Promise<Object>} Configuration object
 */
```

##### `testConnection(provider)`
```javascript
/**
 * Test AI provider connection
 * @param {string} provider - Provider name
 * @returns {Promise<Object>} Test result
 */
```

##### `validateApiKey(provider, key)`
```javascript
/**
 * Validate API key for provider
 * @param {string} provider - Provider name
 * @param {string} key - API key to validate
 * @returns {Promise<boolean>} Validation result
 */
```

---

## 🔐 Security & Authentication APIs

### 1. API Key Management

**Status:** ✅ Basic implementation, security enhancement needed

#### Required Enhancements

##### `encryptApiKey(key, userSalt)`
```javascript
/**
 * Encrypt API key for secure storage
 * @param {string} key - API key to encrypt
 * @param {string} userSalt - User-specific salt
 * @returns {string} Encrypted key
 */
```

##### `decryptApiKey(encryptedKey, userSalt)`
```javascript
/**
 * Decrypt API key for use
 * @param {string} encryptedKey - Encrypted API key
 * @param {string} userSalt - User-specific salt
 * @returns {string} Decrypted key
 */
```

##### `validateKeyStrength(key, provider)`
```javascript
/**
 * Validate API key format and strength
 * @param {string} key - API key to validate
 * @param {string} provider - Provider name
 * @returns {Object} Validation result
 */
```

---

## 📊 Data Models & Schemas

### 1. Enhanced Document Model
```javascript
{
  "id": "string - Unique document identifier",
  "text": "string - Full document content",
  "metadata": {
    "title": "string - Document title",
    "author": "string - Document author",
    "wordCount": "number",
    "characterCount": "number",
    "pageCount": "number",
    "language": "string - Document language",
    "createdAt": "string (ISO 8601)",
    "lastModified": "string (ISO 8601)",
    "lastAnalyzed": "string (ISO 8601)"
  },
  "paragraphs": [
    {
      "id": "string - Unique paragraph identifier",
      "originalIndex": "number",
      "filteredIndex": "number",
      "text": "string",
      "range": "object - Word range object",
      "wordCount": "number",
      "sentenceCount": "number",
      "isEmpty": "boolean",
      "style": "string - Paragraph style",
      "formatting": "object - Formatting information"
    }
  ],
  "tables": [
    {
      "id": "string - Table identifier",
      "title": "string - Table title",
      "rows": "number - Row count",
      "columns": "number - Column count",
      "data": "array - Table data"
    }
  ]
}
```

### 2. Enhanced Suggestion Model
```javascript
{
  "id": "string - Unique suggestion identifier",
  "sessionId": "string - Analysis session ID",
  "paragraphId": "string - Target paragraph ID",
  "paragraphIndex": "number - Target paragraph index",
  "type": "string - clarity|grammar|style|structure|flow|tone",
  "category": "string - Specific category within type",
  "severity": "string - low|medium|high|critical",
  "originalText": "string - Original text segment",
  "suggestedText": "string - Improved text segment",
  "reason": "string - Explanation of improvement",
  "confidence": "number (0-1) - AI confidence score",
  "source": "string - AI provider that generated suggestion",
  "position": {
    "startIndex": "number - Character start position",
    "endIndex": "number - Character end position",
    "startWord": "number - Word start position",
    "endWord": "number - Word end position"
  },
  "documentIndices": {
    "originalIndex": "number - Original paragraph index in document",
    "suggestedIndex": "number - Suggestion paragraph index in document"
  },
  "status": "string - pending|shown|applied|rejected|ignored",
  "userFeedback": {
    "rating": "number (1-5) - User rating",
    "comment": "string - User comment",
    "helpful": "boolean - Was suggestion helpful"
  },
  "metadata": {
    "createdAt": "string (ISO 8601)",
    "appliedAt": "string (ISO 8601)",
    "aiModel": "string - AI model used",
    "processingTime": "number - Generation time in ms"
  }
}
```

### 3. Analysis Command Model
```javascript
{
  "command": "string - Full command text",
  "type": "string - analyse",
  "options": {
    "focusAreas": ["string"] - Specific areas to analyze,
    "paragraphs": ["number"] - Specific paragraph indices,
    "depth": "string - quick|standard|deep",
    "outputFormat": "string - suggestions|report|summary",
    "userInput": "string - Additional user input/guidance"
  },
  "timestamp": "string (ISO 8601)"
}
```

### 4. Chat Message Model (Enhanced)
```javascript
{
  "id": "string - Unique message identifier",
  "sessionId": "string - Chat session identifier",
  "role": "string - user|assistant|system",
  "type": "string - chat|analysis|command|error",
  "content": "string - Message content",
  "isAnalysisCommand": "boolean - True if message was analysis command",
  "commandData": "object - Command parsing results (if applicable)",
  "timestamp": "string (ISO 8601)",
  "metadata": {
    "aiProvider": "string - AI provider used",
    "model": "string - AI model used",
    "tokens": {
      "prompt": "number",
      "completion": "number",
      "total": "number"
    },
    "processingTime": "number - Response time in ms",
    "confidence": "number (0-1) - Response confidence"
  },
  "sources": [
    {
      "type": "string - url|document|reference",
      "title": "string",
      "url": "string",
      "description": "string",
      "relevance": "number (0-1) - Source relevance score"
    }
  ],
  "feedback": {
    "type": "string - like|dislike|report",
    "comment": "string",
    "submitted": "boolean",
    "timestamp": "string (ISO 8601)"
  },
  "actions": [
    {
      "type": "string - analyze|export|save|configure",
      "label": "string - Action button label",
      "data": "object - Action-specific data"
    }
  ]
}
```

---

## 🚧 Implementation Priority Matrix

### Phase 1: Critical APIs (High Priority)

1. **Analysis Command Handler** - Implement `\analyse` command processing
2. **Enhanced AI Provider Integration** - Improve Gemini/Ollama with better prompts
3. **Suggestion Management** - Complete suggestion lifecycle
4. **Error Handling** - Robust error handling across all APIs

### Phase 2: Feature Enhancement (Medium Priority)

1. **Settings Management API** - Complete user preferences system
2. **Export API** - Document analysis export functionality
3. **Advanced Document Management** - Enhanced Word integration
4. **Security Enhancements** - API key encryption and validation

### Phase 3: Advanced Features (Low Priority)

1. **Analytics API** - Usage tracking and insights
2. **Collaboration API** - Multi-user features
3. **Plugin System** - Extensible architecture
4. **Performance Optimization** - Caching and optimization

---

## 🔍 Testing Requirements

### API Endpoint Testing
- Unit tests for all endpoint handlers
- Integration tests with AI providers
- Error scenario testing
- Performance benchmarking

### Command Testing
- `\analyse` command parsing and execution
- Parameter validation
- Error handling for malformed commands
- Output format verification

### Security Testing
- API key validation and encryption
- Input sanitization
- Cross-site scripting prevention
- Data privacy compliance

---

## 📚 Usage Examples

### Analysis Command Examples
```
\analyse
\analyse grammar style
\analyse focus on business tone
\analyse check for clarity issues in technical sections
\analyse grammar "please be extra careful with verb tenses"
\analyse style flow "make it sound more professional"
```

### API Request Examples

#### Chat with Analysis Command
```json
POST /api/chat
{
  "message": "\\analyse grammar clarity please focus on making it more professional",
  "history": [],
  "documentContext": "This is the document text...",
  "isAnalysisCommand": true,
  "analysisOptions": {
    "focusAreas": ["grammar", "clarity"],
    "userInput": "please focus on making it more professional"
  }
}
```

#### Configure AI Provider
```json
POST /api/configure-provider
{
  "provider": "gemini",
  "config": {
    "apiKey": "your-api-key-here",
    "model": "gemini-2.0-flash",
    "parameters": {
      "temperature": 0.7,
      "maxTokens": 1000
    }
  },
  "testConnection": true
}
```

---

This specification provides a complete roadmap for implementing all required APIs with proper request/response schemas, authentication requirements, and clear implementation priorities. The `\analyse` command is specifically handled as a high-priority feature with detailed specifications for implementation.
