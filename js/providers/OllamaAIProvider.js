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
     * @param {Array} history - Chat history (de-prioritized in favor of document context)
     * @param {Object} options - Additional options
     * @param {string} options.systemMessage - System instructions for AI behavior
     * @param {string} options.documentContext - Full document text as context (PRIORITY)
     * @returns {Promise<Object>} Ollama AI response
     */
    async sendChatMessage(message, history = [], options = {}) {
        if (!this.isConfigured()) {
            throw new Error('Ollama API URL not configured');
        }

        console.log('🦙 [OLLAMA] Chat Request Debug:', {
            userMessage: message,
            historyLength: history.length,
            hasSystemMessage: !!options.systemMessage,
            hasDocumentContext: !!options.documentContext,
            documentContextLength: options.documentContext ? options.documentContext.length : 0,
            documentContextPreview: options.documentContext ? options.documentContext.substring(0, 200) + '...' : 'No document context'
        });

        const url = `${this.apiUrl}/api/chat`;
        
        // Always prioritize document context over chat history
        const messages = [];
        
        // Add system message if provided
        if (options.systemMessage) {
            messages.push({
                role: 'system',
                content: `${options.systemMessage}\n\nIMPORTANT: Format your responses using Markdown for better readability:\n- Use **bold** for headings and key phrases\n- Use *italic* for emphasis\n- Use bullet points with - or * for lists\n- Keep responses clean, structured, and easy to read`
            });
        } else {
            // Default Markdown formatting instruction
            messages.push({
                role: 'system',
                content: 'IMPORTANT: Format your responses using Markdown for better readability:\n- Use **bold** for headings and key phrases\n- Use *italic* for emphasis\n- Use bullet points with - or * for lists\n- Keep responses clean, structured, and easy to read'
            });
        }
        
        // PRIORITY: Always add full document context first (most important)
        if (options.documentContext && options.documentContext.trim()) {
            messages.push({
                role: 'system',
                content: `IMPORTANT - FULL DOCUMENT CONTEXT (Use this as primary reference):\n\n---CURRENT DOCUMENT---\n${options.documentContext}\n---END DOCUMENT---\n\nThis is the complete, current document. Always reference this latest version for any suggestions or analysis. Previous chat history is secondary to this document content.`
            });
        }
        
        // Add limited recent chat history (only last 3 exchanges to save context space)
        const recentHistory = history.slice(-6); // Last 3 user-assistant pairs
        recentHistory.forEach(item => {
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

        console.log('🦙 [OLLAMA] Full Request Body:', {
            model: this.model,
            messagesCount: messages.length,
            messages: messages.map((msg, index) => ({
                index,
                role: msg.role,
                contentLength: msg.content.length,
                contentPreview: msg.content.substring(0, 100) + '...'
            }))
        });

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
     * @param {Object} options - Additional options
     * @param {string} options.systemMessage - System instructions for analysis
     * @param {string} options.fullDocumentText - Complete document text for context
     * @returns {Promise<Object>} Ollama suggestions (ALL SUGGESTIONS IN MALAY)
     */
    async getParagraphSuggestions(paragraphs, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('Ollama API URL not configured');
        }

        const url = `${this.apiUrl}/api/chat`;
        
        // Build comprehensive prompt with MALAY language requirement
        let prompt = `PENTING: Sila beri semua cadangan dalam BAHASA MELAYU sahaja. Jangan gunakan bahasa Inggeris untuk cadangan.

${options.systemMessage || 'Sebagai pembantu penulisan profesional,'} analisa dokumen berikut dan berikan cadangan penambahbaikan yang spesifik.`;
        
        // Add full document context (PRIORITY)
        if (options.fullDocumentText && options.fullDocumentText.trim()) {
            prompt += `\n\nKONTEKS DOKUMEN PENUH (GUNAKAN SEBAGAI RUJUKAN UTAMA):\n${options.fullDocumentText}\n\n`;
        }
        
        prompt += `Untuk respons JSON dengan struktur tepat ini:

{
  "totalParagraphs": ${paragraphs.length},
  "documentTheme": "penerangan ringkas tentang tema utama dokumen (DALAM BAHASA MELAYU)",
  "suggestions": [
    {
      "paragraphIndex": 0,
      "originalText": "teks perenggan asal",
      "suggestedText": "teks perenggan yang diperbaiki (DALAM BAHASA MELAYU)",
      "type": "clarity|grammar|style|structure|vocabulary|coherence|flow",
      "reason": "penjelasan ringkas tentang penambahbaikan (DALAM BAHASA MELAYU)",
      "contextualNote": "bagaimana penambahbaikan ini sesuai dalam keseluruhan dokumen (DALAM BAHASA MELAYU)"
    }
  ],
  "timestamp": "${new Date().toISOString()}"
}

Pertimbangkan konteks, tema, dan aliran keseluruhan dokumen semasa membuat cadangan. Hanya cadangkan penambahbaikan untuk perenggan yang benar-benar memerlukannya. Langkau perenggan yang sangat pendek (kurang dari 20 aksara).

PERENGGAN UNTUK DIANALISA:
${paragraphs.map((p, i) => `[${i}]: ${p.text}`).join('\n\n')}

INGAT: Semua suggestedText, reason, contextualNote dan documentTheme MESTI dalam BAHASA MELAYU.
Balas hanya dengan objek JSON, tiada teks tambahan.`;

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
                    documentTheme: "Tidak dapat menentukan tema kerana masalah pemprosesan respons",
                    suggestions: [],
                    timestamp: new Date().toISOString(),
                    note: "Analisis Ollama selesai tetapi tidak dapat memproses respons berstruktur",
                    rawResponse: responseText.substring(0, 500) + "..."
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
