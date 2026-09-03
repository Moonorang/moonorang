/**
 * COMMON-001: 이미 이용 중인 상품인지 서버에 물어보는 동안 자리를 지키는 표시.
 *
 * 이 잠깐 사이에 절차 첫 화면을 먼저 보여주면, 곧 "이미 이용 중" 안내로 바뀌면서
 * 눈앞에서 화면이 갈아끼워진다. 그 깜빡임 대신 기다리는 중임을 알린다.
 */
export default function JoinCheckingNotice() {
  return (
    <p
      role="status"
      className="mt-4 text-center text-12 leading-fixed text-text-secondary"
    >
      이용 중인 상품인지 확인하고 있어요...
    </p>
  );
}
