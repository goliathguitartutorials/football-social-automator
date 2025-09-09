import { NextResponse } from 'next/server';

export async function GET() {
  // Get the secure webhook URL from environment variables
  const N8N_INFO_WEBHOOK_URL = process.env.N8N_INFO_WEBHOOK_URL;

  if (!N8N_INFO_WEBHOOK_URL) {
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // Call the n8n webhook
    const response = await fetch(N8N_INFO_WEBHOOK_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch data from n8n workflow.');
    }

    const data = await response.json();

    // Pass the data from n8n directly to the front-end
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
