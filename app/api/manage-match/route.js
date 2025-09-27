/*
 * ==========================================================
 * API ROUTE: manage-match
 * ENDPOINT: /api/manage-match
 * FILE: /app/api/manage-match/route.js
 * ==========================================================
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
    console.log("LOG: /api/manage-match route hit."); // 1. Log entry point

    try {
        const authHeader = request.headers.get('authorization');
        const authKey = authHeader?.split(' ')[1];
        const { N8N_MATCH_MANAGER_WEBHOOK_URL, APP_SECURITY_KEY } = process.env;

        if (!N8N_MATCH_MANAGER_WEBHOOK_URL || !APP_SECURITY_KEY) {
            console.error("SERVER ERROR: Missing environment variables.");
            throw new Error("Server configuration error: Missing required environment variables.");
        }
        if (authKey !== APP_SECURITY_KEY) {
            console.error("AUTH ERROR: Authorization failed. Invalid key.");
            return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
        }

        const payload = await request.json();
        const { action, matchData } = payload;
        
        console.log(`LOG: Received action: "${action}"`); // 2. Log the action
        console.log("LOG: Received matchData:", matchData); // 3. Log the data

        if (!action || !matchData) {
            console.error("PAYLOAD ERROR: Missing action or matchData.");
            return NextResponse.json({ error: 'Missing required payload data (action or matchData).' }, { status: 400 });
        }

        console.log("LOG: Forwarding payload to n8n webhook:", N8N_MATCH_MANAGER_WEBHOOK_URL); // 4. Log the target URL

        const n8nResponse = await fetch(N8N_MATCH_MANAGER_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        
        console.log(`LOG: Received n8n response with status: ${n8nResponse.status}`); // 5. Log n8n status

        if (!n8nResponse.ok) {
            const errorBody = await n8nResponse.text();
            console.error("N8N WEBHOOK ERROR: n8n workflow returned an error.", {
                status: n8nResponse.status,
                body: errorBody,
            });
            throw new Error(`The backend workflow failed. Status: ${n8nResponse.status}`);
        }

        const result = await n8nResponse.json();
        console.log("LOG: Successfully received JSON response from n8n."); // 6. Log success
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("FATAL API ERROR in /manage-match:", error.message); // 7. Log any crash
        return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
    }
}
