import { NextRequest, NextResponse } from 'next/server';

const VALIDATION_AGENT_URL = process.env.VALIDATION_AGENT_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔍 Proxying question to validation agent:', body.question);
    
    const response = await fetch(`${VALIDATION_AGENT_URL}/validation/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ Validation agent error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Validation agent returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Validation agent response received');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error calling validation agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reach validation agent' },
      { status: 500 }
    );
  }
}
