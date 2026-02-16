import { NextResponse } from 'next/server';

// Proxy route for validation Q&A functionality
const DEFAULT_TARGET = 'https://ownquestaagents-production.up.railway.app/validation/question';

export async function POST(req: Request) {
  const target = process.env.NEXT_PUBLIC_ML_VALIDATION_URL?.replace('/ml-validation/validate', '/validation/question') || DEFAULT_TARGET;

  try {
    console.log('[validation/question proxy] forwarding request to target:', target);
    const body = await req.json();

    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status}`);
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[validation/question proxy] Proxy to validation Q&A service failed. target=', target, err);
    return NextResponse.json({ 
      answer: 'Sorry, I couldn\'t process your question at the moment. Please try again later.',
      error: 'Proxy error', 
      message: String(err?.message || err),
      target
    }, { status: 200 }); // Return 200 to avoid showing errors to user
  }
}