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
        const { 
            N8N_MATCH_MANAGER_WEBHOOK_URL, // Used for SENDING/LOGGING events
            N8N_GET_EVENTS_WEBHOOK_URL,      // NEW: Used for GETTING events
            APP_SECURITY_KEY 
        } = process.env;

        if (!N8N_MATCH_MANAGER_WEBHOOK_URL || !N8N_GET_EVENTS_WEBHOOK_URL || !APP_SECURITY_KEY) {
            throw new Error("Server configuration error: Missing required environment variables.");
        }
        if (authKey !== APP_SECURITY_KEY) {
            return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
        }

        // --- Process JSON Data from the Request Body ---
        const { action, matchData } = await request.json();
        if (!action || !matchData) {
            return NextResponse.json({ error: 'Missing required payload data (action or matchData).' }, { status: 400 });
        }

        // --- NEW: Conditional Logic Based on Action ---
        if (action === 'get_match_events') {
            // ACTION: GET MATCH EVENTS
            // This action queries the n8n workflow that is set up to RETURN data.
            if (!matchData.matchId) {
                return NextResponse.json({ error: 'Missing matchId for get_match_events action.' }, { status: 400 });
            }

            // Append matchId as a query parameter for the GET request
            const getUrl = new URL(N8N_GET_EVENTS_WEBHOOK_URL);
            getUrl.searchParams.append('matchId', matchData.matchId);

            const n8nGetResponse = await fetch(getUrl.toString(), {
                method: 'GET', // Use GET to retrieve data
                headers: { 'Content-Type': 'application/json' },
            });

            if (!n8nGetResponse.ok) {
                throw new Error(`Failed to fetch events from n8n. Status: ${n8nGetResponse.status}`);
            }
            const eventResult = await n8nGetResponse.json();
            return NextResponse.json(eventResult, { status: 200 });

        } else if (action === 'log_event') {
            // ACTION: LOG A NEW EVENT
            // This action sends data to the n8n workflow that is set up to RECEIVE data.
            const payload = { action, matchData };
            const n8nPostResponse = await fetch(N8N_MATCH_MANAGER_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!n8nPostResponse.ok) {
                const errorBody = await n8nPostResponse.text();
                console.error("n8n Webhook Error:", errorBody);
                throw new Error(`Failed to forward data to n8n workflow. Status: ${n8nPostResponse.status}`);
            }
            const postResult = await n8nPostResponse.json();
            return NextResponse.json(postResult, { status: 200 });
        
        } else {
            // Handle any other actions if they exist, or return an error
            return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
        }

    } catch (error) {
        console.error("API Route Error in /manage-match:", error);
        return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
    }
}
