# 04 - Collaborative Code Editor (Monaco)

> Integrate VS Code's Monaco Editor with real-time collaborative editing.

---

## 🎯 Objective

Build a collaborative code editor featuring:
- Monaco Editor (VS Code's editor engine)
- Real-time sync via CRDT
- Syntax highlighting for 50+ languages
- Multi-cursor support (see other users' cursors)
- IntelliSense / autocomplete
- Multiple file tabs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Monaco Editor                         │
│  - Text content (Y.Text CRDT)                           │
│  - Cursor positions (Awareness protocol)                │
│  - Decorations (syntax highlighting)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                Y.js Binding (y-monaco)                   │
│  - Syncs Monaco model ↔ Y.Text                          │
│  - Renders remote cursors                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Rust Backend (yrs)                      │
│  - Persists document state                              │
│  - Broadcasts updates to room                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Frontend Dependencies

```bash
npm install @monaco-editor/react monaco-editor
npm install yjs y-monaco y-protocols
```

---

## 📁 File Structure

```
frontend/src/
├── components/
│   ├── editor/
│   │   ├── CodeEditor.tsx       # Main editor wrapper
│   │   ├── EditorTabs.tsx       # File tabs
│   │   ├── RemoteCursors.tsx    # Render other users' cursors
│   │   └── LanguageSelector.tsx # Language picker
│   └── ...
├── hooks/
│   ├── useMonacoYjs.ts          # Monaco + Y.js binding
│   └── useAwareness.ts          # Cursor awareness
└── lib/
    └── monaco-config.ts         # Monaco configuration
```

---

## 🔧 Implementation Steps

### Step 1: Monaco Configuration

Create `frontend/src/lib/monaco-config.ts`:

```typescript
import * as monaco from 'monaco-editor';

// Configure Monaco themes
export function configureMonaco() {
  // Dark theme matching Chill Space design
  monaco.editor.defineTheme('chill-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'type', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': '#0A0A0A',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#1F1F1F',
      'editor.selectionBackground': '#8B5CF644',
      'editorCursor.foreground': '#8B5CF6',
      'editor.selectionHighlightBackground': '#8B5CF622',
      'editorLineNumber.foreground': '#4A4A4A',
      'editorLineNumber.activeForeground': '#8B5CF6',
    },
  });
}

// Supported languages
export const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: '.js' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts' },
  { id: 'python', name: 'Python', extension: '.py' },
  { id: 'rust', name: 'Rust', extension: '.rs' },
  { id: 'go', name: 'Go', extension: '.go' },
  { id: 'java', name: 'Java', extension: '.java' },
  { id: 'cpp', name: 'C++', extension: '.cpp' },
  { id: 'html', name: 'HTML', extension: '.html' },
  { id: 'css', name: 'CSS', extension: '.css' },
  { id: 'json', name: 'JSON', extension: '.json' },
  { id: 'markdown', name: 'Markdown', extension: '.md' },
];
```

---

### Step 2: Y.js + Monaco Binding Hook

Create `frontend/src/hooks/useMonacoYjs.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { Awareness } from 'y-protocols/awareness';
import type * as monaco from 'monaco-editor';

interface UseMonacoYjsProps {
  roomId: string;
  wsUrl: string;
  username: string;
  userColor: string;
}

interface RemoteCursor {
  id: number;
  name: string;
  color: string;
  position: { lineNumber: number; column: number } | null;
  selection: monaco.IRange | null;
}

export function useMonacoYjs({
  roomId,
  wsUrl,
  username,
  userColor,
}: UseMonacoYjsProps) {
  const docRef = useRef<Y.Doc | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const bind = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      // Create Y.js document
      const doc = new Y.Doc();
      docRef.current = doc;

      // Get the shared text
      const yText = doc.getText('content');

      // Create awareness for cursors
      const awareness = new Awareness(doc);
      awarenessRef.current = awareness;

      // Set local awareness state
      awareness.setLocalStateField('user', {
        name: username,
        color: userColor,
      });

      // Create Monaco binding
      const binding = new MonacoBinding(
        yText,
        editor.getModel()!,
        new Set([editor]),
        awareness
      );
      bindingRef.current = binding;

      // Connect WebSocket
      const ws = new WebSocket(`${wsUrl}?room=${roomId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        // Request initial sync
        ws.send(
          JSON.stringify({
            type: 'SyncRequest',
            payload: { doc_id: roomId },
          })
        );
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'SyncResponse' || msg.type === 'Update') {
          const update = new Uint8Array(msg.payload.state || msg.payload.update);
          Y.applyUpdate(doc, update, 'remote');
        }

        if (msg.type === 'Awareness') {
          // Handle awareness from other clients
          awareness.setLocalStateField('cursor', msg.payload.state);
        }
      };

      // Send local updates
      doc.on('update', (update: Uint8Array, origin: any) => {
        if (origin !== 'remote' && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'Update',
              payload: {
                doc_id: roomId,
                update: Array.from(update),
              },
            })
          );
        }
      });

      // Send cursor awareness updates
      editor.onDidChangeCursorPosition((e) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'Awareness',
              payload: {
                doc_id: roomId,
                client_id: doc.clientID,
                state: {
                  cursor: {
                    line: e.position.lineNumber,
                    column: e.position.column,
                  },
                  user: { name: username, color: userColor },
                },
              },
            })
          );
        }
      });

      return () => {
        binding.destroy();
        ws.close();
        doc.destroy();
      };
    },
    [roomId, wsUrl, username, userColor]
  );

  const destroy = useCallback(() => {
    bindingRef.current?.destroy();
    wsRef.current?.close();
    docRef.current?.destroy();
  }, []);

  return { bind, destroy };
}
```

---

### Step 3: Code Editor Component

Create `frontend/src/components/editor/CodeEditor.tsx`:

```tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { useMonacoYjs } from '@/hooks/useMonacoYjs';
import { configureMonaco, LANGUAGES } from '@/lib/monaco-config';
import { RemoteCursors } from './RemoteCursors';

interface CodeEditorProps {
  roomId: string;
  initialLanguage?: string;
  username: string;
  userColor: string;
}

export function CodeEditor({
  roomId,
  initialLanguage = 'javascript',
  username,
  userColor,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [language, setLanguage] = useState(initialLanguage);
  const [isReady, setIsReady] = useState(false);

  const { bind, destroy } = useMonacoYjs({
    roomId,
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
    username,
    userColor,
  });

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    configureMonaco();

    // Apply theme
    monaco.editor.setTheme('chill-dark');

    // Bind Y.js
    const cleanup = bind(editor);
    setIsReady(true);

    // Editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      minimap: { enabled: true, scale: 0.8 },
      lineNumbers: 'on',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      padding: { top: 16, bottom: 16 },
      renderLineHighlight: 'gutter',
      bracketPairColorization: { enabled: true },
    });

    return cleanup;
  };

  useEffect(() => {
    return () => destroy();
  }, [destroy]);

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] rounded-xl overflow-hidden border border-white/10">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 focus:ring-primary focus:border-primary"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {isReady && (
            <span className="flex items-center gap-2 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Connected
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            automaticLayout: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          }
        />

        {/* Remote cursors overlay */}
        {editorRef.current && <RemoteCursors editor={editorRef.current} />}
      </div>
    </div>
  );
}

export default CodeEditor;
```

---

### Step 4: Remote Cursors Component

Create `frontend/src/components/editor/RemoteCursors.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import type * as monaco from 'monaco-editor';

interface RemoteCursor {
  id: string;
  name: string;
  color: string;
  position: { lineNumber: number; column: number };
}

interface RemoteCursorsProps {
  editor: monaco.editor.IStandaloneCodeEditor;
}

export function RemoteCursors({ editor }: RemoteCursorsProps) {
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);

  useEffect(() => {
    // Decorations for remote cursors
    const decorations: string[] = [];

    const updateDecorations = () => {
      const newDecorations = cursors.map((cursor) => ({
        range: {
          startLineNumber: cursor.position.lineNumber,
          startColumn: cursor.position.column,
          endLineNumber: cursor.position.lineNumber,
          endColumn: cursor.position.column + 1,
        },
        options: {
          className: `remote-cursor-${cursor.id}`,
          afterContentClassName: 'remote-cursor-label',
          hoverMessage: { value: cursor.name },
          beforeContentClassName: `cursor-line-${cursor.color.replace('#', '')}`,
        },
      }));

      // Apply decorations
      editor.deltaDecorations(decorations, newDecorations as any);
    };

    updateDecorations();

    // Listen for cursor updates from WebSocket
    // This would be connected to the awareness protocol
    
  }, [cursors, editor]);

  return (
    <>
      {/* CSS for remote cursors */}
      <style jsx global>{`
        .remote-cursor-label::after {
          content: attr(data-username);
          position: absolute;
          top: -18px;
          left: 0;
          background: var(--cursor-color);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          white-space: nowrap;
          pointer-events: none;
        }

        ${cursors.map(
          (cursor) => `
          .cursor-line-${cursor.color.replace('#', '')} {
            border-left: 2px solid ${cursor.color};
            margin-left: -1px;
          }
        `
        )}
      `}</style>
    </>
  );
}
```

---

### Step 5: Editor Page

Create `frontend/src/app/room/[roomId]/editor/page.tsx`:

```tsx
'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const CodeEditor = dynamic(
  () => import('@/components/editor/CodeEditor'),
  { ssr: false }
);

export default function EditorPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  // Get user info (from Supabase auth or context)
  const username = 'User'; // Replace with actual user
  const userColor = '#8B5CF6'; // Random color for each user

  return (
    <div className="h-screen bg-background-dark p-4">
      <div className="h-full max-w-7xl mx-auto">
        <CodeEditor
          roomId={roomId}
          username={username}
          userColor={userColor}
        />
      </div>
    </div>
  );
}
```

---

## 🎨 Styling

Add to `globals.css`:

```css
/* Monaco Editor customizations */
.monaco-editor {
  --vscode-editorCursor-foreground: #8B5CF6 !important;
}

.monaco-editor .cursor {
  background: #8B5CF6 !important;
}

/* Remote cursor styles */
.remote-cursor-line {
  border-left: 2px solid var(--cursor-color);
  height: 100%;
  position: absolute;
}

.remote-cursor-label {
  position: absolute;
  top: -20px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  z-index: 100;
}
```

---

## ✅ Testing

1. Open `/room/test-room/editor` in two tabs
2. Type in one tab → should appear in other
3. Move cursor → should see remote cursor indicator
4. Try different languages with syntax highlighting

---

## 📝 Next Steps

After completing the code editor:
1. ✅ Real-time collaborative coding works
2. ✅ Multi-cursor support
3. → Proceed to [05_SHARED_CANVAS.md](./05_SHARED_CANVAS.md)

---

## 🔗 Resources

- [Monaco Editor React](https://github.com/suren-atoyan/monaco-react)
- [y-monaco](https://github.com/yjs/y-monaco)
- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
