/*
 * ==========================================================
 * API ROUTE: Manage Asset
 * ENDPOINT: /api/manage-asset
 * FILE: /app/api/manage-asset/route.js
 * ==========================================================
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
    const manageAssetUrl = process.env.N8N_MANAGE_ASSET_URL;
    const appSecurityKey = process.env.APP_SECURITY_KEY;

    // 1. Check for the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    // 2. Validate the bearer token
    const providedKey = authHeader.split(' ')[1];
    if (providedKey !== appSecurityKey) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 3. Check if the webhook URL is configured
    if (!manageAssetUrl) {
        return NextResponse.json({ error: 'Server configuration error: Webhook URL not set' }, { status: 500 });
    }

    try {
        // 4. Get the JSON body from the incoming request
        const body = await request.json();

        // 5. Forward the request to the n8n webhook
        const n8nResponse = await fetch(manageAssetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        // 6. Check if the n8n webhook responded successfully
        if (!n8nResponse.ok) {
            const errorBody = await n8nResponse.text();
            console.error('n8n webhook error:', errorBody);
            return NextResponse.json({ error: 'Webhook processing failed', details: errorBody }, { status: n8nResponse.status });
        }

        // 7. Return the successful response from n8n to the client
        const result = await n8nResponse.json();
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}
