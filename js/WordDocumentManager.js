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

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const body = context.document.body;
                    context.load(body, "text");
                    await context.sync();
                    resolve(body.text);
                } catch (error) {
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

                    const paragraphData = [];
                    for (let i = 0; i < paragraphs.items.length; i++) {
                        const paragraph = paragraphs.items[i];
                        if (paragraph.text.trim()) {
                            paragraphData.push({
                                index: i,
                                text: paragraph.text.trim(),
                                range: paragraph.getRange()
                            });
                        }
                    }
                    resolve(paragraphData);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Replace text in a specific paragraph
     * @param {number} paragraphIndex - Index of the paragraph to replace
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
