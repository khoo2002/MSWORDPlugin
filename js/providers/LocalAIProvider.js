/**
 * LocalAIProvider - Local AI provider implementation
 * Handles communication with local API server for fallback processing
 */
class LocalAIProvider extends BaseAIProvider {
    constructor(baseUrl = 'https://127.0.0.1:5500/api') {
        super();
        this.baseUrl = baseUrl;
    }

    /**
     * Set the base URL
     * @param {string} baseUrl - Local API base URL
     */
    setBaseUrl(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Check if the provider is properly configured
     * @returns {boolean} True (local is always available)
     */
    isConfigured() {
        return true; // Local processing is always available
    }

    /**
     * Get the display name of the provider
     * @returns {string} Provider display name
     */
    getDisplayName() {
        return '🔧 Local Processing';
    }

    /**
     * Send a chat message to local API with fallback
     * @param {string} message - User message
     * @param {Array} history - Chat history (de-prioritized in favor of document context)
     * @param {Object} options - Additional options
     * @param {string} options.systemMessage - System instructions for AI behavior
     * @param {string} options.documentContext - Full document text as context (PRIORITY)
     * @returns {Promise<Object>} Local AI response
     */
    async sendChatMessage(message, history = [], options = {}) {
        console.log('🔧 [LOCAL] Chat Request Debug:', {
            userMessage: message,
            historyLength: history.length,
            hasSystemMessage: !!options.systemMessage,
            hasDocumentContext: !!options.documentContext,
            documentContextLength: options.documentContext ? options.documentContext.length : 0,
            documentContextPreview: options.documentContext ? options.documentContext.substring(0, 200) + '...' : 'No document context'
        });

        try {
            const requestBody = { 
                message, 
                history,
                systemMessage: options.systemMessage,
                documentContext: options.documentContext
            };
            
            const response = await this.makeRequest(`${this.baseUrl}/chat`, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            // Standardize the response format
            if (response.message) {
                return this.createResponse(response.message, 'local');
            } else if (response.response) {
                return this.createResponse(response.response, 'local');
            } else {
                // Create a fallback response if local server is not available
                return this.createFallbackChatResponse(message, options);
            }
        } catch (error) {
            console.warn('Local API not available, using fallback response:', error);
            return this.createFallbackChatResponse(message, options);
        }
    }

    /**
     * Get paragraph suggestions from local API
     * @param {Array} paragraphs - Array of paragraph objects
     * @param {Object} options - Additional options
     * @param {string} options.systemMessage - System instructions for analysis
     * @param {string} options.fullDocumentText - Complete document text for context
     * @returns {Promise<Object>} Local suggestions
     */
    async getParagraphSuggestions(paragraphs, options = {}) {
        try {
            const requestBody = { 
                paragraphs,
                systemMessage: options.systemMessage,
                fullDocumentText: options.fullDocumentText
            };
            
            const response = await this.makeRequest(`${this.baseUrl}/analyze-paragraphs`, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            return response;
        } catch (error) {
            console.warn('Local API not available, using fallback analysis:', error);
            return this.createFallbackSuggestions(paragraphs, options);
        }
    }

    /**
     * Analyze text using local API
     * @param {string} text - Text to analyze
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeText(text) {
        try {
            return await this.makeRequest(`${this.baseUrl}/analyze-text`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });
        } catch (error) {
            console.warn('Local API not available, using fallback analysis:', error);
            return this.createFallbackAnalysis(text);
        }
    }

    /**
     * Get text suggestions from local API
     * @param {string} text - Text to get suggestions for
     * @param {string} context - Context for the suggestions
     * @returns {Promise<Object>} Suggestions response
     */
    async getTextSuggestions(text, context = '') {
        try {
            return await this.makeRequest(`${this.baseUrl}/suggest-improvements`, {
                method: 'POST',
                body: JSON.stringify({ text, context })
            });
        } catch (error) {
            console.warn('Local API not available, using fallback suggestions:', error);
            return this.createFallbackTextSuggestions(text);
        }
    }

    /**
     * Test connection to local API
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch (error) {
            console.warn('Local API connection test failed:', error);
            return false; // Still return false for accurate status, but provider remains available
        }
    }

    /**
     * Create a fallback chat response when local API is not available
     * @param {string} message - User message
     * @param {Object} options - Chat options with context
     * @returns {Object} Fallback response
     */
    createFallbackChatResponse(message, options = {}) {
        let contextAwareResponse = "";
        
        // Check if we have document context to provide better responses
        if (options.documentContext && options.documentContext.trim()) {
            const wordCount = options.documentContext.split(/\s+/).length;
            const hasTitle = options.documentContext.split('\n')[0].length < 100;
            
            contextAwareResponse = `Saya dapat melihat anda sedang bekerja dengan dokumen yang mempunyai kira-kira ${wordCount} perkataan${hasTitle ? ' dengan struktur tajuk yang jelas' : ''}. `;
        }
        
        const responses = [
            contextAwareResponse + "Walaupun pelayan AI tidak tersedia, saya dapat melihat struktur dokumen anda.\n\n**Cadangan:**\n- Cuba gunakan ciri *'Analisa Dokumen'* untuk analisis teks asas\n- Periksa butang **Analyze** di bahagian atas chat",
            contextAwareResponse + "Pelayan pemprosesan tempatan nampaknya tidak aktif.\n\n**Pilihan yang tersedia:**\n- Gunakan ciri analisis dokumen asas\n- Konfigurasikan *Gemini* atau *Ollama* untuk bantuan AI\n- Semak tetapan dalam **Settings**",
            contextAwareResponse + "Saya sedang beroperasi dalam **mod terhad**.\n\n**Untuk bantuan AI penuh:**\n- Semak sambungan rangkaian anda\n- Konfigurasikan penyedia AI luaran\n- Pastikan *API keys* adalah sah",
            contextAwareResponse + "Perkhidmatan AI tidak tersedia buat sementara waktu.\n\n**Anda masih boleh:**\n- Melakukan operasi dokumen asas\n- Analisis perenggan menggunakan **menu Tindakan Pantas**\n- Akses tetapan melalui *Settings modal*"
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return this.createResponse(randomResponse, 'local-fallback');
    }

    /**
     * Create fallback analysis when local API is not available
     * @param {string} text - Text to analyze
     * @returns {Object} Fallback analysis
     */
    createFallbackAnalysis(text) {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        
        return {
            wordCount: words.length,
            characterCount: text.length,
            sentenceCount: sentences.length,
            paragraphCount: paragraphs.length,
            preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            timestamp: new Date().toISOString(),
            source: 'local-fallback'
        };
    }

    /**
     * Create fallback suggestions when local API is not available
     * @param {Array} paragraphs - Array of paragraph objects
     * @param {Object} options - Analysis options with context
     * @returns {Object} Fallback suggestions
     */
    createFallbackSuggestions(paragraphs, options = {}) {
        let documentTheme = "Tidak dapat menentukan tema - pelayan analisis tempatan tidak tersedia";
        
        // Basic theme detection from full document if available  
        if (options.fullDocumentText && options.fullDocumentText.trim()) {
            const text = options.fullDocumentText.toLowerCase();
            if (text.includes('business') || text.includes('company') || text.includes('market') || text.includes('perniagaan') || text.includes('syarikat')) {
                documentTheme = "Dokumen Perniagaan/Profesional";
            } else if (text.includes('research') || text.includes('study') || text.includes('analysis') || text.includes('kajian') || text.includes('penyelidikan')) {
                documentTheme = "Dokumen Penyelidikan/Akademik";
            } else if (text.includes('proposal') || text.includes('project') || text.includes('plan') || text.includes('cadangan') || text.includes('projek')) {
                documentTheme = "Dokumen Cadangan/Perancangan";
            } else {
                documentTheme = "Dokumen Am";
            }
        }
        
        return {
            totalParagraphs: paragraphs.length,
            documentTheme: documentTheme,
            suggestions: [],
            timestamp: new Date().toISOString(),
            note: "Pelayan analisis tempatan tidak tersedia. Konfigurasikan Gemini atau Ollama untuk cadangan bertenaga AI dengan konteks dokumen penuh.",
            source: 'local-fallback'
        };
    }

    /**
     * Create fallback text suggestions when local API is not available
     * @param {string} text - Text to suggest improvements for
     * @returns {Object} Fallback text suggestions
     */
    createFallbackTextSuggestions(text) {
        return {
            suggestions: [],
            timestamp: new Date().toISOString(),
            note: "Local suggestion server not available. Configure Gemini or Ollama for AI-powered suggestions.",
            source: 'local-fallback'
        };
    }
}
