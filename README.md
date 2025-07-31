# AI Writing Assistant for Microsoft Word

A professional Word Add-in that provides intelligent document analysis and writing suggestions using a clean, modern chatbot interface.

## 🚀 Features

### 📊 **Document Analysis**
- Word, character, sentence, and paragraph counting
- Real-time text analysis
- Document statistics and insights

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

## 📁 Project Structure

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
