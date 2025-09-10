import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { N8N_WEBHOOK_URL, APP_SECURITY_KEY } = process.env;

    if (!N8N_WEBHOOK_URL || !APP_SECURITY_KEY) {
      console.error("Server configuration error: Missing environment variables.");
      throw new Error("Server configuration error.");
    }

    const contentType = request.headers.get('content-type') || '';
    let payload;
    let n8nResponse;

    // --- LOGIC TO HANDLE EITHER JSON OR FORMDATA ---
    if (contentType.includes('application/json')) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1];

      if (token !== APP_SECURITY_KEY) {
        return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
      }

      payload = await request.json();
      console.log("Received JSON payload:", payload);

      n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const authKey = formData.get('authKey');

      if (authKey !== APP_SECURITY_KEY) {
        return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
      }

      const n8nFormData = new FormData();
      for (const [key, value] of formData.entries()) {
        if (key !== 'authKey') n8nFormData.append(key, value);
      }
      
      console.log("Received FormData payload");
      
      n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: n8nFormData,
      });

    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type.' }, { status: 415 });
    }

    // --- PROCESS N8N RESPONSE ---
    if (!n8nResponse.ok) {
      const errorResult = await n8nResponse.json().catch(() => ({ message: n8nResponse.statusText }));
      console.error("Error from n8n webhook:", errorResult);
      throw new Error(errorResult.message || 'The n8n workflow returned an error.');
    }

    // --- NEW LOGIC FOR HANDLING PREVIEW URL ---
    // Check if the action was for generating a preview.
    const isPreviewGeneration = payload?.action === 'match_day_announcement' || payload?.action === 'squad_announcement';
    
    // If n8n returns a plain text URL for the preview, handle it.
    if (isPreviewGeneration && n8nResponse.headers.get('content-type')?.includes('text/plain')) {
        const previewUrl = await n8nResponse.text();
        console.log("Received preview URL from n8n:", previewUrl);
        // Send it back to the frontend in a structured JSON object
        return NextResponse.json({ previewUrl: previewUrl });
    }

    // Otherwise, handle other responses (like final post confirmation) as JSON
    const jsonResponse = await n8nResponse.json();
    return NextResponse.json(jsonResponse, { status: 200 });

  } catch (error) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
