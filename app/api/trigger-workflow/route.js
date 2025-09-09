import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { players, password } = body;

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    const APP_SECURITY_KEY = process.env.APP_SECURITY_KEY;

    // Security Check
    if (!N8N_WEBHOOK_URL || !APP_SECURITY_KEY) {
      throw new Error("Server configuration error: Missing environment variables.");
    }
    if (password !== APP_SECURITY_KEY) {
      return NextResponse.json({ message: 'Authorization failed.' }, { status: 401 });
    }
    
    // Prepare payload for n8n
    const payloadForN8n = {
      postType: 'squad_announcement',
      playerList: players,
    };

    // Trigger the n8n workflow
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadForN8n)
    });

    if (!n8nResponse.ok) {
        console.error("Error from n8n webhook:", await n8nResponse.text());
        throw new Error('The n8n workflow returned an error.');
    }

    return NextResponse.json({ message: 'Workflow triggered successfully!' }, { status: 200 });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
