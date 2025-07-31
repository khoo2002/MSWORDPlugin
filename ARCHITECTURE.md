# AI Provider Architecture

## Overview
The APIService has been refactored into a clean Object-Oriented Programming (OOP) architecture using the **Strategy Pattern** and **Provider Pattern**. This makes the code more maintainable, testable, and extensible.

## Architecture Components

### 1. BaseAIProvider (Abstract Base Class)
- **Location**: `js/providers/BaseAIProvider.js`
- **Purpose**: Defines the common interface for all AI providers
- **Key Methods**:
  - `isConfigured()` - Check if provider is ready
  - `getDisplayName()` - Get provider display name
  - `sendChatMessage()` - Send chat messages
  - `getParagraphSuggestions()` - Get writing suggestions
  - `testConnection()` - Test provider connectivity
  - `makeRequest()` - Generic HTTP request helper
  - `createResponse()` - Standardize response format

### 2. GeminiAIProvider
- **Location**: `js/providers/GeminiAIProvider.js`
- **Purpose**: Handles Google Gemini 2.0 Flash API integration
- **Configuration**: Requires API key from Google AI Studio
- **Features**:
  - Chat messaging with context history
  - Structured paragraph analysis
  - Connection testing
  - Error handling with detailed messages

### 3. OllamaAIProvider
- **Location**: `js/providers/OllamaAIProvider.js`
- **Purpose**: Handles local Ollama API communication
- **Configuration**: Requires local Ollama server URL
- **Features**:
  - Local AI processing (privacy-focused)
  - Configurable models (default: llama3.2)
  - Offline capability
  - Low latency responses

### 4. LocalAIProvider
- **Location**: `js/providers/LocalAIProvider.js`
- **Purpose**: Fallback processing and basic text analysis
- **Configuration**: Always available (no external dependencies)
- **Features**:
  - Basic text statistics
  - Fallback responses when other providers fail
  - Local text processing
  - Graceful degradation

### 5. APIService (Orchestrator)
- **Location**: `js/APIService.js`
- **Purpose**: Manages providers and routes requests
- **Responsibilities**:
  - Provider instantiation and configuration
  - Active provider management
  - Request routing with fallback logic
  - Configuration persistence (localStorage)
  - Unified interface for the application

## Benefits of the New Architecture

### 🏗️ **Clean Code Principles**
- **Single Responsibility**: Each provider handles one AI service
- **Open/Closed**: Easy to add new providers without modifying existing code
- **Dependency Inversion**: APIService depends on abstractions, not concrete implementations

### 🔧 **Maintainability**
- Clear separation of concerns
- Each provider is independent and testable
- Easy to debug provider-specific issues
- Modular code organization

### 🚀 **Extensibility**
- Adding new AI providers is straightforward
- Provider-specific features can be easily added
- Configuration management is centralized
- Error handling is consistent across providers

### 🛡️ **Reliability**
- Automatic fallback to Local provider if others fail
- Provider-specific error handling
- Connection testing for each provider
- Graceful degradation when services are unavailable

## Usage Example

```javascript
// APIService automatically manages providers
const apiService = new APIService();

// Set configurations
apiService.setGeminiApiKey('your-api-key');
apiService.setOllamaApiUrl('http://localhost:11434');
apiService.setActiveModel('gemini');

// Send messages (automatically routed to active provider)
const response = await apiService.sendChatMessage('Hello!', chatHistory);

// Get suggestions (with automatic fallback)
const suggestions = await apiService.getParagraphSuggestions(paragraphs);

// Test connections
const isGeminiReady = await apiService.testGeminiConnection();
const isOllamaReady = await apiService.testOllamaConnection();
```

## File Structure

```
js/
├── APIService.js                 # Main orchestrator
├── providers/
│   ├── BaseAIProvider.js        # Abstract base class
│   ├── GeminiAIProvider.js      # Google Gemini integration
│   ├── OllamaAIProvider.js      # Local Ollama integration
│   └── LocalAIProvider.js       # Fallback processing
├── ChatbotUI.js                 # UI controller
├── WordDocumentManager.js       # Document operations
└── app.js                       # Application entry point
```

## Migration Notes

The refactored APIService maintains **full backward compatibility** with the existing application. All public methods remain the same, ensuring no breaking changes to the UI components.

Key improvements:
- Better error messages with provider context
- More reliable fallback mechanisms
- Cleaner separation of provider-specific logic
- Enhanced debugging capabilities
- Future-ready architecture for new AI providers
