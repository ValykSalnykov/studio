'use server';

import { z } from 'zod';

const webhookUrl = process.env.WEBHOOK_URL || 'https://planfix-to-syrve.com:8443/webhook-test/23860823-4ec5-4723-9b55-d8e13285884a';

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

type ActionState = {
  response?: string;
  error?: string;
} | null;

export async function sendMessage(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = messageSchema.safeParse({
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.message?.[0],
    };
  }

  if (!webhookUrl || webhookUrl.startsWith('https://planfix-to-syrve.com')) {
    return {
      error: 'Webhook URL is not configured. Please set WEBHOOK_URL in your .env.local file.',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        // "Content-Type" is not standard for GET requests, but your curl example includes it.
        // Let's add it to match the curl command.
        'Content-Type': 'application/json',
      },
      // Adding an empty body to match `curl -d ""` if needed, though this is non-standard for GET
    });

    const responseText = await response.text();
    let responseContent: string;

    try {
      const responseData = JSON.parse(responseText);
      const data = responseData[0]?.json?.test;
      
      if (data) {
         responseContent = `The bot says: ${JSON.stringify(data)}`;
      } else {
         responseContent = `Received: ${responseText}`;
      }
    } catch (e) {
      responseContent = `Received: ${responseText}`;
    }

    if (!response.ok) {
        // If the request failed, we'll return the response body as an error message
        return {
          error: `Request failed with status ${response.status}. Response: ${responseContent}`,
        };
    }
    
    return {
      response: responseContent,
    };

  } catch (error: unknown) {
    console.error('Fetch error:', error);
    if (error instanceof Error) {
        return { error: `Failed to send message: ${error.message}` };
    }
    return {
      error: 'An unknown network error occurred.',
    };
  }
}
