/**
 * OllamaAIProvider - Local Ollama AI provider implementation
 * Handles communication with local Ollama API
 */
class OllamaAIProvider extends BaseAIProvider {
    constructor(apiUrl = 'http://localhost:11434') {
        super();
        this.apiUrl = apiUrl;
        this.model = 'llama3.2'; // Default model, can be made configurable
    }

    /**
     * Set the API URL
     * @param {string} apiUrl - Ollama API endpoint URL
     */
    setApiUrl(apiUrl) {
        this.apiUrl = apiUrl;
    }

    /**
     * Set the model name
     * @param {string} model - Ollama model name
     */
    setModel(model) {
        this.model = model;
    }

    /**
     * Check if the provider is properly configured
     * @returns {boolean} True if API URL is available
     */
    isConfigured() {
        return this.apiUrl && this.apiUrl.trim().length > 0;
    }

    /**
     * Get the display name of the provider
     * @returns {string} Provider display name
     */
    getDisplayName() {
        return this.isConfigured() ? '🦙 Ollama (Local)' : '❌ Ollama (Config Required)';
    }

    /**
     * Send a chat message to Ollama API
     * @param {string} message - User message
     * @param {Array} history - Chat history
     * @returns {Promise<Object>} Ollama AI response
     */
    async sendChatMessage(message, history = []) {
        if (!this.isConfigured()) {
            throw new Error('Ollama API URL not configured');
        }

        const url = `${this.apiUrl}/api/chat`;
        
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
            model: this.model,
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
                const errorText = await response.text();
                throw new Error(`Ollama API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            
            if (data.message && data.message.content) {
                return this.createResponse(data.message.content, 'ollama');
            } else {
                throw new Error('Invalid response from Ollama API');
            }
        } catch (error) {
            console.error('Ollama API error:', error);
            throw error;
        }
    }

    /**
     * Get paragraph suggestions from Ollama API
     * @param {Array} paragraphs - Array of paragraph objects
     * @returns {Promise<Object>} Ollama suggestions
     */
    async getParagraphSuggestions(paragraphs) {
        if (!this.isConfigured()) {
            throw new Error('Ollama API URL not configured');
        }

        const url = `${this.apiUrl}/api/chat`;
        
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
            model: this.model,
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
                const errorText = await response.text();
                throw new Error(`Ollama API request failed: ${response.status} ${response.statusText} - ${errorText}`);
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
            throw error;
        }
    }

    /**
     * Test connection to Ollama API
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        if (!this.isConfigured()) {
            throw new Error('Ollama API URL not configured');
        }

        try {
            const url = `${this.apiUrl}/api/tags`;
            const response = await fetch(url);
            return response.ok;
        } catch (error) {
            console.error('Ollama connection test failed:', error);
            return false;
        }
    }
}
