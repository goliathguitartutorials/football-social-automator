/*
 * ==========================================================
 * API ROUTE: get-matches
 * ENDPOINT: /api/get-matches
 * FILE: /app/api/get-matches/route.js
 * ==========================================================
 */
import { NextResponse } from 'next/server';

// FIX: This line forces the route to be rendered dynamically.
export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        // --- Security Check ---
        const authHeader = request.headers.get('authorization');
        const authKey = authHeader?.split(' ')[1];

        const { N8N_MATCH_MANAGER_WEBHOOK_URL, APP_SECURITY_KEY } = process.env;

        if (!N8N_MATCH_MANAGER_WEBHOOK_URL || !APP_SECURITY_KEY) {
            throw new Error("Server configuration error: Missing required match manager environment variables.");
        }
        if (authKey !== APP_SECURITY_KEY) {
            return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
        }

        // --- Trigger n8n to get all matches ---
        const payload = {
            action: 'get_all_matches'
        };

        const n8nResponse = await fetch(N8N_MATCH_MANAGER_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!n8nResponse.ok) {
            const errorBody = await n8nResponse.text();
            console.error("n8n Webhook Error:", errorBody);
            throw new Error(`Failed to fetch matches from n8n. Status: ${n8nResponse.status}`);
        }

        const matches = await n8nResponse.json();
        return NextResponse.json(matches, { status: 200 });

    } catch (error) {
        console.error("API Route Error in /get-matches:", error);
        return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
    }
}
