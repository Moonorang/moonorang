import type { ReactNode } from 'react';

interface FormattedMessageProps {
  text: string;
}

// **굵게** 와 [[강조]] 만 지원하는 가벼운 마크다운 - 줄바꿈은 ChatBubble의
// whitespace-pre-wrap이 그대로 살려주므로 여기서 따로 처리하지 않는다.
// [[ ]] 는 모델이 쓰는 표기가 아니라, 화면에서 만드는 문구(가입 결과의 요금제 이름
// 등)에서 한 낱말만 눈에 띄게 하려고 쓰는 우리끼리의 표시다.
const MARKUP_PATTERN = /\*\*(.+?)\*\*|\[\[(.+?)\]\]/g;

/**
 * AI 응답에 포함된 `**텍스트**`를 굵게, `[[텍스트]]`를 강조색으로 렌더링한다.
 * 스트리밍 중이라 여는 기호만 온 경우엔 매치되지 않아 원문 그대로 보이다가,
 * 닫히는 토큰이 도착하는 순간 자연스럽게 바뀐다.
 */
export default function FormattedMessage({ text }: FormattedMessageProps) {
  const matches = [...text.matchAll(MARKUP_PATTERN)];
  if (matches.length === 0) return <>{text}</>;

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    const [full, boldText, highlightText] = match;
    parts.push(
      boldText !== undefined ? (
        <strong key={index} className="font-bold">
          {boldText}
        </strong>
      ) : (
        <span key={index} className="font-medium text-action-primary">
          {highlightText}
        </span>
      ),
    );
    lastIndex = matchIndex + full.length;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
