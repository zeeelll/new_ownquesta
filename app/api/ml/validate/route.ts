import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const goal = formData.get('goal') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!goal) {
      return NextResponse.json(
        { error: 'No ML goal provided' },
        { status: 400 }
      );
    }

    // Forward to ML validation agent
    const mlFormData = new FormData();
    mlFormData.append('file', file);
    mlFormData.append('goal', goal);

    const mlResponse = await fetch('http://localhost:8003/ml_validation/validate', {
      method: 'POST',
      body: mlFormData,
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error('ML Validation Agent Error:', errorText);
      return NextResponse.json(
        { error: 'ML validation failed', details: errorText },
        { status: 500 }
      );
    }

    const mlResult = await mlResponse.json();
    
    return NextResponse.json(mlResult);
  } catch (error) {
    console.error('ML Validation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process ML validation', details: String(error) },
      { status: 500 }
    );
  }
}