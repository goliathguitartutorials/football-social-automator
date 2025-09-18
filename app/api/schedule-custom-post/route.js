/*
 * ==========================================================
 * API ROUTE: schedule-custom-post
 * ENDPOINT: /api/schedule-custom-post
 * FILE: /app/api/schedule-custom-post/route.js
 * ==========================================================
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // --- Security Check ---
        // Get the security key from the Authorization header
        const authHeader = request.headers.get('authorization');
        const authKey = authHeader?.split(' ')[1]; // Extract the key from "Bearer <key>"

        const { N8N_SCHEDULE_CUSTOM_POST_WEBHOOK_URL, APP_SECURITY_KEY } = process.env;

        if (!N8N_SCHEDULE_CUSTOM_POST_WEBHOOK_URL || !APP_SECURITY_KEY) {
            throw new Error("Server configuration error: Missing required environment variables.");
        }
        if (authKey !== APP_SECURITY_KEY) {
            return NextResponse.json({ error: 'Authorization failed.' }, { status: 401 });
        }

        // --- Process Form Data ---
        // This is different from other routes; we parse multipart/form-data
        const formData = await request.formData();
        const imageFile = formData.get('image');
        const caption = formData.get('caption');
        const schedule_time_utc = formData.get('schedule_time_utc');
        const action = formData.get('action'); // 'schedule' or 'post_now'

        if (!imageFile || !caption || !schedule_time_utc || !action) {
            return NextResponse.json({ error: 'Missing required form data fields.' }, { status: 400 });
        }

        // --- Forward Data to n8n Webhook ---
        // We must reconstruct the FormData to forward it
        const n8nFormData = new FormData();
        n8nFormData.append('image', imageFile);
        n8nFormData.append('caption', caption);
        n8nFormData.append('schedule_time_utc', schedule_time_utc);
        n8nFormData.append('action', action);

        const n8nResponse = await fetch(N8N_SCHEDULE_CUSTOM_POST_WEBHOOK_URL, {
            method: 'POST',
            body: n8nFormData,
            // NOTE: Do not set Content-Type header when using FormData with fetch,
            // the browser/runtime will set it automatically with the correct boundary.
        });

        if (!n8nResponse.ok) {
            const errorBody = await n8nResponse.text();
            console.error("n8n Webhook Error:", errorBody);
            throw new Error(`Failed to forward data to n8n workflow. Status: ${n8nResponse.status}`);
        }

        const result = await n8nResponse.json();
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("API Route Error in /schedule-custom-post:", error);
        return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
    }
}
