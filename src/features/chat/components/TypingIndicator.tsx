/**
 * 첫 토큰이 오기 전(빈 content + isStreaming) AI 말풍선 안에 보여주는 대기 애니메이션.
 * COMMON-001: 1초를 넘는 처리는 진행 상태를 표시해야 함 - 응답 생성 시작부터
 * 첫 토큰 도착까지의 공백을 메운다.
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-0.5" aria-label="응답 생성 중">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary" />
    </div>
  );
}
