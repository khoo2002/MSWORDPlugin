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
    default:
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

/**
 * Handle text analysis requests
 * @param {Object} data - Request data containing text
 * @param {Object} res - Response object
 */
function handleTextAnalysis(data, res) {
  const text = data.text || '';
  
  const analysis = {
    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
    characterCount: text.length,
    sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    paragraphCount: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
    timestamp: new Date().toISOString(),
    preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    message: '✅ Text analysis completed successfully!'
  };

  console.log(`📊 Text Analysis Request:
   - Word Count: ${analysis.wordCount}
   - Character Count: ${analysis.characterCount}
   - Sentences: ${analysis.sentenceCount}
   - Paragraphs: ${analysis.paragraphCount}
   - Preview: "${analysis.preview}"`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(analysis, null, 2));
}

/**
 * Handle text improvement suggestions
 * @param {Object} data - Request data containing text and context
 * @param {Object} res - Response object
 */
function handleTextSuggestions(data, res) {
  const { text, context } = data;
  
  // TODO: Integrate with Ollama API here
  const suggestions = {
    originalText: text,
    suggestions: [
      {
        type: 'clarity',
        suggestion: 'Consider breaking long sentences for better readability.',
        confidence: 0.8
      },
      {
        type: 'grammar',
        suggestion: 'Check for passive voice usage.',
        confidence: 0.7
      }
    ],
    timestamp: new Date().toISOString()
  };

  console.log(`💡 Text Suggestions Request for: "${text.substring(0, 50)}..."`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(suggestions));
}

/**
 * Handle chat messages
 * @param {Object} data - Request data containing message and history
 * @param {Object} res - Response object
 */
function handleChatMessage(data, res) {
  const { message, history } = data;
  
  // Simple rule-based responses (TODO: Replace with Ollama integration)
  let response = generateChatResponse(message, history);

  const chatResponse = {
    message: response,
    timestamp: new Date().toISOString(),
    type: 'assistant'
  };

  console.log(`💬 Chat Request: "${message}" -> "${response}"`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(chatResponse));
}

/**
 * Handle paragraph analysis requests
 * @param {Object} data - Request data containing paragraphs
 * @param {Object} res - Response object
 */
function handleParagraphAnalysis(data, res) {
  const { paragraphs } = data;
  
  const suggestions = paragraphs.map((paragraph, index) => {
    return generateParagraphSuggestion(paragraph, index);
  });

  const analysis = {
    totalParagraphs: paragraphs.length,
    suggestions: suggestions.filter(s => s !== null),
    timestamp: new Date().toISOString()
  };

  console.log(`📝 Paragraph Analysis: ${paragraphs.length} paragraphs analyzed, ${analysis.suggestions.length} suggestions generated`);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(analysis));
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
 * Generate suggestions for a specific paragraph
 * @param {Object} paragraph - Paragraph object with text and index
 * @param {number} index - Paragraph index
 * @returns {Object|null} Suggestion object or null if no suggestions
 */
function generateParagraphSuggestion(paragraph, index) {
  const text = paragraph.text;
  
  // Simple heuristics for suggestions (TODO: Replace with Ollama AI analysis)
  if (text.length < 20) {
    return null; // Skip very short paragraphs
  }
  
  let suggestion = null;
  
  // Check for overly long sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = text.length / sentences.length;
  
  if (avgSentenceLength > 150) {
    suggestion = {
      paragraphIndex: paragraph.index,
      originalText: text,
      suggestedText: text + " [Consider breaking this into shorter sentences for better readability.]",
      type: "clarity",
      reason: "This paragraph contains very long sentences that may be difficult to read."
    };
  }
  
  // Check for repetitive words
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = {};
  words.forEach(word => {
    if (word.length > 4) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  const repetitiveWords = Object.entries(wordCount).filter(([word, count]) => count > 3);
  if (repetitiveWords.length > 0 && !suggestion) {
    suggestion = {
      paragraphIndex: paragraph.index,
      originalText: text,
      suggestedText: text + ` [Consider using synonyms for: ${repetitiveWords.map(([word]) => word).join(', ')}]`,
      type: "variety",
      reason: `Repetitive use of words: ${repetitiveWords.map(([word, count]) => `"${word}" (${count} times)`).join(', ')}`
    };
  }
  
  // Default improvement suggestion
  if (!suggestion && text.length > 50) {
    suggestion = {
      paragraphIndex: paragraph.index,
      originalText: text,
      suggestedText: text + " [This paragraph could benefit from more specific examples or details.]",
      type: "enhancement",
      reason: "Consider adding more specific details or examples to strengthen this paragraph."
    };
  }
  
  return suggestion;
}

// Create HTTPS server
const server = https.createServer(options, (req, res) => {
  // Handle API endpoints
  if (req.url.startsWith('/api/')) {
    handleApiRequest(req, res);
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
