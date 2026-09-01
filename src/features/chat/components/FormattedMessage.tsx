import type { ReactNode } from 'react';

interface FormattedMessageProps {
  text: string;
}

// **굵게** 표시만 지원하는 가벼운 마크다운 - 줄바꿈은 ChatBubble의
// whitespace-pre-wrap이 그대로 살려주므로 여기서 따로 처리하지 않는다.
const BOLD_PATTERN = /\*\*(.+?)\*\*/g;

/**
 * AI 응답에 포함된 `**텍스트**`를 굵게 렌더링한다.
 * 스트리밍 중이라 `**`가 아직 안 닫힌 경우엔 매치되지 않아 원문 그대로 보이다가,
 * 닫히는 토큰이 도착하는 순간 자연스럽게 굵게 바뀐다.
 */
export default function FormattedMessage({ text }: FormattedMessageProps) {
  const matches = [...text.matchAll(BOLD_PATTERN)];
  if (matches.length === 0) return <>{text}</>;

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }
    parts.push(
      <strong key={index} className="font-bold">
        {match[1]}
      </strong>,
    );
    lastIndex = matchIndex + match[0].length;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
