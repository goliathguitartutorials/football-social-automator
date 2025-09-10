import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { N8N_WEBHOOK_URL, APP_SECURITY_KEY } = process.env;

    if (!N8N_WEBHOOK_URL || !APP_SECURITY_KEY) {
      console.error("Server configuration error: Missing environment variables.");
      throw new Error("Server configuration error.");
    }

    const contentType = request.headers.get('content-type') || '';
    let n8nResponse;

    // --- LOGIC TO HANDLE EITHER JSON OR FORMDATA ---
    if (contentType.includes('application/json')) {
      // Handle JSON data from new components
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1]; // Get token from "Bearer TOKEN"

      if (token !== APP_SECURITY_KEY) {
        return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
      }

      const payload = await request.json();
      
      console.log("Received JSON payload:", payload);

      // Forward the JSON payload directly to the n8n webhook
      n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

    } else if (contentType.includes('multipart/form-data')) {
      // Handle FormData (e.g., from original Squad Announcement with file uploads)
      const formData = await request.formData();
      const authKey = formData.get('authKey');

      if (authKey !== APP_SECURITY_KEY) {
        return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
      }

      // Reconstruct FormData to send to n8n (excluding our internal authKey)
      const n8nFormData = new FormData();
      for (const [key, value] of formData.entries()) {
        if (key !== 'authKey') {
          n8nFormData.append(key, value);
        }
      }
      
      console.log("Received FormData payload");
      
      n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: n8nFormData,
      });

    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type.' }, { status: 415 });
    }

    // --- PROCESS N8N RESPONSE (SAME FOR BOTH PATHS) ---
    if (!n8nResponse.ok) {
      const errorResult = await n8nResponse.json().catch(() => ({ message: n8nResponse.statusText }));
      console.error("Error from n8n webhook:", errorResult);
      throw new Error(errorResult.message || 'The n8n workflow returned an error.');
    }
    
    // For now, n8n returns a success message for JSON workflows
    // If it returns an image, that logic would go here.
    if (n8nResponse.headers.get('content-type')?.includes('application/json')) {
        const jsonResponse = await n8nResponse.json();
        return NextResponse.json(jsonResponse, { status: 200 });
    }
    
    // Fallback for binary data like image previews
    const blob = await n8nResponse.blob();
    const headers = new Headers();
    headers.set('Content-Type', n8nResponse.headers.get('content-type'));
    return new NextResponse(blob, { status: 200, headers });

  } catch (error) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
