import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-customer-status`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in check-status route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check customer status' },
      { status: 500 }
    );
  }
}
