import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    // FIX: Destructure the body to match the payload sent from the frontend
    const { authKey, workflow, data } = body;

    // Retrieve environment variables from Vercel
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    const APP_SECURITY_KEY = process.env.APP_SECURITY_KEY;

    // --- Security Check ---
    if (!N8N_WEBHOOK_URL || !APP_SECURITY_KEY) {
      console.error("Server configuration error: Missing N8N_WEBHOOK_URL or APP_SECURITY_KEY environment variables.");
      throw new Error("Server configuration error.");
    }
    // FIX: Validate using 'authKey' instead of 'password'
    if (authKey !== APP_SECURITY_KEY) {
      return NextResponse.json({ message: 'Authorization failed.' }, { status: 401 });
    }
    
    // --- Trigger the n8n workflow ---
    // The 'data' object from the frontend is now forwarded directly to n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) // Send the nested data object
    });

    const n8nResult = await n8nResponse.json();

    if (!n8nResponse.ok) {
        console.error("Error from n8n webhook:", n8nResult);
        throw new Error(n8nResult.message || 'The n8n workflow returned an error.');
    }

    // --- Success Response ---
    // FIX: Return the JSON data from n8n back to the frontend.
    // This will include the 'previewUrl' needed for the UI.
    return NextResponse.json(n8nResult, { status: 200 });

  } catch (error) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
