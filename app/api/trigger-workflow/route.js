import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const authKey = formData.get('authKey');
    const workflow = formData.get('workflow');
    const jsonDataString = formData.get('data');
    const customBackgroundFile = formData.get('customBackground');
    const data = JSON.parse(jsonDataString);

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    const APP_SECURITY_KEY = process.env.APP_SECURITY_KEY;

    if (!N8N_WEBHOOK_URL || !APP_SECURITY_KEY) {
      console.error("Server configuration error: Missing environment variables.");
      throw new Error("Server configuration error.");
    }
    if (authKey !== APP_SECURITY_KEY) {
      return NextResponse.json({ message: 'Authorization failed.' }, { status: 401 });
    }
    
    const n8nFormData = new FormData();
    n8nFormData.append('data', JSON.stringify(data));
    if (customBackgroundFile) {
      n8nFormData.append('customBackground', customBackgroundFile);
    }

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: n8nFormData,
    });

    if (!n8nResponse.ok) {
        const errorResult = await n8nResponse.json().catch(() => ({ message: n8nResponse.statusText }));
        console.error("Error from n8n webhook:", errorResult);
        throw new Error(errorResult.message || 'The n8n workflow returned an error.');
    }

    // --- FIX: Pass the binary data through directly ---

    // 1. Get the binary data (the image) from n8n as a Blob
    const imageBlob = await n8nResponse.blob();

    // 2. Get the original Content-Type header from the n8n response (e.g., 'image/jpeg')
    const contentType = n8nResponse.headers.get('content-type');

    // 3. Create a new response to send to the web app, containing the image
    //    and forwarding the correct Content-Type header.
    return new NextResponse(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
      },
    });

  } catch (error) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
