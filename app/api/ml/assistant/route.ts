import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Call the ML Assistant agent from ownquesta_agents
    const response = await fetch('http://localhost:8000/ml-assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        context: context || {},
        conversation_id: body.conversation_id || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { 
          error: 'ML Assistant service error', 
          details: errorData,
          fallback_response: "I'm currently unable to connect to the ML Assistant service. Please make sure the service is running at http://localhost:8000"
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('ML Assistant API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request', 
        details: error.message,
        fallback_response: "I'm having trouble connecting to the ML Assistant. Please ensure the ownquesta_agents service is running (cd ownquesta_agents && python main.py)"
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const response = await fetch('http://localhost:8000/ml-assistant/health', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ 
        status: 'connected', 
        agent_status: data 
      });
    }

    return NextResponse.json({ 
      status: 'disconnected',
      message: 'ML Assistant service is not responding'
    }, { status: 503 });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Cannot reach ML Assistant service',
      details: error.message,
      instructions: 'Start the service: cd ownquesta_agents && python main.py'
    }, { status: 503 });
  }
}
