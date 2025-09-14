/*
 * ==========================================================
 * API ROUTE: Upload Asset
 * ENDPOINT: /api/upload-asset
 * FILE: /app/api/upload-asset/route.js
 * ==========================================================
 */

import { NextResponse } from 'next/server';

// The new dedicated webhook URL from your Vercel environment variables
const N8N_WEBHOOK_URL = process.env.N8N_ASSET_UPLOAD_WEBHOOK_URL;
// The security key for your app
const APP_SECURITY_KEY = process.env.APP_SECURITY_KEY;

export async function POST(request) {
    // 1. --- Security Check ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${APP_SECURITY_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!N8N_WEBHOOK_URL) {
        console.error("N8N_ASSET_UPLOAD_WEBHOOK_URL is not defined in environment variables.");
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    try {
        // 2. --- Forward FormData ---
        // Get the FormData object directly from the incoming request
        const formData = await request.formData();

        // Forward the entire FormData object to the n8n webhook
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            body: formData,
            // IMPORTANT: Do NOT set a 'Content-Type' header here.
            // The browser, when using FormData, automatically sets the correct
            // 'multipart/form-data' boundary, which is crucial for the webhook
            // to parse the file correctly.
        });

        const result = await n8nResponse.json();

        if (!n8nResponse.ok) {
            console.error('n8n webhook error:', result);
            return NextResponse.json({ error: 'Webhook processing failed.', details: result }, { status: n8nResponse.status });
        }

        // 3. --- Return Success Response ---
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
