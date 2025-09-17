// FILE: /app/api/schedule-manager/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
    // 1. Get the webhook URL and secret key from environment variables
    const webhookUrl = process.env.N8N_SCHEDULE_MANAGER_WEBHOOK_URL;
    const internalApiSecret = process.env.INTERNAL_API_SECRET_KEY;

    // 2. Security Check: Validate the Authorization header from the front-end
    const authHeader = request.headers.get('Authorization');
    const clientKey = authHeader?.split(' ')[1]; // Expecting "Bearer YOUR_KEY"

    if (!clientKey || clientKey !== internalApiSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Get the payload from the front-end request
    const body = await request.json();
    const { action } = body;

    // 4. Validate that an action is present
    if (!action) {
        return NextResponse.json({ error: 'Action is missing from the payload' }, { status: 400 });
    }
    
    // 5. Forward the entire payload to your n8n webhook
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // If n8n workflow responds with an error, pass it back to the client
        if (!response.ok) {
            const errorResult = await response.json();
            console.error('Error from n8n webhook:', errorResult);
            return NextResponse.json({ error: 'Webhook processing failed', details: errorResult }, { status: response.status });
        }

        // If successful, pass the n8n response back to the client
        const result = await response.json();
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('Failed to forward request to n8n:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
