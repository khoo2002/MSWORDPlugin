const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml'
};

// Read SSL certificate files
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

/**
 * Enhanced Analysis Command Parser
 * Handles \analyse command parsing and context building
 */
class AnalysisCommandParser {
    /**
     * Parse analysis command and extract focus areas and user guidance
     * @param {string} message - User message that might contain \analyse command
     * @returns {Object} Parsed command data
     */
    static parseAnalyseCommand(message) {
        if (!message || typeof message !== 'string') {
            return {
                isAnalysisCommand: false,
                analysisType: 'natural',
                focusAreas: [],
                userGuidance: '',
                originalMessage: message || ''
            };
        }

        const trimmed = message.trim();
        const isCommand = trimmed.startsWith('\\analyse');
        
        if (!isCommand) {
            return {
                isAnalysisCommand: false,
                analysisType: 'natural',
                focusAreas: [],
                userGuidance: '',
                originalMessage: message
            };
        }

        // Remove \analyse prefix and parse command content
        const commandContent = trimmed.substring(8).trim();
        const validFocusAreas = ['grammar', 'style', 'clarity', 'structure', 'flow', 'tone'];
        const focusAreas = [];
        let userGuidance = '';

        if (commandContent) {
            const words = commandContent.split(' ');
            let guidanceStartIndex = -1;

            // Extract focus areas (first valid keywords)
            for (let i = 0; i < words.length; i++) {
                const word = words[i].toLowerCase();
                if (validFocusAreas.includes(word)) {
                    focusAreas.push(word);
                } else {
                    guidanceStartIndex = i;
                    break;
                }
            }

            // Extract user guidance (everything after focus areas)
            if (guidanceStartIndex >= 0) {
                userGuidance = words.slice(guidanceStartIndex).join(' ').trim();
                // Remove quotes if present
                if (userGuidance.startsWith('"') && userGuidance.endsWith('"')) {
                    userGuidance = userGuidance.slice(1, -1);
                }
            }
        }

        // Default focus areas if none specified
        if (focusAreas.length === 0) {
            focusAreas.push('grammar', 'style', 'clarity');
        }

        return {
            isAnalysisCommand: true,
            analysisType: 'command',
            focusAreas: focusAreas,
            userGuidance: userGuidance,
            originalMessage: message,
            commandContent: commandContent
        };
    }

    /**
     * Detect document type from content
     * @param {string} fullText - Full document text
     * @returns {string} Document type classification
     */
    static detectDocumentType(fullText) {
        if (!fullText || typeof fullText !== 'string') return 'general';

        const text = fullText.toLowerCase();
        
        // Business document indicators
        const businessKeywords = ['proposal', 'executive', 'strategy', 'business', 'revenue', 'market', 'stakeholder', 'company', 'organization'];
        const businessScore = businessKeywords.reduce((score, keyword) => 
            score + (text.includes(keyword) ? 1 : 0), 0);

        // Academic document indicators  
        const academicKeywords = ['research', 'study', 'hypothesis', 'methodology', 'analysis', 'conclusion', 'bibliography', 'abstract', 'peer review'];
        const academicScore = academicKeywords.reduce((score, keyword) =>
            score + (text.includes(keyword) ? 1 : 0), 0);

        // Technical document indicators
        const technicalKeywords = ['implementation', 'system', 'technical', 'specification', 'architecture', 'api', 'software', 'code', 'algorithm'];
        const technicalScore = technicalKeywords.reduce((score, keyword) =>
            score + (text.includes(keyword) ? 1 : 0), 0);

        // Creative document indicators
        const creativeKeywords = ['story', 'character', 'narrative', 'creative', 'fiction', 'poetry', 'imagination', 'artistic'];
        const creativeScore = creativeKeywords.reduce((score, keyword) =>
            score + (text.includes(keyword) ? 1 : 0), 0);

        // Determine document type
        const maxScore = Math.max(businessScore, academicScore, technicalScore, creativeScore);
        if (maxScore === 0) return 'general';
        if (businessScore === maxScore) return 'business';
        if (academicScore === maxScore) return 'academic';
        if (technicalScore === maxScore) return 'technical';
        if (creativeScore === maxScore) return 'creative';
        return 'general';
    }

    /**
     * Build enhanced analysis context
     * @param {Object} requestData - Original request data
     * @param {Object} parsedCommand - Parsed command data
     * @returns {Object} Enhanced context for analysis
     */
    static buildAnalysisContext(requestData, parsedCommand) {
        const fullText = requestData.fullDocumentText || requestData.text || '';
        const paragraphs = requestData.paragraphs || [];
        
        return {
            // Command context
            analysisType: parsedCommand.analysisType,
            isAnalysisCommand: parsedCommand.isAnalysisCommand,
            focusAreas: parsedCommand.focusAreas,
            userGuidance: parsedCommand.userGuidance,
            
            // Document context
            documentType: this.detectDocumentType(fullText),
            documentLength: {
                paragraphs: paragraphs.length,
                words: fullText ? fullText.split(/\s+/).filter(w => w.length > 0).length : 0,
                characters: fullText.length
            },
            
            // Quality thresholds based on analysis type
            qualityThresholds: {
                minimumConfidence: parsedCommand.isAnalysisCommand ? 0.8 : 0.7,
                maxSuggestions: parsedCommand.isAnalysisCommand ? 10 : 15,
                severityLevels: ['low', 'medium', 'high', 'critical']
            },
            
            // Metadata
            metadata: {
                timestamp: new Date().toISOString(),
                requestId: this.generateRequestId(),
                originalCommand: parsedCommand.originalMessage
            }
        };
    }

    /**
     * Generate unique request ID for tracking
     * @returns {string} Unique request identifier
     */
    static generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// JSON request handler for GET endpoints
function handleJsonRequest(req, res) {
  // Set CORS headers for JSON requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse JSON route
  const jsonPath = req.url.substring(10); // Remove '/get_json/'

  switch (jsonPath) {
    case 'latestpadtables':
      handleLatestPadTables(res);
      break;
    default:
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'JSON endpoint not found' }));
  }
}

// API request handler
function handleApiRequest(req, res) {
  // Set CORS headers for API requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse API route
  const apiPath = req.url.substring(4); // Remove '/api'

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        handlePostRequest(apiPath, data, res);
      } catch (error) {
        console.error('❌ API Error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON data' }));
      }
    });
  } else if (req.method === 'GET') {
    handleGetRequest(apiPath, res);
  } else {
    // API endpoint not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

/**
 * Handle POST requests to different API endpoints
 * @param {string} apiPath - The API endpoint path
 * @param {Object} data - Request data
 * @param {Object} res - Response object
 */
function handlePostRequest(apiPath, data, res) {
  switch (apiPath) {
    case '/analyze-text':
      handleTextAnalysis(data, res);
      break;
    case '/suggest-improvements':
      handleTextSuggestions(data, res);
      break;
    case '/chat':
      handleChatMessage(data, res);
      break;
    case '/analyze-paragraphs':
      handleParagraphAnalysis(data, res);
      break;
    case '/generate-advanced-table':
      handleAdvancedTableGeneration(data, res);
      break;
    case '/convert-data-to-table':
      handleDataToTableConversion(data, res);
      break;
    default:
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

/**
 * Handle GET requests to different API endpoints
 * @param {string} apiPath - The API endpoint path
 * @param {Object} res - Response object
 */
function handleGetRequest(apiPath, res) {
  switch (apiPath) {
    case '/get_json/latestpadtables':
      handleLatestPadTables(res);
      break;
    default:
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'GET endpoint not found' }));
  }
}

/**
 * Handle request for latest PAD tables
 * @param {Object} res - Response object
 */
function handleLatestPadTables(res) {
  const tablePath = path.join(__dirname, 'pad', 'ALL_TABLES_RICH_FORMAT.json');
  
  console.log('📊 [LATEST PAD TABLES] Request for latest tables received');
  console.log('📁 Reading file:', tablePath);
  
  fs.readFile(tablePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error reading tables file:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Failed to read tables file',
        message: err.message 
      }));
      return;
    }

    try {
      // Parse and validate JSON
      const tablesData = JSON.parse(data);
      console.log('✅ Successfully loaded tables:', {
        totalTables: tablesData.tables ? tablesData.tables.length : 0,
        metadata: tablesData.metadata || 'No metadata'
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (parseError) {
      console.error('❌ Error parsing tables JSON:', parseError.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Invalid JSON in tables file',
        message: parseError.message 
      }));
    }
  });
}

/**
 * Handle text analysis requests with enhanced \analyse command support
 * @param {Object} data - Request data containing text and analysis parameters
 * @param {Object} res - Response object
 */
function handleTextAnalysis(data, res) {
  console.log('📊 [TEXT ANALYSIS] Enhanced request received:', {
    hasText: !!data.text,
    textLength: data.text?.length || 0,
    hasOptions: !!data.options,
    analysisType: data.analysisType || 'standard'
  });

  const { text = '', options = {}, analysisType = 'standard', focusAreas = [], userGuidance = '' } = data;
  
  if (!text) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Text is required',
      code: 'MISSING_TEXT'
    }));
    return;
  }

  // Parse analysis command if present in text
  const parsedCommand = AnalysisCommandParser.parseAnalyseCommand(text);
  
  // Build enhanced analysis context
  const analysisContext = AnalysisCommandParser.buildAnalysisContext({
    text,
    options,
    analysisType,
    focusAreas: focusAreas.length > 0 ? focusAreas : parsedCommand.focusAreas,
    userGuidance: userGuidance || parsedCommand.userGuidance
  }, parsedCommand);
  
  // Basic text metrics
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = text.length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  const analysis = {
    success: true,
    wordCount,
    characterCount,
    sentenceCount,
    paragraphCount,
    documentType: analysisContext.documentType,
    analysisType: analysisContext.analysisType,
    analysisContext: {
      isAnalysisCommand: analysisContext.isAnalysisCommand,
      focusAreas: analysisContext.focusAreas,
      userGuidance: analysisContext.userGuidance,
      documentType: analysisContext.documentType
    },
    readabilityMetrics: {
      averageWordsPerSentence: Math.round(wordCount / sentenceCount) || 0,
      averageSentencesPerParagraph: Math.round(sentenceCount / paragraphCount) || 0,
      readabilityScore: calculateReadabilityScore(text)
    },
    timestamp: new Date().toISOString(),
    preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    message: analysisContext.isAnalysisCommand 
      ? `✅ Analysis command processed! Focusing on: ${analysisContext.focusAreas.join(', ')}${analysisContext.userGuidance ? ` with guidance: "${analysisContext.userGuidance}"` : ''}`
      : '✅ Text analysis completed successfully!',
    metadata: analysisContext.metadata
  };

  console.log(`📊 [TEXT ANALYSIS] Enhanced analysis completed:`, {
    wordCount: analysis.wordCount,
    documentType: analysis.documentType,
    analysisType: analysis.analysisType,
    focusAreas: analysis.analysisContext.focusAreas.length,
    hasUserGuidance: !!analysis.analysisContext.userGuidance
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(analysis, null, 2));
}

/**
 * Handle text improvement suggestions with enhanced \analyse command support
 * @param {Object} data - Request data containing text, context, and analysis parameters
 * @param {Object} res - Response object
 */
function handleTextSuggestions(data, res) {
  console.log('💡 [TEXT SUGGESTIONS] Enhanced request received:', {
    hasText: !!data.text,
    textLength: data.text?.length || 0,
    hasContext: !!data.context,
    focusAreas: data.focusAreas || [],
    hasUserGuidance: !!data.userGuidance,
    analysisType: data.analysisType || 'standard'
  });

  const { 
    text = '', 
    context = '', 
    focusAreas = [], 
    userGuidance = '', 
    analysisType = 'standard' 
  } = data;
  
  if (!text) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Text is required',
      code: 'MISSING_TEXT'
    }));
    return;
  }

  // Parse analysis command if present
  const parsedCommand = AnalysisCommandParser.parseAnalyseCommand(text);
  
  // Build enhanced analysis context
  const analysisContext = AnalysisCommandParser.buildAnalysisContext({
    text,
    context,
    analysisType,
    focusAreas: focusAreas.length > 0 ? focusAreas : parsedCommand.focusAreas,
    userGuidance: userGuidance || parsedCommand.userGuidance
  }, parsedCommand);

  // Generate focused suggestions based on analysis context
  const suggestions = generateTextSuggestions(text, analysisContext);
  
  const response = {
    success: true,
    originalText: text,
    analysisContext: {
      focusAreas: analysisContext.focusAreas,
      userGuidance: analysisContext.userGuidance,
      documentType: analysisContext.documentType,
      analysisType: analysisContext.analysisType,
      isAnalysisCommand: analysisContext.isAnalysisCommand
    },
    suggestions: suggestions,
    overallScore: calculateTextScore(text, suggestions),
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: analysisContext.metadata.requestId,
      suggestionCount: suggestions.length
    }
  };

  console.log(`💡 [TEXT SUGGESTIONS] Enhanced suggestions generated:`, {
    suggestionCount: suggestions.length,
    analysisType: analysisContext.analysisType,
    focusAreas: analysisContext.focusAreas.length,
    overallScore: response.overallScore
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response, null, 2));
}

/**
 * Generate text suggestions based on analysis context
 * @param {string} text - Text to analyze
 * @param {Object} analysisContext - Analysis context with focus areas and guidance
 * @returns {Array} Array of suggestion objects
 */
function generateTextSuggestions(text, analysisContext) {
  const suggestions = [];
  const { focusAreas, userGuidance, documentType } = analysisContext;
  
  // Generate suggestions based on focus areas
  for (const focusArea of focusAreas) {
    const suggestion = generateTextFocusAreaSuggestion(text, focusArea, userGuidance, documentType);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }
  
  // If no focus areas, generate general suggestions
  if (focusAreas.length === 0) {
    const generalSuggestions = generateGeneralTextSuggestions(text, documentType);
    suggestions.push(...generalSuggestions);
  }
  
  return suggestions.slice(0, 5); // Limit to top 5 suggestions
}

/**
 * Generate focus area specific text suggestions
 * @param {string} text - Text to analyze
 * @param {string} focusArea - Focus area
 * @param {string} userGuidance - User guidance
 * @param {string} documentType - Document type
 * @returns {Object|null} Suggestion object
 */
function generateTextFocusAreaSuggestion(text, focusArea, userGuidance, documentType) {
  const requestId = AnalysisCommandParser.generateRequestId();
  
  switch (focusArea) {
    case 'grammar':
      if (text.toLowerCase().includes('is being') || text.toLowerCase().includes('was being')) {
        return {
          id: `text_grammar_${requestId}`,
          type: 'grammar',
          suggestion: 'Consider using active voice instead of passive voice for stronger, more direct writing.',
          reason: `Passive voice detected. ${userGuidance ? `User guidance: "${userGuidance}"` : 'Active voice is generally more engaging.'}`,
          confidence: 0.85,
          severity: 'medium',
          focusArea: focusArea
        };
      }
      break;
      
    case 'style':
      if (userGuidance.toLowerCase().includes('professional')) {
        const informalWords = ['really', 'pretty', 'kinda', 'sorta', 'gonna', 'wanna'];
        const hasInformalWords = informalWords.some(word => text.toLowerCase().includes(word));
        if (hasInformalWords) {
          return {
            id: `text_style_${requestId}`,
            type: 'style',
            suggestion: 'Replace informal language with more professional alternatives to match the desired tone.',
            reason: `Informal language detected. User guidance: "${userGuidance}"`,
            confidence: 0.9,
            severity: 'medium',
            focusArea: focusArea
          };
        }
      }
      break;
      
    case 'clarity':
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentenceLength = text.length / sentences.length;
      if (avgSentenceLength > 100) {
        return {
          id: `text_clarity_${requestId}`,
          type: 'clarity',
          suggestion: 'Break long sentences into shorter ones to improve readability and comprehension.',
          reason: `Average sentence length is ${Math.round(avgSentenceLength)} characters. ${userGuidance ? `User guidance: "${userGuidance}"` : 'Shorter sentences are easier to follow.'}`,
          confidence: 0.85,
          severity: 'medium',
          focusArea: focusArea
        };
      }
      break;
      
    case 'tone':
      if (documentType === 'business' && (text.includes('awesome') || text.includes('cool') || text.includes('hey'))) {
        return {
          id: `text_tone_${requestId}`,
          type: 'tone',
          suggestion: 'Use more formal language appropriate for business communication.',
          reason: `Casual language detected in business context. ${userGuidance ? `User guidance: "${userGuidance}"` : 'Professional tone is more suitable.'}`,
          confidence: 0.9,
          severity: 'high',
          focusArea: focusArea
        };
      }
      break;
  }
  
  return null;
}

/**
 * Generate general text suggestions when no focus areas specified
 * @param {string} text - Text to analyze
 * @param {string} documentType - Document type
 * @returns {Array} Array of suggestion objects
 */
function generateGeneralTextSuggestions(text, documentType) {
  const suggestions = [];
  const requestId = AnalysisCommandParser.generateRequestId();
  
  // Check for common issues
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 50) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = text.length / sentences.length;
    
    if (avgSentenceLength > 120) {
      suggestions.push({
        id: `text_general_${requestId}_1`,
        type: 'clarity',
        suggestion: 'Consider breaking long sentences for better readability.',
        reason: 'Text contains very long sentences that may be difficult to follow.',
        confidence: 0.8,
        severity: 'medium',
        focusArea: 'clarity'
      });
    }
  }
  
  // Check for word repetition
  const wordCount = {};
  words.forEach(word => {
    const normalizedWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (normalizedWord.length > 4) {
      wordCount[normalizedWord] = (wordCount[normalizedWord] || 0) + 1;
    }
  });
  
  const repetitiveWords = Object.entries(wordCount).filter(([word, count]) => count > 3);
  if (repetitiveWords.length > 0) {
    suggestions.push({
      id: `text_general_${requestId}_2`,
      type: 'style',
      suggestion: `Consider using synonyms for repeated words: ${repetitiveWords.map(([word]) => word).slice(0, 3).join(', ')}`,
      reason: 'Text contains repetitive word usage that could benefit from variety.',
      confidence: 0.75,
      severity: 'low',
      focusArea: 'style'
    });
  }
  
  return suggestions;
}

/**
 * Calculate overall text score based on suggestions
 * @param {string} text - Original text
 * @param {Array} suggestions - Array of suggestions
 * @returns {number} Score from 0-100
 */
function calculateTextScore(text, suggestions) {
  const baseScore = 100;
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  if (wordCount === 0) return 100;
  
  // Reduce score based on suggestion severity
  const penalty = suggestions.reduce((total, suggestion) => {
    switch (suggestion.severity) {
      case 'critical': return total + 15;
      case 'high': return total + 10;
      case 'medium': return total + 5;
      case 'low': return total + 2;
      default: return total;
    }
  }, 0);
  
  return Math.max(60, baseScore - penalty);
}

/**
 * Handle chat messages with enhanced \analyse command support
 * @param {Object} data - Request data containing message and history
 * @param {Object} res - Response object
 */
function handleChatMessage(data, res) {
  const { message, history, fullDocumentText = '' } = data;
  
  console.log('💬 [CHAT] Enhanced request received:', {
    messageLength: message?.length || 0,
    hasHistory: !!(history && history.length > 0),
    hasFullDocumentText: !!fullDocumentText,
    messagePreview: message ? message.substring(0, 50) + '...' : 'No message'
  });
  
  // Parse for analysis command
  const parsedCommand = AnalysisCommandParser.parseAnalyseCommand(message);
  
  let response;
  let responseType = 'chat';
  
  if (parsedCommand.isAnalysisCommand) {
    // Handle analysis command
    console.log('🔍 [CHAT] Analysis command detected:', {
      focusAreas: parsedCommand.focusAreas,
      hasUserGuidance: !!parsedCommand.userGuidance,
      originalCommand: parsedCommand.commandContent
    });
    
    response = `🤖 **Analysis Command Received!**\n\n`;
    response += `📋 **Focus Areas:** ${parsedCommand.focusAreas.join(', ')}\n`;
    
    if (parsedCommand.userGuidance) {
      response += `💬 **User Guidance:** "${parsedCommand.userGuidance}"\n`;
    }
    
    response += `\n🔄 **Processing your document analysis...**\n`;
    response += `I'll analyze your document focusing on ${parsedCommand.focusAreas.join(', ')}`;
    
    if (parsedCommand.userGuidance) {
      response += ` with your specific guidance: "${parsedCommand.userGuidance}"`;
    }
    
    response += `.\n\n✨ Please use the "Analyze Paragraphs" button or wait for the analysis to complete.`;
    
    responseType = 'analysis_command';
  } else {
    // Handle regular chat
    response = generateEnhancedChatResponse(message, history, fullDocumentText);
    responseType = 'chat';
  }

  const chatResponse = {
    message: response,
    timestamp: new Date().toISOString(),
    type: 'assistant',
    responseType: responseType,
    analysisTriggered: parsedCommand.isAnalysisCommand,
    contextData: {
      hasDocumentContext: !!fullDocumentText,
      documentWordCount: fullDocumentText ? fullDocumentText.split(/\s+/).filter(w => w.length > 0).length : 0,
      isAnalysisCommand: parsedCommand.isAnalysisCommand,
      focusAreas: parsedCommand.focusAreas,
      userGuidance: parsedCommand.userGuidance
    }
  };

  console.log(`💬 [CHAT] Response prepared:`, {
    responseType,
    analysisTriggered: parsedCommand.isAnalysisCommand,
    responseLength: response.length
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(chatResponse));
}

/**
 * Generate enhanced chat responses with document context awareness
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @param {string} fullDocumentText - Full document text for context
 * @returns {string} AI response
 */
function generateEnhancedChatResponse(message, history, fullDocumentText) {
  const lowerMessage = message.toLowerCase();
  const hasDocumentContext = !!(fullDocumentText && fullDocumentText.trim());
  const documentLength = hasDocumentContext ? fullDocumentText.split(/\s+/).filter(w => w.length > 0).length : 0;
  
  // Document-aware responses
  if (hasDocumentContext) {
    if (lowerMessage.includes('analyze') || lowerMessage.includes('check') || lowerMessage.includes('review')) {
      return `📄 **I can see your document** (${documentLength} words)!\n\n` +
             `I can analyze it for:\n` +
             `• **Grammar** - Check for grammatical errors and improvements\n` +
             `• **Style** - Enhance writing style and tone\n` +
             `• **Clarity** - Improve readability and understanding\n` +
             `• **Structure** - Organize content more effectively\n` +
             `• **Flow** - Enhance transitions and connections\n` +
             `• **Tone** - Adjust voice for your audience\n\n` +
             `💡 **Try using:** \`\\analyse grammar style "make it more professional"\`\n` +
             `Or click "Analyze Paragraphs" to get started!`;
    }
    
    if (lowerMessage.includes('improve') || lowerMessage.includes('better') || lowerMessage.includes('enhance')) {
      return `✨ **I can help improve your ${documentLength}-word document!**\n\n` +
             `Here are some ways I can help:\n` +
             `• **Focused Analysis** - Use \`\\analyse [focus_area] "your guidance"\`\n` +
             `• **Quick Review** - Use the "Analyze Paragraphs" button\n` +
             `• **Specific Help** - Tell me what aspect you want to improve\n\n` +
             `🎯 **Examples:**\n` +
             `\`\\analyse clarity "make it easier to understand"\`\n` +
             `\`\\analyse grammar style "professional business tone"\``;
    }
    
    if (lowerMessage.includes('grammar') || lowerMessage.includes('spelling')) {
      return `✏️ **I can check your document's grammar!**\n\n` +
             `Your document has ${documentLength} words. I can:\n` +
             `• Check for grammatical errors\n` +
             `• Fix sentence structure issues\n` +
             `• Improve punctuation\n` +
             `• Enhance verb tense consistency\n\n` +
             `🚀 **Try:** \`\\analyse grammar "focus on verb tenses"\``;
    }
    
    if (lowerMessage.includes('professional') || lowerMessage.includes('formal')) {
      return `👔 **I can make your document more professional!**\n\n` +
             `For your ${documentLength}-word document, I can:\n` +
             `• Replace casual language with formal alternatives\n` +
             `• Improve professional tone\n` +
             `• Enhance business writing style\n` +
             `• Strengthen formal structure\n\n` +
             `📝 **Try:** \`\\analyse style tone "make it sound more professional"\``;
    }
  }
  
  // General responses when no document context
  if (lowerMessage.includes('analyze') || lowerMessage.includes('check')) {
    return "📝 **I'm ready to analyze your document!**\n\n" +
           "Once you have content in your Word document, I can help with:\n" +
           "• Grammar and spelling checks\n" +
           "• Style and tone improvements\n" +
           "• Clarity and readability enhancements\n" +
           "• Structure and flow optimization\n\n" +
           "💡 **Tip:** Use `\\analyse [focus] \"your guidance\"` for targeted analysis!";
  }
  
  if (lowerMessage.includes('improve') || lowerMessage.includes('better')) {
    return "🚀 **I'm here to help improve your writing!**\n\n" +
           "I can provide specific suggestions for:\n" +
           "• **Grammar** - Fix errors and improve correctness\n" +
           "• **Style** - Enhance tone and voice\n" +
           "• **Clarity** - Make your message clearer\n" +
           "• **Structure** - Organize content better\n\n" +
           "Just use the paragraph analysis feature to get started!";
  }
  
  if (lowerMessage.includes('grammar') || lowerMessage.includes('spelling')) {
    return "✏️ **Grammar and spelling are my specialties!**\n\n" +
           "I can help with:\n" +
           "• Verb tense consistency\n" +
           "• Subject-verb agreement\n" +
           "• Punctuation accuracy\n" +
           "• Sentence structure\n" +
           "• Common spelling errors\n\n" +
           "Use `\\analyse grammar \"your specific needs\"` for focused help!";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "👋 **Hello! I'm your AI writing assistant.**\n\n" +
           "I can help you:\n" +
           "• **Analyze** your documents for improvements\n" +
           "• **Suggest** specific enhancements\n" +
           "• **Focus** on particular writing aspects\n" +
           "• **Guide** you through the writing process\n\n" +
           "✨ **Quick start:** Try typing `\\analyse clarity` or use the Analyze Paragraphs button!";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return "🤔 **I'm here to help with your writing!**\n\n" +
           "**Available commands:**\n" +
           "• `\\analyse [focus] \"guidance\"` - Targeted analysis\n" +
           "• **Analyze Paragraphs** button - Quick review\n\n" +
           "**Focus areas:** grammar, style, clarity, structure, flow, tone\n\n" +
           "**Examples:**\n" +
           "• `\\analyse grammar \"check verb tenses\"`\n" +
           "• `\\analyse style clarity \"make it professional\"`\n\n" +
           "What would you like help with?";
  }
  
  // Default contextual response
  if (hasDocumentContext) {
    return `💡 **I understand your question about the document.**\n\n` +
           `I have access to your ${documentLength}-word document and can provide relevant assistance.\n\n` +
           `**What I can do:**\n` +
           `• Analyze specific aspects of your writing\n` +
           `• Provide targeted suggestions\n` +
           `• Help with grammar, style, clarity, and more\n\n` +
           `**Try:** \`\\analyse [focus_area] "your specific needs"\``;
  } else {
    return "🤖 **I'm ready to help with your writing!**\n\n" +
           "I can analyze documents, suggest improvements, and provide writing assistance.\n\n" +
           "Once you have content in Word, try:\n" +
           "• `\\analyse grammar` for grammar check\n" +
           "• `\\analyse style \"make it professional\"` for style help\n" +
           "• Use the Analyze Paragraphs button for quick review\n\n" +
           "What would you like to work on?";
  }
}

/**
 * Handle paragraph analysis requests with enhanced \analyse command support
 * @param {Object} data - Request data containing paragraphs and analysis parameters
 * @param {Object} res - Response object
 */
function handleParagraphAnalysis(data, res) {
  console.log('📄 [PARAGRAPH ANALYSIS] Enhanced request received:', {
    paragraphCount: data.paragraphs?.length || 0,
    hasFullDocumentText: !!data.fullDocumentText,
    focusAreas: data.focusAreas || [],
    hasUserGuidance: !!data.userGuidance,
    analysisType: data.analysisType || 'standard',
    systemMessage: data.systemMessage ? 'Present' : 'None'
  });

  // 🔍 DEBUG: Check paragraph structure being received
  console.log('🔍 [DEBUG] Received paragraphs details:');
  if (data.paragraphs && Array.isArray(data.paragraphs)) {
    data.paragraphs.forEach((paragraph, i) => {
      console.log(`   Paragraph ${i}:`, {
        originalIndex: paragraph.originalIndex,
        filteredIndex: paragraph.filteredIndex,
        index: paragraph.index,
        textLength: paragraph.text?.length || 0,
        textPreview: paragraph.text?.substring(0, 50) + '...' || 'No text'
      });
    });
  }

  const { 
    paragraphs, 
    fullDocumentText = '',
    focusAreas = [], 
    userGuidance = '',
    analysisType = 'standard',
    systemMessage = ''
  } = data;
  
  if (!paragraphs || !Array.isArray(paragraphs)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Paragraphs array is required',
      code: 'MISSING_PARAGRAPHS'
    }));
    return;
  }

  // Parse analysis command if present in system message
  let parsedCommand = { isAnalysisCommand: false, analysisType: 'natural', focusAreas: [], userGuidance: '' };
  if (systemMessage && systemMessage.includes('\\analyse')) {
    parsedCommand = AnalysisCommandParser.parseAnalyseCommand(systemMessage);
  }

  // Use explicit parameters if provided, otherwise use parsed command data
  const finalFocusAreas = focusAreas.length > 0 ? focusAreas : parsedCommand.focusAreas;
  const finalUserGuidance = userGuidance || parsedCommand.userGuidance;
  const finalAnalysisType = analysisType !== 'standard' ? analysisType : 
    (finalFocusAreas.length > 0 || finalUserGuidance) ? 'command' : 'natural';

  // Build enhanced analysis context
  const analysisContext = AnalysisCommandParser.buildAnalysisContext({
    paragraphs,
    fullDocumentText,
    focusAreas: finalFocusAreas,
    userGuidance: finalUserGuidance,
    analysisType: finalAnalysisType
  }, {
    isAnalysisCommand: finalAnalysisType === 'command',
    analysisType: finalAnalysisType,
    focusAreas: finalFocusAreas,
    userGuidance: finalUserGuidance
  });

  console.log('🔍 [ENHANCED CONTEXT] Built analysis context:', {
    documentType: analysisContext.documentType,
    analysisType: analysisContext.analysisType,
    focusAreas: analysisContext.focusAreas,
    hasUserGuidance: !!analysisContext.userGuidance,
    documentWordCount: analysisContext.documentLength.words,
    qualityThresholds: analysisContext.qualityThresholds
  });

  // Generate enhanced suggestions based on analysis context
  const suggestions = generateEnhancedParagraphSuggestions(paragraphs, analysisContext);

  // 🔍 DEBUG: Check generated suggestions
  console.log('🔍 [DEBUG] Generated suggestions:');
  suggestions.forEach((suggestion, i) => {
    console.log(`   Suggestion ${i}:`, {
      paragraphIndex: suggestion.paragraphIndex,
      type: suggestion.type,
      confidence: suggestion.confidence,
      originalTextPreview: suggestion.originalText?.substring(0, 50) + '...' || 'No text'
    });
  });

  // Build comprehensive analysis response
  const analysis = {
    success: true,
    totalParagraphs: paragraphs.length,
    documentTheme: analysisContext.documentType,
    analysisType: analysisContext.analysisType,
    overallScore: calculateOverallScore(paragraphs, suggestions),
    suggestions: suggestions,
    documentMetrics: {
      averageWordsPerParagraph: Math.round(analysisContext.documentLength.words / paragraphs.length) || 0,
      readabilityScore: calculateReadabilityScore(fullDocumentText),
      consistencyScore: calculateConsistencyScore(paragraphs)
    },
    analysisContext: {
      focusAreas: analysisContext.focusAreas,
      userGuidance: analysisContext.userGuidance,
      documentType: analysisContext.documentType,
      isAnalysisCommand: analysisContext.isAnalysisCommand
    },
    metadata: analysisContext.metadata,
    timestamp: new Date().toISOString()
  };

  console.log(`✅ [PARAGRAPH ANALYSIS] Enhanced analysis completed:`, {
    suggestionsGenerated: analysis.suggestions.length,
    overallScore: analysis.overallScore,
    documentType: analysis.documentTheme,
    analysisType: analysis.analysisType
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(analysis, null, 2));
}

/**
 * Generate simple chat responses (placeholder for Ollama integration)
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @returns {string} AI response
 */
function generateChatResponse(message, history) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('analyze') || lowerMessage.includes('check')) {
    return "I can analyze your document! Click the 'Analyze Paragraphs' button to get detailed suggestions for improvement.";
  }
  
  if (lowerMessage.includes('improve') || lowerMessage.includes('better')) {
    return "I'd be happy to help improve your writing! Let me analyze your paragraphs and I'll provide specific suggestions.";
  }
  
  if (lowerMessage.includes('grammar') || lowerMessage.includes('spelling')) {
    return "I can help with grammar and spelling! Use the paragraph analysis feature to get detailed feedback on each section.";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI writing assistant. I can help analyze your document and suggest improvements. What would you like me to help you with?";
  }
  
  return "I understand you're asking about your document. I can help with analysis, suggestions, and improvements. Try the 'Analyze Paragraphs' feature to get started!";
}

/**
 * Generate enhanced suggestions for paragraphs based on analysis context
 * @param {Array} paragraphs - Array of paragraph objects
 * @param {Object} analysisContext - Enhanced analysis context
 * @returns {Array} Array of suggestion objects
 */
function generateEnhancedParagraphSuggestions(paragraphs, analysisContext) {
  const suggestions = [];
  const { focusAreas, userGuidance, qualityThresholds, documentType } = analysisContext;

  console.log('🔍 [SUGGESTION GENERATION] Starting with:', {
    paragraphCount: paragraphs.length,
    focusAreas,
    userGuidance,
    documentType
  });

  paragraphs.forEach((paragraph, index) => {
    const text = paragraph.text || '';
    
    console.log(`🔍 [PROCESSING] Paragraph ${index}:`, {
      arrayIndex: index,
      originalIndex: paragraph.originalIndex,
      filteredIndex: paragraph.filteredIndex,
      indexProperty: paragraph.index,
      textLength: text.length,
      textPreview: text.substring(0, 100) + '...'
    });
    
    // Skip very short paragraphs
    if (text.length < 20) {
      console.log(`   ⏭️ Skipping paragraph ${index} - too short (${text.length} chars)`);
      return;
    }

    // Generate focus area specific suggestions
    for (const focusArea of focusAreas) {
      console.log(`   🎯 Checking focus area: ${focusArea}`);
      const suggestion = generateFocusAreaSuggestion(paragraph, index, focusArea, userGuidance, documentType);
      if (suggestion && suggestion.confidence >= qualityThresholds.minimumConfidence) {
        console.log(`   ✅ Generated suggestion for paragraph ${index}, focus: ${focusArea}, confidence: ${suggestion.confidence}, paragraphIndex: ${suggestion.paragraphIndex}`);
        suggestions.push(suggestion);
      } else if (suggestion) {
        console.log(`   ❌ Suggestion for paragraph ${index} rejected - low confidence: ${suggestion.confidence}`);
      } else {
        console.log(`   ❌ No suggestion generated for paragraph ${index}, focus: ${focusArea}`);
      }
    }

    // If no focus areas, generate general suggestions
    if (focusAreas.length === 0) {
      console.log(`   🔄 No focus areas - generating general suggestion`);
      const generalSuggestion = generateGeneralSuggestion(paragraph, index, documentType);
      if (generalSuggestion) {
        console.log(`   ✅ Generated general suggestion for paragraph ${index}, paragraphIndex: ${generalSuggestion.paragraphIndex}`);
        suggestions.push(generalSuggestion);
      } else {
        console.log(`   ❌ No general suggestion for paragraph ${index}`);
      }
    }
  });

  // Limit suggestions based on quality thresholds
  const finalSuggestions = suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, qualityThresholds.maxSuggestions);

  console.log('🔍 [SUGGESTION GENERATION] Completed:', {
    totalGenerated: suggestions.length,
    finalCount: finalSuggestions.length,
    qualityThreshold: qualityThresholds.minimumConfidence,
    maxSuggestions: qualityThresholds.maxSuggestions,
    finalParagraphIndexes: finalSuggestions.map(s => s.paragraphIndex)
  });

  return finalSuggestions;
}

/**
 * Generate focus area specific suggestions
 * @param {Object} paragraph - Paragraph object
 * @param {number} index - Paragraph index
 * @param {string} focusArea - Focus area (grammar, style, clarity, etc.)
 * @param {string} userGuidance - User guidance text
 * @param {string} documentType - Document type
 * @returns {Object|null} Suggestion object or null
 */
function generateFocusAreaSuggestion(paragraph, index, focusArea, userGuidance, documentType) {
  const text = paragraph.text || '';
  const requestId = AnalysisCommandParser.generateRequestId();

  switch (focusArea) {
    case 'grammar':
      return generateGrammarSuggestion(paragraph, index, userGuidance, documentType, requestId);
    case 'style':
      return generateStyleSuggestion(paragraph, index, userGuidance, documentType, requestId);
    case 'clarity':
      return generateClaritySuggestion(paragraph, index, userGuidance, documentType, requestId);
    case 'structure':
      return generateStructureSuggestion(paragraph, index, userGuidance, documentType, requestId);
    case 'flow':
      return generateFlowSuggestion(paragraph, index, userGuidance, documentType, requestId);
    case 'tone':
      return generateToneSuggestion(paragraph, index, userGuidance, documentType, requestId);
    default:
      return null;
  }
}

/**
 * Generate grammar-focused suggestions
 * @param {Object} paragraph - Paragraph object
 * @param {number} index - Paragraph index
 * @param {string} userGuidance - User guidance
 * @param {string} documentType - Document type
 * @param {string} requestId - Request ID
 * @returns {Object|null} Grammar suggestion
 */
function generateGrammarSuggestion(paragraph, index, userGuidance, documentType, requestId) {
  const text = paragraph.text || '';
  
  // Check for passive voice
  const passiveIndicators = ['is being', 'was being', 'been', 'being'];
  const hasPassiveVoice = passiveIndicators.some(indicator => text.toLowerCase().includes(indicator));
  
  if (hasPassiveVoice) {
    return {
      id: `grammar_${requestId}_${index}`,
      paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
      originalText: text,
      suggestedText: text + " [Consider using active voice for stronger, clearer writing.]",
      type: 'grammar',
      reason: `Found passive voice construction. ${userGuidance ? `User guidance: "${userGuidance}"` : 'Active voice is generally more engaging.'}`,
      confidence: 0.85,
      severity: 'medium',
      contextualNote: `Grammar improvement for ${documentType} document`
    };
  }

  // Check for sentence length issues
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = text.length / sentences.length;
  
  if (avgSentenceLength > 150) {
    return {
      id: `grammar_${requestId}_${index}`,
      paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
      originalText: text,
      suggestedText: text + " [Consider breaking long sentences into shorter ones for better readability.]",
      type: 'grammar',
      reason: `Contains very long sentences (avg: ${Math.round(avgSentenceLength)} characters). ${userGuidance ? `User guidance: "${userGuidance}"` : 'Shorter sentences improve clarity.'}`,
      confidence: 0.9,
      severity: 'high',
      contextualNote: `Sentence structure improvement for ${documentType} document`
    };
  }

  return null;
}

/**
 * Generate style-focused suggestions
 * @param {Object} paragraph - Paragraph object
 * @param {number} index - Paragraph index
 * @param {string} userGuidance - User guidance
 * @param {string} documentType - Document type
 * @param {string} requestId - Request ID
 * @returns {Object|null} Style suggestion
 */
function generateStyleSuggestion(paragraph, index, userGuidance, documentType, requestId) {
  const text = paragraph.text || '';
  
  // Check for professional tone if guidance mentions professionalism
  if (userGuidance.toLowerCase().includes('professional')) {
    const informalWords = ['really', 'pretty', 'kinda', 'sorta', 'gonna', 'wanna'];
    const hasInformalWords = informalWords.some(word => text.toLowerCase().includes(word));
    
    if (hasInformalWords) {
      return {
        id: `style_${requestId}_${index}`,
        paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
        originalText: text,
        suggestedText: text + " [Replace informal language with more professional alternatives.]",
        type: 'style',
        reason: `Contains informal language. User guidance: "${userGuidance}"`,
        confidence: 0.9,
        severity: 'medium',
        contextualNote: `Professional tone enhancement for ${documentType} document`
      };
    }
  }

  // Check for word repetition
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  const repetitiveWords = Object.entries(wordCount).filter(([word, count]) => count > 2);
  if (repetitiveWords.length > 0) {
    return {
      id: `style_${requestId}_${index}`,
      paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
      originalText: text,
      suggestedText: text + ` [Consider using synonyms for repeated words: ${repetitiveWords.map(([word]) => word).join(', ')}]`,
      type: 'style',
      reason: `Word repetition detected. ${userGuidance ? `User guidance: "${userGuidance}"` : 'Varied vocabulary improves readability.'}`,
      confidence: 0.8,
      severity: 'low',
      contextualNote: `Vocabulary variety improvement for ${documentType} document`
    };
  }

  return null;
}

/**
 * Generate clarity-focused suggestions
 * @param {Object} paragraph - Paragraph object
 * @param {number} index - Paragraph index
 * @param {string} userGuidance - User guidance
 * @param {string} documentType - Document type
 * @param {string} requestId - Request ID
 * @returns {Object|null} Clarity suggestion
 */
function generateClaritySuggestion(paragraph, index, userGuidance, documentType, requestId) {
  const text = paragraph.text || '';
  
  // Check for complex jargon or technical terms
  const complexWords = ['utilize', 'facilitate', 'implement', 'subsequent', 'aforementioned'];
  const hasComplexWords = complexWords.some(word => text.toLowerCase().includes(word));
  
  if (hasComplexWords) {
    return {
      id: `clarity_${requestId}_${index}`,
      paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
      originalText: text,
      suggestedText: text + " [Consider using simpler alternatives for complex words to improve clarity.]",
      type: 'clarity',
      reason: `Contains complex terminology that could be simplified. ${userGuidance ? `User guidance: "${userGuidance}"` : 'Simpler language improves understanding.'}`,
      confidence: 0.85,
      severity: 'medium',
      contextualNote: `Clarity enhancement for ${documentType} document`
    };
  }

  // Check for unclear pronoun references
  const pronouns = ['it', 'this', 'that', 'they', 'them'];
  const pronounCount = pronouns.reduce((count, pronoun) => {
    return count + (text.toLowerCase().split(' ').filter(word => word === pronoun).length);
  }, 0);
  
  if (pronounCount > 3) {
    return {
      id: `clarity_${requestId}_${index}`,
      paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
      originalText: text,
      suggestedText: text + " [Consider clarifying pronoun references for better understanding.]",
      type: 'clarity',
      reason: `High pronoun usage may create unclear references. ${userGuidance ? `User guidance: "${userGuidance}"` : 'Specific nouns improve clarity.'}`,
      confidence: 0.75,
      severity: 'medium',
      contextualNote: `Reference clarity improvement for ${documentType} document`
    };
  }

  return null;
}

/**
 * Generate structure-focused suggestions
 * @param {Object} paragraph - Paragraph object
 * @param {number} index - Paragraph index
 * @param {string} userGuidance - User guidance
 * @param {string} documentType - Document type
 * @param {string} requestId - Request ID
 * @returns {Object|null} Structure suggestion
 */
function generateStructureSuggestion(paragraph, index, userGuidance, documentType, requestId) {
  const text = paragraph.text || '';
  
  // Check paragraph length
  if (text.length > 500) {
    return {
      id: `structure_${requestId}_${index}`,
      paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
      originalText: text,
      suggestedText: text + " [Consider breaking this long paragraph into smaller, focused paragraphs.]",
      type: 'structure',
      reason: `Paragraph is quite long (${text.length} characters). ${userGuidance ? `User guidance: "${userGuidance}"` : 'Shorter paragraphs improve readability.'}`,
      confidence: 0.9,
      severity: 'medium',
      contextualNote: `Paragraph structure improvement for ${documentType} document`
    };
  }

  // Check for topic coherence
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 6) {
    return {
      id: `structure_${requestId}_${index}`,
      paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
      originalText: text,
      suggestedText: text + " [Consider organizing ideas into separate paragraphs for better structure.]",
      type: 'structure',
      reason: `Contains many sentences (${sentences.length}). ${userGuidance ? `User guidance: "${userGuidance}"` : 'Focused paragraphs improve organization.'}`,
      confidence: 0.8,
      severity: 'low',
      contextualNote: `Organizational structure improvement for ${documentType} document`
    };
  }

  return null;
}

/**
 * Generate flow-focused suggestions
 * @param {Object} paragraph - Paragraph object
 * @param {number} index - Paragraph index
 * @param {string} userGuidance - User guidance
 * @param {string} documentType - Document type
 * @param {string} requestId - Request ID
 * @returns {Object|null} Flow suggestion
 */
function generateFlowSuggestion(paragraph, index, userGuidance, documentType, requestId) {
  const text = paragraph.text || '';
  
  // Check for transition words
  const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'consequently', 'additionally'];
  const hasTransitions = transitionWords.some(word => text.toLowerCase().includes(word));
  
  if (!hasTransitions && text.length > 100) {
    return {
      id: `flow_${requestId}_${index}`,
      paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
      originalText: text,
      suggestedText: text + " [Consider adding transition words to improve flow between ideas.]",
      type: 'flow',
      reason: `Lacks transition words for smooth flow. ${userGuidance ? `User guidance: "${userGuidance}"` : 'Transitions connect ideas effectively.'}`,
      confidence: 0.7,
      severity: 'low',
      contextualNote: `Flow enhancement for ${documentType} document`
    };
  }

  return null;
}

/**
 * Generate tone-focused suggestions
 * @param {Object} paragraph - Paragraph object
 * @param {number} index - Paragraph index
 * @param {string} userGuidance - User guidance
 * @param {string} documentType - Document type
 * @param {string} requestId - Request ID
 * @returns {Object|null} Tone suggestion
 */
function generateToneSuggestion(paragraph, index, userGuidance, documentType, requestId) {
  const text = paragraph.text || '';
  
  // Check tone consistency based on document type
  if (documentType === 'business') {
    const casualWords = ['hey', 'guys', 'cool', 'awesome', 'tons', 'lots'];
    const hasCasualWords = casualWords.some(word => text.toLowerCase().includes(word));
    
    if (hasCasualWords) {
      return {
        id: `tone_${requestId}_${index}`,
        paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
        originalText: text,
        suggestedText: text + " [Consider using more formal language appropriate for business documents.]",
        type: 'tone',
        reason: `Contains casual language inappropriate for business context. ${userGuidance ? `User guidance: "${userGuidance}"` : 'Formal tone suits business documents.'}`,
        confidence: 0.9,
        severity: 'medium',
        contextualNote: `Tone consistency for ${documentType} document`
      };
    }
  }

  return null;
}

/**
 * Generate general suggestions when no focus areas specified
 * @param {Object} paragraph - Paragraph object
 * @param {number} index - Paragraph index
 * @param {string} documentType - Document type
 * @returns {Object|null} General suggestion
 */
function generateGeneralSuggestion(paragraph, index, documentType) {
  const text = paragraph.text || '';
  const requestId = AnalysisCommandParser.generateRequestId();
  
  // Check for most common issues
  const issues = [];
  
  // Check sentence length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = text.length / sentences.length;
  if (avgSentenceLength > 150) {
    issues.push('long sentences');
  }
  
  // Check word repetition
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  const repetitiveWords = Object.entries(wordCount).filter(([word, count]) => count > 2);
  if (repetitiveWords.length > 0) {
    issues.push('word repetition');
  }
  
  if (issues.length > 0) {
    return {
      id: `general_${requestId}_${index}`,
      paragraphIndex: paragraph.originalIndex !== undefined ? paragraph.originalIndex : index,
      originalText: text,
      suggestedText: text + ` [Consider improving: ${issues.join(', ')}]`,
      type: 'clarity',
      reason: `General improvements needed: ${issues.join(', ')}`,
      confidence: 0.75,
      severity: 'medium',
      contextualNote: `General improvement for ${documentType} document`
    };
  }

  return null;
}

/**
 * Calculate overall document score
 * @param {Array} paragraphs - Array of paragraphs
 * @param {Array} suggestions - Array of suggestions
 * @returns {number} Overall score (0-100)
 */
function calculateOverallScore(paragraphs, suggestions) {
  if (paragraphs.length === 0) return 100;
  
  const suggestionRatio = suggestions.length / paragraphs.length;
  const baseScore = 100 - (suggestionRatio * 30); // Reduce score based on suggestions
  
  // Adjust based on suggestion severity
  const severityPenalty = suggestions.reduce((penalty, suggestion) => {
    switch (suggestion.severity) {
      case 'critical': return penalty + 10;
      case 'high': return penalty + 5;
      case 'medium': return penalty + 2;
      case 'low': return penalty + 1;
      default: return penalty;
    }
  }, 0);
  
  return Math.max(60, Math.min(100, baseScore - severityPenalty));
}

/**
 * Calculate readability score
 * @param {string} text - Full document text
 * @returns {number} Readability score (0-100)
 */
function calculateReadabilityScore(text) {
  if (!text) return 100;
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordsPerSentence = words.length / sentences.length;
  
  // Simple readability score based on sentence length
  if (avgWordsPerSentence < 15) return 90;
  if (avgWordsPerSentence < 20) return 80;
  if (avgWordsPerSentence < 25) return 70;
  return 60;
}

/**
 * Calculate consistency score
 * @param {Array} paragraphs - Array of paragraphs
 * @returns {number} Consistency score (0-100)
 */
function calculateConsistencyScore(paragraphs) {
  if (paragraphs.length < 2) return 100;
  
  const paragraphLengths = paragraphs.map(p => (p.text || '').length);
  const avgLength = paragraphLengths.reduce((sum, len) => sum + len, 0) / paragraphLengths.length;
  const variance = paragraphLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / paragraphLengths.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation means better consistency
  const consistencyRatio = stdDev / avgLength;
  if (consistencyRatio < 0.3) return 95;
  if (consistencyRatio < 0.5) return 85;
  if (consistencyRatio < 0.7) return 75;
  return 65;
}

/**
 * Handle advanced table generation requests
 * @param {Object} data - Request data containing table specifications
 * @param {Object} res - Response object
 */
function handleAdvancedTableGeneration(data, res) {
  console.log('📊 [ADVANCED TABLE] Request received:', {
    hasTemplate: !!data.template,
    dataType: data.dataType || 'unknown',
    hasCustomData: !!data.customData,
    tableType: data.tableType || 'standard'
  });

  const { 
    template = 'malaysian_statistics',
    dataType = 'statistics',
    customData = null,
    tableType = 'advanced',
    metadata = {}
  } = data;

  try {
    let tableStructure;

    switch (template) {
      case 'malaysian_statistics':
        tableStructure = generateMalaysianStatisticsTable(customData, metadata);
        break;
      case 'government_report':
        tableStructure = generateGovernmentReportTable(customData, metadata);
        break;
      case 'financial_summary':
        tableStructure = generateFinancialSummaryTable(customData, metadata);
        break;
      case 'custom_complex':
        tableStructure = generateCustomComplexTable(customData, metadata);
        break;
      default:
        tableStructure = generateMalaysianStatisticsTable(customData, metadata);
    }

    const response = {
      success: true,
      tableStructure: tableStructure,
      template: template,
      renderingHint: 'Use insertAdvancedTable() method for optimal formatting',
      metadata: {
        generated: new Date().toISOString(),
        complexity: calculateTableComplexity(tableStructure),
        estimatedSize: estimateTableSize(tableStructure)
      }
    };

    console.log('📊 [ADVANCED TABLE] Generated successfully:', {
      template,
      complexity: response.metadata.complexity,
      headerLevels: tableStructure.structure?.headerLevels?.length || 0,
      dataRows: tableStructure.structure?.dataRows?.length || 0,
      summaryRows: tableStructure.structure?.summaryRows?.length || 0
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('📊 [ADVANCED TABLE] Generation error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Failed to generate advanced table',
      message: error.message 
    }));
  }
}

/**
 * Handle data-to-table conversion requests
 * @param {Object} data - Request data containing raw data to convert
 * @param {Object} res - Response object
 */
function handleDataToTableConversion(data, res) {
  console.log('🔄 [DATA CONVERSION] Request received:', {
    hasRawData: !!data.rawData,
    dataFormat: data.format || 'unknown',
    conversionType: data.conversionType || 'auto'
  });

  const { 
    rawData,
    format = 'auto',
    conversionType = 'auto_detect',
    targetStructure = 'advanced',
    metadata = {}
  } = data;

  try {
    if (!rawData) {
      throw new Error('Raw data is required for conversion');
    }

    let tableStructure;

    switch (format) {
      case 'csv':
        tableStructure = convertCSVToAdvancedTable(rawData, metadata);
        break;
      case 'json':
        tableStructure = convertJSONToAdvancedTable(rawData, metadata);
        break;
      case 'markdown':
        tableStructure = convertMarkdownToAdvancedTable(rawData, metadata);
        break;
      case 'excel_extract':
        tableStructure = convertExcelExtractToAdvancedTable(rawData, metadata);
        break;
      default:
        tableStructure = autoDetectAndConvert(rawData, metadata);
    }

    const response = {
      success: true,
      tableStructure: tableStructure,
      originalFormat: format,
      detectedStructure: analyzeDataStructure(rawData),
      conversionMetadata: {
        processed: new Date().toISOString(),
        sourceRows: countSourceRows(rawData),
        outputComplexity: calculateTableComplexity(tableStructure)
      }
    };

    console.log('🔄 [DATA CONVERSION] Completed successfully:', {
      format,
      sourceRows: response.conversionMetadata.sourceRows,
      outputComplexity: response.conversionMetadata.outputComplexity
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('🔄 [DATA CONVERSION] Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Failed to convert data to table',
      message: error.message 
    }));
  }
}

/**
 * Generate Malaysian statistics table structure
 * @param {Object} customData - Custom data for the table
 * @param {Object} metadata - Table metadata
 * @returns {Object} Advanced table structure
 */
function generateMalaysianStatisticsTable(customData, metadata) {
  const defaultData = customData || {
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

  return {
    id: generateAdvancedTableId(),
    title: defaultData.title,
    metadata: {
      source: metadata.source || "MCMC Malaysia",
      description: defaultData.description,
      dateRange: "2022-2025",
      lastUpdated: metadata.lastUpdated || "31 Julai 2025",
      category: "Government Statistics",
      ...metadata
    },
    structure: {
      headerLevels: [
        // Main headers
        {
          cells: [
            { text: "No.", rowspan: 2, alignment: "center" },
            { text: "Tahun", rowspan: 2, alignment: "center" },
            { text: "Penurunan Kandungan 3R", rowspan: 2, alignment: "center" },
            { text: "Jumlah Penurunan 3R", rowspan: 2, alignment: "center" },
            { text: "Jumlah keseluruhan elemen jelik", rowspan: 2, alignment: "center" },
            { text: "Col5", rowspan: 2, alignment: "center" },
            { text: "Col6", rowspan: 2, alignment: "center" }
          ]
        },
        // Sub headers
        {
          cells: [
            { text: "Agama", alignment: "center", style: "subheader" },
            { text: "Kaum", alignment: "center", style: "subheader" },
            { text: "Raja", alignment: "center", style: "subheader" },
            { text: "", alignment: "center" },
            { text: "", alignment: "center" },
            { text: "", alignment: "center" },
            { text: "", alignment: "center" }
          ]
        }
      ],
      dataRows: defaultData.data.map(row => ({
        cells: row.map((cell, index) => ({
          value: cell,
          displayText: cell,
          dataType: detectAdvancedDataType(cell),
          alignment: index === 0 || index === 1 ? "center" : "right"
        }))
      })),
      summaryRows: [
        {
          label: "Jumlah",
          cells: defaultData.totals.map((cell, index) => ({
            value: cell,
            displayText: cell,
            isCalculated: index > 0 && cell !== "",
            alignment: index === 0 ? "center" : "right",
            style: "summary"
          }))
        }
      ]
    },
    formatting: {
      headerStyle: {
        bold: true,
        backgroundColor: "#2F5597",
        textColor: "#FFFFFF",
        borderStyle: "solid",
        borderWidth: "2px"
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
        borderWidth: "3px"
      }
    },
    renderingStrategy: "html_insertion"
  };
}

/**
 * Convert Excel extract data to advanced table
 * @param {string} rawData - Raw markdown table data
 * @param {Object} metadata - Metadata for the table
 * @returns {Object} Advanced table structure
 */
function convertExcelExtractToAdvancedTable(rawData, metadata) {
  // Parse markdown table format from your Excel extract
  const lines = rawData.split('\n');
  const tableLines = [];
  let inTable = false;
  
  for (const line of lines) {
    if (line.includes('+--') || line.includes('|')) {
      if (line.includes('+--')) {
        inTable = !inTable;
        continue;
      }
      if (inTable && line.includes('|')) {
        tableLines.push(line);
      }
    }
  }
  
  // Extract table data
  const tableRows = tableLines
    .filter(line => !line.includes('==='))
    .map(line => {
      return line.split('|')
        .slice(1, -1) // Remove empty first and last elements
        .map(cell => cell.trim());
    });
  
  if (tableRows.length === 0) {
    throw new Error('No valid table data found in the input');
  }
  
  // Identify header and data rows
  const headerRow = tableRows[0];
  const dataRows = tableRows.slice(1);
  
  return {
    id: generateAdvancedTableId(),
    title: metadata.title || "Converted Table",
    metadata: {
      source: metadata.source || "Excel Extract",
      converted: new Date().toISOString(),
      originalFormat: "Markdown Table",
      ...metadata
    },
    structure: {
      headerLevels: [
        {
          cells: headerRow.map(cell => ({
            text: cell,
            alignment: "center",
            style: "header"
          }))
        }
      ],
      dataRows: dataRows.map(row => ({
        cells: row.map((cell, index) => ({
          value: cell,
          displayText: cell,
          dataType: detectAdvancedDataType(cell),
          alignment: detectAdvancedDataType(cell) === 'number' ? "right" : "left"
        }))
      })),
      summaryRows: []
    },
    formatting: {
      headerStyle: {
        bold: true,
        backgroundColor: "#4472C4",
        textColor: "#FFFFFF",
        borderStyle: "solid",
        borderWidth: "2px"
      },
      dataStyle: {
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        borderStyle: "solid",
        borderWidth: "1px"
      }
    },
    renderingStrategy: "html_insertion"
  };
}

// Helper functions for advanced tables
function generateAdvancedTableId() {
  return `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function detectAdvancedDataType(value) {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) return 'number';
    if (/^\d+\.\d+$/.test(value)) return 'decimal';
    if (/^\d{4}$/.test(value)) return 'year';
  }
  return 'text';
}

function calculateTableComplexity(tableStructure) {
  let complexity = 'simple';
  
  if (tableStructure.structure?.headerLevels?.length > 1) {
    complexity = 'complex';
  } else if (tableStructure.structure?.summaryRows?.length > 0) {
    complexity = 'moderate';
  }
  
  return complexity;
}

function estimateTableSize(tableStructure) {
  const headerRows = tableStructure.structure?.headerLevels?.length || 0;
  const dataRows = tableStructure.structure?.dataRows?.length || 0;
  const summaryRows = tableStructure.structure?.summaryRows?.length || 0;
  const columns = tableStructure.structure?.headerLevels?.[0]?.cells?.length || 0;
  
  return {
    totalRows: headerRows + dataRows + summaryRows,
    totalColumns: columns,
    estimatedCells: (headerRows + dataRows + summaryRows) * columns
  };
}

function countSourceRows(rawData) {
  if (typeof rawData === 'string') {
    return rawData.split('\n').length;
  } else if (Array.isArray(rawData)) {
    return rawData.length;
  }
  return 0;
}

function analyzeDataStructure(rawData) {
  return {
    type: typeof rawData,
    isArray: Array.isArray(rawData),
    hasHeaders: true, // Simplified detection
    estimatedColumns: 'unknown'
  };
}

function autoDetectAndConvert(rawData, metadata) {
  // Simple auto-detection - can be enhanced
  if (typeof rawData === 'string' && rawData.includes('|')) {
    return convertExcelExtractToAdvancedTable(rawData, metadata);
  }
  
  throw new Error('Unable to auto-detect data format');
}

// Create HTTPS server
const server = https.createServer(options, (req, res) => {
  // Handle API endpoints
  if (req.url.startsWith('/api/')) {
    handleApiRequest(req, res);
    return;
  }

  // Handle GET JSON endpoints (for table data)
  if (req.url.startsWith('/get_json/') && req.method === 'GET') {
    handleJsonRequest(req, res);
    return;
  }

  // Parse URL for static file serving
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Default to index.html for root path
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Remove leading slash and resolve file path
  const filePath = path.join(__dirname, pathname.substring(1));

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>');
      return;
    }

    // Get file extension and MIME type
    const ext = path.parse(filePath).ext;
    const mimeType = mimeTypes[ext] || 'text/plain';

    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1><p>Error reading file.</p>');
        return;
      }

      // Set CORS headers for cross-origin requests
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(data);
    });
  });
});

// Start server
const PORT = 5500;
const HOST = '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`🚀 HTTPS Server running at https://${HOST}:${PORT}/`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🔒 Using SSL certificates: cert.pem & key.pem`);
  console.log('\n✨ Enhanced Backend Features:');
  console.log('   • \\analyse command parsing and parameter extraction');
  console.log('   • User guidance integration with focus areas');
  console.log('   • Document type detection and context building');
  console.log('   • Enhanced suggestion generation with confidence scoring');
  console.log('   • Comprehensive analysis context for AI providers');
  console.log('   • Smart chat responses with document awareness');
  console.log('\n📝 Available API endpoints:');
  console.log('   • POST /api/analyze-paragraphs - Enhanced paragraph analysis');
  console.log('   • POST /api/analyze-text - Enhanced text analysis');
  console.log('   • POST /api/suggest-improvements - Enhanced suggestions');
  console.log('   • POST /api/chat - Enhanced chat with \\analyse support');
  console.log('   • GET /get_json/latestpadtables - Latest PAD tables data');
  console.log('\n📝 Available files:');
  
  // List available files
  fs.readdirSync(__dirname).forEach(file => {
    if (!file.startsWith('.') && file !== 'server.js') {
      console.log(`   - https://${HOST}:${PORT}/${file}`);
    }
  });
  
  console.log('\n💡 Press Ctrl+C to stop the server');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop any other servers or change the port.`);
  } else {
    console.error('❌ Server error:', err.message);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped.');
    process.exit(0);
  });
});
