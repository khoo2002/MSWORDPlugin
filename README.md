# 🤖 AI Writing Assistant for Microso## 🛠️ AI Model Configuration

### Choose Your AI Model
The app supports multiple AI providers - select one at a time:

1. **🤖 Gemini 2.0 Flash** (Recommended)
   - Google's most advanced model
   - Requires free API key from Google AI Studio
   - Best performance for writing analysis

2. **🦙 Ollama** (Privacy-focused)
   - Run AI models locally on your computer
   - Complete privacy - no data leaves your device
   - Requires Ollama installation

3. **🔧 Local Processing** (Fallback)
   - Simple rule-based suggestions
   - Always available, no setup required
   - Limited capabilities

### Step 1: Choose Your Model
1. Open ⚙️ **Settings** in the app
2. Select your preferred AI model using the radio buttons
3. The configuration options will update automatically

### Step 2: Configure Selected Model

#### For Gemini:
1. Visit **[Google AI Studio](https://aistudio.google.com/apikey)**
2. Sign in and create a free API key
3. Enter the API key in the settings
4. Click **"🧪 Test Gemini"** to verify

#### For Ollama:
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Run `ollama serve` to start the server
3. Enter your Ollama URL (default: `http://localhost:11434`)
4. Click **"🧪 Test Ollama"** to verify

#### For Local Processing:
- No configuration needed
- Click **"🧪 Test Local"** to verify server connection

### Step 3: Save and Test
1. Click **"💾 Save Settings"**
2. Use **"🧪 Test Connection"** to verify your setup
3. Start analyzing your documents!ul Microsoft Word Add-in that provides AI-powered writing assistance using Google's Gemini API and a clean, modern chatbot interface.

## 🚀 Features

### 🤖 **AI-Powered Analysis**
- **Gemini Integration**: Uses Google's advanced Gemini 2.0 Flash model
- **Smart Suggestions**: Context-aware writing improvements
- **Interactive Chat**: Natural language assistance for your documents
- **Secure API Storage**: Your API key stays private and local

### 📊 **Document Analysis**
- Word, character, sentence, and paragraph counting
- Real-time text analysis with AI insights
- Paragraph-by-paragraph improvement suggestions
- Document statistics and readability metrics

### 🤖 **AI Chatbot Interface**
- Interactive chat interface for document queries
- Paragraph-by-paragraph analysis
- Intelligent writing suggestions
- Context-aware recommendations

### ✨ **Writing Improvements**
- Grammar and style suggestions
- Clarity and readability improvements
- Vocabulary enhancement recommendations
- Sentence structure optimization

### 🔧 **Advanced Features**
- Ollama API integration support (configurable)
- Real-time text highlighting
- One-click suggestion application
- Professional, clean interface
- HTTPS security with SSL certificates

### 📋 **Structured AI Responses**
All AI models provide suggestions in a consistent format:
```json
{
  "totalParagraphs": 3,
  "suggestions": [
    {
      "paragraphIndex": 0,
      "originalText": "Original paragraph text...",
      "suggestedText": "Improved paragraph text...",
      "type": "clarity|grammar|style|structure|vocabulary",
      "reason": "Explanation of the improvement"
    }
  ],
  "timestamp": "2025-01-31T12:00:00.000Z"
}
```

This ensures consistent processing regardless of which AI model you choose (Gemini, Ollama, or Local).

## �️ Gemini API Setup

### Step 1: Get Your Free API Key
1. Visit **[Google AI Studio](https://aistudio.google.com/apikey)**
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (starts with `AIza...`)

### Step 2: Configure the Add-in
1. Open the AI Writing Assistant in Microsoft Word
2. Click the ⚙️ **Settings** button
3. Paste your API key in the **"Gemini API Key"** field
4. Click **"💾 Save Settings"**
5. Click **"🧪 Test Gemini"** to verify connection

### Step 3: Start Using AI Features
- **📝 Analyze**: Get AI-powered paragraph suggestions
- **💬 Chat**: Ask questions about your document
- **✨ Apply**: Use AI suggestions to improve your writing

---

## �📁 Project Structure

```
MSWORDPlugin/
├── index.html              # Main HTML interface
├── manifest.xml            # Word Add-in manifest
├── server.js              # HTTPS server with API endpoints
├── cert.pem               # SSL certificate
├── key.pem                # SSL private key
├── css/
│   └── styles.css         # Professional styling
└── js/
    ├── app.js             # Main application controller
    ├── WordDocumentManager.js  # Word document operations
    ├── APIService.js      # API communication layer
    └── ChatbotUI.js       # Chatbot interface management
```

## 🛠 Architecture

### **Object-Oriented Design**
- **WordDocumentManager**: Handles all Word document operations
- **APIService**: Manages API communications (local + Ollama)
- **ChatbotUI**: Controls the user interface and interactions
- **AIWritingAssistant**: Main application coordinator

### **Clean Code Principles**
- Modular, reusable components
- Comprehensive commenting
- Error handling and logging
- Professional styling
- Responsive design

## 🚀 Getting Started

### **Prerequisites**
- Node.js installed
- Microsoft Word with Office Add-ins support
- Valid SSL certificates (cert.pem, key.pem)

### **Installation**
1. Clone or download the project files
2. Navigate to the project directory
3. Start the HTTPS server:
   ```bash
   node server.js
   ```
4. Open Word and sideload the add-in using `https://127.0.0.1:5500/`

### **Configuration**
1. Click the ⚙️ Config button in the interface
2. Enter your Ollama API URL (optional): `http://localhost:11434`
3. Test the connection and save settings

## 📡 API Endpoints

### **Local Server APIs**
- `POST /api/analyze-text` - Document text analysis
- `POST /api/suggest-improvements` - Writing suggestions
- `POST /api/chat` - Chatbot interactions
- `POST /api/analyze-paragraphs` - Paragraph-specific analysis

### **Ollama Integration**
- Configurable Ollama API URL
- Reserved variable: `APIService.ollamaApiUrl`
- Connection testing and validation
- Ready for AI model integration

## 🎯 Usage

### **Quick Analysis**
1. Open a Word document with content
2. Click "📊 Analyze Document" for overall statistics
3. Use "📝 Analyze Paragraphs" for detailed suggestions

### **Interactive Chat**
1. Type questions about your document in the chat
2. Get context-aware responses and suggestions
3. Apply or reject suggestions with one click

### **Writing Improvements**
1. Review paragraph-specific suggestions
2. Preview original vs. suggested text
3. Apply changes directly to the document
4. Highlight paragraphs for easy identification

## 🔧 Development

### **Adding New Features**
1. **Document Operations**: Extend `WordDocumentManager.js`
2. **API Endpoints**: Add to `server.js` API handlers
3. **UI Components**: Update `ChatbotUI.js`
4. **Styling**: Modify `css/styles.css`

### **Ollama Integration**
```javascript
// In APIService.js
this.ollamaApiUrl = 'http://localhost:11434';

// Example Ollama API call
async callOllama(prompt) {
    return this.makeRequest(`${this.ollamaApiUrl}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({
            model: 'llama2',
            prompt: prompt
        })
    });
}
```

## 🔒 Security

- HTTPS encryption with SSL certificates
- CORS headers for secure cross-origin requests
- Input validation and error handling
- No sensitive data storage in client

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on different screen sizes
- **Real-time Updates**: Live typing indicators and status
- **Accessibility**: Keyboard navigation and screen reader support
- **Professional Colors**: Microsoft Office-inspired theme

## 📝 License

This project is designed for educational and professional use. Ensure you have appropriate licenses for any AI models or APIs you integrate.

## 🤝 Contributing

1. Follow the established OOP patterns
2. Add comprehensive comments
3. Maintain clean, readable code
4. Test all new features thoroughly
5. Update documentation as needed

---

**Built with ❤️ for better writing experiences in Microsoft Word**
