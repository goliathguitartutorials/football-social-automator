import { NextResponse } from 'next/server';

// Change from GET to POST to securely receive the authorization key
export async function POST(request) {
  try {
    const { authKey } = await request.json();

    // --- Security Check ---
    const { N8N_INFO_WEBHOOK_URL, APP_SECURITY_KEY } = process.env;
    if (!N8N_INFO_WEBHOOK_URL || !APP_SECURITY_KEY) {
      throw new Error("Server configuration error.");
    }
    if (authKey !== APP_SECURITY_KEY) {
      return NextResponse.json({ message: 'Authorization failed.' }, { status: 401 });
    }

    // --- Fetch Data from n8n ---
    const response = await fetch(N8N_INFO_WEBHOOK_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch data from n8n workflow.');
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ message: error.message || 'Internal server error.' }, { status: 500 });
  }
}
