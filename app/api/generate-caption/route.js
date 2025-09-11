/*
 * ==========================================================
 * API ROUTE: Generate Caption
 * ENDPOINT: /api/generate-caption
 * FILE: /app/api/generate-caption/route.js
 * ==========================================================
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // 1. Get the data and auth key from the user's request
        const body = await request.json();
        const { gameInfo, page } = body;
        const authKey = request.headers.get('Authorization')?.split(' ')[1];

        if (!authKey || authKey !== process.env.AUTH_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const webhookUrl = process.env.N8N_CAPTION_WEBHOOK_URL;
        if (!webhookUrl) {
            throw new Error('Webhook URL is not configured in environment variables.');
        }

        // 2. Securely call the n8n webhook from the server
        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameInfo, page }),
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n webhook failed with status: ${n8nResponse.status}`);
        }

        const n8nResult = await n8nResponse.json();

        // 3. Return the result from n8n back to the user's browser
        return NextResponse.json(n8nResult);

    } catch (error) {
        console.error('Error in generate-caption API route:', error);
        return NextResponse.json({ error: 'Failed to generate caption.', details: error.message }, { status: 500 });
    }
}
