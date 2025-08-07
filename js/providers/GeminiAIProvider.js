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
     * @param {Array} history - Chat history (de-prioritized in favor of document context)
     * @param {Object} options - Additional options
     * @param {string} options.systemMessage - System instructions for AI behavior
     * @param {string} options.documentContext - Full document text as context (PRIORITY)
     * @returns {Promise<Object>} Gemini AI response
     */
    async sendChatMessage(message, history = [], options = {}) {
        if (!this.isConfigured()) {
            throw new Error('Gemini API key not configured');
        }

        console.log('🤖 [GEMINI] Chat Request Debug:', {
            userMessage: message,
            historyLength: history.length,
            hasSystemMessage: !!options.systemMessage,
            hasDocumentContext: !!options.documentContext,
            documentContextLength: options.documentContext ? options.documentContext.length : 0,
            documentContextPreview: options.documentContext ? options.documentContext.substring(0, 200) + '...' : 'No document context',
            // FULL DOCUMENT CONTEXT FOR DEBUGGING
            FULL_DOCUMENT_CONTEXT: options.documentContext || 'No document context available'
        });

        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
        
        // Always prioritize document context over chat history
        const contents = [];
        
        // Add system message if provided
        if (options.systemMessage) {
            contents.push({
                role: 'user',
                parts: [{ text: `System Instructions: ${options.systemMessage}\n\nIMPORTANT: Format your responses using Markdown for better readability:\n- Use **bold** for headings and key phrases\n- Use *italic* for emphasis\n- Use bullet points with - or * for lists\n- Keep responses clean, structured, and easy to read` }]
            });
            contents.push({
                role: 'model',
                parts: [{ text: 'I understand the system instructions and will format my responses using **Markdown** for *better readability* and structure.' }]
            });
        } else {
            // Default Markdown formatting instruction
            contents.push({
                role: 'user',
                parts: [{ text: 'IMPORTANT: Format your responses using Markdown for better readability:\n- Use **bold** for headings and key phrases\n- Use *italic* for emphasis\n- Use bullet points with - or * for lists\n- Keep responses clean, structured, and easy to read' }]
            });
            contents.push({
                role: 'model',
                parts: [{ text: 'I will format my responses using **Markdown** for *better readability* and structure.' }]
            });
        }
        
        // PRIORITY: Always add full document context first (most important)
        if (options.documentContext && options.documentContext.trim()) {
            const contextMessage = `IMPORTANT - FULL DOCUMENT CONTEXT (Use this as primary reference):\n\n---CURRENT DOCUMENT---\n${options.documentContext}\n---END DOCUMENT---\n\nThis is the complete, current document. Always reference this latest version for any suggestions or analysis. Previous chat history is secondary to this document content.`;
            contents.push({
                role: 'user',
                parts: [{ text: contextMessage }]
            });
            contents.push({
                role: 'model',
                parts: [{ text: 'I have the complete current document and will prioritize this latest content over any previous conversation history.' }]
            });
        }
        
        // Add limited recent chat history (only last 3 exchanges to save context space)
        const recentHistory = history.slice(-6); // Last 3 user-assistant pairs
        recentHistory.forEach(item => {
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

        console.log('🤖 [GEMINI] Full Request Body:', {
            contentsCount: contents.length,
            contents: contents.map((content, index) => ({
                index,
                role: content.role,
                textLength: content.parts[0].text.length,
                textPreview: content.parts[0].text.substring(0, 100) + '...',
                // SHOW FULL CONTENT FOR DEBUGGING
                fullText: content.parts[0].text
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
     * @param {Object} options - Additional options
     * @param {string} options.systemMessage - System instructions for analysis
     * @param {string} options.fullDocumentText - Complete document text for context
     * @param {Array} focusAreas - Array of focus areas for analysis (grammar, style, clarity, etc.)
     * @param {string} userGuidance - User-provided guidance from \analyse commands
     * @returns {Promise<Object>} Gemini suggestions (ALL SUGGESTIONS IN MALAY)
     */
    async getParagraphSuggestions(paragraphs, options = {}, focusAreas = [], userGuidance = '') {
        if (!this.isConfigured()) {
            throw new Error('Gemini API key not configured');
        }

        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
        
        // Determine analysis type based on parameters
        const analysisType = (focusAreas.length > 0 || userGuidance.trim()) ? 'command' : 'natural';
        
        // Build comprehensive prompt with MALAY language requirement and focus areas
        let prompt = `PENTING: Sila beri semua cadangan dalam BAHASA MELAYU sahaja. Jangan gunakan bahasa Inggeris untuk cadangan.

Anda adalah penganalisis penulisan pakar dengan pengetahuan mendalam tentang:
- Peraturan tatabahasa dan sintaks
- Gaya dan nada penulisan
- Struktur dan aliran dokumen
- Optimisasi kejelasan dan kebolehbacaan
- Piawaian penulisan profesional dan akademik

## Konteks Analisis:
- Jenis Analisis: ${analysisType}`;

        // Add focus areas if provided
        if (focusAreas.length > 0) {
            prompt += `\n- Bidang Fokus: ${focusAreas.join(', ')}`;
        }

        // Add user guidance if provided
        if (userGuidance.trim()) {
            prompt += `\n- Panduan Pengguna: "${userGuidance}"`;
        }

        prompt += `\n- Jumlah Perenggan: ${paragraphs.length}

## Tugasan Utama:
Analisa perenggan dokumen yang diberikan dan hasilkan cadangan yang spesifik dan boleh dilaksanakan berdasarkan bidang fokus dan panduan pengguna.`;

        // Add focus area specific instructions
        if (focusAreas.length > 0) {
            prompt += `\n\n## Arahan Khusus:
1. **Prioriti Panduan Pengguna**: Arahan khusus pengguna mengambil keutamaan
2. **Pematuhan Bidang Fokus**: Tumpukan pada bidang yang dinyatakan: ${focusAreas.join(', ')}
3. **Respons Berstruktur**: Berikan analisis berstruktur dan boleh dilaksanakan
4. **Ambang Kualiti**: Hanya cadangkan perubahan dengan keyakinan > 0.7`;
        }

        // Add full document context (PRIORITY)
        if (options.fullDocumentText && options.fullDocumentText.trim()) {
            prompt += `\n\nKONTEKS DOKUMEN PENUH (GUNAKAN SEBAGAI RUJUKAN UTAMA):\n${options.fullDocumentText}\n\n`;
        }
        
        prompt += `
Untuk setiap perenggan yang perlu diperbaiki, berikan:

1. id (pengecam unik untuk cadangan)
2. paragraphIndex (indeks bermula dari 0)
3. originalText (teks perenggan asal)
4. suggestedText (versi yang diperbaiki dengan perubahan spesifik - DALAM BAHASA MELAYU)
5. type (salah satu daripada: "clarity", "grammar", "style", "structure", "flow", "tone")
6. reason (penjelasan ringkas tentang penambahbaikan - DALAM BAHASA MELAYU)
7. confidence (skor keyakinan AI dari 0 hingga 1)
8. severity (tahap kepentingan: "low", "medium", "high", "critical")

Pertimbangkan konteks, tema, dan aliran keseluruhan dokumen semasa membuat cadangan. Hanya cadangkan penambahbaikan untuk perenggan yang benar-benar memerlukannya. Langkau perenggan yang sangat pendek (kurang dari 20 aksara).`;

        // Add user guidance reminder if provided
        if (userGuidance.trim()) {
            prompt += `\n\nINGAT: Pastikan semua cadangan selaras dengan panduan pengguna: "${userGuidance}"`;
        }

        prompt += `

PERENGGAN UNTUK DIANALISA:
${paragraphs.map((p, i) => `[${i}]: ${p.text} (Original Word Position: ${p.originalIndex || i})`).join('\n\n')}

PENTING: Apabila memberikan cadangan, gunakan indeks yang betul:
- Untuk paragraphIndex, gunakan FILTERED INDEX (0-${paragraphs.length - 1}) 
- Sistem akan memetakan semula kepada kedudukan asal dalam dokumen Word

Sila balas dengan objek JSON yang mengandungi:
{
  "totalParagraphs": ${paragraphs.length},
  "documentTheme": "penerangan ringkas tentang tema utama dokumen (DALAM BAHASA MELAYU)",
  "analysisType": "${analysisType}",
  "overallScore": "nombor (0-100) - skor kualiti dokumen",
  "suggestions": [
    {
      "id": "pengecam unik",
      "paragraphIndex": "nombor - indeks perenggan sasaran",
      "originalText": "teks asal tepat",
      "suggestedText": "versi yang diperbaiki (DALAM BAHASA MELAYU)",
      "type": "clarity|grammar|style|structure|flow|tone",
      "reason": "penjelasan jelas tentang penambahbaikan (DALAM BAHASA MELAYU)",
      "confidence": "nombor (0-1) - keyakinan AI dalam cadangan",
      "severity": "low|medium|high|critical"
    }
  ],
  "documentMetrics": {
    "averageWordsPerParagraph": "nombor",
    "readabilityScore": "nombor (0-100)",
    "consistencyScore": "nombor (0-100)"
  },
  "timestamp": "${new Date().toISOString()}"
}

INGAT: Semua suggestedText, reason, dan documentTheme MESTI dalam BAHASA MELAYU.`;

        const requestBody = {
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 3072,
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
                    documentTheme: "Tidak dapat menentukan tema kerana masalah pemprosesan respons",
                    suggestions: [],
                    timestamp: new Date().toISOString(),
                    note: "Analisis Gemini selesai tetapi tidak dapat memproses respons berstruktur",
                    rawResponse: responseText.substring(0, 500) + "..."
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
