# 09 - Voice & Video Rooms (WebRTC)

> Add real-time voice and video calls to study rooms.

---

## 🎯 Objective

- Voice chat in study rooms
- Video conferencing
- Screen sharing
- Peer-to-peer with Rust signaling server

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   User A        │◄───────►│   User B        │
│   (Browser)     │  WebRTC │   (Browser)     │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    Signaling (WebSocket)  │
         └───────────┬───────────────┘
                     ▼
         ┌─────────────────────┐
         │  Rust Backend       │
         │  (Signaling Server) │
         └─────────────────────┘
```

---

## 📦 Dependencies

**Frontend:**
```bash
npm install simple-peer @types/simple-peer
```

**Backend (Cargo.toml):**
```toml
# WebRTC signaling is just WebSocket messages
# No additional crates needed beyond existing ws setup
```

---

## 🔧 Implementation

### Signaling Messages (Rust)

```rust
// src/ws/messages.rs - add these
#[derive(Debug, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum RTCClientMessage {
    JoinCall { room_id: Uuid },
    LeaveCall,
    Offer { target_id: Uuid, sdp: String },
    Answer { target_id: Uuid, sdp: String },
    IceCandidate { target_id: Uuid, candidate: String },
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum RTCServerMessage {
    UserJoinedCall { user_id: Uuid, username: String },
    UserLeftCall { user_id: Uuid },
    Offer { from_id: Uuid, sdp: String },
    Answer { from_id: Uuid, sdp: String },
    IceCandidate { from_id: Uuid, candidate: String },
    CallParticipants { users: Vec<Uuid> },
}
```

### WebRTC Hook (Frontend)

```typescript
// hooks/useWebRTC.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';

interface Peer {
  id: string;
  peer: SimplePeer.Instance;
  stream?: MediaStream;
}

export function useWebRTC(roomId: string, wsUrl: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [isInCall, setIsInCall] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const joinCall = useCallback(async () => {
    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true, audio: true
    });
    setLocalStream(stream);

    // Connect WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'JoinCall', payload: { room_id: roomId } }));
      setIsInCall(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      handleSignal(msg, stream);
    };
  }, [roomId, wsUrl]);

  const handleSignal = (msg: any, stream: MediaStream) => {
    switch (msg.type) {
      case 'UserJoinedCall':
        // Create offer for new user
        createPeer(msg.payload.user_id, true, stream);
        break;
      case 'Offer':
        // Answer incoming offer
        createPeer(msg.payload.from_id, false, stream, msg.payload.sdp);
        break;
      case 'Answer':
        peers.get(msg.payload.from_id)?.peer.signal({ type: 'answer', sdp: msg.payload.sdp });
        break;
      case 'IceCandidate':
        peers.get(msg.payload.from_id)?.peer.signal({ candidate: JSON.parse(msg.payload.candidate) });
        break;
    }
  };

  const createPeer = (userId: string, initiator: boolean, stream: MediaStream, offer?: string) => {
    const peer = new SimplePeer({ initiator, stream, trickle: true });

    peer.on('signal', (data) => {
      if (data.type === 'offer') {
        wsRef.current?.send(JSON.stringify({
          type: 'Offer', payload: { target_id: userId, sdp: data.sdp }
        }));
      } else if (data.type === 'answer') {
        wsRef.current?.send(JSON.stringify({
          type: 'Answer', payload: { target_id: userId, sdp: data.sdp }
        }));
      } else if (data.candidate) {
        wsRef.current?.send(JSON.stringify({
          type: 'IceCandidate', payload: { target_id: userId, candidate: JSON.stringify(data.candidate) }
        }));
      }
    });

    peer.on('stream', (remoteStream) => {
      setPeers(prev => new Map(prev.set(userId, { ...prev.get(userId)!, stream: remoteStream })));
    });

    if (offer) peer.signal({ type: 'offer', sdp: offer });

    setPeers(prev => new Map(prev.set(userId, { id visitation: userId, peer })));
  };

  const leaveCall = useCallback(() => {
    localStream?.getTracks().forEach(t => t.stop());
    peers.forEach(p => p.peer.destroy());
    wsRef.current?.close();
    setIsInCall(false);
    setLocalStream(null);
    setPeers(new Map());
  }, [localStream, peers]);
  
  const toggleMute = () => localStream?.getAudioTracks().forEach(t => t.enabled = !t.enabled);
  const toggleVideo = () => localStream?.getVideoTracks().forEach(t => t.enabled = !t.enabled);

  return { localStream, peers, isInCall, joinCall, leaveCall, toggleMute, toggleVideo };
}
```

### Video Grid Component

```tsx
// components/call/VideoGrid.tsx
'use client';
import { useWebRTC } from '@/hooks/useWebRTC';

export function VideoGrid({ roomId }: { roomId: string }) {
  const { localStream, peers, isInCall, joinCall, leaveCall, toggleMute, toggleVideo } = useWebRTC(
    roomId, 'ws://localhost:8080/ws'
  );

  return (
    <div className="flex flex-col h-full">
      {!isInCall ? (
        <button onClick={joinCall} className="px-6 py-3 bg-primary rounded-xl">
          📹 Join Call
        </button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Local video */}
            <div className="relative bg-black rounded-xl overflow-hidden">
              <video ref={(el) => el && localStream && (el.srcObject = localStream)} 
                autoPlay muted className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-white text-sm">You</span>
            </div>
            {/* Remote videos */}
            {Array.from(peers.values()).map((p) => (
              <div key={p.id} className="relative bg-black rounded-xl overflow-hidden">
                <video ref={(el) => el && p.stream && (el.srcObject = p.stream)}
                  autoPlay className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 py-4">
            <button onClick={toggleMute} className="p-3 bg-white/10 rounded-full">🎤</button>
            <button onClick={toggleVideo} className="p-3 bg-white/10 rounded-full">📹</button>
            <button onClick={leaveCall} className="p-3 bg-red-500 rounded-full">📞</button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 🔒 TURN Server (Production)

For NAT traversal in production, use a TURN server:

```typescript
const peer = new SimplePeer({
  initiator,
  stream,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
    ]
  }
});
```

---

## ✅ Features

- [x] Voice chat
- [x] Video calls
- [x] Mute/unmute
- [ ] Screen sharing
- [ ] Recording
- [ ] Virtual backgrounds

---

## 🔗 Resources

- [Simple Peer](https://github.com/feross/simple-peer)
- [WebRTC Guide](https://webrtc.org/getting-started/overview)
