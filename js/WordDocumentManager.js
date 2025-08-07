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
     * Insert a sample table into the document
     * @returns {Promise<boolean>} Success status
     */
    async insertTable() {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const body = context.document.body;
                    
                    // Add some spacing before the table
                    body.insertParagraph('', Word.InsertLocation.end);
                    body.insertParagraph('📊 STATISTIK PENURUNAN KANDUNGAN 3R', Word.InsertLocation.end);
                    body.insertParagraph('Perincian penurunan kandungan 3R dari tahun 2022 hingga 2025', Word.InsertLocation.end);
                    body.insertParagraph('', Word.InsertLocation.end);
                    
                    // Define Malaysian statistics table data (your actual complex data)
                    const tableData = [
                        ['No.', 'Tahun', 'Penurunan Kandungan 3R', 'Jumlah Penurunan 3R', 'Jumlah keseluruhan elemen jelik', 'Col5', 'Col6'],
                        ['', '', 'Agama', 'Kaum', 'Raja', '', ''],
                        ['1.', '2022', '40', '119', '16', '175.0', '422.0'],
                        ['2.', '2023', '519', '960', '154', '1633.0', '3396.0'],
                        ['3.', '2024', '1772', '2670', '388', '4830.0', '13805.0'],
                        ['4.', '2025', '148', '992', '76', '1216.0', '25962.0'],
                        ['Jumlah', '', '2479', '4741', '634', '7854', '43585.0']
                    ];

                    // Insert the table
                    const table = body.insertTable(tableData.length, tableData[0].length, Word.InsertLocation.end, tableData);
                    
                    // Style the table with professional government formatting
                    table.styleBuiltIn = Word.Style.gridTable4_Accent1;
                    table.horizontalAlignment = Word.Alignment.left;
                    
                    // Style the main header row (row 0)
                    const headerRow = table.getRow(0);
                    headerRow.font.bold = true;
                    headerRow.font.color = '#FFFFFF';
                    headerRow.shadingColor = '#2F5597'; // Government blue
                    
                    // Style the sub-header row (row 1 - Agama, Kaum, Raja)
                    const subHeaderRow = table.getRow(1);
                    subHeaderRow.font.bold = true;
                    subHeaderRow.font.color = '#000000';
                    subHeaderRow.shadingColor = '#E6F3FF'; // Light blue
                    
                    // Style the summary/total row (last row)
                    const summaryRow = table.getRow(tableData.length - 1);
                    summaryRow.font.bold = true;
                    summaryRow.font.color = '#000000';
                    summaryRow.shadingColor = '#F0F8FF'; // Very light blue
                    
                    // Auto-fit the table
                    table.autoFitBehavior = Word.AutoFitBehavior.autoFitToContents;
                    
                    // Add some spacing after the table
                    body.insertParagraph('', Word.InsertLocation.end);
                    body.insertParagraph('Sumber: MCMC Malaysia | Tarikh: 31 Julai 2025', Word.InsertLocation.end);
                    body.insertParagraph('Statistik dihasilkan pada: ' + new Date().toLocaleString(), Word.InsertLocation.end);
                    
                    await context.sync();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Insert a custom table with specific data and title
     * @param {Array} tableData - 2D array of table data OR complex table structure
     * @param {string} title - Title for the table
     * @returns {Promise<boolean>} Success status
     */
    async insertCustomTable(tableData, title = 'Data Table') {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        // Check if this is a complex table structure or simple 2D array
        if (this.isComplexTableStructure(tableData)) {
            return await this.insertAdvancedTable(tableData);
        }

        // Legacy 2D array handling
        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    // Get the current selection/cursor position
                    const selection = context.document.getSelection();
                    
                    // Add some spacing before the table
                    selection.insertParagraph('', Word.InsertLocation.after);
                    selection.insertParagraph(`📊 ${title}`, Word.InsertLocation.after);
                    selection.insertParagraph('', Word.InsertLocation.after);
                    
                    // Insert the table at cursor position
                    const table = selection.insertTable(tableData.length, tableData[0].length, Word.InsertLocation.after, tableData);
                    
                    // Style the table
                    table.styleBuiltIn = Word.Style.gridTable4_Accent1;
                    table.horizontalAlignment = Word.Alignment.left;
                    
                    // Style the header row
                    const headerRow = table.getRow(0);
                    headerRow.font.bold = true;
                    headerRow.font.color = '#FFFFFF';
                    headerRow.shadingColor = '#2F5597';
                    
                    // Auto-fit the table
                    table.autoFitBehavior = Word.AutoFitBehavior.autoFitToContents;
                    
                    // Add some spacing after the table
                    selection.insertParagraph('', Word.InsertLocation.after);
                    selection.insertParagraph('Table inserted on: ' + new Date().toLocaleString(), Word.InsertLocation.after);
                    
                    await context.sync();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Check if the table data is a complex structure or simple 2D array
     * @param {*} tableData - Table data to check
     * @returns {boolean} True if complex structure
     */
    isComplexTableStructure(tableData) {
        return tableData && 
               typeof tableData === 'object' && 
               !Array.isArray(tableData) &&
               (tableData.structure || tableData.headerLevels || tableData.metadata);
    }

    /**
     * Insert advanced table with complex structure, merged cells, and formatting
     * @param {Object} tableStructure - Complex table structure object
     * @returns {Promise<boolean>} Success status
     */
    async insertAdvancedTable(tableStructure) {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const selection = context.document.getSelection();
                    
                    // Add title and metadata
                    selection.insertParagraph('', Word.InsertLocation.after);
                    selection.insertParagraph(`📊 ${tableStructure.title}`, Word.InsertLocation.after);
                    
                    if (tableStructure.metadata?.description) {
                        selection.insertParagraph(`${tableStructure.metadata.description}`, Word.InsertLocation.after);
                    }
                    
                    selection.insertParagraph('', Word.InsertLocation.after);

                    // Generate and insert HTML table
                    const htmlTable = this.generateAdvancedHTMLTable(tableStructure);
                    selection.insertHtml(htmlTable, Word.InsertLocation.after);
                    
                    // Add source and timestamp
                    selection.insertParagraph('', Word.InsertLocation.after);
                    if (tableStructure.metadata?.source) {
                        selection.insertParagraph(`📋 Source: ${tableStructure.metadata.source}`, Word.InsertLocation.after);
                    }
                    if (tableStructure.metadata?.lastUpdated) {
                        selection.insertParagraph(`📅 Last Updated: ${tableStructure.metadata.lastUpdated}`, Word.InsertLocation.after);
                    }
                    selection.insertParagraph(`🕒 Generated: ${new Date().toLocaleString()}`, Word.InsertLocation.after);
                    
                    await context.sync();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Generate advanced HTML table with merged cells and complex formatting
     * @param {Object} tableStructure - Table structure
     * @returns {string} HTML table string
     */
    generateAdvancedHTMLTable(tableStructure) {
        const { structure, formatting } = tableStructure;
        let html = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; margin: 10px 0;">';

        // Generate header levels
        if (structure.headerLevels) {
            structure.headerLevels.forEach((level, levelIndex) => {
                html += '<tr>';
                level.cells.forEach(cell => {
                    const style = this.generateCellStyle(cell, formatting.headerStyle);
                    const colspan = cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
                    const rowspan = cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '';
                    html += `<th${colspan}${rowspan} style="${style}">${cell.text}</th>`;
                });
                html += '</tr>';
            });
        }

        // Generate data rows
        if (structure.dataRows) {
            structure.dataRows.forEach(row => {
                html += '<tr>';
                row.cells.forEach(cell => {
                    const style = this.generateCellStyle(cell, formatting.dataStyle);
                    const colspan = cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
                    const rowspan = cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '';
                    html += `<td${colspan}${rowspan} style="${style}">${cell.displayText}</td>`;
                });
                html += '</tr>';
            });
        }

        // Generate summary rows
        if (structure.summaryRows) {
            structure.summaryRows.forEach(row => {
                html += '<tr>';
                row.cells.forEach(cell => {
                    const style = this.generateCellStyle(cell, formatting.summaryStyle);
                    html += `<td style="${style}">${cell.displayText}</td>`;
                });
                html += '</tr>';
            });
        }

        html += '</table>';
        return html;
    }

    /**
     * Generate CSS style string for table cell
     * @param {Object} cell - Cell object
     * @param {Object} baseStyle - Base style object
     * @returns {string} CSS style string
     */
    generateCellStyle(cell, baseStyle) {
        const styles = [];
        
        // Base styles
        if (baseStyle.backgroundColor) styles.push(`background-color: ${baseStyle.backgroundColor}`);
        if (baseStyle.textColor) styles.push(`color: ${baseStyle.textColor}`);
        if (baseStyle.bold) styles.push('font-weight: bold');
        styles.push('border: 1px solid #000000');
        styles.push('padding: 8px');
        
        // Cell-specific alignment
        if (cell.alignment) styles.push(`text-align: ${cell.alignment}`);
        
        // Data type specific formatting
        if (cell.dataType === 'number' || cell.dataType === 'decimal') {
            styles.push('font-family: "Courier New", monospace');
        }
        
        return styles.join('; ');
    }

    /**
     * Read all tables from the document
     * @returns {Promise<Array>} Array of table objects with their content
     */
    async readTables() {
        if (!this.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        console.log('📋 [TABLES] Starting to read document tables...');

        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const tables = context.document.body.tables;
                    context.load(tables, "items");
                    await context.sync();

                    console.log('📋 [TABLES] Found tables:', tables.items.length);

                    const tableData = [];
                    
                    for (let i = 0; i < tables.items.length; i++) {
                        const table = tables.items[i];
                        
                        // Load table properties
                        context.load(table, ["rowCount", "columnCount"]);
                        await context.sync();
                        
                        console.log(`📋 [TABLE ${i}] Size: ${table.rowCount}x${table.columnCount}`);
                        
                        // Get all rows
                        const rows = table.rows;
                        context.load(rows, "items");
                        await context.sync();
                        
                        const tableRows = [];
                        
                        for (let rowIndex = 0; rowIndex < rows.items.length; rowIndex++) {
                            const row = rows.items[rowIndex];
                            const cells = row.cells;
                            context.load(cells, "items/body/text");
                            await context.sync();
                            
                            const rowData = [];
                            for (let cellIndex = 0; cellIndex < cells.items.length; cellIndex++) {
                                const cellText = cells.items[cellIndex].body.text.trim();
                                rowData.push(cellText);
                            }
                            tableRows.push(rowData);
                        }
                        
                        tableData.push({
                            index: i,
                            rowCount: table.rowCount,
                            columnCount: table.columnCount,
                            rows: tableRows,
                            title: this.generateTableTitle(tableRows),
                            searchableText: this.generateSearchableText(tableRows)
                        });
                    }
                    
                    console.log('📋 [TABLES] Processed tables:', {
                        totalTables: tableData.length,
                        tableInfo: tableData.map(t => ({ 
                            index: t.index, 
                            size: `${t.rowCount}x${t.columnCount}`, 
                            title: t.title 
                        }))
                    });
                    
                    resolve(tableData);
                } catch (error) {
                    console.error('📋 [TABLES] Error reading tables:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Generate a descriptive title for a table based on its content
     * @param {Array} rows - Table rows data
     * @returns {string} Generated title
     */
    generateTableTitle(rows) {
        if (rows.length === 0) return 'Empty Table';
        
        // Use first row as potential headers, or first cell if single column
        const firstRow = rows[0];
        if (firstRow.length === 0) return 'Empty Table';
        
        if (firstRow.length === 1) {
            return firstRow[0] || 'Table';
        }
        
        // Take first 2-3 headers to create title
        const headers = firstRow.slice(0, 3).filter(cell => cell.trim().length > 0);
        if (headers.length > 0) {
            return headers.join(', ') + (firstRow.length > 3 ? '...' : '');
        }
        
        return `Table (${rows.length}x${firstRow.length})`;
    }

    /**
     * Generate searchable text content from table rows
     * @param {Array} rows - Table rows data
     * @returns {string} Concatenated searchable text
     */
    generateSearchableText(rows) {
        return rows.flat().join(' ').toLowerCase();
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
