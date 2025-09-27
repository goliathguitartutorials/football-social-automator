/*
 * ==========================================================
 * API ROUTE: manage-match
 * ENDPOINT: /api/manage-match
 * FILE: /app/api/manage-match/route.js
 * ==========================================================
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // --- Security Check ---
        const authHeader = request.headers.get('authorization');
        const authKey = authHeader?.split(' ')[1];

        const { N8N_MATCH_MANAGER_WEBHOOK_URL, APP_SECURITY_KEY } = process.env;

        if (!N8N_MATCH_MANAGER_WEBHOOK_URL || !APP_SECURITY_KEY) {
            throw new Error("Server configuration error: Missing required environment variables.");
        }
        if (authKey !== APP_SECURITY_KEY) {
            return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
        }

        // --- Process JSON Data from the Request Body ---
        const body = await request.json();

        // A more flexible check: as long as there's an 'action', we forward it.
        if (!body.action) {
            return NextResponse.json({ error: 'Missing required "action" in payload.' }, { status: 400 });
        }

        // --- Forward the entire payload to n8n Webhook ---
        const n8nResponse = await fetch(N8N_MATCH_MANAGER_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body), // Send the entire body as received
        });

        if (!n8nResponse.ok) {
            const errorBody = await n8nResponse.text();
            console.error("n8n Webhook Error:", errorBody);
            throw new Error(`Failed to forward data to n8n workflow. Status: ${n8nResponse.status}`);
        }

        const result = await n8nResponse.json();
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("API Route Error in /manage-match:", error);
        return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
    }
}
