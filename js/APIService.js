/**
 * APIService - Handles all API communications
 * Manages connections to local server and external services like Ollama and Gemini
 */
class APIService {
    constructor() {
        this.baseUrl = 'https://127.0.0.1:5500/api';
        this.ollamaApiUrl = this.loadOllamaApiUrl(); // Load saved Ollama API URL
        this.geminiApiKey = this.loadGeminiApiKey(); // Load saved Gemini API key
        this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.activeModel = this.loadActiveModel(); // Load saved model preference
        this.requestTimeout = 30000; // 30 seconds
    }

    /**
     * Set the Ollama API URL
     * @param {string} url - Ollama API endpoint URL
     */
    setOllamaApiUrl(url) {
        this.ollamaApiUrl = url;
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
     * Set and save the Gemini API key
     * @param {string} apiKey - Gemini API key
     */
    setGeminiApiKey(apiKey) {
        this.geminiApiKey = apiKey;
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
     * Set and save the active model
     * @param {string} model - 'gemini' or 'ollama' or 'local'
     */
    setActiveModel(model) {
        this.activeModel = model;
        localStorage.setItem('activeModel', model);
    }

    /**
     * Load saved active model from localStorage
     * @returns {string} Saved model or default
     */
    loadActiveModel() {
        return localStorage.getItem('activeModel') || 'local';
    }

    /**
     * Check if Gemini API key is configured
     * @returns {boolean} True if API key is available
     */
    hasGeminiApiKey() {
        return this.geminiApiKey && this.geminiApiKey.trim().length > 0;
    }

    /**
     * Check if Ollama is configured
     * @returns {boolean} True if Ollama URL is available
     */
    hasOllamaConfig() {
        return this.ollamaApiUrl && this.ollamaApiUrl.trim().length > 0;
    }

    /**
     * Get the currently active model name
     * @returns {string} Active model display name
     */
    getActiveModelName() {
        switch (this.activeModel) {
            case 'gemini':
                return this.hasGeminiApiKey() ? '🤖 Gemini 2.0 Flash' : '❌ Gemini (Key Required)';
            case 'ollama':
                return this.hasOllamaConfig() ? '🦙 Ollama' : '❌ Ollama (Config Required)';
            default:
                return '🔧 Local Processing';
        }
    }

    /**
     * Check if the current model is ready to use
     * @returns {boolean} True if model is properly configured
     */
    isCurrentModelReady() {
        switch (this.activeModel) {
            case 'gemini':
                return this.hasGeminiApiKey();
            case 'ollama':
                return this.hasOllamaConfig();
            default:
                return true; // Local is always available
        }
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
        // Route to active model
        switch (this.activeModel) {
            case 'gemini':
                if (this.hasGeminiApiKey()) {
                    return this.sendGeminiChatMessage(message, history);
                }
                break;
            case 'ollama':
                if (this.hasOllamaConfig()) {
                    return this.sendOllamaChatMessage(message, history);
                }
                break;
        }
        
        // Fallback to local server
        return this.makeRequest(`${this.baseUrl}/chat`, {
            method: 'POST',
            body: JSON.stringify({ message, history })
        });
    }

    /**
     * Send chat message to Gemini API
     * @param {string} message - User message
     * @param {Array} history - Chat history
     * @returns {Promise<Object>} Gemini AI response
     */
    async sendGeminiChatMessage(message, history = []) {
        const url = `${this.geminiBaseUrl}/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
        
        // Convert chat history to Gemini format
        const contents = [];
        
        // Add history
        history.forEach(item => {
            contents.push({
                role: item.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: item.content }]
            });
        });
        
        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const requestBody = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return {
                    message: data.candidates[0].content.parts[0].text,
                    timestamp: new Date().toISOString(),
                    type: 'assistant',
                    source: 'gemini'
                };
            } else {
                throw new Error('Invalid response from Gemini API');
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            // Fallback to local server
            return this.makeRequest(`${this.baseUrl}/chat`, {
                method: 'POST',
                body: JSON.stringify({ message, history })
            });
        }
    }

    /**
     * Send chat message to Ollama API
     * @param {string} message - User message
     * @param {Array} history - Chat history
     * @returns {Promise<Object>} Ollama AI response
     */
    async sendOllamaChatMessage(message, history = []) {
        const url = `${this.ollamaApiUrl}/api/chat`;
        
        // Convert chat history to Ollama format
        const messages = [];
        
        // Add history
        history.forEach(item => {
            messages.push({
                role: item.role === 'assistant' ? 'assistant' : 'user',
                content: item.content
            });
        });
        
        // Add current message
        messages.push({
            role: 'user',
            content: message
        });

        const requestBody = {
            model: 'llama3.2', // Default model, can be made configurable
            messages: messages,
            stream: false
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.message && data.message.content) {
                return {
                    message: data.message.content,
                    timestamp: new Date().toISOString(),
                    type: 'assistant',
                    source: 'ollama'
                };
            } else {
                throw new Error('Invalid response from Ollama API');
            }
        } catch (error) {
            console.error('Ollama API error:', error);
            // Fallback to local server
            return this.makeRequest(`${this.baseUrl}/chat`, {
                method: 'POST',
                body: JSON.stringify({ message, history })
            });
        }
    }

    /**
     * Get paragraph-specific suggestions
     * @param {Array} paragraphs - Array of paragraph objects
     * @returns {Promise<Object>} Suggestions for each paragraph
     */
    async getParagraphSuggestions(paragraphs) {
        // Route to active model
        switch (this.activeModel) {
            case 'gemini':
                if (this.hasGeminiApiKey()) {
                    return this.getGeminiParagraphSuggestions(paragraphs);
                }
                break;
            case 'ollama':
                if (this.hasOllamaConfig()) {
                    return this.getOllamaParagraphSuggestions(paragraphs);
                }
                break;
        }
        
        // Fallback to local server
        return this.makeRequest(`${this.baseUrl}/analyze-paragraphs`, {
            method: 'POST',
            body: JSON.stringify({ paragraphs })
        });
    }

    /**
     * Get paragraph suggestions from Gemini API
     * @param {Array} paragraphs - Array of paragraph objects
     * @returns {Promise<Object>} Gemini suggestions
     */
    async getGeminiParagraphSuggestions(paragraphs) {
        const url = `${this.geminiBaseUrl}/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
        
        const prompt = `As a professional writing assistant, analyze the following paragraphs and provide specific improvement suggestions. For each paragraph that needs improvement, provide:

1. paragraphIndex (0-based index)
2. originalText (the original paragraph text)
3. suggestedText (improved version with specific changes)
4. type (one of: "clarity", "grammar", "style", "structure", "vocabulary")
5. reason (brief explanation of the improvement)

Only suggest improvements for paragraphs that actually need them. Skip very short paragraphs (less than 20 characters).

Paragraphs to analyze:
${paragraphs.map((p, i) => `[${i}]: ${p.text}`).join('\n\n')}

Please respond with a JSON object containing:
{
  "totalParagraphs": ${paragraphs.length},
  "suggestions": [array of suggestion objects],
  "timestamp": "${new Date().toISOString()}"
}`;

        const requestBody = {
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const responseText = data.candidates[0].content.parts[0].text;
                
                // Try to parse JSON from the response
                try {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const suggestions = JSON.parse(jsonMatch[0]);
                        return suggestions;
                    }
                } catch (parseError) {
                    console.warn('Could not parse Gemini JSON response, using fallback');
                }
                
                // Fallback if JSON parsing fails
                return {
                    totalParagraphs: paragraphs.length,
                    suggestions: [],
                    timestamp: new Date().toISOString(),
                    note: "Gemini analysis completed but could not parse structured response"
                };
            } else {
                throw new Error('Invalid response from Gemini API');
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            // Fallback to local server
            return this.makeRequest(`${this.baseUrl}/analyze-paragraphs`, {
                method: 'POST',
                body: JSON.stringify({ paragraphs })
            });
        }
    }

    /**
     * Test connection to Gemini API
     * @returns {Promise<boolean>} Connection status
     */
    async testGeminiConnection() {
        if (!this.hasGeminiApiKey()) {
            throw new Error('Gemini API key not configured');
        }

        try {
            const url = `${this.geminiBaseUrl}/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
            const testRequest = {
                contents: [{
                    role: 'user',
                    parts: [{ text: 'Hello, please respond with "Connection test successful"' }]
                }]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testRequest)
            });

            return response.ok;
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }

    /**
     * Get paragraph suggestions from Ollama API
     * @param {Array} paragraphs - Array of paragraph objects
     * @returns {Promise<Object>} Ollama suggestions
     */
    async getOllamaParagraphSuggestions(paragraphs) {
        const url = `${this.ollamaApiUrl}/api/chat`;
        
        const prompt = `As a professional writing assistant, analyze the following paragraphs and provide specific improvement suggestions. For each paragraph that needs improvement, provide a JSON response with this exact structure:

{
  "totalParagraphs": ${paragraphs.length},
  "suggestions": [
    {
      "paragraphIndex": 0,
      "originalText": "original paragraph text",
      "suggestedText": "improved paragraph text",
      "type": "clarity|grammar|style|structure|vocabulary",
      "reason": "brief explanation of the improvement"
    }
  ],
  "timestamp": "${new Date().toISOString()}"
}

Only suggest improvements for paragraphs that actually need them. Skip very short paragraphs (less than 20 characters).

Paragraphs to analyze:
${paragraphs.map((p, i) => `[${i}]: ${p.text}`).join('\n\n')}

Respond only with the JSON object, no additional text.`;

        const requestBody = {
            model: 'llama3.2',
            messages: [{
                role: 'user',
                content: prompt
            }],
            stream: false
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.message && data.message.content) {
                const responseText = data.message.content;
                
                // Try to parse JSON from the response
                try {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const suggestions = JSON.parse(jsonMatch[0]);
                        return suggestions;
                    }
                } catch (parseError) {
                    console.warn('Could not parse Ollama JSON response, using fallback');
                }
                
                // Fallback if JSON parsing fails
                return {
                    totalParagraphs: paragraphs.length,
                    suggestions: [],
                    timestamp: new Date().toISOString(),
                    note: "Ollama analysis completed but could not parse structured response"
                };
            } else {
                throw new Error('Invalid response from Ollama API');
            }
        } catch (error) {
            console.error('Ollama API error:', error);
            // Fallback to local server
            return this.makeRequest(`${this.baseUrl}/analyze-paragraphs`, {
                method: 'POST',
                body: JSON.stringify({ paragraphs })
            });
        }
    }

    /**
     * Test connection to Ollama API (when configured)
     * @returns {Promise<boolean>} Connection status
     */
    async testOllamaConnection() {
        if (!this.hasOllamaConfig()) {
            throw new Error('Ollama API URL not configured');
        }

        try {
            const url = `${this.ollamaApiUrl}/api/tags`;
            const response = await fetch(url);
            return response.ok;
        } catch (error) {
            console.error('Ollama connection test failed:', error);
            return false;
        }
    }
}
