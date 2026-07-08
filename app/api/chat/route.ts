import { NextRequest, NextResponse } from 'next/server';

const JAS_URL = process.env.JAS_URL || 'https://prolog.anyapp.cfd';

export async function POST(req: NextRequest) {
  try {
    const { message, session_id } = await req.json();
    if (!message?.trim()) return NextResponse.json({error:'message required'},{status:400});
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(`${JAS_URL}/chat`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({text:message.trim(), session_id: session_id||'default'}),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return NextResponse.json({error:`JAS ${res.status}`},{status:502});
    const data = await res.json();
    return NextResponse.json({
      answer:   data.data?.answer   ?? data.answer   ?? '',
      strategy: data.data?.strategy ?? data.strategy ?? 'unknown',
      session_id: session_id || 'default',
      latency_ms: data.latency_ms,
    });
  } catch(e: any) {
    if (e?.name === 'AbortError') return NextResponse.json({error:'JAS timeout'},{status:504});
    return NextResponse.json({error:String(e)},{status:500});
  }
}
