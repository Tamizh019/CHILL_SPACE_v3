# 03 - CRDT Collaboration Engine (yrs)

> Implement conflict-free real-time collaboration using CRDTs (Conflict-free Replicated Data Types).

---

## 🎯 Objective

Integrate the `yrs` crate (Rust port of Y.js) to enable:
- Conflict-free collaborative text editing
- Automatic merging of concurrent edits
- Offline support with sync on reconnect
- Undo/redo per user
- Awareness protocol for cursor positions

---

## 🧠 What is CRDT?

**CRDT** = Conflict-free Replicated Data Type

Unlike traditional sync where a central server resolves conflicts, CRDTs mathematically guarantee that:
- All users converge to the same state
- Edits can happen offline and merge later
- No data loss, ever

```
User A: Types "Hello"     ───────┐
                                 ├──► CRDT Merge ──► "Hello World!"
User B: Types " World!" (same time)──┘

No conflicts! Both edits preserved automatically.
```

---

## 📦 Dependencies

Add to `backend/Cargo.toml`:

```toml
[dependencies]
# ... existing dependencies ...

# CRDT
yrs = "0.18"
y-sync = "0.5"
```

---

## 📁 File Structure

```
backend/src/
├── crdt/
│   ├── mod.rs           # Module export
│   ├── document.rs      # Document management
│   └── sync.rs          # Sync protocol handler
```

---

## 🔧 Implementation Steps

### Step 1: Document Store

Create `backend/src/crdt/document.rs`:

```rust
use dashmap::DashMap;
use std::sync::Arc;
use uuid::Uuid;
use yrs::{Doc, ReadTxn, StateVector, Text, Transact, Update, WriteTxn};

/// Manages CRDT documents for rooms
#[derive(Clone)]
pub struct DocumentStore {
    /// Map of document_id → Yrs Document
    documents: Arc<DashMap<Uuid, Doc>>,
}

impl DocumentStore {
    pub fn new() -> Self {
        Self {
            documents: Arc::new(DashMap::new()),
        }
    }

    /// Get or create a document for a room
    pub fn get_or_create(&self, doc_id: Uuid) -> Doc {
        self.documents
            .entry(doc_id)
            .or_insert_with(|| {
                let doc = Doc::new();
                // Initialize with a shared text type called "content"
                {
                    let text = doc.get_or_insert_text("content");
                    let mut txn = doc.transact_mut();
                    // Document starts empty
                }
                tracing::info!("Created new CRDT document: {}", doc_id);
                doc
            })
            .clone()
    }

    /// Apply an update from a client
    pub fn apply_update(&self, doc_id: Uuid, update: &[u8]) -> Result<Vec<u8>, String> {
        if let Some(doc) = self.documents.get(&doc_id) {
            let update = Update::decode_v1(update).map_err(|e| e.to_string())?;
            let mut txn = doc.transact_mut();
            txn.apply_update(update);
            
            // Return the full state for broadcasting
            let state = txn.encode_state_as_update_v1(&StateVector::default());
            Ok(state)
        } else {
            Err("Document not found".to_string())
        }
    }

    /// Get current document state for new clients
    pub fn get_state(&self, doc_id: Uuid) -> Option<Vec<u8>> {
        self.documents.get(&doc_id).map(|doc| {
            let txn = doc.transact();
            txn.encode_state_as_update_v1(&StateVector::default())
        })
    }

    /// Get state vector for incremental sync
    pub fn get_state_vector(&self, doc_id: Uuid) -> Option<Vec<u8>> {
        self.documents.get(&doc_id).map(|doc| {
            let txn = doc.transact();
            txn.state_vector().encode_v1()
        })
    }

    /// Get incremental update from a state vector
    pub fn get_update_since(&self, doc_id: Uuid, state_vector: &[u8]) -> Option<Vec<u8>> {
        self.documents.get(&doc_id).map(|doc| {
            let sv = StateVector::decode_v1(state_vector).unwrap_or_default();
            let txn = doc.transact();
            txn.encode_state_as_update_v1(&sv)
        })
    }

    /// Get text content as string (for debugging/storage)
    pub fn get_text_content(&self, doc_id: Uuid) -> Option<String> {
        self.documents.get(&doc_id).map(|doc| {
            let txn = doc.transact();
            let text = doc.get_or_insert_text("content");
            text.get_string(&txn)
        })
    }
}

impl Default for DocumentStore {
    fn default() -> Self {
        Self::new()
    }
}
```

---

### Step 2: Sync Protocol

Create `backend/src/crdt/sync.rs`:

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::document::DocumentStore;

/// CRDT sync message types
#[derive(Debug, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum CrdtClientMessage {
    /// Request full sync on join
    SyncRequest { doc_id: Uuid },
    
    /// Incremental sync with state vector
    SyncStep1 { doc_id: Uuid, state_vector: Vec<u8> },
    
    /// Apply local update
    Update { doc_id: Uuid, update: Vec<u8> },
    
    /// Awareness update (cursor position, selection, etc.)
    Awareness { doc_id: Uuid, client_id: u64, state: Vec<u8> },
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum CrdtServerMessage {
    /// Full document state
    SyncResponse { doc_id: Uuid, state: Vec<u8> },
    
    /// Incremental update
    SyncStep2 { doc_id: Uuid, update: Vec<u8> },
    
    /// Broadcast update to all clients
    Update { doc_id: Uuid, update: Vec<u8> },
    
    /// Broadcast awareness
    Awareness { doc_id: Uuid, client_id: u64, state: Vec<u8> },
}

/// Handle CRDT sync messages
pub struct CrdtSyncHandler {
    doc_store: DocumentStore,
}

impl CrdtSyncHandler {
    pub fn new(doc_store: DocumentStore) -> Self {
        Self { doc_store }
    }

    pub fn handle_message(&self, msg: CrdtClientMessage) -> Option<CrdtServerMessage> {
        match msg {
            CrdtClientMessage::SyncRequest { doc_id } => {
                let _ = self.doc_store.get_or_create(doc_id);
                self.doc_store.get_state(doc_id).map(|state| {
                    CrdtServerMessage::SyncResponse { doc_id, state }
                })
            }
            
            CrdtClientMessage::SyncStep1 { doc_id, state_vector } => {
                self.doc_store.get_update_since(doc_id, &state_vector).map(|update| {
                    CrdtServerMessage::SyncStep2 { doc_id, update }
                })
            }
            
            CrdtClientMessage::Update { doc_id, update } => {
                match self.doc_store.apply_update(doc_id, &update) {
                    Ok(_) => Some(CrdtServerMessage::Update { doc_id, update }),
                    Err(e) => {
                        tracing::error!("Failed to apply CRDT update: {}", e);
                        None
                    }
                }
            }
            
            CrdtClientMessage::Awareness { doc_id, client_id, state } => {
                // Just broadcast awareness to other clients
                Some(CrdtServerMessage::Awareness { doc_id, client_id, state })
            }
        }
    }
}
```

---

### Step 3: Module Export

Create `backend/src/crdt/mod.rs`:

```rust
pub mod document;
pub mod sync;

pub use document::DocumentStore;
pub use sync::{CrdtClientMessage, CrdtServerMessage, CrdtSyncHandler};
```

---

### Step 4: Integrate with WebSocket Handler

Update `backend/src/ws/handler.rs` to include CRDT:

```rust
// Add to existing imports
use crate::crdt::{CrdtClientMessage, CrdtSyncHandler, DocumentStore};

#[derive(Clone)]
pub struct WsState {
    pub room_manager: RoomManager,
    pub doc_store: DocumentStore,
    pub crdt_handler: Arc<CrdtSyncHandler>,
}

// In handle_socket, add CRDT message handling:
// After parsing ClientMessage, also try parsing CRDT messages:

// ... existing ClientMessage handling ...

// Handle CRDT messages
if let Ok(crdt_msg) = serde_json::from_str::<CrdtClientMessage>(&text) {
    if let Some(response) = state.crdt_handler.handle_message(crdt_msg) {
        // For updates, broadcast to room
        if let CrdtServerMessage::Update { doc_id, update } = &response {
            room_manager.broadcast(
                *doc_id, // assuming doc_id matches room_id
                ServerMessage::CrdtUpdate { 
                    doc_id: *doc_id, 
                    update: update.clone() 
                },
            );
        } else {
            // Send directly to client
            let _ = internal_tx_clone.send(/* convert to ServerMessage */).await;
        }
    }
}
```

---

## 🖥️ Frontend Integration

### Install y.js:

```bash
npm install yjs y-websocket
```

### React Hook for CRDT:

```typescript
// hooks/useCrdt.ts
import { useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';

export function useCrdt(roomId: string, wsUrl: string) {
  const docRef = useRef<Y.Doc | null>(null);
  const textRef = useRef<Y.Text | null>(null);

  useEffect(() => {
    // Create Y.js document
    const doc = new Y.Doc();
    docRef.current = doc;

    // Get the shared text type
    const text = doc.getText('content');
    textRef.current = text;

    // Set up WebSocket sync
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Request sync
      ws.send(JSON.stringify({
        type: 'SyncRequest',
        payload: { doc_id: roomId }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === 'SyncResponse' || msg.type === 'SyncStep2') {
        const update = new Uint8Array(msg.payload.state || msg.payload.update);
        Y.applyUpdate(doc, update);
      }
      
      if (msg.type === 'Update') {
        const update = new Uint8Array(msg.payload.update);
        Y.applyUpdate(doc, update);
      }
    };

    // Send local updates to server
    doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'Update',
          payload: {
            doc_id: roomId,
            update: Array.from(update)
          }
        }));
      }
    });

    return () => {
      ws.close();
      doc.destroy();
    };
  }, [roomId, wsUrl]);

  const insert = useCallback((index: number, content: string) => {
    textRef.current?.insert(index, content);
  }, []);

  const getText = useCallback(() => {
    return textRef.current?.toString() || '';
  }, []);

  return { doc: docRef.current, text: textRef.current, insert, getText };
}
```

---

## ✅ Testing

### Test CRDT sync:

1. Open two browser tabs
2. Both join the same room
3. Type in one tab → should appear in the other
4. Type simultaneously → no conflicts!

### Test offline:

1. Disconnect one tab's network
2. Type in both tabs
3. Reconnect → all changes merge

---

## 📝 Next Steps

After completing CRDT integration:
1. ✅ Conflict-free text editing works
2. ✅ Multiple users can edit simultaneously
3. → Proceed to [04_CODE_EDITOR.md](./04_CODE_EDITOR.md)

---

## 🔗 Resources

- [Y.js Documentation](https://docs.yjs.dev/)
- [yrs Crate Docs](https://docs.rs/yrs/latest/yrs/)
- [CRDT Explained](https://crdt.tech/)
