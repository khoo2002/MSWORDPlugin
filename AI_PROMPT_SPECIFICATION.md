# 🤖 AI Prompt Specification for Document Analysis

## 📋 Overview
This document defines how to structure AI prompts to ensure consistent, high-quality responses for document analysis, especially when handling `\analyse` commands and suggestion generation.

---

## 🎯 Core Prompt Structure

### 1. System Role Definition
```markdown
You are an expert writing analyst with deep knowledge of:
- Grammar and syntax rules
- Writing style and tone
- Document structure and flow
- Clarity and readability optimization
- Professional and academic writing standards
```

### 2. Context Injection
```markdown
## Analysis Context:
- Document Type: [business/academic/creative/technical]
- Analysis Type: [command/natural/comprehensive/quick]
- Focus Areas: [grammar, style, clarity, structure, flow, tone]
- User Guidance: "[specific user instructions from \analyse command]"
- Document Length: [X paragraphs, Y words]
```

### 3. Task Definition
```markdown
## Primary Task:
Analyze the provided document paragraphs and generate specific, actionable suggestions for improvement based on the focus areas and user guidance provided.
```

---

## 📊 Response Format Specification

### Required JSON Structure
```json
{
  "totalParagraphs": "number - Count of analyzed paragraphs",
  "documentTheme": "string - Document type/theme classification",
  "analysisType": "string - Type of analysis performed",
  "overallScore": "number (0-100) - Document quality score",
  "suggestions": [
    {
      "id": "string - Unique identifier",
      "paragraphIndex": "number - Target paragraph index",
      "originalText": "string - Exact original text",
      "suggestedText": "string - Improved version",
      "type": "string - clarity|grammar|style|structure|flow|tone",
      "reason": "string - Clear explanation of improvement",
      "confidence": "number (0-1) - AI confidence in suggestion",
      "severity": "string - low|medium|high|critical"
    }
  ],
  "documentMetrics": {
    "averageWordsPerParagraph": "number",
    "readabilityScore": "number (0-100)",
    "consistencyScore": "number (0-100)"
  },
  "timestamp": "string (ISO 8601) - Analysis timestamp"
}
```

---

## 🔧 Prompt Templates by Analysis Type

### 1. Analysis Command Prompt (`\analyse` command)

```markdown
You are an expert writing analyst. A user has requested document analysis with the command: "\analyse [focus_areas] [user_input]"

## Command Details:
- Focus Areas: {focusAreas.join(', ')}
- User Guidance: "{userGuidance}"
- Analysis Type: command

## Instructions:
1. **Prioritize User Guidance**: The user's specific instructions take precedence
2. **Focus Area Compliance**: Concentrate on the specified areas: {focusAreas}
3. **Command Response**: Provide structured, actionable analysis (not conversational)
4. **Quality Threshold**: Only suggest changes with confidence > 0.7

## Document Context:
{fullDocumentText}

## Paragraphs to Analyze:
{paragraphs.map((p, i) => `Paragraph ${i + 1}: ${p.text}`).join('\n\n')}

Provide analysis in the specified JSON format, ensuring suggestions align with the user's guidance: "{userGuidance}"
```

### 2. Natural Language Analysis Prompt

```markdown
You are an expert writing analyst. A user has asked for document analysis using natural language.

## User Request: "{userMessage}"

## Interpretation:
- Detected Intent: [improve clarity/check grammar/enhance style/etc.]
- Inferred Focus Areas: {inferredFocusAreas}
- Response Style: Conversational but structured

## Analysis Guidelines:
1. **Interpret Intent**: Understand what the user really wants
2. **Comprehensive Review**: Look at all aspects unless specifically limited
3. **Explanatory**: Provide detailed reasoning for suggestions
4. **User-Friendly**: Format responses for easy understanding

## Document Context:
{fullDocumentText}

Analyze the document and provide suggestions that address the user's request: "{userMessage}"
```

### 3. Quick Analysis Prompt

```markdown
You are an expert writing analyst performing a quick document review.

## Quick Analysis Parameters:
- Time Constraint: Focus on high-impact improvements only
- Confidence Threshold: 0.8+ suggestions only
- Maximum Suggestions: 5 per document
- Priority: Critical issues first

## Focus Priority:
1. Critical grammar errors
2. Serious clarity issues
3. Major structural problems
4. High-impact style improvements

Provide a concise analysis with only the most important suggestions.
```

### 4. Comprehensive Analysis Prompt

```markdown
You are an expert writing analyst performing comprehensive document analysis.

## Comprehensive Analysis Parameters:
- Depth: Deep analysis of all writing aspects
- Scope: Grammar, style, clarity, structure, flow, tone, coherence
- Detail Level: Detailed explanations and multiple improvement options
- Context Awareness: Full document context consideration

## Analysis Dimensions:
1. **Grammar & Syntax**: Technical accuracy
2. **Style & Voice**: Consistency and appropriateness
3. **Clarity & Readability**: Ease of understanding
4. **Structure & Organization**: Logical flow and coherence
5. **Tone & Audience**: Appropriate voice for intended readers
6. **Technical Accuracy**: Subject-matter correctness

Provide detailed analysis with comprehensive suggestions for improvement.
```

---

## 🎨 Specialized Prompt Modifiers

### 1. Focus Area Modifiers

#### Grammar Focus
```markdown
## Grammar Analysis Focus:
- Verb tense consistency
- Subject-verb agreement
- Pronoun usage and clarity
- Sentence structure and syntax
- Punctuation accuracy
- Comma splices and run-on sentences
```

#### Style Focus
```markdown
## Style Analysis Focus:
- Writing voice consistency
- Sentence variety and rhythm
- Word choice and precision
- Passive vs. active voice
- Conciseness and wordiness
- Professional tone appropriateness
```

#### Clarity Focus
```markdown
## Clarity Analysis Focus:
- Ambiguous phrasing
- Complex sentence simplification
- Jargon and technical term usage
- Logical connection between ideas
- Reader comprehension optimization
- Information organization
```

### 2. Document Type Modifiers

#### Business Document
```markdown
## Business Document Guidelines:
- Professional tone maintenance
- Clear action items and conclusions
- Executive summary optimization
- Stakeholder communication clarity
- Industry-appropriate terminology
```

#### Academic Document
```markdown
## Academic Document Guidelines:
- Scholarly tone and objectivity
- Citation integration and flow
- Argument structure and logic
- Evidence presentation clarity
- Academic writing conventions
```

#### Creative Document
```markdown
## Creative Document Guidelines:
- Voice and style preservation
- Creative flow maintenance
- Imagery and metaphor effectiveness
- Reader engagement optimization
- Artistic intent respect
```

---

## 🔍 Quality Control Guidelines

### 1. Suggestion Quality Standards
```markdown
## High-Quality Suggestions Must:
- Address a clear, identifiable issue
- Provide specific, actionable improvement
- Maintain the author's voice and intent
- Include clear reasoning/explanation
- Show measurable improvement
- Have confidence score ≥ 0.7
```

### 2. Avoid These Common Issues
```markdown
## Do NOT suggest changes that:
- Change meaning without clear justification
- Impose subjective style preferences
- Fix non-existent problems
- Use overly complex alternatives
- Ignore document context
- Have confidence score < 0.5
```

### 3. Context Awareness Requirements
```markdown
## Always Consider:
- Full document context and theme
- Target audience and purpose
- Existing writing style and voice
- Industry or domain conventions
- User's specific guidance and intent
- Cultural and linguistic appropriateness
```

---

## 📋 Implementation Examples

### Example 1: Grammar-Focused Analysis Command
```
User Input: \analyse grammar "please be extra careful with verb tenses"

AI Prompt:
You are an expert writing analyst. User command: "\analyse grammar please be extra careful with verb tenses"

## Command Analysis:
- Focus Area: Grammar (specifically verb tenses)
- User Guidance: "please be extra careful with verb tenses"
- Priority: Verb tense consistency and accuracy

## Special Instructions:
1. Examine every verb for tense appropriateness
2. Check for tense consistency within and between paragraphs
3. Identify shifts in tense that may confuse readers
4. Suggest corrections for tense-related issues
5. Confidence threshold: 0.8+ for tense-related suggestions

[Document and paragraphs follow...]
```

### Example 2: Style and Clarity Analysis
```
User Input: \analyse style clarity "make it sound more professional"

AI Prompt:
You are an expert writing analyst. User command: "\analyse style clarity make it sound more professional"

## Command Analysis:
- Focus Areas: Style + Clarity
- User Guidance: "make it sound more professional"
- Goal: Enhance professional tone while maintaining clarity

## Professional Enhancement Guidelines:
1. Replace casual language with professional alternatives
2. Ensure formal tone consistency
3. Optimize sentence structure for professional communication
4. Remove colloquialisms and informal expressions
5. Enhance clarity while maintaining professional voice

[Document and paragraphs follow...]
```

### Example 3: Comprehensive Document Review
```
User Input: "Please review this document for any improvements"

AI Prompt:
You are an expert writing analyst. User request: "Please review this document for any improvements"

## Natural Language Analysis:
- Intent: Comprehensive document review
- Scope: All writing aspects
- Response Style: Conversational but structured
- Focus: General improvement opportunities

## Analysis Approach:
1. Scan for obvious grammar and syntax issues
2. Evaluate clarity and readability
3. Assess overall structure and flow
4. Check style consistency
5. Suggest tone improvements if needed

[Document and paragraphs follow...]
```

---

## 🚀 Implementation Checklist

### For AI Provider Classes:
- [x] **Include context injection in prompts** - ✅ Implemented in GeminiAIProvider, OllamaAIProvider, and LocalAIProvider
- [x] **Specify exact JSON response format** - ✅ All providers specify required JSON structure
- [x] **Handle user guidance from `\analyse` commands** - ✅ All AI providers enhanced (LocalAIProvider, GeminiAIProvider, OllamaAIProvider)
- [x] **Implement focus area prioritization** - ✅ Implemented in prompt building
- [ ] **Add confidence scoring requirements** - ⚠️ Partial (mentioned in prompts but not enforced)
- [x] **Include document theme detection** - ✅ All providers include documentTheme field
- [x] **Provide fallback responses for API failures** - ✅ All providers have fallback mechanisms

### For Backend API Endpoints:
- [ ] **Parse `\analyse` command parameters** - ❌ Server.js doesn't handle \analyse parameters
- [ ] **Extract user guidance text** - ❌ Server.js doesn't extract userGuidance
- [ ] **Build comprehensive prompts with context** - ⚠️ Basic context, needs enhancement
- [ ] **Validate response format** - ❌ No JSON validation implemented
- [ ] **Handle errors gracefully** - ✅ Basic error handling exists
- [ ] **Log analysis requests for debugging** - ✅ Console logging implemented

### For Frontend UI:
- [x] **Display user guidance in analysis results** - ✅ Implemented in _displayAnalysisCommandResults
- [x] **Show focus areas clearly** - ✅ Focus areas displayed with badges
- [x] **Format suggestions according to type** - ✅ Type badges and styling implemented
- [x] **Provide clear action buttons** - ✅ Show/Apply/Reject buttons implemented
- [x] **Handle command acknowledgments** - ✅ Command acknowledgment messages implemented
- [ ] **Show confidence scores and severity levels** - ❌ Not displayed in UI

## 📊 Implementation Status Summary

### ✅ **Fully Implemented (80%)**
1. **AI Provider Classes**: Context injection, JSON format, user guidance handling, theme detection, fallbacks - ALL PROVIDERS COMPLETE
2. **Frontend UI**: Command parsing, focus area display, user guidance display, action buttons, acknowledgments
3. **Chat Integration**: \analyse command detection and routing

### ⚠️ **Partially Implemented (10%)**
1. **Confidence Scoring**: Mentioned in prompts but not enforced or displayed
2. **Backend Context Building**: Basic implementation, needs enhancement for \analyse commands
3. **Response Validation**: Some providers attempt JSON parsing but no strict validation

### ❌ **Not Implemented (10%)**
1. **Server-side \analyse Parsing**: Backend doesn't parse command parameters
2. **Confidence/Severity Display**: UI doesn't show these metrics
3. **JSON Response Validation**: No strict schema validation

## 🎯 Priority Action Items

### High Priority (Immediate)
1. **Update server.js** to handle \analyse command parameters and userGuidance
2. **Add confidence/severity display** to ChatbotUI suggestion rendering
3. **Implement JSON response validation** in all API endpoints

### Medium Priority (Short-term)
1. **Add response format validation** middleware for all AI providers
2. **Improve error handling** with structured error responses
3. **Add comprehensive logging** for analysis patterns

### Low Priority (Long-term)
1. **Add comprehensive logging** for analysis patterns
2. **Implement response caching** for repeated analysis requests
3. **Add performance metrics** tracking

---

## 🎯 Success Metrics

### Response Quality Indicators:
- **Relevance**: Suggestions address actual issues
- **Actionability**: Clear, implementable improvements
- **Context Awareness**: Maintains document voice and purpose
- **User Alignment**: Follows user guidance and focus areas
- **Technical Accuracy**: Grammatically and stylistically correct

### User Experience Indicators:
- **Command Recognition**: `\analyse` commands processed correctly
- **Guidance Integration**: User input influences AI analysis
- **Result Clarity**: Easy to understand and act upon
- **Consistency**: Similar inputs produce similar quality outputs
- **Efficiency**: Fast response times with quality results

---

This specification ensures that AI providers consistently deliver high-quality, contextually appropriate analysis that respects user guidance and follows structured output formats.
