'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string; role: 'user' | 'assistant'; content: string;
  strategy?: string; ts: number; error?: boolean;
}
interface Session { id: string; label: string; messages: Message[]; }

function newId() { return Math.random().toString(36).slice(2,10); }
function newSession(n: number): Session { return {id: newId(), label: `Chat ${n}`, messages: []}; }
function fmt(ts: number) { return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([newSession(1)]);
  const [activeId, setActiveId] = useState(() => sessions[0].id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const active = sessions.find(s => s.id === activeId) ?? sessions[0];

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [active.messages, loading]);
  useEffect(() => { textRef.current?.focus(); }, [activeId]);

  const addMsg = useCallback((sid: string, msg: Message) => {
    setSessions(prev => prev.map(s => s.id !== sid ? s : {
      ...s,
      messages: [...s.messages, msg],
      label: s.messages.length === 0 ? msg.content.slice(0,30)+'…' : s.label,
    }));
  }, []);

  const handleNew = () => {
    const s = newSession(sessions.length + 1);
    setSessions(prev => [...prev, s]);
    setActiveId(s.id);
    setSidebarOpen(false);
  };

  const handleDelete = (id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (!next.length) { const s = newSession(1); setActiveId(s.id); return [s]; }
      if (id === activeId) setActiveId(next[next.length-1].id);
      return next;
    });
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput(''); setLoading(true);
    const sid = activeId;
    addMsg(sid, {id: newId(), role:'user', content:text, ts:Date.now()});
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({message:text, session_id:sid}),
      });
      const data = await res.json();
      addMsg(sid, {id:newId(), role:'assistant',
        content: data.answer || data.error || 'No response.',
        strategy: data.strategy, ts: Date.now(), error: !res.ok});
    } catch {
      addMsg(sid, {id:newId(), role:'assistant', content:'Connection error.', ts:Date.now(), error:true});
    } finally { setLoading(false); }
  }, [input, loading, activeId, addMsg]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') setSidebarOpen(false);
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  return (
    <div style={{display:'flex',height:'100dvh',overflow:'hidden',background:'var(--bg)'}}>
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:40}} />
      )}

      {/* Sidebar */}
      <aside style={{
        width:'var(--sidebar-w)',flexShrink:0,display:'flex',flexDirection:'column',
        borderRight:'1px solid var(--border)',background:'var(--bg-subtle)',
        position: sidebarOpen ? 'fixed' : undefined,
        top:0,left:0,bottom:0,zIndex:50,
        transform: sidebarOpen ? 'none' : undefined,
      }}>
        <div style={{padding:'16px 14px 10px',display:'flex',alignItems:'center',
          justifyContent:'space-between',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:28,borderRadius:8,background:'var(--accent)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:'.75rem',fontWeight:700,color:'var(--accent-fg)'}}>J</div>
            <span style={{fontWeight:700,fontSize:'.9rem',color:'var(--text)'}}>JAS</span>
          </div>
          <button onClick={handleNew}
            style={{padding:'5px 10px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',
              background:'transparent',color:'var(--text-2)',cursor:'pointer',fontSize:'.8rem'}}
          >+ New</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'6px'}}>
          {sessions.map(s => (
            <div key={s.id} style={{display:'flex',alignItems:'center',
              borderRadius:'var(--radius-sm)',marginBottom:2,
              background: s.id===activeId ? 'var(--bg-hover)' : 'transparent'}}>
              <button onClick={() => { setActiveId(s.id); setSidebarOpen(false); }}
                style={{flex:1,textAlign:'left',padding:'8px 10px',fontSize:'.85rem',
                  color: s.id===activeId ? 'var(--text)' : 'var(--text-2)',
                  fontWeight: s.id===activeId ? 600 : 400,
                  background:'none',border:'none',cursor:'pointer',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {s.label}
              </button>
              <button onClick={() => handleDelete(s.id)}
                style={{padding:'4px 6px',marginRight:4,background:'none',border:'none',
                  cursor:'pointer',color:'var(--text-3)',fontSize:'.75rem'}}>✕</button>
            </div>
          ))}
        </div>
        <div style={{padding:'10px 14px',borderTop:'1px solid var(--border)',
          fontSize:'.72rem',color:'var(--text-3)'}}>JAS · Deterministic AI</div>
      </aside>

      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        {/* Mobile topbar */}
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',
          borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
          <button onClick={() => setSidebarOpen(v => !v)}
            style={{padding:'6px 8px',background:'none',border:'none',cursor:'pointer',color:'var(--text-2)'}}>
            ☰
          </button>
          <span style={{fontWeight:600,fontSize:'.95rem'}}>{active.label}</span>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 0 8px'}}>
          {active.messages.length === 0 && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',
              justifyContent:'center',gap:12,padding:'60px 24px',textAlign:'center'}}>
              <div style={{width:52,height:52,borderRadius:14,background:'var(--accent)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:'1.4rem',color:'var(--accent-fg)'}}>J</div>
              <p style={{fontWeight:600,fontSize:'1.1rem',color:'var(--text)'}}>Ask JAS anything</p>
              <p style={{fontSize:'.875rem',color:'var(--text-3)',maxWidth:300,lineHeight:1.6}}>
                Deterministic reasoning over 5M+ facts. No hallucination.
              </p>
              {['what is react','run typescript check','react vs nextjs'].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  style={{padding:'5px 14px',borderRadius:99,border:'1px solid var(--border)',
                    background:'none',color:'var(--text-2)',cursor:'pointer',fontSize:'.78rem'}}>
                  {q}
                </button>
              ))}
            </div>
          )}
          {active.messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className="msg-in"
                style={{display:'flex',flexDirection: isUser ? 'row-reverse' : 'row',
                  gap:10,padding:'4px 16px',maxWidth:'100%'}}>
                <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,
                  background: isUser ? 'var(--user-bg)' : 'var(--bg-hover)',
                  border:'1px solid var(--border)',display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:'.7rem',fontWeight:700,
                  color: isUser ? 'var(--user-fg)' : 'var(--text-2)'}}>
                  {isUser ? 'U' : 'J'}
                </div>
                <div style={{maxWidth:'min(72%,640px)',minWidth:0}}>
                  <div style={{background: isUser ? 'var(--user-bg)' : m.error ? 'rgba(239,68,68,.08)' : 'var(--bot-bg)',
                    color: isUser ? 'var(--user-fg)' : m.error ? '#ef4444' : 'var(--bot-fg)',
                    borderRadius: isUser ? 'var(--radius) var(--radius) 4px var(--radius)'
                                       : 'var(--radius) var(--radius) var(--radius) 4px',
                    padding:'10px 14px',fontSize:'.9rem',lineHeight:1.65,wordBreak:'break-word',
                    border: m.error ? '1px solid rgba(239,68,68,.2)' : 'none'}}>
                    {m.content}
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginTop:3,
                    flexDirection: isUser ? 'row-reverse' : 'row'}}>
                    <span style={{fontSize:'.7rem',color:'var(--text-3)'}}>{fmt(m.ts)}</span>
                    {m.strategy && !isUser && (
                      <span style={{fontSize:'.67rem',color:'var(--text-3)',
                        background:'var(--bg-hover)',border:'1px solid var(--border)',
                        borderRadius:99,padding:'1px 6px'}}>{m.strategy}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{display:'flex',gap:10,padding:'4px 16px',alignItems:'flex-end'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--bg-hover)',
                border:'1px solid var(--border)',display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:'.7rem',fontWeight:700,color:'var(--text-2)'}}>J</div>
              <div style={{background:'var(--bot-bg)',borderRadius:'var(--radius) var(--radius) var(--radius) 4px',
                padding:'12px 16px',display:'flex',gap:5,alignItems:'center'}}>
                <span className="dot"/><span className="dot"/><span className="dot"/>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{borderTop:'1px solid var(--border)',background:'var(--surface)',padding:'12px 16px 14px'}}>
          <div style={{display:'flex',gap:10,alignItems:'flex-end',background:'var(--bg-subtle)',
            border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'4px 4px 4px 14px'}}>
            <textarea ref={textRef} value={input} onChange={autoResize} onKeyDown={onKey}
              disabled={loading}
              placeholder="Ask JAS… (Enter to send, Shift+Enter for newline)"
              rows={1}
              style={{flex:1,background:'none',border:'none',outline:'none',resize:'none',
                fontSize:'.9rem',color:'var(--text)',lineHeight:1.6,padding:'8px 0',
                maxHeight:160,overflowY:'auto',fontFamily:'var(--font)'}} />
            <button onClick={handleSend} disabled={loading || !input.trim()}
              style={{padding:'8px 14px',borderRadius:'calc(var(--radius) - 4px)',
                background: loading || !input.trim() ? 'var(--bg-hover)' : 'var(--accent)',
                color: loading || !input.trim() ? 'var(--text-3)' : 'var(--accent-fg)',
                border:'none',cursor: loading || !input.trim() ? 'default' : 'pointer',
                fontSize:'.85rem',fontWeight:600,transition:'background var(--transition)',
                flexShrink:0,alignSelf:'flex-end',marginBottom:2}}>
              {loading ? '…' : '↑'}
            </button>
          </div>
          <p style={{fontSize:'.7rem',color:'var(--text-3)',marginTop:5,paddingLeft:2}}>
            Shift+Enter for newline · Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
