/*
 * ==========================================================
 * COMPONENT: API Route
 * PAGE: (Backend)
 * FILE: /app/api/trigger-workflow/route.js
 * ==========================================================
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { N8N_WEBHOOK_URL, APP_SECURITY_KEY } = process.env;

    if (!N8N_WEBHOOK_URL || !APP_SECURITY_KEY) {
      console.error("Server configuration error: Missing environment variables.");
      throw new Error("Server configuration error.");
    }

    // --- UNIFIED AUTHORIZATION CHECK ---
    // All requests, regardless of type, must have a valid authorization header.
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (token !== APP_SECURITY_KEY) {
      return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // --- HANDLE JSON PAYLOADS (for previews, etc.) ---
    if (contentType.includes('application/json')) {
      const payload = await request.json();
      console.log("Proxying JSON payload to n8n:", payload);

      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!n8nResponse.ok) {
        const errorResult = await n8nResponse.json().catch(() => ({ message: n8nResponse.statusText }));
        console.error("Error from n8n webhook:", errorResult);
        throw new Error(errorResult.message || 'The n8n workflow returned an error.');
      }

      // Check if this action was for generating a preview.
      const isPreviewGeneration = payload?.action === 'match_day_announcement' || payload?.action === 'squad_announcement';
      
      // If n8n returns a plain text URL for the preview, handle it.
      if (isPreviewGeneration && n8nResponse.headers.get('content-type')?.includes('text/plain')) {
          const previewUrl = await n8nResponse.text();
          console.log("Received preview URL from n8n:", previewUrl);
          return NextResponse.json({ previewUrl: previewUrl });
      }

      // Otherwise, handle other responses as JSON
      const jsonResponse = await n8nResponse.json();
      return NextResponse.json(jsonResponse, { status: 200 });

    // --- HANDLE FILE UPLOADS (for bespoke posts) ---
    } else if (contentType.includes('multipart/form-data')) {
      console.log("Proxying FormData (file upload) to n8n...");
      
      // Directly stream the request body to n8n without parsing it.
      // This is the key fix.
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          // Pass the original Content-Type header which includes the multipart boundary
          'Content-Type': contentType,
        },
        body: request.body,
      });

      if (!n8nResponse.ok) {
        const errorResult = await n8nResponse.json().catch(() => ({ message: n8nResponse.statusText }));
        console.error("Error from n8n webhook:", errorResult);
        throw new Error(errorResult.message || 'The n8n workflow returned an error.');
      }

      // Bespoke posts are not expected to return previews, so we just parse the JSON confirmation.
      const jsonResponse = await n8nResponse.json();
      return NextResponse.json(jsonResponse, { status: 200 });

    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type.' }, { status: 415 });
    }

  } catch (error) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
