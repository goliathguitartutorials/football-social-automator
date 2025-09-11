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
        const body = await request.json();
        const { gameInfo, page } = body;
        const authKeyFromUser = request.headers.get('Authorization')?.split(' ')[1];

        // --- ADDED LOGGING FOR DEBUGGING ---
        console.log('API Route: /api/generate-caption invoked.');
        const serverAuthKey = process.env.AUTH_KEY;

        if (!serverAuthKey) {
            console.error('CRITICAL: AUTH_KEY environment variable is not set on the server.');
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }
        
        // Securely check the keys
        if (!authKeyFromUser || authKeyFromUser !== serverAuthKey) {
            console.warn('Authorization failed. Keys do not match.');
            // Note: In a real production app, avoid logging the keys themselves.
            // console.log(`Key from user: ...${authKeyFromUser?.slice(-4)}`); 
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        console.log('Authorization successful. Proceeding to call n8n webhook.');
        // --- END LOGGING ---

        const webhookUrl = process.env.N8N_CAPTION_WEBHOOK_URL;
        if (!webhookUrl) {
            throw new Error('Webhook URL is not configured in environment variables.');
        }

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameInfo, page }),
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n webhook failed with status: ${n8nResponse.status}`);
        }

        const n8nResult = await n8nResponse.json();
        return NextResponse.json(n8nResult);

    } catch (error) {
        console.error('Error in generate-caption API route:', error);
        return NextResponse.json({ error: 'Failed to generate caption.', details: error.message }, { status: 500 });
    }
}
