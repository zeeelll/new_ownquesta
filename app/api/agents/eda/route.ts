import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Forward to EDA agent
    const edaFormData = new FormData();
    edaFormData.append('file', file);

    const edaResponse = await fetch('http://localhost:8002/eda/upload_and_run', {
      method: 'POST',
      body: edaFormData,
    });

    if (!edaResponse.ok) {
      const errorText = await edaResponse.text();
      console.error('EDA Agent Error:', errorText);
      return NextResponse.json(
        { error: 'EDA analysis failed', details: errorText },
        { status: 500 }
      );
    }

    const edaResult = await edaResponse.json();
    
    return NextResponse.json(edaResult);
  } catch (error) {
    console.error('EDA API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process EDA analysis', details: String(error) },
      { status: 500 }
    );
  }
}
