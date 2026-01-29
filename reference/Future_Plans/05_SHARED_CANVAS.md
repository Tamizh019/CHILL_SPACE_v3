# 05 - Shared Canvas / Whiteboard (Tldraw)

> Implement a collaborative whiteboard using Tldraw for visual brainstorming.

---

## 🎯 Objective

Build a shared canvas featuring:
- Real-time collaborative drawing
- Shapes, text, arrows, freehand
- Sticky notes for ideas
- Image uploads
- Infinite canvas with zoom/pan
- Export as PNG/SVG

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Tldraw Canvas                         │
│  - Shapes stored as Y.Map                               │
│  - Real-time sync via yrs                               │
│  - Cursor awareness for collaboration                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Y.js + Tldraw Binding                       │
│  - @tldraw/yjs for sync                                 │
│  - Awareness for user presence                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Rust Backend (yrs)                      │
│  - Persists canvas state                                │
│  - Broadcasts shape updates                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Frontend Dependencies

```bash
npm install tldraw @tldraw/yjs yjs
```

---

## 📁 File Structure

```
frontend/src/
├── components/
│   └── canvas/
│       ├── SharedCanvas.tsx     # Main canvas component
│       ├── CanvasToolbar.tsx    # Custom toolbar
│       └── UserCursors.tsx      # Show collaborator cursors
├── hooks/
│   └── useTldrawYjs.ts          # Tldraw + Y.js binding
└── lib/
    └── canvas-config.ts         # Canvas themes/settings
```

---

## 🔧 Implementation Steps

### Step 1: Canvas Configuration

Create `frontend/src/lib/canvas-config.ts`:

```typescript
import { TLUiOverrides, TLUiActionsContextType } from 'tldraw';

// Dark theme colors matching Chill Space
export const CANVAS_THEME = {
  background: '#0A0A0A',
  grid: '#1F1F1F',
  selection: '#8B5CF6',
  cursor: '#8B5CF6',
};

// User colors for collaboration
export const USER_COLORS = [
  '#8B5CF6', // Violet (primary)
  '#0EA5E9', // Cyan
  '#22C55E', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

// Custom UI overrides
export const uiOverrides: TLUiOverrides = {
  actions(editor, actions): TLUiActionsContextType {
    // Add custom actions here
    return actions;
  },
};
```

---

### Step 2: Y.js + Tldraw Hook

Create `frontend/src/hooks/useTldrawYjs.ts`:

```typescript
import { useEffect, useMemo, useCallback } from 'react';
import { TLRecord, TLStoreWithStatus, createTLStore, defaultShapeUtils } from 'tldraw';
import * as Y from 'yjs';
import { getRandomColor } from '@/lib/canvas-config';

interface UseTldrawYjsProps {
  roomId: string;
  wsUrl: string;
  username: string;
}

export function useTldrawYjs({ roomId, wsUrl, username }: UseTldrawYjsProps) {
  // Create Y.js document
  const yDoc = useMemo(() => new Y.Doc(), []);
  
  // Y.Map to store Tldraw records
  const yStore = useMemo(() => yDoc.getMap<TLRecord>('tldraw'), [yDoc]);
  
  // Awareness for user presence
  const userColor = useMemo(() => getRandomColor(), []);

  // Create TLStore with Y.js binding
  const store = useMemo((): TLStoreWithStatus => {
    const baseStore = createTLStore({
      shapeUtils: defaultShapeUtils,
    });

    // Sync from Y.js to TLStore
    const syncFromYjs = () => {
      const records: TLRecord[] = [];
      yStore.forEach((value, key) => {
        records.push(value);
      });
      baseStore.mergeRemoteChanges(() => {
        baseStore.put(records);
      });
    };

    // Listen for Y.js changes
    yStore.observe((event) => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const record = yStore.get(key);
          if (record) {
            baseStore.mergeRemoteChanges(() => {
              baseStore.put([record]);
            });
          }
        } else if (change.action === 'delete') {
          baseStore.mergeRemoteChanges(() => {
            baseStore.remove([key as any]);
          });
        }
      });
    });

    // Sync from TLStore to Y.js
    baseStore.listen(({ changes }) => {
      yDoc.transact(() => {
        Object.values(changes.added).forEach((record) => {
          yStore.set(record.id, record);
        });
        Object.values(changes.updated).forEach(([_, record]) => {
          yStore.set(record.id, record);
        });
        Object.values(changes.removed).forEach((record) => {
          yStore.delete(record.id);
        });
      });
    });

    return {
      store: baseStore,
      status: 'synced-local',
    };
  }, [yDoc, yStore]);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`${wsUrl}?room=${roomId}&type=canvas`);

    ws.onopen = () => {
      // Request sync
      ws.send(JSON.stringify({
        type: 'SyncRequest',
        payload: { doc_id: roomId, doc_type: 'canvas' }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === 'SyncResponse' || msg.type === 'Update') {
        const update = new Uint8Array(msg.payload.update || msg.payload.state);
        Y.applyUpdate(yDoc, update, 'remote');
      }
    };

    // Send local updates
    yDoc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'Update',
          payload: {
            doc_id: roomId,
            doc_type: 'canvas',
            update: Array.from(update)
          }
        }));
      }
    });

    return () => {
      ws.close();
    };
  }, [roomId, wsUrl, yDoc]);

  // User presence info
  const userPresence = useMemo(() => ({
    id: yDoc.clientID.toString(),
    name: username,
    color: userColor,
  }), [yDoc.clientID, username, userColor]);

  return { store, userPresence };
}
```

---

### Step 3: Shared Canvas Component

Create `frontend/src/components/canvas/SharedCanvas.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Tldraw,
  Editor,
  exportToBlob,
  TLUiComponents,
} from 'tldraw';
import 'tldraw/tldraw.css';
import { useTldrawYjs } from '@/hooks/useTldrawYjs';
import { CANVAS_THEME } from '@/lib/canvas-config';

interface SharedCanvasProps {
  roomId: string;
  username: string;
}

export function SharedCanvas({ roomId, username }: SharedCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  
  const { store, userPresence } = useTldrawYjs({
    roomId,
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
    username,
  });

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
    
    // Set dark background
    editor.user.updateUserPreferences({
      isDarkMode: true,
      colorScheme: 'dark',
    });
  }, []);

  // Export canvas as image
  const exportCanvas = useCallback(async () => {
    if (!editor) return;
    
    const shapes = editor.getCurrentPageShapes();
    if (shapes.length === 0) {
      alert('No shapes to export');
      return;
    }

    const blob = await exportToBlob({
      editor,
      format: 'png',
      ids: shapes.map((s) => s.id),
    });

    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-${roomId}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editor, roomId]);

  // Custom components with our styling
  const components: TLUiComponents = {
    // Customize or hide default components
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] rounded-xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-medium">Shared Canvas</h3>
          <span className="text-xs text-gray-500">
            Room: {roomId.slice(0, 8)}...
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* User presence indicators */}
          <div
            className="w-6 h-6 rounded-full border-2 border-black"
            style={{ backgroundColor: userPresence.color }}
            title={userPresence.name}
          />
          
          <button
            onClick={exportCanvas}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
          >
            Export PNG
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <Tldraw
          store={store}
          onMount={handleMount}
          components={components}
          hideUi={false}
        />

        {/* Custom overlay styles */}
        <style jsx global>{`
          .tl-background {
            background-color: ${CANVAS_THEME.background} !important;
          }
          
          .tl-grid {
            stroke: ${CANVAS_THEME.grid} !important;
          }
          
          .tl-selection__fg {
            stroke: ${CANVAS_THEME.selection} !important;
          }
          
          /* Hide default dark mode toggle */
          [data-testid="main.menu"] button[data-testid*="color-scheme"] {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}

export default SharedCanvas;
```

---

### Step 4: Canvas Page

Create `frontend/src/app/room/[roomId]/canvas/page.tsx`:

```tsx
'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Avoid SSR for Tldraw
const SharedCanvas = dynamic(
  () => import('@/components/canvas/SharedCanvas'),
  { ssr: false }
);

export default function CanvasPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const username = 'User'; // From auth context

  return (
    <div className="h-screen bg-background-dark p-4">
      <div className="h-full max-w-7xl mx-auto">
        <SharedCanvas roomId={roomId} username={username} />
      </div>
    </div>
  );
}
```

---

### Step 5: Rust Backend - Canvas Document Type

Add to `backend/src/crdt/document.rs`:

```rust
/// Different document types
pub enum DocumentType {
    Text,    // For code editor
    Canvas,  // For whiteboard (stores shapes as JSON)
}

impl DocumentStore {
    /// Get or create a canvas document
    pub fn get_or_create_canvas(&self, doc_id: Uuid) -> Doc {
        self.documents
            .entry(doc_id)
            .or_insert_with(|| {
                let doc = Doc::new();
                // Canvas uses Y.Map for shapes
                let _ = doc.get_or_insert_map("shapes");
                tracing::info!("Created new canvas document: {}", doc_id);
                doc
            })
            .clone()
    }
}
```

---

## 🎨 Canvas Theme

Add to `globals.css`:

```css
/* Tldraw overrides for Chill Space theme */
.tldraw {
  --color-background: #0A0A0A !important;
  --color-muted-1: #1F1F1F !important;
  --color-primary: #8B5CF6 !important;
  --color-selection-fill: rgba(139, 92, 246, 0.2) !important;
  --color-selection-stroke: #8B5CF6 !important;
}

.tldraw__editor {
  background: #0A0A0A !important;
}

/* Grid pattern */
.tl-grid-dot {
  fill: #2A2A2A !important;
}
```

---

## ✅ Features Checklist

- [x] Real-time shape sync
- [x] Multi-user collaboration
- [x] Dark theme matching design
- [x] Export to PNG
- [x] User presence indicators
- [ ] Undo/redo per user
- [ ] Shape locking
- [ ] Comments on shapes

---

## 📝 Next Steps

After completing the canvas:
1. ✅ Collaborative whiteboard works
2. ✅ Shapes sync in real-time
3. → Proceed to [06_CODE_EXECUTION.md](./06_CODE_EXECUTION.md)

---

## 🔗 Resources

- [Tldraw Documentation](https://tldraw.dev/)
- [Tldraw + Yjs Example](https://github.com/tldraw/tldraw-yjs-example)
- [Y.js Shared Types](https://docs.yjs.dev/api/shared-types)
