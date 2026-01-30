# 07 - AI Study Buddy (Gemini Integration)

> Add AI-powered study assistance using Google Gemini API.

---

## 🎯 Objective

Build an intelligent study assistant:
- Chat with AI about study topics
- Code explanation and debugging
- Generate flashcards from notes
- Summarize documents
- Quiz generation
- Contextual help in code editor

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  - Chat panel                                           │
│  - Code selection → "Explain this"                      │
│  - Notes → "Make flashcards"                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js API Route                       │
│  - Rate limiting                                        │
│  - Context management                                   │
│  - Streaming responses                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Google Gemini API                       │
│  - gemini-2.0-flash (fast responses)                    │
│  - gemini-pro (complex reasoning)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies

### Frontend:
```bash
npm install ai @ai-sdk/google
```

### Environment Variables:
```env
GOOGLE_GEMINI_API_KEY=your-api-key
```

---

## 📁 File Structure

```
frontend/src/
├── app/
│   └── api/
│       └── ai/
│           ├── chat/route.ts        # Chat endpoint
│           ├── explain/route.ts     # Code explanation
│           ├── flashcards/route.ts  # Generate flashcards
│           └── summarize/route.ts   # Document summary
├── components/
│   └── ai/
│       ├── AIChatPanel.tsx          # Chat interface
│       ├── CodeExplainer.tsx        # Code explanation popup
│       └── FlashcardGenerator.tsx   # Flashcard UI
└── lib/
    └── gemini.ts                    # Gemini client setup
```

---

## 🔧 Implementation Steps

### Step 1: Gemini Client Setup

Create `frontend/src/lib/gemini.ts`:

```typescript
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

// Models
export const flashModel = google('gemini-2.0-flash');
export const proModel = google('gemini-pro');

// System prompts for different contexts
export const SYSTEM_PROMPTS = {
  studyBuddy: `You are a friendly and encouraging AI study buddy called "Sparky" for the Chill Space app. 
Your role is to:
- Help users understand complex topics
- Answer questions clearly and concisely
- Encourage and motivate users in their studies
- Use emojis occasionally to be friendly 🎓
- Break down complex concepts into simple steps
- Provide examples when helpful

Keep responses concise but helpful. If asked about code, format it properly with syntax highlighting.`,

  codeExplainer: `You are a code explanation assistant. When given code:
1. Explain what the code does in simple terms
2. Break down the logic step by step
3. Highlight any important concepts or patterns
4. Point out potential issues or improvements
5. Use clear, beginner-friendly language

Format your response with markdown for readability.`,

  flashcardGenerator: `You are a flashcard generator. When given study material:
1. Identify key concepts, terms, and facts
2. Create question-answer pairs (Q: / A: format)
3. Focus on important, testable information
4. Keep questions clear and specific
5. Keep answers concise but complete

Return flashcards in this JSON format:
{
  "flashcards": [
    { "question": "...", "answer": "..." }
  ]
}`,

  quizGenerator: `You are a quiz generator. When given a topic or content:
1. Create multiple choice questions
2. Include 4 options per question (A, B, C, D)
3. Mark the correct answer
4. Vary difficulty levels
5. Cover key concepts

Return quizzes in this JSON format:
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A",
      "explanation": "..."
    }
  ]
}`,
};
```

---

### Step 2: Chat API Route

Create `frontend/src/app/api/ai/chat/route.ts`:

```typescript
import { streamText } from 'ai';
import { flashModel, SYSTEM_PROMPTS } from '@/lib/gemini';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  // Build system prompt with optional context
  let systemPrompt = SYSTEM_PROMPTS.studyBuddy;
  if (context?.code) {
    systemPrompt += `\n\nThe user is working on this code:\n\`\`\`\n${context.code}\n\`\`\``;
  }
  if (context?.notes) {
    systemPrompt += `\n\nThe user's notes:\n${context.notes}`;
  }

  const result = await streamText({
    model: flashModel,
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
```

---

### Step 3: Code Explanation API

Create `frontend/src/app/api/ai/explain/route.ts`:

```typescript
import { generateText } from 'ai';
import { flashModel, SYSTEM_PROMPTS } from '@/lib/gemini';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { code, language } = await req.json();

  const result = await generateText({
    model: flashModel,
    system: SYSTEM_PROMPTS.codeExplainer,
    prompt: `Explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
  });

  return Response.json({ explanation: result.text });
}
```

---

### Step 4: Flashcard Generator API

Create `frontend/src/app/api/ai/flashcards/route.ts`:

```typescript
import { generateText } from 'ai';
import { proModel, SYSTEM_PROMPTS } from '@/lib/gemini';

export const runtime = 'edge';

interface Flashcard {
  question: string;
  answer: string;
}

export async function POST(req: Request) {
  const { content, count = 10 } = await req.json();

  const result = await generateText({
    model: proModel,
    system: SYSTEM_PROMPTS.flashcardGenerator,
    prompt: `Create ${count} flashcards from this study material:\n\n${content}`,
  });

  // Parse JSON from response
  try {
    const match = result.text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return Response.json(parsed);
    }
  } catch (e) {
    // If parsing fails, return error
  }

  return Response.json({ flashcards: [], error: 'Failed to generate flashcards' });
}
```

---

### Step 5: AI Chat Panel Component

Create `frontend/src/components/ai/AIChatPanel.tsx`:

```tsx
'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIChatPanelProps {
  context?: {
    code?: string;
    notes?: string;
  };
}

export function AIChatPanel({ context }: AIChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    body: { context },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transition-all z-50"
      >
        <span className="text-2xl">🤖</span>
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-surface-dark border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <h3 className="font-semibold text-white">Sparky</h3>
                <span className="text-xs text-gray-400">AI Study Buddy</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-3xl mb-2">👋</p>
                  <p>Hi! I'm Sparky, your AI study buddy.</p>
                  <p className="text-sm mt-1">Ask me anything!</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary text-black rounded-br-md'
                        : 'bg-white/10 text-white rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white px-4 py-2 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-600 text-black font-medium rounded-xl transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

### Step 6: Code Explainer Component

Create `frontend/src/components/ai/CodeExplainer.tsx`:

```tsx
'use client';

import { useState } from 'react';

interface CodeExplainerProps {
  code: string;
  language: string;
  onClose: () => void;
}

export function CodeExplainer({ code, language, onClose }: CodeExplainerProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const explain = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      setExplanation(data.explanation);
    } catch (error) {
      setExplanation('Failed to get explanation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">🔍 Code Explanation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Code Preview */}
        <div className="p-4 bg-black/30 border-b border-white/10 max-h-40 overflow-auto">
          <pre className="text-sm text-gray-300 font-mono">{code}</pre>
        </div>

        {/* Explanation */}
        <div className="p-6 overflow-auto max-h-80">
          {!explanation && !isLoading && (
            <button
              onClick={explain}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-black font-medium rounded-xl transition-colors"
            >
              ✨ Explain This Code
            </button>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {explanation && (
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-300">{explanation}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🎓 Quick Actions

Add contextual AI actions in the code editor:

```tsx
// In CodeEditor.tsx, add context menu
editor.addAction({
  id: 'explain-code',
  label: '✨ Explain with AI',
  contextMenuGroupId: 'ai',
  run: (ed) => {
    const selection = ed.getSelection();
    const selectedText = ed.getModel()?.getValueInRange(selection!);
    if (selectedText) {
      // Show CodeExplainer modal
      setCodeToExplain(selectedText);
    }
  },
});
```

---

## ✅ Features Checklist

- [x] Chat with AI study buddy
- [x] Code explanation
- [x] Streaming responses
- [x] Context awareness (current code/notes)
- [ ] Flashcard generation
- [ ] Quiz generation
- [ ] Document summarization
- [ ] Voice input

---

## 📝 Next Steps

After completing AI integration:
1. ✅ AI chat assistant working
2. ✅ Code explanation feature
3. → Proceed to [08_FOCUS_MODE.md](./08_FOCUS_MODE.md)

---

## 🔗 Resources

- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [AI SDK Google Provider](https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai)
