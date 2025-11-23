import { z } from 'zod';

const antonWebhookUrl = import.meta.env.VITE_ANTON_WEBHOOK_URL;
const templatorWebhookUrl = import.meta.env.VITE_TEMPLATOR_WEBHOOK_URL;

const messageSchema = z.object({
  message: z.string().min(1, 'Сообщение не может быть пустым.'),
  sessionId: z.string().min(1, 'Требуется идентификатор сессии'),
});

interface Case {
    id: string;
    source: string;
}

export type ActionState = {
  logs?: string[];
  response?: string;
  error?: string | string[];
} | null;

interface WebhookRequestData {
    message: string;
    sessionId: string;
    review?: boolean;
    review_message?: string;
    site?: boolean;
    bz?: boolean;
    telegram?: boolean;
    cases?: Case[];
}

async function handleWebhookRequest(url: string | undefined, data: WebhookRequestData): Promise<ActionState> {
    const log: string[] = ['[1/6] Запуск клиентского запроса.'];
  
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
      message: data.review_message || data.message,
      sessionId: data.sessionId,
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
      const timeoutId = setTimeout(() => controller.abort(), 180000);
  
      const requestBody: {
          message: string,
          sessionId: string,
          review: boolean,
          review_message?: string,
          site: boolean,
          bz: boolean,
          telegram: boolean,
          cases?: Case[]
      } = {
          message: data.message,
          sessionId: data.sessionId,
          review: data.review || false,
          site: data.site || false,
          bz: data.bz || false,
          telegram: data.telegram || false,
      };

      if (requestBody.review) {
          requestBody.review_message = data.review_message;
          requestBody.cases = data.cases;
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

export async function sendMessage(data: WebhookRequestData): Promise<ActionState> {
    return handleWebhookRequest(antonWebhookUrl, data);
}

export async function sendTemplatorMessage(data: WebhookRequestData): Promise<ActionState> {
    return handleWebhookRequest(templatorWebhookUrl, data);
}
