import type { SummarizeTurnMessage } from '@/features/chat/types';

function formatTurns(messages: SummarizeTurnMessage[]): string {
  return messages
    .map((message) => `${message.role === 'user' ? '사용자' : '무너'}: ${message.content}`)
    .join('\n');
}

/**
 * chat-api-design.md §2.6 - 오래된 대화 구간을 압축 요약하는 프롬프트.
 * 기존 요약이 있으면 이어붙여 누적 재요약한다("기존 요약 + 이후 원문 → 새 요약").
 */
export function buildSummarizePrompt(
  messages: SummarizeTurnMessage[],
  existingSummary?: string,
): string {
  return `다음은 통신사 요금제 상담 챗봇 '무너'와 사용자의 대화 일부입니다.
이후 상담에서 참고할 수 있도록 짧게 요약하세요.

## 요약 지침
- 사용자의 사용 패턴·선호, 이미 안내한 내용, 아직 안 풀린 질문처럼 이후 상담에도
  계속 참고해야 할 내용만 남기세요.
- 예산·데이터 사용량처럼 숫자로 관리되는 조건은 이 요약과 별도로 이미 저장돼 있으니
  반복하지 말고, 대화의 흐름과 맥락 위주로 요약하세요.
- 사람이 아니라 챗봇이 다음 턴에 참고할 메모입니다. 3~5문장 이내로 간결하게 쓰세요.
${existingSummary ? `\n## 기존 요약\n${existingSummary}\n` : ''}
## 요약할 대화
${formatTurns(messages)}`;
}
