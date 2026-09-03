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

/**
 * 이미 압축된 요약 두 개를 하나로 합친다. summarizeConversation과 달리 입력이 원문
 * 턴이 아니라 "이미 요약된 텍스트 두 개"라는 점이 다르다 - 로그아웃 전 회원 대화가
 * 이미 요약돼있는 상태에서, 로그아웃 중 게스트로 나눈 대화도 따로 요약된 채로 있을 때
 * (둘 다 각자 요약 트리거를 넘긴 드문 경우) 로그인 승계 시점에 사용한다.
 */
export async function mergeSummaries(
  memberSummary: string,
  guestSummary: string,
): Promise<string> {
  const completion = await openai.chat.completions.create(
    {
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'user',
          content: `다음은 같은 사용자와 통신사 요금제 상담 챗봇 '무너'가 나눈 대화를
시간순으로 두 구간(로그인 전/후)에 걸쳐 각각 압축해둔 요약입니다. 두 요약에 담긴
내용을 모두 유지한 채, 이후 상담에서 참고할 수 있도록 하나의 요약으로 합치세요.
사람이 아니라 챗봇이 다음 턴에 참고할 메모이므로 3~5문장 이내로 간결하게 쓰세요.

## 요약 1 (먼저 있었던 대화)
${memberSummary}

## 요약 2 (이어서 있었던 대화)
${guestSummary}`,
        },
      ],
      temperature: OPENAI_TEMPERATURE,
      seed: OPENAI_SEED,
    },
    { timeout: SUMMARIZE_TIMEOUT_MS },
  );

  return (
    completion.choices[0]?.message.content?.trim() || `${memberSummary}\n${guestSummary}`
  );
}
