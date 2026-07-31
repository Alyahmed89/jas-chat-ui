'use client';
import { useState } from 'react';

interface Message { id: string; role: 'user' | 'assistant'; content: string; }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { id: String(Date.now()), role: 'user', content: text }]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { id: String(Date.now() + 1), role: 'assistant', content: String(data.answer ?? '') }]);
    } finally { setBusy(false); }
  }

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: 16, borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>JAS Chat</header>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ textAlign: m.role === 'user' ? 'right' : 'left', margin: '8px 0' }}>
            <span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 12, background: '#f3f4f6' }}>{m.content}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #e5e7eb' }}>
        <input style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }}
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Message JAS..." />
        <button style={{ padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 0 }}
          onClick={send} disabled={busy}>Send</button>
      </div>
    </main>
  );
}
