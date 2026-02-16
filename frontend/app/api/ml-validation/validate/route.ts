import { NextResponse } from 'next/server';

// Proxy route to forward multipart/form-data POSTs to the ML validation service.
// Uses NEXT_PUBLIC_ML_VALIDATION_URL if set, otherwise falls back to a stable default.

const DEFAULT_TARGET = 'https://ownquestaagents-production.up.railway.app/ml-validation/validate';

export async function POST(req: Request) {
  const target = process.env.NEXT_PUBLIC_ML_VALIDATION_URL || DEFAULT_TARGET;

  try {
    // log the target for easier debugging when proxying fails
    console.log('[ml-validation proxy] forwarding request to target:', target);
    // Read raw body as ArrayBuffer and forward along with content-type
    const body = await req.arrayBuffer();
    const contentType = req.headers.get('content-type') || undefined;

    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        ...(contentType ? { 'content-type': contentType } : {})
      },
      body
    });

    const responseBody = await res.arrayBuffer();
    const headers: Record<string, string> = {};
    // copy a few useful headers
    const ct = res.headers.get('content-type');
    if (ct) headers['content-type'] = ct;

    return new NextResponse(responseBody, {
      status: res.status,
      headers
    });
  } catch (err: any) {
    console.error('[ml-validation proxy] Proxy to validation service failed. target=', target, err);
    return NextResponse.json({ error: 'Proxy error', message: String(err?.message || err), target }, { status: 502 });
  }
}
