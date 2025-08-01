/**
 * WordDocumentManager - Handles all Word document operations
 * Provides methods to read, analyze, and modify Word document content
 */
class WordDocumentManager {
    constructor() {
        this.isOfficeReady = false;
        this.init();
    }

    /**
     * Initialize Office.js and setup Word document access
     */
    async init() {
        try {
            await new Promise((resolve) => {
                Office.onReady(() => {
                    this.isOfficeReady = true;
                    resolve();
                });
            });
        } catch (error) {
            console.error('Failed to initialize Office.js:', error);
        }
    }

    /**
     * Read all text content from the Word document
     * @returns {Promise<string>} The document text content
     */
    async readDocumentText() {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        console.log('📖 [WORD DOCUMENT] Starting to read document text...');

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const body = context.document.body;
                    context.load(body, "text");
                    await context.sync();
                    
                    console.log('📖 [WORD DOCUMENT] Text retrieved:', {
                        textLength: body.text ? body.text.length : 0,
                        wordCount: body.text ? body.text.split(/\s+/).filter(w => w.length > 0).length : 0,
                        textPreview: body.text ? body.text.substring(0, 500) + '...' : 'No text',
                        // FULL TEXT FOR DEBUGGING - Remove this in production
                        FULL_TEXT_DEBUG: body.text || 'No text available'
                    });
                    
                    resolve(body.text);
                } catch (error) {
                    console.error('📖 [WORD DOCUMENT] Error reading text:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Read paragraphs from the document with their ranges
     * @returns {Promise<Array>} Array of paragraph objects with text and range info
     */
    async readParagraphs() {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const paragraphs = context.document.body.paragraphs;
                    context.load(paragraphs, "text");
                    await context.sync();

                    console.log('📖 [PARAGRAPH READING] Total paragraphs found:', paragraphs.items.length);

                    const paragraphData = [];
                    let filteredIndex = 0; // Index in the filtered array
                    
                    for (let i = 0; i < paragraphs.items.length; i++) {
                        const paragraph = paragraphs.items[i];
                        const trimmedText = paragraph.text.trim();
                        
                        console.log(`📖 [PARAGRAPH ${i}] Text: "${paragraph.text}" (Length: ${paragraph.text.length}, Trimmed: ${trimmedText.length})`);
                        
                        if (trimmedText) {
                            paragraphData.push({
                                originalIndex: i,        // Original position in Word document
                                filteredIndex: filteredIndex, // Position in our filtered array
                                text: trimmedText,
                                range: paragraph.getRange()
                            });
                            filteredIndex++;
                        }
                    }
                    
                    console.log('📖 [PARAGRAPH READING] Filtered paragraphs:', {
                        totalOriginal: paragraphs.items.length,
                        totalFiltered: paragraphData.length,
                        mapping: paragraphData.map(p => ({ filtered: p.filteredIndex, original: p.originalIndex, text: p.text.substring(0, 50) + '...' }))
                    });
                    
                    resolve(paragraphData);
                } catch (error) {
                    console.error('📖 [PARAGRAPH READING] Error:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Replace text in a specific paragraph using filtered index
     * @param {number} filteredIndex - Index in the filtered paragraph array
     * @param {string} newText - New text content
     * @param {Array} paragraphMapping - Array of paragraph objects with originalIndex mapping
     * @returns {Promise<boolean>} Success status
     */
    async replaceParagraphByFilteredIndex(filteredIndex, newText, paragraphMapping) {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        // Find the original Word document index
        const paragraphInfo = paragraphMapping[filteredIndex];
        if (!paragraphInfo) {
            throw new Error(`Filtered index ${filteredIndex} not found in paragraph mapping`);
        }

        const originalIndex = paragraphInfo.originalIndex;
        
        console.log(`📝 [PARAGRAPH REPLACE] Mapping filtered index ${filteredIndex} to original index ${originalIndex}`);
        
        return this.replaceParagraph(originalIndex, newText);
    }

    /**
     * Replace text in a specific paragraph using original Word index
     * @param {number} paragraphIndex - Original index in Word document
     * @param {string} newText - New text content
     * @returns {Promise<boolean>} Success status
     */
    async replaceParagraph(paragraphIndex, newText) {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const paragraphs = context.document.body.paragraphs;
                    context.load(paragraphs);
                    await context.sync();

                    if (paragraphIndex < paragraphs.items.length) {
                        const paragraph = paragraphs.items[paragraphIndex];
                        paragraph.insertText(newText, Word.InsertLocation.replace);
                        await context.sync();
                        resolve(true);
                    } else {
                        reject(new Error('Paragraph index out of range'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Insert text at the end of the document
     * @param {string} text - Text to insert
     * @returns {Promise<boolean>} Success status
     */
    async insertText(text) {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const body = context.document.body;
                    body.insertText(text, Word.InsertLocation.end);
                    await context.sync();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Highlight a specific paragraph
     * @param {number} paragraphIndex - Index of the paragraph to highlight
     * @param {string} color - Highlight color (default: yellow)
     * @returns {Promise<boolean>} Success status
     */
    async highlightParagraph(paragraphIndex, color = 'yellow') {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const paragraphs = context.document.body.paragraphs;
                    context.load(paragraphs);
                    await context.sync();

                    if (paragraphIndex < paragraphs.items.length) {
                        const paragraph = paragraphs.items[paragraphIndex];
                        paragraph.font.highlightColor = color;
                        await context.sync();
                        resolve(true);
                    } else {
                        reject(new Error('Paragraph index out of range'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Remove highlight from a specific paragraph
     * @param {number} paragraphIndex - Index of the paragraph to unhighlight
     * @returns {Promise<boolean>} Success status
     */
    async removeHighlight(paragraphIndex) {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const paragraphs = context.document.body.paragraphs;
                    context.load(paragraphs);
                    await context.sync();

                    if (paragraphIndex < paragraphs.items.length) {
                        const paragraph = paragraphs.items[paragraphIndex];
                        paragraph.font.highlightColor = null; // Remove highlight
                        await context.sync();
                        resolve(true);
                    } else {
                        reject(new Error('Paragraph index out of range'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Insert suggested text after original paragraph with side-by-side highlighting
     * @param {number} paragraphIndex - Index of the original paragraph
     * @param {string} originalText - Original text content
     * @param {string} suggestedText - Suggested text content
     * @returns {Promise<object>} Object with original and suggested paragraph indices
     */
    async insertSuggestionAfterParagraph(paragraphIndex, originalText, suggestedText) {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const paragraphs = context.document.body.paragraphs;
                    context.load(paragraphs);
                    await context.sync();

                    if (paragraphIndex < paragraphs.items.length) {
                        const originalParagraph = paragraphs.items[paragraphIndex];
                        
                        // Highlight original paragraph in light gray
                        originalParagraph.font.highlightColor = '#E8E8E8';
                        
                        // Insert suggested text after the original paragraph
                        const suggestedParagraph = originalParagraph.insertParagraph(suggestedText, Word.InsertLocation.after);
                        
                        // Highlight suggested paragraph in light green
                        suggestedParagraph.font.highlightColor = '#D4F6D4';
                        
                        await context.sync();
                        
                        resolve({
                            originalIndex: paragraphIndex,
                            suggestedIndex: paragraphIndex + 1
                        });
                    } else {
                        reject(new Error('Paragraph index out of range'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Navigate to and select a specific paragraph
     * @param {number} paragraphIndex - Index of the paragraph to navigate to
     * @returns {Promise<boolean>} Success status
     */
    async navigateToParagraph(paragraphIndex) {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const paragraphs = context.document.body.paragraphs;
                    context.load(paragraphs);
                    await context.sync();

                    if (paragraphIndex < paragraphs.items.length) {
                        const paragraph = paragraphs.items[paragraphIndex];
                        const range = paragraph.getRange();
                        
                        // Select the paragraph and scroll to it
                        range.select();
                        
                        await context.sync();
                        resolve(true);
                    } else {
                        reject(new Error('Paragraph index out of range'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Remove suggestion paragraph and restore original highlighting
     * @param {number} originalIndex - Index of the original paragraph
     * @param {number} suggestedIndex - Index of the suggested paragraph to remove
     * @returns {Promise<boolean>} Success status
     */
    async removeSuggestion(originalIndex, suggestedIndex) {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const paragraphs = context.document.body.paragraphs;
                    context.load(paragraphs);
                    await context.sync();

                    // Remove suggested paragraph
                    if (suggestedIndex < paragraphs.items.length) {
                        const suggestedParagraph = paragraphs.items[suggestedIndex];
                        suggestedParagraph.delete();
                    }

                    // Remove highlight from original paragraph
                    if (originalIndex < paragraphs.items.length) {
                        const originalParagraph = paragraphs.items[originalIndex];
                        originalParagraph.font.highlightColor = null;
                    }

                    await context.sync();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Apply suggestion by replacing original with suggested text and removing suggestion
     * @param {number} originalIndex - Index of the original paragraph
     * @param {number} suggestedIndex - Index of the suggested paragraph
     * @param {string} suggestedText - The suggested text to apply
     * @returns {Promise<boolean>} Success status
     */
    async applySuggestionInDocument(originalIndex, suggestedIndex, suggestedText) {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const paragraphs = context.document.body.paragraphs;
                    context.load(paragraphs);
                    await context.sync();

                    // Replace original paragraph with suggested text
                    if (originalIndex < paragraphs.items.length) {
                        const originalParagraph = paragraphs.items[originalIndex];
                        originalParagraph.insertText(suggestedText, Word.InsertLocation.replace);
                        originalParagraph.font.highlightColor = null; // Remove highlight
                    }

                    // Remove the suggested paragraph
                    if (suggestedIndex < paragraphs.items.length) {
                        const suggestedParagraph = paragraphs.items[suggestedIndex];
                        suggestedParagraph.delete();
                    }

                    await context.sync();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
}
