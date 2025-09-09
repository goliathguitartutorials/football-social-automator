import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // FIX: Parse the incoming request as FormData instead of JSON
    const formData = await request.formData();

    // Extract all the fields sent from the frontend
    const authKey = formData.get('authKey');
    const workflow = formData.get('workflow'); // e.g., 'football-social-automator'
    const jsonDataString = formData.get('data');
    const customBackgroundFile = formData.get('customBackground');

    // Parse the stringified JSON data back into an object
    const data = JSON.parse(jsonDataString);

    // --- Security Check ---
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    const APP_SECURITY_KEY = process.env.APP_SECURITY_KEY;

    if (!N8N_WEBHOOK_URL || !APP_SECURITY_KEY) {
      console.error("Server configuration error: Missing environment variables.");
      throw new Error("Server configuration error.");
    }
    if (authKey !== APP_SECURITY_KEY) {
      return NextResponse.json({ message: 'Authorization failed.' }, { status: 401 });
    }
    
    // --- Prepare data to forward to n8n ---
    const n8nFormData = new FormData();

    // Re-append the JSON data for n8n to use
    n8nFormData.append('data', JSON.stringify(data));

    // Re-append the file if it exists for n8n to receive
    if (customBackgroundFile) {
      // n8n will receive this file under the field name 'customBackground'
      n8nFormData.append('customBackground', customBackgroundFile);
    }

    // --- Trigger the n8n workflow ---
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: n8nFormData, // Forward the complete FormData
    });

    const n8nResult = await n8nResponse.json();

    if (!n8nResponse.ok) {
        console.error("Error from n8n webhook:", n8nResult);
        throw new Error(n8nResult.message || 'The n8n workflow returned an error.');
    }

    // --- Success Response ---
    // Return the JSON data from n8n (containing the previewUrl) back to the frontend
    return NextResponse.json(n8nResult, { status: 200 });

  } catch (error) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
