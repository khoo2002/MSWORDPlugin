/**
 * AdvancedTableManager - Handles complex table structures with merged cells, headers, and formatting
 * Designed for sophisticated data like Malaysian government statistics
 */
class AdvancedTableManager {
    constructor(wordDocumentManager) {
        this.wordManager = wordDocumentManager;
        this.tableStructures = new Map();
    }

    /**
     * Create a complex table structure object
     * @param {Object} tableConfig - Complex table configuration
     * @returns {Object} Structured table object
     */
    createTableStructure(tableConfig) {
        const {
            title,
            metadata,
            headerLevels,
            dataRows,
            summaryRows,
            formatting,
            calculations
        } = tableConfig;

        return {
            id: this.generateTableId(),
            title: title || 'Untitled Table',
            metadata: {
                created: new Date().toISOString(),
                source: metadata?.source || 'User Generated',
                description: metadata?.description || '',
                ...metadata
            },
            structure: {
                headerLevels: this.processHeaderLevels(headerLevels),
                dataRows: this.processDataRows(dataRows),
                summaryRows: this.processSummaryRows(summaryRows),
                totalRows: this.calculateTotalRows(headerLevels, dataRows, summaryRows),
                totalColumns: this.calculateTotalColumns(headerLevels, dataRows)
            },
            formatting: this.processFormatting(formatting),
            calculations: this.processCalculations(calculations),
            renderingStrategy: this.determineRenderingStrategy(headerLevels, dataRows)
        };
    }

    /**
     * Process header levels (supports multi-level headers)
     * @param {Array} headerLevels - Array of header level definitions
     * @returns {Array} Processed header structure
     */
    processHeaderLevels(headerLevels = []) {
        return headerLevels.map((level, levelIndex) => ({
            level: levelIndex,
            cells: level.map((cell, cellIndex) => ({
                index: cellIndex,
                text: cell.text || cell,
                colspan: cell.colspan || 1,
                rowspan: cell.rowspan || 1,
                alignment: cell.alignment || 'center',
                style: cell.style || 'header',
                merged: (cell.colspan > 1 || cell.rowspan > 1),
                mergeMaster: true,
                mergeRange: this.calculateMergeRange(cellIndex, cell.colspan, cell.rowspan)
            }))
        }));
    }

    /**
     * Process data rows with support for merged cells and formatting
     * @param {Array} dataRows - Array of data row definitions
     * @returns {Array} Processed data structure
     */
    processDataRows(dataRows = []) {
        return dataRows.map((row, rowIndex) => ({
            index: rowIndex,
            type: 'data',
            cells: row.map((cell, cellIndex) => ({
                index: cellIndex,
                value: cell.value || cell,
                displayText: cell.displayText || cell.value || cell,
                dataType: this.detectDataType(cell.value || cell),
                formatting: cell.formatting || null,
                colspan: cell.colspan || 1,
                rowspan: cell.rowspan || 1,
                alignment: cell.alignment || this.getDefaultAlignment(cell.value || cell),
                style: cell.style || 'data',
                formula: cell.formula || null,
                merged: (cell.colspan > 1 || cell.rowspan > 1)
            }))
        }));
    }

    /**
     * Process summary/total rows
     * @param {Array} summaryRows - Array of summary row definitions
     * @returns {Array} Processed summary structure
     */
    processSummaryRows(summaryRows = []) {
        return summaryRows.map((row, rowIndex) => ({
            index: rowIndex,
            type: 'summary',
            label: row.label || 'Total',
            cells: row.cells.map((cell, cellIndex) => ({
                index: cellIndex,
                value: cell.value || cell,
                displayText: cell.displayText || cell.value || cell,
                isCalculated: cell.isCalculated || false,
                formula: cell.formula || null,
                dataType: this.detectDataType(cell.value || cell),
                formatting: cell.formatting || 'bold',
                alignment: cell.alignment || 'center',
                style: 'summary',
                highlighted: true
            }))
        }));
    }

    /**
     * Create Malaysian statistics table from your example data
     * @param {Object} statisticsData - Your complex statistics data
     * @returns {Object} Complete table structure
     */
    createMalaysianStatisticsTable(statisticsData) {
        // Based on your Table 2 example: "Penurunan Kandungan 3R"
        const tableConfig = {
            title: statisticsData.title || "STATISTIK PENURUNAN KANDUNGAN 3R",
            metadata: {
                source: "MCMC Malaysia",
                description: "Perincian penurunan kandungan 3R dari tahun 2022 hingga 2025",
                dateRange: "2022-2025",
                lastUpdated: "31 Julai 2025"
            },
            headerLevels: [
                // Main headers
                [
                    { text: "No.", rowspan: 2, alignment: "center" },
                    { text: "Tahun", rowspan: 2, alignment: "center" },
                    { text: "Penurunan Kandungan 3R", rowspan: 2, alignment: "center" },
                    { text: "Jumlah Penurunan 3R", rowspan: 2, alignment: "center" },
                    { text: "Jumlah keseluruhan elemen jelik", rowspan: 2, alignment: "center" },
                    { text: "Col5", rowspan: 2, alignment: "center" },
                    { text: "Col6", rowspan: 2, alignment: "center" }
                ],
                // Sub headers (the Agama, Kaum, Raja row)
                [
                    { text: "Agama", alignment: "center", style: "subheader" },
                    { text: "Kaum", alignment: "center", style: "subheader" },
                    { text: "Raja", alignment: "center", style: "subheader" },
                    { text: "", alignment: "center" },
                    { text: "", alignment: "center" },
                    { text: "", alignment: "center" },
                    { text: "", alignment: "center" }
                ]
            ],
            dataRows: [
                [
                    { value: "1.", alignment: "center" },
                    { value: "2022", alignment: "center" },
                    { value: "40", alignment: "right", dataType: "number" },
                    { value: "119", alignment: "right", dataType: "number" },
                    { value: "16", alignment: "right", dataType: "number" },
                    { value: "175.0", alignment: "right", dataType: "decimal" },
                    { value: "422.0", alignment: "right", dataType: "decimal" }
                ],
                [
                    { value: "2.", alignment: "center" },
                    { value: "2023", alignment: "center" },
                    { value: "519", alignment: "right", dataType: "number" },
                    { value: "960", alignment: "right", dataType: "number" },
                    { value: "154", alignment: "right", dataType: "number" },
                    { value: "1633.0", alignment: "right", dataType: "decimal" },
                    { value: "3396.0", alignment: "right", dataType: "decimal" }
                ],
                [
                    { value: "3.", alignment: "center" },
                    { value: "2024", alignment: "center" },
                    { value: "1772", alignment: "right", dataType: "number" },
                    { value: "2670", alignment: "right", dataType: "number" },
                    { value: "388", alignment: "right", dataType: "number" },
                    { value: "4830.0", alignment: "right", dataType: "decimal" },
                    { value: "13805.0", alignment: "right", dataType: "decimal" }
                ],
                [
                    { value: "4.", alignment: "center" },
                    { value: "2025", alignment: "center" },
                    { value: "148", alignment: "right", dataType: "number" },
                    { value: "992", alignment: "right", dataType: "number" },
                    { value: "76", alignment: "right", dataType: "number" },
                    { value: "1216.0", alignment: "right", dataType: "decimal" },
                    { value: "25962.0", alignment: "right", dataType: "decimal" }
                ]
            ],
            summaryRows: [
                {
                    label: "Jumlah",
                    cells: [
                        { value: "Jumlah", alignment: "center", style: "summary_label" },
                        { value: "2479", alignment: "right", isCalculated: true, formula: "SUM(C2:C5)" },
                        { value: "4741", alignment: "right", isCalculated: true, formula: "SUM(D2:D5)" },
                        { value: "634", alignment: "right", isCalculated: true, formula: "SUM(E2:E5)" },
                        { value: "7854", alignment: "right", isCalculated: true, formula: "SUM(F2:F5)" },
                        { value: "43585.0", alignment: "right", isCalculated: true, formula: "SUM(G2:G5)" },
                        { value: "", alignment: "center" }
                    ]
                }
            ],
            formatting: {
                headerStyle: {
                    bold: true,
                    backgroundColor: "#2F5597",
                    textColor: "#FFFFFF",
                    borderStyle: "solid",
                    borderWidth: "1px"
                },
                subHeaderStyle: {
                    bold: true,
                    backgroundColor: "#E6F3FF",
                    textColor: "#000000",
                    borderStyle: "solid",
                    borderWidth: "1px"
                },
                dataStyle: {
                    backgroundColor: "#FFFFFF",
                    textColor: "#000000",
                    borderStyle: "solid",
                    borderWidth: "1px"
                },
                summaryStyle: {
                    bold: true,
                    backgroundColor: "#F0F8FF",
                    textColor: "#000000",
                    borderStyle: "double",
                    borderWidth: "2px"
                },
                numberFormat: "#,##0.0"
            },
            calculations: {
                autoSum: true,
                formulas: {
                    totalRow: "SUM(ABOVE)",
                    percentage: "(VALUE/TOTAL)*100"
                }
            }
        };

        return this.createTableStructure(tableConfig);
    }

    /**
     * Insert advanced table into Word document
     * @param {Object} tableStructure - Complex table structure
     * @returns {Promise<boolean>} Success status
     */
    async insertAdvancedTable(tableStructure) {
        if (!this.wordManager.isOfficeReady) {
            throw new Error('Office.js is not ready');
        }

        const strategy = tableStructure.renderingStrategy;
        
        switch (strategy) {
            case 'html_insertion':
                return await this.insertHTMLTable(tableStructure);
            case 'word_api_with_merge':
                return await this.insertWordAPIWithMerge(tableStructure);
            case 'hybrid_approach':
                return await this.insertHybridTable(tableStructure);
            default:
                return await this.insertHTMLTable(tableStructure);
        }
    }

    /**
     * Insert table using HTML for maximum formatting control
     * @param {Object} tableStructure - Table structure
     * @returns {Promise<boolean>} Success status
     */
    async insertHTMLTable(tableStructure) {
        return new Promise((resolve, reject) => {
            Word.run(async (context) => {
                try {
                    const selection = context.document.getSelection();
                    
                    // Add title
                    selection.insertParagraph('', Word.InsertLocation.after);
                    selection.insertParagraph(`📊 ${tableStructure.title}`, Word.InsertLocation.after);
                    selection.insertParagraph('', Word.InsertLocation.after);

                    // Generate complex HTML table
                    const htmlTable = this.generateAdvancedHTMLTable(tableStructure);
                    
                    // Insert HTML
                    selection.insertHtml(htmlTable, Word.InsertLocation.after);
                    
                    // Add metadata
                    selection.insertParagraph('', Word.InsertLocation.after);
                    selection.insertParagraph(`Source: ${tableStructure.metadata.source}`, Word.InsertLocation.after);
                    selection.insertParagraph(`Generated: ${new Date().toLocaleString()}`, Word.InsertLocation.after);
                    
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
        let html = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">';

        // Generate header levels
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

        // Generate data rows
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

        // Generate summary rows
        structure.summaryRows.forEach(row => {
            html += '<tr>';
            row.cells.forEach(cell => {
                const style = this.generateCellStyle(cell, formatting.summaryStyle);
                html += `<td style="${style}">${cell.displayText}</td>`;
            });
            html += '</tr>';
        });

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
        if (baseStyle.borderStyle) styles.push(`border: ${baseStyle.borderWidth || '1px'} ${baseStyle.borderStyle} #000`);
        
        // Cell-specific alignment
        if (cell.alignment) styles.push(`text-align: ${cell.alignment}`);
        
        // Data type specific formatting
        if (cell.dataType === 'number' || cell.dataType === 'decimal') {
            styles.push('font-family: monospace');
        }
        
        return styles.join('; ');
    }

    /**
     * Determine the best rendering strategy based on table complexity
     * @param {Array} headerLevels - Header levels
     * @param {Array} dataRows - Data rows
     * @returns {string} Rendering strategy
     */
    determineRenderingStrategy(headerLevels, dataRows) {
        const hasMultiLevelHeaders = headerLevels && headerLevels.length > 1;
        const hasMergedCells = this.checkForMergedCells(headerLevels, dataRows);
        const isLargeTable = dataRows && dataRows.length > 20;

        if (hasMultiLevelHeaders || hasMergedCells) {
            return 'html_insertion';
        } else if (isLargeTable) {
            return 'word_api_with_merge';
        } else {
            return 'hybrid_approach';
        }
    }

    /**
     * Check if table has merged cells
     * @param {Array} headerLevels - Header levels
     * @param {Array} dataRows - Data rows
     * @returns {boolean} Has merged cells
     */
    checkForMergedCells(headerLevels = [], dataRows = []) {
        // Check headers
        for (const level of headerLevels) {
            for (const cell of level) {
                if ((cell.colspan && cell.colspan > 1) || (cell.rowspan && cell.rowspan > 1)) {
                    return true;
                }
            }
        }
        
        // Check data rows
        for (const row of dataRows) {
            for (const cell of row) {
                if ((cell.colspan && cell.colspan > 1) || (cell.rowspan && cell.rowspan > 1)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // Helper methods
    generateTableId() {
        return `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    detectDataType(value) {
        if (typeof value === 'number') return 'number';
        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) return 'number';
            if (/^\d+\.\d+$/.test(value)) return 'decimal';
            if (/^\d{4}$/.test(value)) return 'year';
        }
        return 'text';
    }

    getDefaultAlignment(value) {
        const dataType = this.detectDataType(value);
        switch (dataType) {
            case 'number':
            case 'decimal':
                return 'right';
            case 'year':
                return 'center';
            default:
                return 'left';
        }
    }

    calculateTotalRows(headerLevels, dataRows, summaryRows) {
        return (headerLevels?.length || 0) + (dataRows?.length || 0) + (summaryRows?.length || 0);
    }

    calculateTotalColumns(headerLevels, dataRows) {
        if (headerLevels && headerLevels[0]) {
            return headerLevels[0].length;
        }
        if (dataRows && dataRows[0]) {
            return dataRows[0].length;
        }
        return 0;
    }

    calculateMergeRange(startIndex, colspan, rowspan) {
        return {
            startColumn: startIndex,
            endColumn: startIndex + (colspan - 1),
            rowspan: rowspan
        };
    }

    processFormatting(formatting = {}) {
        return {
            headerStyle: {
                bold: true,
                backgroundColor: "#2F5597",
                textColor: "#FFFFFF",
                borderStyle: "solid",
                borderWidth: "1px",
                ...formatting.headerStyle
            },
            dataStyle: {
                backgroundColor: "#FFFFFF",
                textColor: "#000000",
                borderStyle: "solid",
                borderWidth: "1px",
                ...formatting.dataStyle
            },
            summaryStyle: {
                bold: true,
                backgroundColor: "#F0F8FF",
                textColor: "#000000",
                borderStyle: "double",
                borderWidth: "2px",
                ...formatting.summaryStyle
            }
        };
    }

    processCalculations(calculations = {}) {
        return {
            autoSum: calculations.autoSum || false,
            formulas: calculations.formulas || {},
            ...calculations
        };
    }
}
