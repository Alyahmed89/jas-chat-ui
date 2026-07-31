import { NextRequest, NextResponse } from 'next/server';
const ENGINE = process.env.ENGINE_URL ?? 'https://prolog.anyapp.cfd/chat';
export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(ENGINE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
  const data: any = await res.json();
  return NextResponse.json({ answer: String(data?.data?.answer ?? ''), sessionId: String(data?.session_id ?? '') });
}
