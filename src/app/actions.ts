'use server';

import { z } from 'zod';

const webhookUrl = process.env.WEBHOOK_URL || 'https://planfix-to-syrve.com:8443/webhook-test/23860823-4ec5-4723-9b55-d8e13285884a';

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
  sessionId: z.string().min(1, 'Session ID is required'),
});

type ActionState = {
  logs?: string[];
  response?: string; // AI Message
  error?: string | string[];
} | null;

export async function sendMessage(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const log: string[] = ['[1/6] Server action started.'];

  const validatedFields = messageSchema.safeParse({
    message: formData.get('message'),
    sessionId: formData.get('sessionId'),
  });

  if (!validatedFields.success) {
    log.push('[FAIL] Validation failed.');
    return {
      logs: log,
      error: validatedFields.error.flatten().fieldErrors.message || 'Unknown validation error.',
    };
  }
  log.push(`[2/6] Message validated: "${validatedFields.data.message}"`);
  log.push(`[2/6] Session ID validated: "${validatedFields.data.sessionId}"`);
  
  if (!webhookUrl) {
    log.push('[FAIL] Webhook URL is not configured correctly.');
    return {
      logs: log,
      error: 'Webhook URL is not configured. Please set WEBHOOK_URL in your .env.local file.',
    };
  }
  log.push(`[3/6] Using webhook URL: ${webhookUrl}`);

  try {
    log.push('[4/6] Attempting to send POST request with fetch...');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
         message: validatedFields.data.message,
         sessionId: validatedFields.data.sessionId,
    }),
    });
    log.push(`[5/6] Received response with status: ${response.status}`);

    const responseText = await response.text();
    log.push(`[6/6] Raw response body received: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
    
    if (!response.ok) {
        return {
          logs: log,
          error: `Request failed. Status: ${response.status}. Body: ${responseText}`,
        };
    }

    let aiMessage: string;
    try {
        const responseData = JSON.parse(responseText);
        if (responseData.output) {
            aiMessage = responseData.output;
        } else {
            aiMessage = responseText;
        }
    } catch (e) {
        aiMessage = responseText;
    }
    
    return {
        logs: log,
        response: aiMessage,
    };

  } catch (error: unknown) {
    log.push('[FAIL] An error occurred during the fetch call.');
    console.error('Fetch error:', error);
    if (error instanceof Error) {
        return { logs: log, error: `Failed to send message: ${error.message}` };
    }
    return {
      logs: log,
      error: 'An unknown network error occurred.',
    };
  }
}
