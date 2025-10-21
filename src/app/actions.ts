'use server';

import { z } from 'zod';

const webhookUrl = process.env.WEBHOOK_URL || 'https://planfix-to-syrve.com:8443/webhook-test/23860823-4ec5-4723-9b55-d8e13285884a';

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

type ActionState = {
  response?: string[];
  error?: string[];
} | null;

export async function sendMessage(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const log: string[] = ['[1/6] Server action started.'];

  const validatedFields = messageSchema.safeParse({
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    log.push('[FAIL] Message validation failed.');
    return {
      error: [...log, validatedFields.error.flatten().fieldErrors.message?.[0] || 'Unknown validation error.'],
    };
  }
  log.push(`[2/6] Message validated: "${validatedFields.data.message}"`);
  
  if (!webhookUrl || webhookUrl.startsWith('https://planfix-to-syrve.com')) {
     log.push('[FAIL] Webhook URL is not configured correctly.');
    return {
      error: [...log, 'Webhook URL is not configured. Please set WEBHOOK_URL in your .env.local file.'],
    };
  }
  log.push(`[3/6] Using webhook URL: ${webhookUrl}`);

  try {
    log.push('[4/6] Attempting to send GET request with fetch...');
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // The body is omitted for GET request as per last change
    });
    log.push(`[5/6] Received response with status: ${response.status}`);

    const responseText = await response.text();
    log.push(`[6/6] Raw response body received: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

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
        return {
          error: [...log, `Request failed. Final processed response: ${responseContent}`],
        };
    }
    
    return {
      response: [...log, `Success! Final processed response: ${responseContent}`],
    };

  } catch (error: unknown) {
    log.push('[FAIL] An error occurred during the fetch call.');
    console.error('Fetch error:', error);
    if (error instanceof Error) {
        return { error: [...log, `Failed to send message: ${error.message}`] };
    }
    return {
      error: [...log, 'An unknown network error occurred.'],
    };
  }
}
