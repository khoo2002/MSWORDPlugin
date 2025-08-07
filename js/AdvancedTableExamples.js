/**
 * ADVANCED TABLE SYSTEM - USAGE EXAMPLES
 * How to create and insert complex tables like your Malaysian statistics data
 */

// ========================================================================
// EXAMPLE 1: Creating Your Complex Malaysian Statistics Table
// ========================================================================

async function createMalaysianStatisticsTable() {
    try {
        // Initialize the advanced table manager
        const tableManager = new AdvancedTableManager(wordDocumentManager);
        
        // Your actual data from the Excel extract
        const malayStatisticsData = {
            title: "STATISTIK PENURUNAN KANDUNGAN 3R",
            description: "Perincian penurunan kandungan 3R dari tahun 2022 hingga 2025",
            data: [
                ["1.", "2022", "40", "119", "16", "175.0", "422.0"],
                ["2.", "2023", "519", "960", "154", "1633.0", "3396.0"],
                ["3.", "2024", "1772", "2670", "388", "4830.0", "13805.0"],
                ["4.", "2025", "148", "992", "76", "1216.0", "25962.0"]
            ],
            totals: ["Jumlah", "2479", "4741", "634", "7854", "43585.0", ""]
        };

        const metadata = {
            source: "MCMC Malaysia",
            lastUpdated: "31 Julai 2025",
            department: "Jabatan Komunikasi dan Multimedia Malaysia"
        };

        // Create the advanced table structure
        const tableStructure = tableManager.createMalaysianStatisticsTable(malayStatisticsData);
        
        // Insert into Word document
        const success = await tableManager.insertAdvancedTable(tableStructure);
        
        if (success) {
            console.log('✅ Complex Malaysian statistics table inserted successfully!');
        }
        
    } catch (error) {
        console.error('❌ Error creating table:', error);
    }
}

// ========================================================================
// EXAMPLE 2: Converting Your Excel Extract to Advanced Table
// ========================================================================

async function convertExcelExtractToTable() {
    try {
        // Your raw markdown table data from the Excel extract
        const rawTableData = `
+--------+---------+--------------------------+-----------------------+-----------------------------------+---------+---------+
| No.    | Tahun   | Penurunan Kandungan 3R   | Jumlah Penurunan 3R   | Jumlah keseluruhan elemen jelik   | Col5    | Col6    |
+========+=========+==========================+=======================+===================================+=========+=========+
| Agama  | Kaum    | Raja                     |                       |                                   |         |         |
+--------+---------+--------------------------+-----------------------+-----------------------------------+---------+---------+
| 1.     | 2022    | 40                       | 119                   | 16                                | 175.0   | 422.0   |
+--------+---------+--------------------------+-----------------------+-----------------------------------+---------+---------+
| 2.     | 2023    | 519                      | 960                   | 154                               | 1633.0  | 3396.0  |
+--------+---------+--------------------------+-----------------------+-----------------------------------+---------+---------+
| 3.     | 2024    | 1772                     | 2670                  | 388                               | 4830.0  | 13805.0 |
+--------+---------+--------------------------+-----------------------+-----------------------------------+---------+---------+
| 4.     | 2025    | 148                      | 992                   | 76                                | 1216.0  | 25962.0 |
+--------+---------+--------------------------+-----------------------+-----------------------------------+---------+---------+
| Jumlah | 2479    | 4741                     | 634                   | 7854                              | 43585.0 |         |
+--------+---------+--------------------------+-----------------------+-----------------------------------+---------+---------+
        `;

        // Call the API to convert
        const response = await fetch('/api/convert-data-to-table', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rawData: rawTableData,
                format: 'excel_extract',
                metadata: {
                    title: "Converted Malaysian Statistics",
                    source: "Excel Extract Conversion",
                    originalFile: "01.08.2025 - STATISTIK JUMLAH PERMOHONAN DAN PENURUNAN KANDUNGAN.xlsx"
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Use the converted table structure
            await wordDocumentManager.insertCustomTable(result.tableStructure);
            console.log('✅ Excel extract converted and inserted successfully!');
        }
        
    } catch (error) {
        console.error('❌ Error converting Excel extract:', error);
    }
}

// ========================================================================
// EXAMPLE 3: Using the API to Generate Advanced Tables
// ========================================================================

async function generateAdvancedTableViaAPI() {
    try {
        // Generate a Malaysian statistics table via API
        const response = await fetch('/api/generate-advanced-table', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                template: 'malaysian_statistics',
                tableType: 'advanced',
                customData: {
                    title: "STATISTIK CUSTOM KANDUNGAN 3R",
                    description: "Custom data untuk demonstrasi",
                    data: [
                        ["1.", "2022", "100", "200", "50", "350.0", "700.0"],
                        ["2.", "2023", "150", "300", "75", "525.0", "1050.0"],
                        ["3.", "2024", "200", "400", "100", "700.0", "1400.0"]
                    ],
                    totals: ["Jumlah", "450", "900", "225", "1575.0", "3150.0", ""]
                },
                metadata: {
                    source: "Custom Demo Data",
                    lastUpdated: "Today",
                    category: "Demonstration"
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Insert the generated table
            await wordDocumentManager.insertCustomTable(result.tableStructure);
            console.log('✅ Advanced table generated and inserted via API!');
            console.log('📊 Table complexity:', result.metadata.complexity);
            console.log('📏 Table size:', result.metadata.estimatedSize);
        }
        
    } catch (error) {
        console.error('❌ Error generating table via API:', error);
    }
}

// ========================================================================
// EXAMPLE 4: Creating Custom Complex Tables with Merged Cells
// ========================================================================

async function createCustomComplexTable() {
    const customTableConfig = {
        title: "LAPORAN KOMPREHENSIF KANDUNGAN DIGITAL",
        metadata: {
            source: "Kementerian Komunikasi dan Multimedia",
            description: "Laporan menyeluruh penurunan kandungan digital",
            reportPeriod: "Januari - Julai 2025"
        },
        headerLevels: [
            // Level 1: Main categories
            [
                { text: "Bil.", rowspan: 3, alignment: "center" },
                { text: "Tempoh", rowspan: 3, alignment: "center" },
                { text: "Kategori Kandungan", colspan: 3, alignment: "center" },
                { text: "Jumlah Keseluruhan", rowspan: 3, alignment: "center" },
                { text: "Status", rowspan: 3, alignment: "center" }
            ],
            // Level 2: Sub categories
            [
                { text: "3R", rowspan: 2, alignment: "center" },
                { text: "Buli/Gangguan", rowspan: 2, alignment: "center" },
                { text: "Kanak-kanak", rowspan: 2, alignment: "center" }
            ],
            // Level 3: Specific metrics (if needed)
            [
                { text: "Permohonan", alignment: "center" },
                { text: "Penurunan", alignment: "center" },
                { text: "Permohonan", alignment: "center" },
                { text: "Penurunan", alignment: "center" },
                { text: "Permohonan", alignment: "center" },
                { text: "Penurunan", alignment: "center" }
            ]
        ],
        dataRows: [
            [
                { value: "1", alignment: "center" },
                { value: "Q1 2025", alignment: "center" },
                { value: "125", alignment: "right", dataType: "number" },
                { value: "110", alignment: "right", dataType: "number" },
                { value: "89", alignment: "right", dataType: "number" },
                { value: "78", alignment: "right", dataType: "number" },
                { value: "45", alignment: "right", dataType: "number" },
                { value: "42", alignment: "right", dataType: "number" },
                { value: "460", alignment: "right", dataType: "number" },
                { value: "Aktif", alignment: "center" }
            ],
            [
                { value: "2", alignment: "center" },
                { value: "Q2 2025", alignment: "center" },
                { value: "98", alignment: "right", dataType: "number" },
                { value: "92", alignment: "right", dataType: "number" },
                { value: "156", alignment: "right", dataType: "number" },
                { value: "134", alignment: "right", dataType: "number" },
                { value: "67", alignment: "right", dataType: "number" },
                { value: "59", alignment: "right", dataType: "number" },
                { value: "606", alignment: "right", dataType: "number" },
                { value: "Aktif", alignment: "center" }
            ]
        ],
        summaryRows: [
            {
                label: "Jumlah Keseluruhan",
                cells: [
                    { value: "Jumlah", alignment: "center", style: "summary_label" },
                    { value: "", alignment: "center" },
                    { value: "223", alignment: "right", isCalculated: true },
                    { value: "202", alignment: "right", isCalculated: true },
                    { value: "245", alignment: "right", isCalculated: true },
                    { value: "212", alignment: "right", isCalculated: true },
                    { value: "112", alignment: "right", isCalculated: true },
                    { value: "101", alignment: "right", isCalculated: true },
                    { value: "1066", alignment: "right", isCalculated: true },
                    { value: "100%", alignment: "center" }
                ]
            }
        ],
        formatting: {
            headerStyle: {
                bold: true,
                backgroundColor: "#1f4e79",
                textColor: "#FFFFFF",
                borderStyle: "solid",
                borderWidth: "2px"
            },
            subHeaderStyle: {
                bold: true,
                backgroundColor: "#5b9bd5",
                textColor: "#FFFFFF",
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
                backgroundColor: "#d9e2f3",
                textColor: "#000000",
                borderStyle: "double",
                borderWidth: "3px"
            }
        }
    };

    try {
        const tableManager = new AdvancedTableManager(wordDocumentManager);
        const tableStructure = tableManager.createTableStructure(customTableConfig);
        await tableManager.insertAdvancedTable(tableStructure);
        console.log('✅ Custom complex table with merged cells created successfully!');
    } catch (error) {
        console.error('❌ Error creating custom complex table:', error);
    }
}

// ========================================================================
// EXAMPLE 5: Integration with Chat UI for Table Generation
// ========================================================================

function setupAdvancedTableCommands() {
    // Add to your chat command handler
    const chatCommands = {
        '/create-malay-stats': createMalaysianStatisticsTable,
        '/convert-excel': convertExcelExtractToTable,
        '/generate-api-table': generateAdvancedTableViaAPI,
        '/create-complex': createCustomComplexTable
    };

    // Example integration in chat handler
    function handleChatCommand(command) {
        if (chatCommands[command]) {
            chatCommands[command]();
        }
    }
}

// ========================================================================
// USAGE INSTRUCTIONS
// ========================================================================

/*
HOW TO USE THE ADVANCED TABLE SYSTEM:

1. FOR SIMPLE TABLES (backward compatibility):
   - Still use the existing 2D array format
   - WordDocumentManager will automatically detect and use legacy method

2. FOR COMPLEX TABLES (like your Malaysian statistics):
   - Use the new advanced table structure format
   - WordDocumentManager will automatically detect and use advanced method

3. API ENDPOINTS:
   - POST /api/generate-advanced-table - Generate predefined complex tables
   - POST /api/convert-data-to-table - Convert raw data to advanced tables

4. KEY FEATURES:
   ✅ Multi-level headers with merged cells
   ✅ Complex data structures (like your Agama|Kaum|Raja subheaders)
   ✅ Summary/total rows with calculations
   ✅ Professional formatting and styling
   ✅ HTML insertion for maximum formatting control
   ✅ Automatic data type detection and alignment
   ✅ Metadata and source attribution
   ✅ Malaysian government document formatting standards

5. DATA COMPATIBILITY:
   ✅ Direct conversion from your Excel extract format
   ✅ Markdown table parsing
   ✅ JSON data structures
   ✅ CSV imports
   ✅ Custom complex configurations

EXAMPLE USAGE IN YOUR APPLICATION:
================================

// For your existing simple tables:
await wordDocumentManager.insertCustomTable(simple2DArray, "Simple Table");

// For your complex Malaysian statistics:
await wordDocumentManager.insertCustomTable(advancedTableStructure);

// The system automatically detects which method to use!
*/

export {
    createMalaysianStatisticsTable,
    convertExcelExtractToTable,
    generateAdvancedTableViaAPI,
    createCustomComplexTable,
    setupAdvancedTableCommands
};
