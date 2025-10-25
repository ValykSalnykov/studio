'use server';

import { z } from 'zod';

const antonWebhookUrl = process.env.ANTON_WEBHOOK_URL;
const templatorWebhookUrl = process.env.TEMPLATOR_WEBHOOK_URL;

const messageSchema = z.object({
  message: z.string().min(1, 'Сообщение не может быть пустым.'),
  sessionId: z.string().min(1, 'Требуется идентификатор сессии'),
});

type ActionState = {
  logs?: string[];
  response?: string;
  error?: string | string[];
} | null;

async function handleWebhookRequest(url: string | undefined, formData: FormData): Promise<ActionState> {
    const log: string[] = ['[1/6] Запуск серверного действия.'];
  
    if (!url) {
      const errorMessage = 'Переменная окружения WEBHOOK_URL не установлена. Пожалуйста, установите ее, чтобы чат заработал.';
      log.push(`[FAIL] ${errorMessage}`);
      console.error(errorMessage);
      return {
        logs: log,
        error: errorMessage,
      };
    }
    log.push(`[2/6] Используется webhook URL: ${url}`);
  
    const validatedFields = messageSchema.safeParse({
      message: formData.get('message'),
      sessionId: formData.get('sessionId'),
    });
  
    if (!validatedFields.success) {
      const errorMessage = validatedFields.error.flatten().fieldErrors.message?.join(', ') || 'Неизвестная ошибка валидации.';
      log.push(`[FAIL] Валидация не пройдена: ${errorMessage}`);
      return {
        logs: log,
        error: errorMessage,
      };
    }
    log.push(`[3/6] Сообщение и ID сессии прошли валидацию.`);
  
    try {
      log.push('[4/6] Попытка отправки POST-запроса...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
  
      const case_numbers = formData.getAll('case_numbers').filter(cn => typeof cn === 'string' && cn.length > 0);

      const requestBody: {
          message: string,
          sessionId: string,
          review: boolean,
          review_message?: string,
          site: boolean,
          bz: boolean,
          telegram: boolean,
          case_numbers?: string[]
      } = {
          message: validatedFields.data.message,
          sessionId: validatedFields.data.sessionId,
          review: formData.get('review') === 'true',
          site: formData.get('site') === 'true',
          bz: formData.get('bz') === 'true',
          telegram: formData.get('telegram') === 'true',
      };

      if (requestBody.review) {
          requestBody.review_message = formData.get('review_message') as string;
      }

      if (case_numbers.length > 0) {
        requestBody.case_numbers = case_numbers as string[];
      }
  
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      log.push(`[5/6] Получен ответ со статусом: ${response.status}`);
      const responseText = await response.text();
      log.push(`[6/6] Получено тело ответа: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
  
      if (!response.ok) {
        return {
          logs: log,
          error: `Сетевой запрос не удался. Статус: ${response.status}. Ответ: ${responseText}`,
        };
      }
  
      let aiMessage: string;
      try {
        const responseData = JSON.parse(responseText);
        if (responseData.output) {
          aiMessage = responseData.output;
        } else {
          aiMessage = JSON.stringify(responseData);
        }
      } catch (e) {
        aiMessage = responseText;
      }
  
      return {
        logs: log,
        response: aiMessage,
      };
  
    } catch (error: unknown) {
      log.push('[FAIL] Произошла ошибка во время выполнения запроса.');
      console.error('Fetch error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { logs: log, error: 'Запрос занял слишком много времени (более 60 секунд) и был прерван.' };
        }
        return { logs: log, error: `Не удалось отправить сообщение: ${error.message}` };
      }
      return {
        logs: log,
        error: 'Произошла неизвестная сетевая ошибка.',
      };
    }
}

export async function sendMessage(prevState: ActionState, formData: FormData): Promise<ActionState> {
    return handleWebhookRequest(antonWebhookUrl, formData);
}

export async function sendTemplatorMessage(prevState: ActionState, formData: FormData): Promise<ActionState> {
    return handleWebhookRequest(templatorWebhookUrl, formData);
}
