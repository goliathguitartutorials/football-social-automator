/*
 * ==========================================================
 * API ROUTE: post-now
 * ENDPOINT: /api/post-now
 * FILE: /app/api/post-now/route.js
 * ==========================================================
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // --- Security Check ---
        const authHeader = request.headers.get('authorization');
        const authKey = authHeader?.split(' ')[1];

        const { N8N_POST_NOW_WEBHOOK_URL, APP_SECURITY_KEY } = process.env;

        if (!N8N_POST_NOW_WEBHOOK_URL || !APP_SECURITY_KEY) {
            throw new Error("Server configuration error: Missing required environment variables.");
        }
        if (authKey !== APP_SECURITY_KEY) {
            return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
        }

        // --- Process Form Data ---
        const formData = await request.formData();
        const imageFile = formData.get('image');
        const caption = formData.get('caption');
        const action = formData.get('action'); // Should be 'post_now'

        if (!imageFile || !caption || !action) {
            return NextResponse.json({ error: 'Missing required form data fields.' }, { status: 400 });
        }

        // --- Forward Data to n8n Webhook ---
        const n8nFormData = new FormData();
        n8nFormData.append('image', imageFile);
        n8nFormData.append('caption', caption);
        n8nFormData.append('action', action);

        const n8nResponse = await fetch(N8N_POST_NOW_WEBHOOK_URL, {
            method: 'POST',
            body: n8nFormData,
        });

        if (!n8nResponse.ok) {
            const errorBody = await n8nResponse.text();
            console.error("n8n Webhook Error:", errorBody);
            throw new Error(`Failed to forward data to n8n workflow. Status: ${n8nResponse.status}`);
        }

        const result = await n8nResponse.json();
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("API Route Error in /post-now:", error);
        return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
    }
}
