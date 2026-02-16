import { NextResponse } from 'next/server';

const DEFAULT_TARGET = 'http://localhost:8000/validation/analyze';

export async function POST(req: Request) {
  // derive base from NEXT_PUBLIC_ML_VALIDATION_URL if available
  const env = process.env.NEXT_PUBLIC_ML_VALIDATION_URL || '';
  let base = env;
  if (base.includes('/ml-validation/validate')) {
    base = base.replace('/ml-validation/validate', '');
  }
  const target = (base ? `${base.replace(/\/$/, '')}/validation/analyze` : DEFAULT_TARGET);

  try {
    console.log('[ml-validation analyze proxy] forwarding request to target:', target);
    const body = await req.json();

    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    const result = await res.json();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`[ml-validation analyze proxy] Proxy failed. target=${target}`);
    console.error(err);
    return NextResponse.json({
      error: 'Proxy error',
      message: String(err?.message || err),
      target: String(target || ''),
      stack: err?.stack || null
    }, { status: 502 });
  }
}
