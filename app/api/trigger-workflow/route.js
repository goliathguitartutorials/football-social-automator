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

      const isPreviewGeneration = payload?.action === 'match_day_announcement' || payload?.action === 'squad_announcement';
      
      if (isPreviewGeneration && n8nResponse.headers.get('content-type')?.includes('text/plain')) {
          const previewUrl = await n8nResponse.text();
          console.log("Received preview URL from n8n:", previewUrl);
          return NextResponse.json({ previewUrl: previewUrl });
      }

      const jsonResponse = await n8nResponse.json();
      return NextResponse.json(jsonResponse, { status: 200 });

    // --- HANDLE FILE UPLOADS (for bespoke posts) ---
    } else if (contentType.includes('multipart/form-data')) {
      console.log("Proxying FormData (file upload) to n8n...");
      
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
        },
        body: request.body,
        // @ts-ignore
        duplex: 'half', // FIX: This option is required for streaming request bodies.
      });

      if (!n8nResponse.ok) {
        const errorResult = await n8nResponse.json().catch(() => ({ message: n8nResponse.statusText }));
        console.error("Error from n8n webhook:", errorResult);
        throw new Error(errorResult.message || 'The n8n workflow returned an error.');
      }

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
