import { buildSummarizePrompt } from '@/features/chat/server/summarizePrompt';
import type { SummarizeTurnMessage } from '@/features/chat/types';

import { openai, OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_SEED } from '@/shared/lib/openai';

// 요약은 짧은 비스트리밍 호출이라 본 채팅(60초)보다 훨씬 짧게 제한한다
const SUMMARIZE_TIMEOUT_MS = 20_000;

/**
 * 오래된 대화 구간을 짧은 요약 텍스트로 압축한다.
 * chat-api-design.md §2.6: 사용자 응답 스트림이 끝난 뒤 비동기로(await 없이) 실행되므로
 * 스트리밍 응답 자체는 필요 없다 - 완료된 텍스트 하나만 받으면 된다.
 */
export async function summarizeConversation(
  messages: SummarizeTurnMessage[],
  existingSummary?: string,
): Promise<string> {
  const completion = await openai.chat.completions.create(
    {
      model: OPENAI_MODEL,
      messages: [
        { role: 'user', content: buildSummarizePrompt(messages, existingSummary) },
      ],
      temperature: OPENAI_TEMPERATURE,
      seed: OPENAI_SEED,
    },
    { timeout: SUMMARIZE_TIMEOUT_MS },
  );

  return completion.choices[0]?.message.content?.trim() || existingSummary || '';
}
