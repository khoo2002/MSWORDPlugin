/**
 * GeminiAIProvider - Google Gemini 2.0 Flash AI provider implementation
 * Handles communication with Google's Gemini API
 */
class GeminiAIProvider extends BaseAIProvider {
    constructor(apiKey = '') {
        super();
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'gemini-2.0-flash';
    }

    /**
     * Set the API key
     * @param {string} apiKey - Gemini API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Check if the provider is properly configured
     * @returns {boolean} True if API key is available
     */
    isConfigured() {
        return this.apiKey && this.apiKey.trim().length > 0;
    }

    /**
     * Get the display name of the provider
     * @returns {string} Provider display name
     */
    getDisplayName() {
        return this.isConfigured() ? '🤖 Gemini 2.0 Flash' : '❌ Gemini (Key Required)';
    }

    /**
     * Send a chat message to Gemini API
     * @param {string} message - User message
     * @param {Array} history - Chat history
     * @returns {Promise<Object>} Gemini AI response
     */
    async sendChatMessage(message, history = []) {
        if (!this.isConfigured()) {
            throw new Error('Gemini API key not configured');
        }

        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
        
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
                const errorText = await response.text();
                throw new Error(`Gemini API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const responseMessage = data.candidates[0].content.parts[0].text;
                return this.createResponse(responseMessage, 'gemini');
            } else {
                throw new Error('Invalid response from Gemini API');
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Get paragraph suggestions from Gemini API
     * @param {Array} paragraphs - Array of paragraph objects
     * @returns {Promise<Object>} Gemini suggestions
     */
    async getParagraphSuggestions(paragraphs) {
        if (!this.isConfigured()) {
            throw new Error('Gemini API key not configured');
        }

        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
        
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
                const errorText = await response.text();
                throw new Error(`Gemini API request failed: ${response.status} ${response.statusText} - ${errorText}`);
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
            throw error;
        }
    }

    /**
     * Test connection to Gemini API
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        if (!this.isConfigured()) {
            throw new Error('Gemini API key not configured');
        }

        try {
            const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
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

            if (response.ok) {
                const data = await response.json();
                return data.candidates && data.candidates[0] && data.candidates[0].content;
            }
            return false;
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }
}
